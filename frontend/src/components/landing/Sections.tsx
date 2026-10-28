import { Button } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { TbArrowRight, TbFileText, TbFileTypePdf, TbPhoto } from "react-icons/tb";
import s from "./landing.module.css";
import useLoopPhase from "./useLoopPhase";

const reveal = (reduce: boolean, delay = 0) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.5, delay },
      };

function SectionHead({
  no,
  kicker,
  title,
  children,
}: {
  no: string;
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={s.sectionHead}>
      <span className={s.sectionNo}>{no}</span>
      <span className="rv-label">{kicker}</span>
      <h2 className={s.sectionTitle}>{title}</h2>
      {children && <p className={s.sectionText}>{children}</p>}
    </div>
  );
}

/* ---------------- 01 What the recipient sees ---------------- */

const WINDOW = 7 * 24 * 3600; // 7-day max expiry, in seconds
const START_LEFT = 2 * 24 * 3600 + 14 * 3600 + 3 * 60 + 22;

function fmt(left: number) {
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const sec = left % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return { d, clock: `${p(h)}:${p(m)}:${p(sec)}`, sec };
}

export function RecipientSection() {
  const reduce = !!useReducedMotion();
  const [left, setLeft] = useState(START_LEFT);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setLeft((l) => (l > 0 ? l - 1 : START_LEFT)), 1000);
    return () => window.clearInterval(id);
  }, [reduce]);
  const { d, clock, sec } = fmt(left);
  const R = 52;
  const C = 2 * Math.PI * R;
  const r2 = 40;
  const C2 = 2 * Math.PI * r2;

  return (
    <section className={`${s.section} ${s.split}`} aria-labelledby="sec-recipient">
      <motion.div {...reveal(reduce)}>
        <SectionHead
          no="01"
          kicker="What the recipient sees"
          title={<span id="sec-recipient">An inspection slip before a single byte.</span>}
        >
          Recipients land on a slip, not a download. They see who sent it, what is
          inside, how big it is and exactly when the link dies. Nothing auto-opens and
          nothing runs.
        </SectionHead>
        <ul className={s.ticks}>
          <li>Sender, file list and sizes shown up front</li>
          <li>Live countdown to expiry (max 7 days)</li>
          <li>Password gate when the sender sets one</li>
        </ul>
      </motion.div>

      <motion.div className={s.slip} {...reveal(reduce, 0.1)} aria-label="Example inspection slip">
        <div className={s.slipHead}>
          <div>
            <span className="rv-label">Inspection slip</span>
            <strong className={s.slipTitle}>Q3 field survey</strong>
          </div>
          <span className={s.slipStamp}>CHECKED</span>
        </div>
        <div className={s.slipBody}>
          <ul className={s.slipFiles}>
            <li><TbFileTypePdf size={18} /> survey.pdf<span>2.4 MB</span></li>
            <li><TbPhoto size={18} /> site-map.png<span>860 KB</span></li>
            <li><TbFileText size={18} /> notes.txt<span>4 KB</span></li>
          </ul>
          <div className={s.ring} role="img" aria-label={`Expires in ${d} days ${clock}`}>
            <svg viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={R} className={s.ringTrack} />
              <circle
                cx="64"
                cy="64"
                r={R}
                className={s.ringFill}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - left / WINDOW)}
              />
              <circle cx="64" cy="64" r={r2} className={s.ringTrackThin} />
              <circle
                cx="64"
                cy="64"
                r={r2}
                className={s.ringSec}
                strokeDasharray={C2}
                strokeDashoffset={C2 * (1 - sec / 60)}
              />
            </svg>
            <div className={s.ringText}>
              <strong>{d}d</strong>
              <span>{clock}</span>
            </div>
          </div>
        </div>
        <div className={s.slipGrid}>
          <div><span className="rv-label">From</span><b>maya@rv.edu</b></div>
          <div><span className="rv-label">Total</span><b>3.26 MB</b></div>
          <div><span className="rv-label">Scripts</span><b>0 run</b></div>
        </div>
        <div className={s.slipFoot}>
          <span className={s.perf} />
          <span className="rv-label">Link /s/Rae9K3vTq7LmWx2PbN4GkH · tripwire armed</span>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------- 02 Tripwire ---------------- */

export function TripwireSection() {
  const reduce = !!useReducedMotion();
  // phases 0..4 = attempts 1..5, 5..8 = locked hold, 9 = reset
  const phase = useLoopPhase(10, 800, reduce, 6);
  const attempts = Math.min(5, phase + 1);
  const locked = phase >= 5 && phase < 9;

  return (
    <section className={s.tripwire} aria-labelledby="sec-tripwire">
      <div className={s.tape} aria-hidden="true" />
      <div className={s.tripInner}>
        <motion.div {...reveal(reduce)}>
          <SectionHead
            no="02"
            kicker="Tripwire"
            title={<span id="sec-tripwire">Guess wrong five times. The gate drops.</span>}
          >
            Brute-forcing a password or hammering a link trips the wire. The share
            locks itself and the owner sees why.
          </SectionHead>
        </motion.div>

        <div className={s.attemptPanel} aria-label="Tripwire attempt counter demo">
          <div className={s.attemptHead}>
            <span className="rv-label">Password attempts · /s/Rae9…GkH</span>
            <span className={s.attemptCount}>
              {phase === 9 ? 0 : attempts}
              <small>/5</small>
            </span>
          </div>
          <div className={s.attemptSlots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} data-hit={phase !== 9 && i < attempts} />
            ))}
          </div>
          <ol className={s.attemptLog}>
            {[0, 1, 2, 3, 4].map((i) =>
              phase !== 9 && i < attempts ? (
                <li key={i}>
                  <span>#{i + 1}</span> wrong password <span>203.0.113.{14 + i * 7}</span>
                </li>
              ) : null,
            )}
          </ol>
          <motion.div
            className={s.lockedStamp}
            initial={false}
            animate={
              locked || reduce
                ? { opacity: 1, scale: 1, rotate: -8 }
                : { opacity: 0, scale: 2, rotate: -18 }
            }
            transition={{ duration: 0.2, ease: "easeIn" }}
          >
            LOCKED
          </motion.div>
        </div>

        <div className={s.burst}>
          <span className="rv-label">Or a download burst</span>
          <div className={s.burstRow}>
            <div><strong>20</strong><span>downloads</span></div>
            <i>/</i>
            <div><strong>5</strong><span>IPs</span></div>
            <i>/</i>
            <div><strong>10</strong><span>min</span></div>
          </div>
          <p>Any of these in the window and the link locks before the 21st copy leaves.</p>
        </div>
      </div>
      <div className={s.tape} aria-hidden="true" />
    </section>
  );
}

/* ---------------- 03 Specs ---------------- */

const SPECS = [
  { v: "128", u: "-bit", l: "Random share ID entropy" },
  { v: "10", u: "MB", l: "Max per share" },
  { v: "50", u: "MB", l: "Storage per account" },
  { v: "7", u: "days", l: "Longest a link can live" },
  { v: "21", u: "types", l: "Executable types blocked" },
  { v: "0", u: "scripts", l: "Executed on download" },
];

export function SpecsSection() {
  const reduce = !!useReducedMotion();
  return (
    <section className={s.section} aria-labelledby="sec-specs">
      <div className={s.specsHead}>
        <span className={s.sectionNo}>03</span>
        <h2 id="sec-specs" className={s.sectionTitleSm}>Specifications</h2>
        <span className="rv-label">Hard limits · enforced server-side · not configurable by recipients</span>
      </div>
      <div className={s.specs}>
        {SPECS.map((x, i) => (
          <motion.div key={x.l} className={s.spec} {...reveal(reduce, i * 0.06)}>
            <span className={s.specIdx}>SPEC-{String(i + 1).padStart(2, "0")}</span>
            <strong className={s.specVal}>
              {x.v}
              <small>{x.u}</small>
            </strong>
            <span className={s.specLabel}>{x.l}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 04 Audit trail ---------------- */

const LOG = [
  { seq: 1041, t: "09:14:02", ev: "share_created", prev: "0000…0000", hash: "a91f…3c07" },
  { seq: 1042, t: "09:14:03", ev: "file_uploaded", prev: "a91f…3c07", hash: "5be2…d1f4" },
  { seq: 1043, t: "09:31:47", ev: "download", prev: "5be2…d1f4", hash: "e07c…8a19" },
  { seq: 1044, t: "09:32:10", ev: "bad_password", prev: "e07c…8a19", hash: "3d6a…02be" },
  { seq: 1045, t: "09:32:21", ev: "bad_password", prev: "3d6a…02be", hash: "c4f8…77e3" },
  { seq: 1046, t: "10:05:00", ev: "auto_revoked", prev: "c4f8…77e3", hash: "9a20…b55d" },
];

export function AuditSection() {
  const reduce = !!useReducedMotion();
  return (
    <section className={`${s.section} ${s.splitRev}`} aria-labelledby="sec-audit">
      <motion.div className={s.ledger} {...reveal(reduce)} aria-label="Example hash-chained audit log">
        <div className={s.ledgerHead}>
          <span>SEQ</span>
          <span>TIME</span>
          <span>EVENT</span>
          <span className={s.hideSm}>PREV → HASH</span>
        </div>
        {LOG.map((r, i) => (
          <motion.div
            key={r.seq}
            className={s.ledgerRow}
            data-alert={r.ev === "auto_revoked" || r.ev === "bad_password"}
            initial={reduce ? false : { opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduce ? 0 : 0.15 + i * 0.12 }}
          >
            <span>{r.seq}</span>
            <span>{r.t}</span>
            <span className={s.ledgerEv}>{r.ev}</span>
            <span className={`${s.ledgerHash} ${s.hideSm}`}>
              {r.prev} <b>→</b> {r.hash}
            </span>
          </motion.div>
        ))}
        <div className={s.ledgerFoot}>
          <span className={s.verified}>✓ CHAIN VERIFIED · 1046 LINKS</span>
          <span className="rv-label">Mirrored → MongoDB Atlas</span>
        </div>
      </motion.div>
      <motion.div {...reveal(reduce, 0.1)}>
        <SectionHead
          no="04"
          kicker="Audit trail"
          title={<span id="sec-audit">Every event is chained to the one before.</span>}
        >
          Each log entry carries the hash of the previous one, so a deleted or edited
          row breaks the chain and shows up on verify. The log is mirrored off-box to
          MongoDB Atlas.
        </SectionHead>
        <ul className={s.ticks}>
          <li>SHA-256 over each event plus the previous hash</li>
          <li>Tamper anywhere and verify points at the broken link</li>
        </ul>
      </motion.div>
    </section>
  );
}

/* ---------------- Closing CTA ---------------- */

export function ClosingCta({ signupEnabled }: { signupEnabled: boolean }) {
  return (
    <section className={s.cta} aria-labelledby="sec-cta">
      <div className={s.ctaInner}>
        <div>
          <span className={s.ctaLabel}>Lane 01 is open</span>
          <h2 id="sec-cta" className={s.ctaTitle}>
            Send the next file through the checkpoint.
          </h2>
        </div>
        <div className={s.ctaActions}>
          <Button
            component={Link}
            href="/upload"
            size="lg"
            rightIcon={<TbArrowRight size={20} aria-hidden="true" />}
          >
            Share a file
          </Button>
          {signupEnabled && (
            <Link href="/auth/signUp" className={s.ctaSecondary}>
              Create an account
            </Link>
          )}
        </div>
      </div>
      <div className={s.ctaBarcode} aria-hidden="true" />
    </section>
  );
}
