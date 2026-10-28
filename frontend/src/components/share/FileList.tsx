import {
  ActionIcon,
  Group,
  Skeleton,
  Stack,
  TextInput,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TbDownload, TbEye, TbLink, TbClipboard } from "react-icons/tb";
import { FormattedMessage } from "react-intl";
import useConfig from "../../hooks/config.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { FileMetaData } from "../../types/File.type";
import { Share } from "../../types/share.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import toast from "../../utils/toast.util";
import TableSortIcon, { TableSort } from "../core/SortIcon";
import showFilePreviewModal from "./modals/showFilePreviewModal";
import { HoverTip } from "../core/HoverTip";
import api from "../../services/api.service";
import m from "./recipient.module.css";
import { fileType } from "./SafetyCard";

const renderFileName = (name: string) => {
  const parts = name.split("/");
  if (parts.length === 1) return name;
  const fileName = parts.pop();
  const folderPath = parts.join("/");
  return (
    <span>
      <span style={{ opacity: 0.5 }}>{folderPath}/</span>
      <span style={{ fontWeight: 600 }}>{fileName}</span>
    </span>
  );
};

const FileList = ({
  files,
  setShare,
  share,
  isLoading,
  recipientId,
}: {
  files?: FileMetaData[];
  setShare: Dispatch<SetStateAction<Share | undefined>>;
  share: Share;
  isLoading: boolean;
  recipientId?: string;
}) => {
  const clipboard = useClipboard();
  const config = useConfig();
  const modals = useModals();
  const t = useTranslate();

  const [sort, setSort] = useState<TableSort>({
    property: "name",
    direction: "desc",
  });

  const sortFiles = () => {
    if (files && sort.property) {
      const sortedFiles = files.sort((a: any, b: any) => {
        if (sort.direction === "asc") {
          return b[sort.property!].localeCompare(a[sort.property!], undefined, {
            numeric: true,
          });
        } else {
          return a[sort.property!].localeCompare(b[sort.property!], undefined, {
            numeric: true,
          });
        }
      });

      setShare({
        ...share,
        files: sortedFiles,
      });
    }
  };

  const copyFileLink = (file: FileMetaData) => {
    const recipientQuery = recipientId
      ? `?recipient=${encodeURIComponent(recipientId)}`
      : "";
    const link = `${config.get("general.appUrl") !== config.get("general.appUrl", true) ? config.get("general.appUrl") : window.location.origin}/api/shares/${
      share.id
    }/files/${file.id}${recipientQuery}`;

    if (window.isSecureContext) {
      clipboard.copy(link);
      toast.success(t("common.notify.copied-link"));
    } else {
      modals.openModal({
        title: t("share.modal.file-link"),
        children: (
          <Stack align="stretch">
            <TextInput variant="filled" value={link} />
          </Stack>
        ),
      });
    }
  };

  useEffect(sortFiles, [sort]);

  const actions = (file: FileMetaData) => (
    <Group position="right" noWrap spacing={6}>
      {shareService.isShareTextFile(file.name) && (
        <HoverTip label={t("share.copy-text-contents")}>
          <ActionIcon
            variant="subtle"
            size={30}
            aria-label={t("share.copy-text-contents")}
            onClick={() => {
              api
                .get(`/shares/${share.id}/files/${file.id}?download=false`)
                .then((res) => {
                  if (window.isSecureContext) {
                    clipboard.copy(res.data);
                    toast.success(t("share.notify.copied-contents"));
                  } else {
                    toast.error(t("share.notify.copy-not-supported"));
                  }
                });
            }}
          >
            <TbClipboard />
          </ActionIcon>
        </HoverTip>
      )}
      {shareService.doesFileSupportPreview(file.name) && (
        <HoverTip label={t("common.button.preview")}>
          <ActionIcon
            variant="subtle"
            size={30}
            aria-label={t("common.button.preview")}
            onClick={() => showFilePreviewModal(share.id, file, modals)}
          >
            <TbEye />
          </ActionIcon>
        </HoverTip>
      )}
      {!share.hasPassword && (
        <HoverTip label={t("common.button.copy-link")}>
          <ActionIcon
            variant="subtle"
            size={30}
            aria-label={t("common.button.copy-link")}
            onClick={() => copyFileLink(file)}
          >
            <TbLink />
          </ActionIcon>
        </HoverTip>
      )}
      <HoverTip label={t("common.button.download")}>
        <ActionIcon
          color="victoria"
          variant="filled"
          size={30}
          radius={0}
          aria-label={`${t("common.button.download")} ${file.name}`}
          onClick={async () => {
            await shareService.downloadFile(share.id, file.id, recipientId);
          }}
        >
          <TbDownload />
        </ActionIcon>
      </HoverTip>
    </Group>
  );

  return (
    <section className={`${m.manifest} ${m.paper}`} aria-label="Manifest">
      <div className={m.manifestHead}>
        <span className={m.kicker}>
          Manifest · {files?.length ?? 0} line{files?.length === 1 ? "" : "s"}
        </span>
        <Group spacing="md">
          <span className={`${m.kicker} ${m.sortBtn}`}>
            <FormattedMessage id="share.table.name" />
            <TableSortIcon sort={sort} setSort={setSort} property="name" />
          </span>
          <span className={`${m.kicker} ${m.sortBtn}`}>
            <FormattedMessage id="share.table.size" />
            <TableSortIcon sort={sort} setSort={setSort} property="size" />
          </span>
        </Group>
      </div>
      {isLoading
        ? [...Array(3)].map((_, i) => (
            <div className={m.line} key={i}>
              <Skeleton height={14} width={20} />
              <Skeleton height={14} />
              <Skeleton height={14} width={60} />
              <Skeleton height={28} width={28} />
            </div>
          ))
        : files!.map((file, index) => (
            <div className={m.line} key={file.name}>
              <span className={m.lineNo}>{String(index + 1).padStart(2, "0")}</span>
              <span className={m.lineName}>
                <span>{renderFileName(file.name)}</span>
                <span className={m.leader} aria-hidden="true" />
              </span>
              <span className={m.lineMeta}>
                {byteToHumanSizeString(parseInt(file.size))}
                <span className={m.typeTag}>{fileType(file.name) || "FILE"}</span>
              </span>
              {actions(file)}
            </div>
          ))}
    </section>
  );
};

export default FileList;
