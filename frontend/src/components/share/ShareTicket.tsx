import { motion, useReducedMotion } from "framer-motion";
import moment from "moment";
import { useMemo } from "react";
import tk from "../upload/ticket.module.css";

// Deterministic barcode bars from the share id (decorative, not scannable).
const barsFor = (id: string) => {
  const out: { w: number; gap: number }[] = [];
  for (let i = 0; i < id.length * 3; i++) {
    const c = id.charCodeAt(i % id.length) + i * 7;
    out.push({ w: (c % 3) + 1, gap: ((c >> 2) % 3) + 1 });
  }
  return out;
};

const serialFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const s = String(h).padStart(10, "0").slice(0, 10);
  return `RV-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
};

// Ticket-stub rendering of a share link: the ID, link, barcode and serial on
// the main part; expiry and remaining views on the perforated stub.
const ShareTicket = ({
  shareId,
  link,
  expiration,
  maxViews,
  views = 0,
}: {
  shareId: string;
  link: string;
  expiration?: Date | string | null;
  maxViews?: number | null;
  views?: number;
}) => {
  const reduceMotion = useReducedMotion();
  const never = !expiration || moment(expiration).unix() === 0;
  const viewsLeft =
    maxViews === undefined || maxViews === null
      ? "NO LIMIT"
      : String(Math.max(0, maxViews - views));
  const bars = useMemo(() => barsFor(shareId), [shareId]);
  const serial = useMemo(() => serialFor(shareId), [shareId]);

  // Print: the ticket feeds out of the slot, then the stub tears along the
  // perforation and settles slightly askew.
  return (
    <div className={tk.slot}>
      <div className={tk.slotMouth} aria-hidden="true">
        <span className={tk.led} />
      </div>
      <div className={tk.clip}>
        <motion.div
          className={tk.ticket}
          initial={reduceMotion ? false : { y: "-105%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.25, 1] }}
        >
          <div className={tk.main}>
            <div className={tk.mainTop}>
              <span>
                Share ticket · <b>checked</b>
              </span>
              <span>Admit link holder</span>
            </div>
            <span className={tk.id} data-testid="ticket-id">
              {shareId}
            </span>
            <div className={tk.link}>{link.replace(/^https?:\/\//, "")}</div>
            <div className={tk.barRow}>
              <div className={tk.barcode} aria-hidden="true">
                {bars.map((b, i) => (
                  <i
                    key={i}
                    style={{ width: b.w, marginRight: b.gap }}
                  />
                ))}
              </div>
              <div className={tk.serial}>
                SERIAL
                <b>{serial}</b>
              </div>
            </div>
          </div>
          <motion.div
            className={tk.stub}
            animate={
              reduceMotion
                ? {}
                : { x: [0, 0, 8, 6], y: [0, 0, 3, 2], rotate: [0, 0, 3.4, 2.6] }
            }
            transition={{
              delay: 1.0,
              duration: 0.55,
              times: [0, 0.15, 0.7, 1],
              ease: "easeOut",
            }}
          >
            <div className={tk.field}>
              <span className="rv-label">Expires</span>
              <strong suppressHydrationWarning>
                {never ? "NEVER" : moment(expiration).format("DD MMM HH:mm")}
              </strong>
            </div>
            <div className={tk.field}>
              <span className="rv-label">Views left</span>
              <strong>{viewsLeft}</strong>
            </div>
            <span className={tk.admit} aria-hidden="true">
              ADMIT
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShareTicket;
