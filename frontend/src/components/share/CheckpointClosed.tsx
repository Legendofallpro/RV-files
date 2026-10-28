import { Button } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";
import { TbArrowRight, TbLock } from "react-icons/tb";
import s from "./recipient.module.css";

type Variant = "notfound" | "expired" | "revoked" | "tripwire" | "viewlimit" | "private" | "error";

const variantFor = (code: string, hazard: boolean): Variant => {
  if (hazard || code === "TRIPWIRE") return "tripwire";
  switch (code) {
    case "NOT FOUND":
      return "notfound";
    case "EXPIRED":
      return "expired";
    case "REVOKED":
      return "revoked";
    case "VIEW LIMIT":
      return "viewlimit";
    case "PRIVATE":
    case "RECIPIENTS ONLY":
      return "private";
    default:
      return "error";
  }
};

const useSlam = (delay = 0.35) => {
  const reduce = useReducedMotion();
  return {
    initial: reduce ? false : { scale: 2.4, opacity: 0, rotate: -24 },
    animate: { scale: 1, opacity: 1, rotate: -9 },
    transition: { delay, type: "spring", stiffness: 520, damping: 20 },
  } as const;
};

const BlankSlip = ({ children }: { children?: ReactNode }) => (
  <div className={`${s.blankSlip} ${s.paper}`} aria-hidden="true">
    <div className={s.kicker}>Inspection slip · Form RV-7</div>
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className={s.blankLine} />
    ))}
    {children}
  </div>
);

const Visual = ({ variant }: { variant: Variant }) => {
  const slam = useSlam();
  const reduce = useReducedMotion();
  switch (variant) {
    case "expired":
      return (
        <motion.svg viewBox="0 0 200 200" className={s.clock} aria-hidden="true" {...slam}>
          <defs>
            <path id="rv-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <circle cx="100" cy="100" r="94" fill="none" stroke="var(--rv-signal)" strokeWidth="5" />
          <circle cx="100" cy="100" r="64" fill="none" stroke="var(--rv-signal)" strokeWidth="2.5" />
          <text fill="var(--rv-signal)" fontFamily="JetBrains Mono, monospace" fontSize="13" fontWeight="700" letterSpacing="5">
            <textPath href="#rv-ring">EXPIRED · TIME LIMIT REACHED · EXPIRED ·</textPath>
          </text>
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="42"
              x2="100"
              y2={i % 3 === 0 ? 52 : 47}
              stroke="var(--rv-signal)"
              strokeWidth="3"
              transform={`rotate(${i * 30} 100 100)`}
            />
          ))}
          <line x1="100" y1="100" x2="100" y2="58" stroke="var(--rv-signal)" strokeWidth="5" strokeLinecap="square" />
          <line x1="100" y1="100" x2="132" y2="100" stroke="var(--rv-signal)" strokeWidth="5" strokeLinecap="square" />
          <circle cx="100" cy="100" r="6" fill="var(--rv-signal)" />
        </motion.svg>
      );
    case "revoked":
      return (
        <>
          <div className={`${s.vTicket} ${s.paper}`} aria-hidden="true">
            <div className={s.vTicketMain}>
              <div className={s.kicker}>Pass · RV Files</div>
              <div className={s.blankLine} />
              <div className={s.blankLine} />
              <div className={s.blankLine} style={{ width: "50%" }} />
              <div className={s.kicker}>Admit one consignment</div>
            </div>
            <div className={s.vTicketStub}>NO. 000000</div>
          </div>
          <motion.div className={s.void} aria-hidden="true" {...slam} animate={{ ...slam.animate, rotate: -16 }}>
            VOID
          </motion.div>
        </>
      );
    case "tripwire":
      return (
        <>
          <motion.div
            className={s.tape}
            style={{ top: "18%", rotate: -8 }}
            initial={reduce ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            aria-hidden="true"
          >
            <span className={s.tapeLabel}>TRIPWIRE · DO NOT CROSS · LINK LOCKED</span>
          </motion.div>
          <motion.div
            className={s.tape}
            style={{ bottom: "16%", rotate: 6 }}
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            aria-hidden="true"
          >
            <span className={s.tapeLabel}>SECURITY HOLD · SECURITY HOLD</span>
          </motion.div>
          <motion.div
            className={s.lockBox}
            aria-hidden="true"
            initial={reduce ? false : { y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 16 }}
          >
            <TbLock size={96} strokeWidth={1.6} />
          </motion.div>
        </>
      );
    case "viewlimit":
      return (
        <div className={s.turnstile} aria-hidden="true">
          <div className={s.holes} style={{ maxWidth: 260, justifyContent: "center" }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`${s.hole} ${s.holeUsed}`} style={{ width: 22, height: 22 }} />
            ))}
          </div>
          <div className={s.bigNum}>0 left</div>
          <motion.div className={s.rectStamp} style={{ position: "relative" }} {...slam}>
            FULLY PUNCHED
          </motion.div>
        </div>
      );
    case "private":
      return (
        <>
          <div className={`${s.redacted} ${s.paper}`} aria-hidden="true">
            <div className={s.kicker}>Recipient list · restricted</div>
            {[80, 62, 90, 45, 70].map((w, i) => (
              <div key={i} className={s.redactBar} style={{ width: `${w}%` }} />
            ))}
          </div>
          <motion.div className={s.rectStamp} aria-hidden="true" {...slam}>
            NAMED
            <br />
            RECIPIENTS ONLY
          </motion.div>
        </>
      );
    default:
      return (
        <>
          <BlankSlip />
          <motion.div className={s.rectStamp} aria-hidden="true" {...slam}>
            {variant === "notfound" ? "NO SUCH TICKET" : "CHECK FAILED"}
            <small>{variant === "notfound" ? "NOT ON THE MANIFEST" : "PLEASE RETRY"}</small>
          </motion.div>
        </>
      );
  }
};

// Full-bleed "checkpoint closed" notice: one visual per reason, one line, one action.
const CheckpointClosed = ({
  code,
  title,
  text,
  reason,
  hazard = false,
  actionLabel,
  actionHref,
}: {
  code: string;
  title: ReactNode;
  text: ReactNode;
  reason?: ReactNode;
  hazard?: boolean;
  actionLabel: ReactNode;
  actionHref: string;
}) => {
  const reduce = useReducedMotion();
  const variant = variantFor(code, hazard);
  return (
    <section
      className={`${s.closed} ${variant === "tripwire" ? s.tripwire : s.paper}`}
      role="alert"
      data-variant={variant}
    >
      <div className={s.closedGrid}>
        <div className={s.visual}>
          <Visual variant={variant} />
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <span
            className={s.closedCode}
            style={{ color: variant === "tripwire" || variant === "expired" ? "var(--rv-signal)" : "var(--rv-ink)" }}
          >
            ■ Checkpoint closed · {code}
          </span>
          <h1 className={s.closedTitle}>{title}</h1>
          {reason && <p className={s.reason}>{reason}</p>}
          <p className={s.closedText}>{text}</p>
          <Button component={Link} href={actionHref} size="lg" radius={0} rightIcon={<TbArrowRight />}>
            {actionLabel}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CheckpointClosed;
