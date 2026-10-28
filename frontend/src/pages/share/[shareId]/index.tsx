import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useModals } from "@mantine/modals";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { TbDownload, TbEdit, TbPlusMinus } from "react-icons/tb";
import Meta from "../../../components/Meta";
import DownloadAllButton from "../../../components/share/DownloadAllButton";
import FileList from "../../../components/share/FileList";
import SafetyCard from "../../../components/share/SafetyCard";
import CheckpointClosed from "../../../components/share/CheckpointClosed";
import useShareAccess from "../../../hooks/shareAccess.hook";
import showShareInformationsModal from "../../../components/share/showShareInformationsModal";
import useConfig from "../../../hooks/config.hook";
import useTranslate from "../../../hooks/useTranslate.hook";
import useUser from "../../../hooks/user.hook";
import shareService from "../../../services/share.service";
import { MyShare } from "../../../types/share.type";
import toast from "../../../utils/toast.util";
import { byteToHumanSizeString } from "../../../utils/fileSize.util";
import { getQueryString } from "../../../utils/router.util";
import { HoverTip } from "../../../components/core/HoverTip";

export function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: { shareId: context.params!.shareId },
  };
}

const Share = ({ shareId }: { shareId: string }) => {
  const modals = useModals();
  const router = useRouter();
  const { share, setShare, isRestricted, error } = useShareAccess({
    shareId,
    modals,
  });
  const { user } = useUser();
  const config = useConfig();
  const t = useTranslate();

  const isOwner = !!user && !!share && share.creator?.id === user.id;

  const isOwnerOrAdmin =
    !!user && !!share && (share.creator?.id === user.id || user.isAdmin);
  const recipientId = getQueryString(router.query.recipient);

  const handleEditClick = async () => {
    try {
      const myShares = isOwner
        ? await shareService.getMyShares()
        : await shareService.list();
      const myShare = myShares.find((s) => s.id === shareId);
      if (!myShare) return;
      showShareInformationsModal(
        modals,
        myShare,
        parseInt(config.get("share.maxSize")),
        config.get("general.appUrl"),
        config.get("general.appUrl", true),
        user?.isAdmin
          ? { value: 0, unit: "days" }
          : config.get("share.maxExpiration"),
        (updatedShare: MyShare) => {
          setShare((prev) =>
            prev
              ? {
                  ...prev,
                  name: updatedShare.name,
                  description: updatedShare.description,
                  expiration: updatedShare.expiration,
                  hasPassword:
                    updatedShare.security?.passwordProtected ??
                    prev.hasPassword,
                }
              : prev,
          );
        },
        true,
      );
    } catch (e) {
      toast.axiosError(e);
    }
  };

  if (error) {
    const isTripwire =
      error.title === "share.error.removed.title" &&
      !!error.message?.startsWith("Auto-revoked");
    const codes: Record<string, string> = {
      "share.error.not-found.title": "NOT FOUND",
      "share.error.expired.title": "EXPIRED",
      "share.error.removed.title": isTripwire ? "TRIPWIRE" : "REVOKED",
      "share.error.visitor-limit-exceeded.title": "VIEW LIMIT",
      "share.error.access-denied.title": "PRIVATE",
    };
    const plain: Record<string, string> = {
      "NOT FOUND":
        "This link doesn't match any share. Check that it was copied in full.",
      EXPIRED: "The sender's time limit ran out, so these files are gone.",
      REVOKED: "The sender cancelled this link. Ask them for a new one.",
      "VIEW LIMIT":
        "This link was opened as many times as the sender allowed.",
      TRIPWIRE:
        "Nothing can be downloaded after the lock. Ask the sender for a fresh link.",
    };
    const code = codes[error.title] ?? "ERROR";
    const text =
      plain[code] ??
      error.message ??
      (error.description ? t(error.description) : "");
    const reason = isTripwire
      ? error.message!.replace(/^Auto-revoked:\s*/i, "Locked after ")
      : undefined;
    return (
      <>
        <Meta title={t(error.title)} />
        <CheckpointClosed
          code={code}
          reason={reason}
          hazard={isTripwire}
          title={isTripwire ? "Tripwire triggered. Link locked." : t(error.title)}
          text={text}
          actionLabel={t("common.button.go-home")}
          actionHref="/"
        />
      </>
    );
  }

  if (isRestricted) {
    return (
      <CheckpointClosed
        code="RECIPIENTS ONLY"
        title={<FormattedMessage id="share.error.restricted.title" />}
        text={<FormattedMessage id="share.error.restricted.description" />}
        actionLabel={<FormattedMessage id="share.error.restricted.button" />}
        actionHref={`/auth/signIn?redirect=/share/${shareId}`}
      />
    );
  }

  return (
    <>
      <Meta
        title={t("share.title", { shareId: share?.name || shareId })}
        description={t("share.description")}
      />

      {(() => {
        const files = share?.files ?? [];
        const ownerTools =
          isOwner || isOwnerOrAdmin ? (
            <Group spacing="xs">
              <span className="rv-label">Sender tools</span>
              {isOwner && (
                <HoverTip label={t("account.shares.button.edit")}>
                  <Link href={`/share/${shareId}/edit`}>
                    <ActionIcon variant="outline" color="dark" size="lg" aria-label={t("account.shares.button.edit")}>
                      <TbPlusMinus />
                    </ActionIcon>
                  </Link>
                </HoverTip>
              )}
              {isOwnerOrAdmin && (
                <HoverTip label={t("common.button.edit")}>
                  <ActionIcon
                    variant="outline"
                    color="dark"
                    size="lg"
                    aria-label={t("common.button.edit")}
                    onClick={handleEditClick}
                  >
                    <TbEdit />
                  </ActionIcon>
                </HoverTip>
              )}
            </Group>
          ) : null;
        const action =
          files.length > 1 ? (
            <DownloadAllButton shareId={shareId} recipientId={recipientId} primary>
              <TbDownload style={{ marginRight: 8 }} />
              Download all safely · ZIP
            </DownloadAllButton>
          ) : files.length === 1 ? (
            <Button
              size="lg"
              fullWidth
              radius={0}
              leftIcon={<TbDownload />}
              onClick={() =>
                shareService.downloadFile(shareId, files[0].id, recipientId)
              }
            >
              Download safely
            </Button>
          ) : null;
        return share?.safety ? (
          <SafetyCard
            safety={share.safety}
            files={files}
            createdAt={share.createdAt}
            shareId={shareId}
            name={share.name}
            description={share.description}
            action={action}
            tools={ownerTools}
          />
        ) : (
          <Box mb="lg">
            <div className="rv-label">Share · {shareId}</div>
            <Title order={2} mt={4} style={{ overflowWrap: "anywhere" }}>
              {share?.name || shareId}
            </Title>
            <Text size="sm">{share?.description}</Text>
            <Group mt="md">
              {ownerTools}
              {action}
            </Group>
          </Box>
        );
      })()}

      <FileList
        files={share?.files}
        setShare={setShare}
        share={share!}
        isLoading={!share}
        recipientId={recipientId}
      />
    </>
  );
};

export default Share;
