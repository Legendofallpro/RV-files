import {
  ActionIcon,
  Button,
  Center,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useModals } from "@mantine/modals";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TbPlusMinus,
  TbActivity,
  TbBan,
  TbInfoCircle,
  TbLink,
  TbLock,
  TbTrash,
  TbUsers,
} from "react-icons/tb";
import { FaUserLock } from "react-icons/fa";
import { FormattedMessage } from "react-intl";
import Meta from "../../components/Meta";
import showShareInformationsModal from "../../components/share/showShareInformationsModal";
import showShareLinkModal from "../../components/account/showShareLinkModal";
import { HoverTip } from "../../components/core/HoverTip";
import CenterLoader from "../../components/core/CenterLoader";
import useConfig from "../../hooks/config.hook";
import useUser from "../../hooks/user.hook";
import useTranslate from "../../hooks/useTranslate.hook";
import shareService from "../../services/share.service";
import { MyShare } from "../../types/share.type";
import toast from "../../utils/toast.util";
import bd from "../../components/account/board.module.css";

const browserName = (ua: string | null) => {
  if (!ua) return null;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\/|CriOS/.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  if (/curl\//.test(ua)) return "curl";
  return null;
};

const shareStatus = (share: MyShare) => {
  if (share.removedReason?.startsWith("Auto-revoked")) return "tripwire";
  if (share.removedReason) return "revoked";
  const expiry = moment(share.expiration);
  if (expiry.unix() !== 0 && expiry.isBefore(moment())) return "expired";
  return "active";
};

const pad = (n: number) => String(n).padStart(2, "0");
const countdown = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
};

const MyShares = () => {
  const modals = useModals();
  const clipboard = useClipboard();
  const config = useConfig();
  const { user } = useUser();
  const t = useTranslate();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [shares, setShares] = useState<MyShare[]>();
  const [voiding, setVoiding] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const showActivity = async (shareId: string) => {
    let events: Awaited<ReturnType<typeof shareService.getActivity>> = [];
    try {
      events = await shareService.getActivity(shareId);
    } catch {
      toast.error(t("common.error.unknown"));
      return;
    }
    modals.openModal({
      title: t("account.shares.modal.activity.title", { share: shareId }),
      size: "lg",
      children: (
        <div>
          <div className={bd.logHead}>
            <span>
              Gate log ·{" "}
              <span style={{ textTransform: "none" }}>{shareId}</span>
            </span>
            <span>{events.length} event{events.length === 1 ? "" : "s"}</span>
          </div>
          {events.length ? (
            <ol className={bd.log}>
              {events.map((e, i) => (
                <li className={bd.logItem} key={i}>
                  <span className={bd.logTime}>
                    {moment(e.createdAt).format("HH:mm:ss")}
                  </span>
                  <span className={bd.logDot} aria-hidden="true">
                    <i
                      className={e.type === "bad_password" ? bd.hot : undefined}
                    />
                  </span>
                  <span className={bd.logMsg}>
                    <b>{t(`account.shares.activity.${e.type}`)}</b> ·{" "}
                    {browserName(e.userAgent) ??
                      t("account.shares.activity.unknown-browser")}
                    <span>
                      {moment(e.createdAt).format("DD MMM YYYY")} ·{" "}
                      {moment(e.createdAt).fromNow()}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className={bd.logEmpty}>
              ▸ <FormattedMessage id="account.shares.modal.activity.empty" />
            </div>
          )}
        </div>
      ),
    });
  };

  useEffect(() => {
    shareService.getMyShares().then((shares) => setShares(shares));
  }, []);

  const stats = useMemo(() => {
    const list = shares ?? [];
    const by = (st: string) => list.filter((x) => shareStatus(x) === st).length;
    return {
      total: list.length,
      active: by("active"),
      expired: by("expired"),
      revoked: by("revoked"),
      tripwire: by("tripwire"),
      downloads: list.reduce((acc, x) => acc + (x.downloads || 0), 0),
      views: list.reduce((acc, x) => acc + (x.views || 0), 0),
    };
  }, [shares]);

  if (!shares) return <CenterLoader />;

  const openInfo = (share: MyShare) =>
    showShareInformationsModal(
      modals,
      share,
      parseInt(config.get("share.maxSize")),
      config.get("general.appUrl"),
      config.get("general.appUrl", true),
      user?.isAdmin
        ? { value: 0, unit: "days" }
        : config.get("share.maxExpiration"),
      (updatedShare) =>
        setShares(
          shares.map((item) =>
            item.id === updatedShare.id ? updatedShare : item,
          ),
        ),
    );

  const copyLink = (share: MyShare) => {
    if (window.isSecureContext) {
      clipboard.copy(
        `${config.get("general.appUrl") !== config.get("general.appUrl", true) ? config.get("general.appUrl") : window.location.origin}/s/${share.id}`,
      );
      toast.success(t("common.notify.copied-link"));
    } else {
      showShareLinkModal(
        modals,
        share.id,
        config.get("general.appUrl"),
        config.get("general.appUrl", true),
        {
          expiration: share.expiration,
          maxViews: share.security?.maxViews ?? null,
          views: share.views,
        },
      );
    }
  };

  const revoke = (share: MyShare) =>
    modals.openConfirmModal({
      title: t("account.shares.modal.revoke.title", {
        share: share.id,
      }),
      children: (
        <Text size="sm">
          <FormattedMessage id="account.shares.modal.revoke.description" />
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: {
        confirm: t("account.shares.button.revoke"),
        cancel: t("common.button.cancel"),
      },
      onConfirm: async () => {
        await shareService.revoke(share.id);
        setVoiding(share.id);
        setTimeout(() => setVoiding(null), 1400);
        setShares(
          shares.map((item) =>
            item.id === share.id
              ? {
                  ...item,
                  removedReason: "Revoked by owner",
                }
              : item,
          ),
        );
      },
    });

  const remove = (share: MyShare) =>
    modals.openConfirmModal({
      title: t("account.shares.modal.delete.title", {
        share: share.id,
      }),
      children: (
        <Text size="sm">
          <FormattedMessage id="account.shares.modal.delete.description" />
        </Text>
      ),
      confirmProps: {
        color: "red",
      },
      labels: {
        confirm: t("common.button.delete"),
        cancel: t("common.button.cancel"),
      },
      onConfirm: () => {
        shareService.expire(share.id);
        setShares(shares.filter((item) => item.id !== share.id));
      },
    });

  const spark = (on: number, cls?: string) => (
    <div className={bd.spark} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <i
          key={i}
          className={
            i < Math.round((on / Math.max(stats.total, 1)) * 12)
              ? cls ?? bd.on
              : undefined
          }
        />
      ))}
    </div>
  );

  return (
    <>
      <Meta title={t("account.shares.title")} />
      <div className={bd.wide}>
        <div className={bd.head}>
          <div>
            <div className="rv-label">
              Owner operations board · {shares.length} share
              {shares.length === 1 ? "" : "s"}
            </div>
            <h1 className={bd.title}>
              <FormattedMessage id="account.shares.title" />
              <em>.</em>
            </h1>
          </div>
          <div className={bd.clock} suppressHydrationWarning>
            Board time <b>{moment(now).format("HH:mm:ss")}</b>
          </div>
        </div>

        <div className={bd.strip} role="list" aria-label="Summary">
          <div className={`${bd.stat} ${bd.statSignal}`} role="listitem">
            <span className="rv-label">Active links</span>
            <span className={bd.statNum}>{pad(stats.active)}</span>
            {spark(stats.active, bd.sig)}
          </div>
          <div className={bd.stat} role="listitem">
            <span className="rv-label">Downloads</span>
            <span className={bd.statNum}>{pad(stats.downloads)}</span>
            <div className={bd.statSub}>{stats.views} visits total</div>
          </div>
          <div className={bd.stat} role="listitem">
            <span className="rv-label">Expired</span>
            <span className={bd.statNum}>{pad(stats.expired)}</span>
            {spark(stats.expired)}
          </div>
          <div className={bd.stat} role="listitem">
            <span className="rv-label">Revoked</span>
            <span className={bd.statNum}>{pad(stats.revoked)}</span>
            {spark(stats.revoked)}
          </div>
          <div
            className={`${bd.stat} ${stats.tripwire ? bd.statHazard : ""}`}
            role="listitem"
          >
            <span className="rv-label">Tripwire hits</span>
            <span
              className={bd.statNum}
              style={stats.tripwire ? { color: "var(--rv-signal)" } : undefined}
            >
              {pad(stats.tripwire)}
            </span>
            <div className={bd.statSub}>
              {stats.tripwire ? "auto-revoked links" : "all clear"}
            </div>
          </div>
        </div>

        {shares.length == 0 ? (
          <Center style={{ height: "50vh" }}>
            <Stack align="center" spacing={10}>
              <Title order={3}>
                <FormattedMessage id="account.shares.title.empty" />
              </Title>
              <Text>
                <FormattedMessage id="account.shares.description.empty" />
              </Text>
              {user?.allowShare !== false && (
                <>
                  <Space h={5} />
                  <Button component={Link} href="/upload" variant="light">
                    <FormattedMessage id="account.shares.button.create" />
                  </Button>
                </>
              )}
            </Stack>
          </Center>
        ) : (
          <div className={bd.list}>
            <div className={bd.listHead}>
              <span>Status</span>
              <span>Entry</span>
              <span>Expires in</span>
              <span>
                <FormattedMessage id="account.shares.table.visitors" />
              </span>
              <span>
                <FormattedMessage id="account.shares.table.downloads" />
              </span>
              <span style={{ textAlign: "right" }}>Controls</span>
            </div>
            {shares.map((share, idx) => {
              const status = shareStatus(share);
              const expiry = moment(share.expiration);
              const never = expiry.unix() === 0;
              const left = expiry.valueOf() - now;
              const span = Math.max(
                1,
                expiry.valueOf() - moment(share.createdAt).valueOf(),
              );
              const frac = never ? 1 : Math.max(0, Math.min(1, left / span));
              return (
                <motion.div
                  key={share.id}
                  className={`${bd.row} ${status === "tripwire" ? bd.trip : ""} ${status === "revoked" || status === "expired" ? bd.dim : ""}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                >
                  <div>
                    {share.removedReason ? (
                      <HoverTip label={share.removedReason}>
                        <span className={`rv-pill rv-pill--${status}`}>
                          {status}
                        </span>
                      </HoverTip>
                    ) : (
                      <span className={`rv-pill rv-pill--${status}`}>
                        {status}
                      </span>
                    )}
                  </div>
                  <div className={bd.ident} style={{ position: "relative" }}>
                    <AnimatePresence>
                      {voiding === share.id && (
                        <motion.span
                          className="rv-void"
                          aria-hidden="true"
                          initial={
                            reduceMotion
                              ? { x: "-50%", y: "-50%", rotate: -8 }
                              : {
                                  x: "-50%",
                                  y: "-50%",
                                  scale: 2.4,
                                  rotate: -18,
                                  opacity: 0,
                                }
                          }
                          animate={{
                            x: "-50%",
                            y: "-50%",
                            scale: 1,
                            rotate: -8,
                            opacity: 1,
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 650,
                            damping: 20,
                          }}
                        >
                          VOID
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className={bd.idLine}>
                      {share.id}
                      {share.security?.passwordProtected && (
                        <HoverTip label="Password Protected">
                          <span style={{ display: "inline-flex" }}>
                            <TbLock
                              color="currentColor"
                              title={t("account.shares.table.password-protected")}
                            />
                          </span>
                        </HoverTip>
                      )}
                      {config.get("share.enableUserRecipients") &&
                        (share.security?.restrictToRecipients ? (
                          <HoverTip label="Recipients Only">
                            <span style={{ display: "inline-flex" }}>
                              <FaUserLock
                                color="var(--rv-muted)"
                                title={t(
                                  "account.shares.table.restricted-to-recipients",
                                )}
                              />
                            </span>
                          </HoverTip>
                        ) : share.recipients?.length ? (
                          <HoverTip label="Sent to Recipients">
                            <span style={{ display: "inline-flex" }}>
                              <TbUsers
                                color="var(--rv-muted)"
                                title={t(
                                  "account.shares.table.shared-with-recipients",
                                )}
                              />
                            </span>
                          </HoverTip>
                        ) : null)}
                    </span>
                    <span className={bd.name}>
                      {share.name || "Untitled manifest"}
                    </span>
                    {status === "tripwire" && (
                      <span className={bd.tripNote}>
                        ⚠ {share.removedReason}
                      </span>
                    )}
                  </div>
                  <div className={bd.countdown} suppressHydrationWarning>
                    {never ? (
                      <FormattedMessage id="account.shares.table.expiry-never" />
                    ) : status === "active" ? (
                      countdown(left)
                    ) : (
                      "— closed —"
                    )}
                    <small suppressHydrationWarning>
                      {never ? "no expiry" : expiry.format("DD MMM YYYY HH:mm")}
                    </small>
                    {!never && status === "active" && (
                      <div className={bd.cdBar} aria-hidden="true">
                        <i
                          className={frac < 0.2 ? bd.low : undefined}
                          style={{ width: `${frac * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className={bd.count}>
                    {share.security?.maxViews
                      ? `${share.views}/${share.security.maxViews}`
                      : pad(share.views)}
                    <small>VISITS</small>
                  </div>
                  <div className={bd.count}>
                    {pad(share.downloads)}
                    <small>DOWNLOADS</small>
                  </div>
                  <div className={bd.acts}>
                    <div className={bd.group} role="group" aria-label="Manage">
                      <Link href={`/share/${share.id}/edit`}>
                        <HoverTip label={t("account.shares.button.edit")}>
                          <ActionIcon radius={0} variant="subtle" size={32}>
                            <TbPlusMinus />
                          </ActionIcon>
                        </HoverTip>
                      </Link>
                      <HoverTip label={t("common.button.info")}>
                        <ActionIcon
                          radius={0}
                          variant="subtle"
                          size={32}
                          onClick={() => openInfo(share)}
                        >
                          <TbInfoCircle />
                        </ActionIcon>
                      </HoverTip>
                      <HoverTip label={t("common.button.copy-link")}>
                        <ActionIcon
                          radius={0}
                          variant="subtle"
                          size={32}
                          onClick={() => copyLink(share)}
                        >
                          <TbLink />
                        </ActionIcon>
                      </HoverTip>
                      <HoverTip label={t("account.shares.button.activity")}>
                        <ActionIcon
                          radius={0}
                          variant="subtle"
                          size={32}
                          data-act="activity"
                          onClick={() => showActivity(share.id)}
                        >
                          <TbActivity />
                        </ActionIcon>
                      </HoverTip>
                    </div>
                    <div
                      className={`${bd.group} ${bd.groupDanger}`}
                      role="group"
                      aria-label="Danger"
                    >
                      {!share.removedReason && (
                        <HoverTip label={t("account.shares.button.revoke")}>
                          <ActionIcon
                            radius={0}
                            color="orange"
                            variant="subtle"
                            size={32}
                            onClick={() => revoke(share)}
                          >
                            <TbBan />
                          </ActionIcon>
                        </HoverTip>
                      )}
                      <HoverTip label={t("common.button.delete")}>
                        <ActionIcon
                          radius={0}
                          color="red"
                          variant="subtle"
                          size={32}
                          onClick={() => remove(share)}
                        >
                          <TbTrash />
                        </ActionIcon>
                      </HoverTip>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyShares;
