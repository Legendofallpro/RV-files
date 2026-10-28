import { useReducedMotion } from "framer-motion";
import { useId, useMemo } from "react";
import s from "./recipient.module.css";

const C = 100; // centre of the 200x200 viewBox

// One guilloché trace: a ring whose radius oscillates around `r`.
const rosette = (r: number, amp: number, lobes: number, phase: number, steps = 144) => {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const rr = r + amp * Math.sin(lobes * t + phase);
    const x = C + rr * Math.cos(t);
    const y = C + rr * Math.sin(t);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + "Z";
};

// Banknote-style security seal: rosette line work drawn in, then a foil sheen.
const SecuritySeal = ({ serial, date }: { serial: string; date: string }) => {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const paths = useMemo(() => {
    const outer = Array.from({ length: 22 }, (_, i) =>
      rosette(79 + (i % 2) * 1.2, 9, 15, (i / 22) * Math.PI * 0.9),
    );
    const inner = Array.from({ length: 18 }, (_, i) =>
      rosette(44 + (i % 2) * 1, 8, 9, (i / 18) * Math.PI),
    );
    return { outer, inner };
  }, []);
  const anim = (i: number, base: number) =>
    reduce ? undefined : { animationDelay: `${base + i * 0.025}s` };

  return (
    <div className={s.seal} role="img" aria-label={`Security seal: cleared, ${serial}, ${date}`}>
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <circle cx={C} cy={C} r={97} />
          </clipPath>
          <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--rv-surface)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--rv-surface)" stopOpacity="0.75" />
            <stop offset="1" stopColor="var(--rv-surface)" stopOpacity="0" />
          </linearGradient>
          <path id={`ring-${uid}`} d={`M ${C} ${C} m -60 0 a 60 60 0 1 1 120 0 a 60 60 0 1 1 -120 0`} />
        </defs>
        <circle cx={C} cy={C} r={97} fill="var(--rv-surface)" />
        <g clipPath={`url(#clip-${uid})`}>
          {/* hairlines */}
          {Array.from({ length: 22 }, (_, i) => (
            <circle
              key={`h${i}`}
              cx={C}
              cy={C}
              r={20 + i * 3.6}
              fill="none"
              stroke="var(--rv-accent-2, var(--rv-ink))"
              strokeOpacity="0.16"
              strokeWidth="0.35"
            />
          ))}
          {paths.outer.map((d, i) => (
            <path
              key={`o${i}`}
              d={d}
              pathLength={1}
              className={s.sealLine}
              style={anim(i, 0.2)}
              fill="none"
              stroke="var(--rv-signal)"
              strokeOpacity="0.8"
              strokeWidth="0.35"
            />
          ))}
          {paths.inner.map((d, i) => (
            <path
              key={`i${i}`}
              d={d}
              pathLength={1}
              className={s.sealLine}
              style={anim(i, 0.5)}
              fill="none"
              stroke="var(--rv-signal)"
              strokeOpacity="0.8"
              strokeWidth="0.35"
            />
          ))}
          <circle cx={C} cy={C} r={97} fill="none" stroke="var(--rv-signal)" strokeWidth="1.6" />
          <circle cx={C} cy={C} r={92} fill="none" stroke="var(--rv-signal)" strokeWidth="0.5" />
          <circle cx={C} cy={C} r={68} fill="none" stroke="var(--rv-signal)" strokeWidth="0.6" />
          <circle cx={C} cy={C} r={30} fill="var(--rv-surface)" stroke="var(--rv-signal)" strokeWidth="0.8" />
          {!reduce && (
            <rect
              className={s.sealSheen}
              x="-120"
              y="0"
              width="90"
              height="200"
              fill={`url(#sheen-${uid})`}
            />
          )}
        </g>
        <circle cx={C} cy={C} r={62.5} fill="none" stroke="var(--rv-surface)" strokeOpacity="0.85" strokeWidth="11" />
        <text
          fill="var(--rv-ink)"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.4"
          fontWeight="700"
          letterSpacing="2.1"
        >
          <textPath href={`#ring-${uid}`}>
            CLEARED · RV CHECKPOINT · {date} ·
          </textPath>
        </text>
        <text
          x={C}
          y={C - 3}
          textAnchor="middle"
          fill="var(--rv-signal)"
          fontFamily="Space Grotesk, sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="1.5"
        >
          CLEARED
        </text>
        <text
          x={C}
          y={C + 9}
          textAnchor="middle"
          fill="var(--rv-ink)"
          fontFamily="JetBrains Mono, monospace"
          fontSize="6.4"
          letterSpacing="0.6"
        >
          {serial}
        </text>
      </svg>
    </div>
  );
};

export default SecuritySeal;
