import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import s from "./auth.module.css";

const BELT = [
  { name: "q3-report.pdf", ok: true, note: "CLEARED" },
  { name: "invoice-2041.xlsx", ok: true, note: "CLEARED" },
  { name: "setup.exe", ok: false, note: "BLOCKED" },
  { name: "site-photos.zip", ok: true, note: "CLEARED" },
  { name: "macro.vbs", ok: false, note: "BLOCKED" },
  { name: "contract-final.docx", ok: true, note: "CLEARED" },
];
const ROWS = 5;

// Animated mini scanner: a beam sweeps the belt and each item is stamped as it passes.
const Scanner = () => {
  const reduce = useReducedMotion();
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setOffset((o) => (o + 1) % BELT.length), 2400);
    return () => clearInterval(timer);
  }, [reduce]);
  const items = Array.from({ length: ROWS }).map((_, i) => BELT[(offset + i) % BELT.length]);
  return (
    <div className={s.scanner} aria-hidden="true">
      <div className={s.belt}>
        {items.map((item, i) => (
          <motion.div
            key={`${item.name}-${offset}-${i}`}
            className={s.item}
            initial={reduce ? false : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <span>{String(((offset + i) % BELT.length) + 1).padStart(2, "0")}</span>
            <span>{item.name}</span>
            <motion.span
              className={item.ok ? s.ok : s.bad}
              initial={reduce ? false : { opacity: 0, scale: 1.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.35, type: "spring", stiffness: 500, damping: 18 }}
            >
              {item.ok ? "✓ " : "✕ "}
              {item.note}
            </motion.span>
          </motion.div>
        ))}
      </div>
      {!reduce && (
        <motion.div
          className={s.beam}
          initial={{ top: "-15%" }}
          animate={{ top: ["-15%", "100%"] }}
          transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
        />
      )}
    </div>
  );
};

const Barcode = ({ seed }: { seed: string }) => (
  <span className={s.barcode} aria-hidden="true">
    {Array.from(seed.repeat(3).slice(0, 30)).map((c, i) => (
      <span key={i} style={{ width: (c.charCodeAt(0) % 3) + 1 }} />
    ))}
  </span>
);

const AuthShell = ({
  form,
  title,
  subtitle,
  children,
}: {
  form: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={s.shell}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className={s.formSide}>
        <div className={s.strip}>
          <span>
            <b>■</b> {form}
          </span>
          <span>Gate A · RV Files</span>
        </div>
        <div className={s.formBody}>
          <div className={s.kicker}>
            {form.includes("Boarding") ? "Boarding check" : "Checkpoint registration"}
          </div>
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.sub}>{subtitle}</p>}
          <div className={s.fields}>{children}</div>
        </div>
        <div className={s.foot}>
          <span>Keep this pass private</span>
          <Barcode seed={form} />
        </div>
      </section>

      <aside className={s.visual}>
        <div>
          <div className={s.vKicker}>Live inspection lane</div>
          <h2 className={s.vTitle}>Every file is checked at the gate. Every link can be locked.</h2>
        </div>
        <Scanner />
        <ul className={s.facts}>
          <li>
            <strong>21+</strong>
            <span>risky file types refused at upload: .exe, .bat, .js and more</span>
          </li>
          <li>
            <strong>128-bit</strong>
            <span>unguessable links that expire within 7 days at most</span>
          </li>
          <li>
            <strong>5 / 20</strong>
            <span>wrong passwords or bulk downloads trip the wire and lock the link</span>
          </li>
        </ul>
      </aside>
    </motion.div>
  );
};

export default AuthShell;
