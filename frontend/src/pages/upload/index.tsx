import {
  Button,
  Center,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { hideNotification } from "@mantine/notifications";
import { AxiosError } from "axios";
import pLimit from "p-limit";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { TbShieldLock } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import Dropzone from "../../components/upload/Dropzone";
import PrecheckList from "../../components/upload/PrecheckList";
import bay from "../../components/upload/bay.module.css";
import { motion, useReducedMotion } from "framer-motion";
import showCompletedUploadModal from "../../components/upload/modals/showCompletedUploadModal";
import showCreateUploadModal from "../../components/upload/modals/showCreateUploadModal";
import useConfig from "../../hooks/config.hook";
import useConfirmLeave from "../../hooks/confirm-leave.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import useUser from "../../hooks/user.hook";
import shareService from "../../services/share.service";
import { FileUpload } from "../../types/File.type";
import { CreateShare, Share } from "../../types/share.type";
import toast from "../../utils/toast.util";
import { useRouter } from "next/router";
import {
  getNormalizedFileName,
  validateAndFilterFiles,
} from "../../utils/file.util";
import { byteToHumanSizeString } from "../../utils/fileSize.util";

const promiseLimit = pLimit(3);
let errorToastShown = false;
let createdShare: Share;
let createdShareMaxViews: number | null = null;

const Upload = ({
  maxShareSize,
  isReverseShare = false,
  simplified,
}: {
  maxShareSize?: number;
  isReverseShare: boolean;
  simplified: boolean;
}) => {
  const modals = useModals();
  const router = useRouter();
  const t = useTranslate();

  const { user } = useUser();
  const config = useConfig();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setisUploading] = useState(false);
  const [rejected, setRejected] = useState<FileUpload[]>([]);
  const [usedStorage, setUsedStorage] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  // Read-only: sum the owner's live shares for the quota gauge.
  useEffect(() => {
    if (!user || isReverseShare) return;
    shareService
      .getMyShares()
      .then((shares) =>
        setUsedStorage(
          shares
            .filter((s) => !s.removedReason)
            .reduce((acc, s) => acc + (Number(s.size) || 0), 0),
        ),
      )
      .catch(() => setUsedStorage(null));
  }, [user, isReverseShare]);

  const filesRef = useRef<FileUpload[]>(files);
  filesRef.current = files;

  useConfirmLeave({
    message: t("upload.notify.confirm-leave"),
    enabled: isUploading,
  });

  const chunkSize = useRef(parseInt(config.get("share.chunkSize")));

  maxShareSize ??= user?.shareSizeLimit
    ? parseInt(user.shareSizeLimit)
    : parseInt(config.get("share.maxSize"));

  const currentFilesSize = useMemo(() => {
    return files.reduce((acc, file) => acc + file.size, 0);
  }, [files]);

  const autoOpenCreateUploadModal = config.get("share.autoOpenShareModal");

  const uploadFiles = async (share: CreateShare, files: FileUpload[]) => {
    setisUploading(true);

    try {
      const isReverseShare = router.pathname != "/upload";
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);
      createdShareMaxViews = share.security?.maxViews ?? null;
      createdShare = await shareService.create(
        { ...share, size: totalSize },
        isReverseShare,
      );
    } catch (e) {
      toast.axiosError(e);
      setisUploading(false);
      return;
    }

    const fileUploadPromises = files.map(async (file, fileIndex) =>
      // Limit the number of concurrent uploads to 3
      promiseLimit(async () => {
        let fileId;

        const setFileProgress = (progress: number) => {
          setFiles((files) =>
            files.map((file, callbackIndex) => {
              if (fileIndex == callbackIndex) {
                file.uploadingProgress = progress;
              }
              return file;
            }),
          );
        };

        setFileProgress(1);

        let chunks = Math.ceil(file.size / chunkSize.current);

        // If the file is 0 bytes, we still need to upload 1 chunk
        if (chunks == 0) chunks++;

        for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
          const from = chunkIndex * chunkSize.current;
          const to = from + chunkSize.current;
          const blob = file.slice(from, to);
          try {
            await shareService
              .uploadFile(
                createdShare.id,
                blob,
                {
                  id: fileId,
                  name: getNormalizedFileName(file),
                },
                chunkIndex,
                chunks,
                (progressEvent) => {
                  if (progressEvent.total && file.size > 0) {
                    const chunkProgress =
                      progressEvent.loaded / progressEvent.total;
                    const uploadedBytesBeforeThisChunk =
                      chunkIndex * chunkSize.current;
                    const uploadedBytesInThisChunk = blob.size * chunkProgress;
                    const totalUploaded =
                      uploadedBytesBeforeThisChunk + uploadedBytesInThisChunk;
                    const overallPercent = (totalUploaded / file.size) * 100;
                    setFileProgress(Math.min(overallPercent, 99.9));
                  }
                },
              )
              .then((response) => {
                fileId = response.id;
              });

            setFileProgress(((chunkIndex + 1) / chunks) * 100);
          } catch (e) {
            if (
              e instanceof AxiosError &&
              e.response?.data.error == "unexpected_chunk_index"
            ) {
              // Retry with the expected chunk index
              chunkIndex = e.response!.data!.expectedChunkIndex - 1;
              continue;
            } else {
              setFileProgress(-1);
              // Retry after 5 seconds
              await new Promise((resolve) => setTimeout(resolve, 5000));
              chunkIndex = -1;

              continue;
            }
          }
        }
      }),
    );

    Promise.all(fileUploadPromises);
  };

  const showCreateUploadModalCallback = (files: FileUpload[]) => {
    showCreateUploadModal(
      modals,
      {
        isUserSignedIn: user ? true : false,
        isReverseShare,
        appUrl: config.get("general.appUrl"),
        defaultAppUrl: config.get("general.appUrl", true),
        allowUnauthenticatedShares: config.get(
          "security.allowUnauthenticatedShares",
        ),
        enableEmailRecepients: config.get("share.enableShareEmailRecipients"),
        enableUserRecipients: config.get("share.enableUserRecipients"),
        maxExpiration: user?.isAdmin
          ? { value: 0, unit: "days" }
          : config.get("share.maxExpiration"),
        defaultExpiration: config.get("share.defaultExpiration"),
        shareIdLength: config.get("share.shareIdLength"),
        simplified,
      },
      files,
      uploadFiles,
    );
  };

  const handleDropzoneFilesChanged = useCallback(
    (newFiles: FileUpload[]) => {
      const baseFiles = autoOpenCreateUploadModal ? [] : filesRef.current;

      const filtered = validateAndFilterFiles(
        newFiles,
        baseFiles,
        maxShareSize!,
        (normalizedName) =>
          toast.error(
            t("upload.notify.duplicate-skipped", { name: normalizedName }),
          ),
        () =>
          toast.error(
            t("upload.dropzone.notify.file-too-big", {
              maxSize: byteToHumanSizeString(maxShareSize!),
            }),
          ),
      );
      if (filtered.length === 0) return;

      if (autoOpenCreateUploadModal) {
        filesRef.current = filtered;
        setFiles(filtered);
        showCreateUploadModalCallback(filtered);
      } else {
        const nextFiles = [...filesRef.current, ...filtered];
        filesRef.current = nextFiles;
        setFiles(nextFiles);
      }
    },
    [maxShareSize, autoOpenCreateUploadModal, t, showCreateUploadModalCallback],
  );

  useEffect(() => {
    // Check if there are any files that failed to upload
    const fileErrorCount = files.filter(
      (file) => file.uploadingProgress == -1,
    ).length;

    if (fileErrorCount > 0) {
      if (!errorToastShown) {
        toast.error(
          t("upload.notify.count-failed", { count: fileErrorCount }),
          {
            id: "upload-failed",
            withCloseButton: false,
            autoClose: false,
          },
        );
      }
      errorToastShown = true;
    } else {
      if (errorToastShown) {
        hideNotification("upload-failed");
      }
      errorToastShown = false;
    }

    // Complete share
    if (
      files.length > 0 &&
      files.every((file) => file.uploadingProgress >= 100) &&
      fileErrorCount == 0
    ) {
      shareService
        .completeShare(createdShare.id)
        .then((share) => {
          setisUploading(false);
          showCompletedUploadModal(
            modals,
            share,
            config.get("general.appUrl"),
            config.get("general.appUrl", true),
            createdShareMaxViews,
          );
          setFiles([]);
        })
        .catch(() => toast.error(t("upload.notify.generic-error")));
    }
  }, [files]);

  if (user && user.allowShare === false && !isReverseShare) {
    return (
      <>
        <Meta title={t("upload.title")} />
        <Center style={{ height: "70vh" }}>
          <Stack align="center" spacing={10}>
            <TbShieldLock size={48} color="gray" />
            <Title order={3}>
              <FormattedMessage id="upload.error.not-allowed.title" />
            </Title>
            <Text color="dimmed" align="center">
              <FormattedMessage id="upload.error.not-allowed.description" />
            </Text>
            <Space h={5} />
            <Button component={Link} href="/account/shares" variant="light">
              <FormattedMessage id="account.shares.title" />
            </Button>
          </Stack>
        </Center>
      </>
    );
  }

  const quota = user?.storageQuotaLimit
    ? parseInt(user.storageQuotaLimit)
    : 50 * 1000 * 1000;
  const sharePct = Math.min(100, (currentFilesSize / maxShareSize) * 100);
  const used = usedStorage ?? 0;
  const usedPct = Math.min(100, (used / quota) * 100);
  const pendingPct = Math.min(100 - usedPct, (currentFilesSize / quota) * 100);
  const overQuota = used + currentFilesSize > quota;
  const maxExp = config.get("share.maxExpiration") as
    | { value: number; unit: string }
    | undefined;
  const typeCount = new Set(
    files.map((f) => (f.name.includes(".") ? f.name.split(".").pop() : "bin")),
  ).size;
  const fmt = (n: number) => byteToHumanSizeString(n).toUpperCase();

  const readout = (
    <div className={bay.readout} aria-live="polite">
      <div className={bay.readCell}>
        <span className="rv-label">Cleared</span>
        <strong>{String(files.length).padStart(2, "0")}</strong>
      </div>
      <div className={bay.readCell}>
        <span className="rv-label">Rejected</span>
        <strong className={rejected.length ? bay.bad : undefined}>
          {String(rejected.length).padStart(2, "0")}
        </strong>
      </div>
      <div className={bay.readCell}>
        <span className="rv-label">Load</span>
        <strong>{fmt(currentFilesSize)}</strong>
      </div>
      <div className={bay.readCell}>
        <span className="rv-label">Types</span>
        <strong>{String(typeCount).padStart(2, "0")}</strong>
      </div>
    </div>
  );

  return (
    <>
      <Meta title={t("upload.title")} />
      <div className={bay.wide}>
      <div className={bay.bayHead}>
        <div>
          <div className="rv-label">Inspection bay · outbound</div>
          <h1 className={bay.bayTitle}>
            Load, inspect, <em>issue ticket.</em>
          </h1>
        </div>
        <div className={bay.bayMeta}>
          <span className={bay.live}>Scanner online</span>
          <span>
            ID <b>128-bit</b>
          </span>
          <span>
            Limit <b>{fmt(maxShareSize)}</b>
          </span>
        </div>
      </div>
      <div className={bay.bay}>
        <div>
          <Dropzone
            title={
              !autoOpenCreateUploadModal && files.length > 0
                ? t("share.edit.append-upload")
                : undefined
            }
            maxShareSize={maxShareSize}
            currentFilesSize={currentFilesSize}
            onFilesChanged={handleDropzoneFilesChanged}
            onFilesRejected={(blocked) =>
              setRejected((prev) => [...blocked, ...prev].slice(0, 8))
            }
            isUploading={isUploading}
            readout={readout}
          />
          <PrecheckList
            files={files}
            setFiles={setFiles}
            rejected={rejected}
            onDismissRejected={(i) =>
              setRejected((prev) => prev.filter((_, j) => j !== i))
            }
            maxShareSize={maxShareSize}
          />
        </div>
        <motion.aside
          className={bay.manifest}
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          aria-label="Share manifest"
        >
          <div className={bay.manHead}>
            <h3>Manifest</h3>
            <span className="rv-label">Form RV-01</span>
          </div>
          <div className={bay.manSec}>
            <div className={bay.secNo}>
              <span>
                <b>01</b> · Share load
              </span>
              <span>{sharePct.toFixed(0)}%</span>
            </div>
            <div className={bay.bigNum}>
              {fmt(currentFilesSize)} <small>/ {fmt(maxShareSize)}</small>
            </div>
            <div className={`${bay.gauge} ${sharePct >= 100 ? bay.gaugeOver : ""}`}>
              <motion.i
                initial={false}
                animate={{ width: `${sharePct}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.4 }}
              />
            </div>
            <div className={bay.gaugeScale}>
              <span>0</span>
              <span>{fmt(maxShareSize / 2)}</span>
              <span>{fmt(maxShareSize)}</span>
            </div>
          </div>
          {!isReverseShare && (
            <div className={bay.manSec}>
              <div className={bay.secNo}>
                <span>
                  <b>02</b> · Account quota
                </span>
                <span>{usedStorage === null ? "LIMIT" : `${(usedPct + pendingPct).toFixed(0)}%`}</span>
              </div>
              <div className={bay.bigNum}>
                {usedStorage === null ? "—" : fmt(used + currentFilesSize)}{" "}
                <small>/ {fmt(quota)}</small>
              </div>
              <div className={`${bay.gauge} ${overQuota ? bay.gaugeOver : ""}`}>
                <i style={{ width: `${usedPct}%` }} />
                <i
                  className={bay.pending}
                  style={{ left: `${usedPct}%`, width: `${pendingPct}%` }}
                />
              </div>
              <div className={bay.gaugeScale}>
                <span>■ live shares</span>
                <span style={{ color: "var(--rv-signal)" }}>■ this load</span>
              </div>
            </div>
          )}
          <div className={bay.manSec}>
            <div className={bay.secNo}>
              <span>
                <b>03</b> · Ticket rules
              </span>
            </div>
            <ul className={bay.rules}>
              <li>
                Max expiry{" "}
                <b>
                  {user?.isAdmin
                    ? "NONE (ADMIN)"
                    : maxExp && maxExp.value
                      ? `${maxExp.value} ${maxExp.unit}`.toUpperCase()
                      : "7 DAYS"}
                </b>
              </li>
              <li>
                Link ID <b>128-BIT RANDOM</b>
              </li>
              <li>
                Blocked types <b>21+ BY SERVER</b>
              </li>
              <li>
                Tripwire <b>5 BAD PW · 20 DL / 5 IP</b>
              </li>
            </ul>
          </div>
          <div className={bay.issueWrap}>
            <button
              type="button"
              className={bay.issue}
              disabled={files.length <= 0 || isUploading}
              onClick={() => showCreateUploadModalCallback(files)}
            >
              <span>{isUploading ? "PRINTING…" : "ISSUE TICKET"}</span>
              <small>
                {files.length} ITEM{files.length === 1 ? "" : "S"} →
              </small>
            </button>
            <div className={bay.issueNote}>
              {files.length
                ? "Opens the declaration form"
                : "Load at least one item to issue"}
            </div>
          </div>
        </motion.aside>
      </div>
      </div>
    </>
  );
};
export default Upload;
