import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { TbFileTypePdf } from "react-icons/tb";
import s from "./landing.module.css";
import useLoopPhase, { randomId } from "./useLoopPhase";

const CHECKS = [
  { key: "TYPE", value: "application/pdf", result: "PASS" },
  { key: "SIZE", value: "2.4 MB / 10 MB", result: "PASS" },
  { key: "BLOCKLIST", value: "21 TYPES · CLEAR", result: "PASS" },
  { key: "LINK", value: "128-BIT RANDOM", result: "ISSUED" },
];

const STEPS = 14;
const REST = 10; // fully completed frame for reduced motion

export default function InspectionConsole() {
  const reduce = !!useReducedMotion();
  const phase = useLoopPhase(STEPS, 650, reduce, REST);
  const [ticketId, setTicketId] = useState("Rae9K3vTq7LmWx2PbN4GkH");

  useEffect(() => {
    if (phase === 0) setTicketId(randomId());
  }, [phase]);

  const atGate = phase >= 1 && phase < 13;
  const scanning = phase >= 2 && phase <= 6;
  const stamped = phase >= 7 && phase < 13;
  const printed = phase >= 8 && phase < 13;
  const doneCount = Math.max(0, Math.min(4, phase - 2));
  const progress = phase >= 13 ? 0 : doneCount / 4;

  return (
    <div className={s.console} aria-hidden="true">
      <span className={`${s.crop} ${s.cropTL}`} />
      <span className={`${s.crop} ${s.cropTR}`} />
      <span className={`${s.crop} ${s.cropBL}`} />
      <span className={`${s.crop} ${s.cropBR}`} />

      <div className={s.consoleBar}>
        <span className={s.consoleLed} data-busy={scanning} />
        <span>INSPECTION CONSOLE · RV-01</span>
        <span className={s.consoleBarRight}>
          LANE 01 · {scanning ? "SCANNING" : stamped ? "CLEARED" : "IDLE"}
        </span>
      </div>

      <motion.div
        className={s.consoleBody}
        animate={
          phase === 7 && !reduce ? { x: [0, -4, 4, -2, 0] } : { x: 0 }
        }
        transition={{ duration: 0.28 }}
      >
        {/* Lane: conveyor, gate, file card */}
        <div className={s.lane}>
          <div className={s.laneGrid} />
          <div className={s.gate}>
            <span className={s.gateLabel}>GATE 01</span>
            {scanning && !reduce && (
              <motion.span
                className={s.beam}
                initial={{ top: "6%" }}
                animate={{ top: ["6%", "88%", "6%"] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          <motion.div
            className={s.fileCard}
            initial={false}
            animate={{
              left: atGate ? "50%" : phase >= 13 ? "120%" : "-40%",
              opacity: phase >= 13 || phase === 0 ? 0 : 1,
            }}
            transition={{ duration: reduce ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <TbFileTypePdf size={34} strokeWidth={1.4} />
            <strong>survey.pdf</strong>
            <span>2.4 MB · 3 pages</span>
            <motion.span
              className={s.stamp}
              initial={false}
              animate={
                stamped
                  ? { opacity: 1, scale: 1, rotate: -9 }
                  : { opacity: 0, scale: 2.4, rotate: -20 }
              }
              transition={{ duration: reduce ? 0 : 0.18, ease: "easeIn" }}
            >
              CHECKED
            </motion.span>
          </motion.div>
          <div className={s.belt} />
        </div>

        {/* Readout */}
        <div className={s.readout}>
          <div className={s.readoutHead}>
            <span>READOUT</span>
            <span>{String(doneCount).padStart(2, "0")}/04</span>
          </div>
          <ol className={s.checks}>
            {CHECKS.map((c, i) => {
              const done = phase < 13 && doneCount > i;
              const active = scanning && doneCount === i;
              return (
                <li key={c.key} data-state={done ? "done" : active ? "active" : "idle"}>
                  <span className={s.checkKey}>{c.key}</span>
                  <span className={s.checkVal}>{done || active ? c.value : "· · ·"}</span>
                  <span className={s.checkRes}>
                    {done ? `✓ ${c.result}` : active ? "SCAN" : "—"}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className={s.meter}>
            <motion.span
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: reduce ? 0 : 0.4 }}
            />
          </div>
          <div className={s.readoutFoot}>
            <span>0 SCRIPTS EXECUTED</span>
            <span>EXPIRY ≤ 7 DAYS</span>
          </div>
        </div>
      </motion.div>

      {/* Printer */}
      <div className={s.printer}>
        <div className={s.printerSlot}>
          <span>TICKET PRINTER</span>
          <span className={s.printerLed} data-on={printed} />
        </div>
        <div className={s.ticketClip}>
          <motion.div
            className={s.ticket}
            initial={false}
            animate={{ y: printed ? "0%" : "-105%" }}
            transition={{ duration: reduce ? 0 : 0.9, ease: "linear" }}
          >
            <div className={s.ticketMain}>
              <span className={s.ticketLabel}>SHARE TICKET · /s/</span>
              <span className={s.ticketId}>{ticketId}</span>
              <span className={s.ticketMeta}>22 CHARS · 128-BIT · TRIPWIRE ARMED</span>
            </div>
            <div className={s.ticketStub}>
              <span className={s.barcode} />
              <span className={s.ticketLabel}>ADMIT 1</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
