import { useEffect, useState } from "react";

/**
 * Steps through `steps` phases every `stepMs`, looping forever.
 * When `paused` (reduced motion) it parks on `restPhase`.
 */
export default function useLoopPhase(
  steps: number,
  stepMs: number,
  paused: boolean,
  restPhase: number,
) {
  const [phase, setPhase] = useState(paused ? restPhase : 0);
  useEffect(() => {
    if (paused) {
      setPhase(restPhase);
      return;
    }
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % steps),
      stepMs,
    );
    return () => window.clearInterval(id);
  }, [steps, stepMs, paused, restPhase]);
  return phase;
}

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function randomId(length = 22) {
  let out = "";
  for (let i = 0; i < length; i++)
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}
