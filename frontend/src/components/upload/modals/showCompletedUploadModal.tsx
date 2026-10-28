import { Button, Stack, Text, Collapse } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { TbCheck, TbCopy, TbExternalLink, TbQrcode } from "react-icons/tb";
import toast from "../../../utils/toast.util";
import tk from "../ticket.module.css";
import { useModals } from "@mantine/modals";
import { ModalsContextProps } from "@mantine/modals/lib/context";
import { useState } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import useTranslate, {
  translateOutsideContext,
} from "../../../hooks/useTranslate.hook";
import { CompletedShare } from "../../../types/share.type";
import QRCode from "../../share/QRCode";
import ShareTicket from "../../share/ShareTicket";

const showCompletedUploadModal = (
  modals: ModalsContextProps,
  share: CompletedShare,
  appUrl: string,
  defaultAppUrl: string,
  maxViews?: number | null,
) => {
  const t = translateOutsideContext();
  return modals.openModal({
    closeOnClickOutside: false,
    withCloseButton: false,
    closeOnEscape: false,
    size: "lg",
    title: t("upload.modal.completed.share-ready"),
    children: (
      <Body
        share={share}
        appUrl={appUrl}
        defaultAppUrl={defaultAppUrl}
        maxViews={maxViews ?? share.safety?.maxViews ?? null}
      />
    ),
  });
};

const Body = ({
  share,
  appUrl,
  defaultAppUrl,
  maxViews,
}: {
  share: CompletedShare;
  appUrl: string;
  defaultAppUrl: string;
  maxViews: number | null;
}) => {
  const modals = useModals();
  const router = useRouter();
  const t = useTranslate();

  const isReverseShare = !!router.query["reverseShareToken"];

  const link = `${appUrl !== defaultAppUrl ? appUrl : window.location.origin}/s/${share.id}`;

  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const clipboard = useClipboard({ timeout: 500 });
  const canCopy = typeof window !== "undefined" && window.isSecureContext;
  const copyLink = () => {
    clipboard.copy(link);
    toast.success(t("common.notify.copied-link"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleQR = () => {
    setShowQR(!showQR);
  };


  return (
    <Stack align="stretch">
      <ShareTicket
        shareId={share.id}
        link={link}
        expiration={share.expiration}
        maxViews={maxViews}
      />
      <div className={tk.controls} role="group" aria-label="Ticket controls">
        {canCopy ? (
          <button
            type="button"
            className={`${tk.ctl} ${tk.ctlPrimary}`}
            onClick={copyLink}
          >
            {copied ? <TbCheck /> : <TbCopy />}
            {copied ? "Copied" : "Copy link"}
          </button>
        ) : (
          <input
            readOnly
            value={link}
            aria-label={t("common.text.link")}
            className={tk.ctl}
            onFocus={(e) => e.currentTarget.select()}
            style={{ textTransform: "none", minWidth: 0 }}
          />
        )}
        <button
          type="button"
          className={`${tk.ctl} ${showQR ? tk.ctlOn : ""}`}
          onClick={handleToggleQR}
          aria-pressed={showQR}
        >
          <TbQrcode /> QR
        </button>
        <a className={tk.ctl} href={link}>
          <TbExternalLink /> Open
        </a>
      </div>
      <Collapse in={showQR}>
        <div className={tk.qrBox}>
          <QRCode link={link} />
        </div>
      </Collapse>
      {share.notifyReverseShareCreator === true && (
        <Text
          size="sm"
          sx={(theme) => ({
            color:
              theme.colorScheme === "dark"
                ? theme.colors.gray[3]
                : theme.colors.dark[4],
          })}
        >
          {t("upload.modal.completed.notified-reverse-share-creator")}
        </Text>
      )}
      <Text className={tk.doneNote}>
        {/* If our share.expiration is timestamp 0, show a different message */}
        {moment(share.expiration).unix() === 0
          ? t("upload.modal.completed.never-expires")
          : t("upload.modal.completed.expires-on", {
              expiration: moment(share.expiration).format("LLL"),
            })}
      </Text>

      <Button
        onClick={() => {
          modals.closeAll();
          if (isReverseShare) {
            router.reload();
          } else {
            router.push("/upload");
          }
        }}
      >
        <FormattedMessage id="common.button.done" />
      </Button>
    </Stack>
  );
};

export default showCompletedUploadModal;
