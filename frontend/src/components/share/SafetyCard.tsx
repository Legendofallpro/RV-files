import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { TbCheck, TbShieldLock } from "react-icons/tb";
import useTranslate from "../../hooks/useTranslate.hook";
import { ShareSafety } from "../../types/share.type";
import { byteToHumanSizeString } from "../../utils/fileSize.util";
import s from "./recipient.module.css";
import SecuritySeal from "./SecuritySeal";

export const fileType = (fileName: string) => {
  const name = fileName.split(/[\\/]/).pop() || fileName;
  const dot = name.lastIndexOf(".");
  return dot > 0
    ? name
        .slice(dot + 1)
        .trim()
        .toUpperCase()
    : "";
};

// Deterministic barcode from the share id: bar widths 1-4px.
const Barcode = ({ seed }: { seed: string }) => {
  const bars = Array.from((seed + seed).slice(0, 34)).map(
    (c) => (c.charCodeAt(0) % 4) + 1,
  );
  return (
    <span className={s.barcode} aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} style={{ width: w, opacity: i % 5 === 0 ? 0.55 : 1 }} />
      ))}
    </span>
  );
};

const pad = (v: number) => String(v).padStart(2, "0");

const Countdown = ({
  expiresAt,
  createdAt,
}: {
  expiresAt: string | null;
  createdAt?: string;
}) => {
  const t = useTranslate();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (expiresAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (expiresAt === null)
    return (
      <div>
        <div className={s.kicker}>Valid for</div>
        <div className={s.count}>∞</div>
        <div className={s.gaugeText}>{t("share.expiry.no-expiry")}</div>
      </div>
    );

  const deadline = Date.parse(expiresAt);
  const current = now ?? deadline;
  const secs = Math.max(0, Math.ceil((deadline - current) / 1000));
  const origin = createdAt ? Date.parse(createdAt) : current;
  const total = Math.max(1, deadline - origin);
  const left = now === null ? 1 : Math.max(0, Math.min(1, (deadline - current) / total));
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const urgent = secs > 0 && secs < 3600;

  return (
    <div>
      <div className={s.kicker}>{t("share.expiry.remaining")}</div>
      <div
        className={`${s.count} ${urgent ? s.urgent : ""}`}
        role="timer"
        aria-live="off"
        suppressHydrationWarning
      >
        {now === null ? (
          "--:--:--"
        ) : secs <= 0 ? (
          t("share.expiry.expired")
        ) : (
          <>
            {d > 0 && (
              <>
                {d}
                <small>D</small>
              </>
            )}
            {pad(h)}
            <small>H</small>
            {pad(m)}
            <small>M</small>
            {pad(secs % 60)}
            <small>S</small>
          </>
        )}
      </div>
      <div className={s.bar} aria-hidden="true">
        <motion.div
          className={s.barFill}
          style={{ background: urgent ? "var(--rv-signal)" : undefined }}
          initial={false}
          animate={{ width: `${left * 100}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>
      <div className={s.gaugeText} style={{ color: "var(--rv-muted)" }}>
        Closes {new Date(deadline).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </div>
    </div>
  );
};

const ViewsGauge = ({ views, maxViews }: { views: number; maxViews: number | null }) => {
  const t = useTranslate();
  if (maxViews === null)
    return (
      <div>
        <div className={s.kicker}>Views</div>
        <div className={s.gaugeText}>
          <strong>{views}</strong> so far · {t("share.safety.unlimited-views")}
        </div>
      </div>
    );
  const shown = Math.min(maxViews, 20);
  const used = Math.round((Math.min(views, maxViews) / maxViews) * shown);
  return (
    <div>
      <div className={s.kicker}>Views punched</div>
      <div className={s.holes} aria-hidden="true">
        {Array.from({ length: shown }).map((_, i) => (
          <span key={i} className={`${s.hole} ${i < used ? s.holeUsed : ""}`} />
        ))}
      </div>
      <div className={s.gaugeText}>
        <strong>{views}</strong> / {maxViews} used · {Math.max(0, maxViews - views)} left
      </div>
    </div>
  );
};

// Recipient-facing inspection slip: what was checked before this share opened.
const SafetyCard = ({
  safety,
  files,
  createdAt,
  shareId,
  name,
  description,
  action,
  tools,
}: {
  safety: ShareSafety;
  files: { name: string; size: string }[];
  createdAt?: string;
  shareId: string;
  name?: string;
  description?: string;
  action?: ReactNode;
  tools?: ReactNode;
}) => {
  const t = useTranslate();
  const reduceMotion = useReducedMotion();
  const shake = useAnimationControls();
  const checks = [
    { label: t("share.safety.blocked-list", { count: safety.blockedExtensions.length }), code: "EXT-BLOCK" },
    { label: t("share.safety.attachment"), code: "NO-EXEC" },
    { label: t("share.safety.unguessable"), code: "128-BIT" },
  ];
  const types = Array.from(
    new Set(files.map((file) => fileType(file.name)).filter(Boolean)),
  );
  const totalBytes = files.reduce((sum, f) => {
    const n = Number(f.size);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
  const serial = `RV-${shareId.slice(0, 4).toUpperCase()}-${shareId
    .slice(-4)
    .toUpperCase()}`;

  return (
    <motion.div className={s.wrap} animate={shake}>
      <SecuritySeal serial={serial} date={new Date().toISOString().slice(0, 10)} />
      <section
        className={`${s.slip} ${s.paper}`}
        aria-label={t("share.safety.title")}
      >
        <div className={s.strip}>
          <span>
            <b>■</b> Inspection slip · Form RV-7 · {serial}
          </span>
          <Barcode seed={shareId} />
        </div>

        <div className={s.body}>
          <div className={s.form}>
            <div className={s.kicker}>Consignment · {shareId}</div>
            <h1 className={s.title}>{name || shareId}</h1>
            {description && <p className={s.desc}>{description}</p>}

            <div className={s.grid}>
              <div className={s.cell}>
                <div className={s.cellLabel}>
                  <i>01</i>Shared by
                </div>
                <div className={s.cellValue}>
                  {safety.sharedBy?.trim() || t("share.safety.anonymous")}
                </div>
              </div>
              <div className={s.cell}>
                <div className={s.cellLabel}>
                  <i>02</i>Contents
                </div>
                <div className={s.cellValue}>
                  {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
                  {byteToHumanSizeString(totalBytes)}
                </div>
              </div>
              <div className={s.cell}>
                <div className={s.cellLabel}>
                  <i>03</i>File type
                </div>
                <div className={s.cellValue} style={{ fontFamily: "var(--rv-font-mono, monospace)" }}>
                  {types.length ? types.join(" · ") : t("share.safety.unknown-type")}
                </div>
              </div>
              <div className={s.cell}>
                <div className={s.cellLabel}>
                  <i>04</i>Password
                </div>
                <div className={s.cellValue}>
                  {safety.hasPassword ? "Required · verified" : "None set"}
                </div>
              </div>
              <div className={s.cell}>
                <div className={s.cellLabel}>
                  <i>05</i>Delivery
                </div>
                <div className={s.cellValue}>Attachment only</div>
              </div>
              <div className={s.cell}>
                <div className={s.cellLabel}>
                  <i>06</i>Tripwire
                </div>
                <div className={s.cellValue}>Armed</div>
              </div>
            </div>

            <ul className={s.checks}>
              {checks.map((check, index) => {
                const at = reduceMotion ? 0 : 0.35 + index * 0.42;
                return (
                  <motion.li
                    key={check.code}
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: at, duration: 0.25 }}
                  >
                    <span className={s.tick}>
                      <motion.span
                        style={{ display: "grid" }}
                        initial={reduceMotion ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: at + 0.12, type: "spring", stiffness: 600, damping: 18 }}
                      >
                        <TbCheck size={13} strokeWidth={3.5} aria-hidden="true" />
                      </motion.span>
                    </span>
                    <span>{check.label}</span>
                    <span className={s.checkCode}>✓ {check.code}</span>
                  </motion.li>
                );
              })}
            </ul>
            <p className={s.note}>{t("share.safety.extension-note")}</p>
          </div>

          <div className={s.side}>
            <Countdown expiresAt={safety.expiresAt} createdAt={createdAt} />
            <ViewsGauge views={safety.views} maxViews={safety.maxViews} />
            {tools}
            <div className={s.download}>
              {action}
              <p className={s.reassure}>
                <TbShieldLock size={16} style={{ flex: "none", marginTop: 1 }} aria-hidden="true" />
                Downloads as an attachment, never runs in your browser.
              </p>
            </div>
          </div>
        </div>
      </section>

    </motion.div>
  );
};
export default SafetyCard;
