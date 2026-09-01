"use client";

// Le quattro curve messe in fila e riproducibili. Guardarle una accanto
// all'altra è l'unico modo per capire perché `drift` non è `out` più lenta.

import { useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { duration, ease, type EaseToken } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { Button } from "@/components/ui/Button";

const ROWS: readonly { token: EaseToken; dur: keyof typeof duration; usoKey: string }[] = [
  { token: "out", dur: "base", usoKey: "usoOut" },
  { token: "inOut", dur: "base", usoKey: "usoInOut" },
  { token: "soft", dur: "micro", usoKey: "usoSoft" },
  { token: "drift", dur: "drift", usoKey: "usoDrift" },
];

/** Traccia la curva come path SVG: 100×100, origine in basso a sinistra. */
function CurvePlot({ token }: { token: EaseToken }) {
  const [x1, y1, x2, y2] = ease[token];
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="h-16 w-16 shrink-0">
      <path
        d={`M0 100 C ${x1 * 100} ${100 - y1 * 100}, ${x2 * 100} ${100 - y2 * 100}, 100 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-brass"
      />
    </svg>
  );
}

export function MotionTokens() {
  const t = useTranslations("kitchenSink.movimento");
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={() => setRun((n) => n + 1)}>
        {t("riproduci")}
      </Button>

      <ul className="space-y-6">
        {ROWS.map(({ token, dur, usoKey }) => (
          <li key={token} className="border-t border-border pt-6">
            <div className="flex flex-wrap items-center gap-6">
              <CurvePlot token={token} />

              <div className="w-56 shrink-0">
                <p className="font-mono text-mono text-brass">ease.{token}</p>
                <p className="font-mono text-mono text-stone-dim">
                  {duration[dur]}s · duration.{dur}
                </p>
                <p className="font-sans text-mono text-stone-dim">{t(usoKey)}</p>
              </div>

              {/* Il tracciato: una tessera di tufo che attraversa la corsia.
                  Si anima `x`, mai `left`: la seconda ricalcola il layout a
                  ogni frame. La corsa è espressa in unità di container. */}
              <div className="@container relative h-8 min-w-0 flex-1 rounded-sm border border-border bg-tuff-light">
                <motion.span
                  key={`${token}-${run}`}
                  className="absolute left-1 top-1 size-6 rounded-xs bg-brass"
                  initial={{ x: 0 }}
                  animate={{ x: "calc(100cqw - 2rem)" }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: duration[dur], ease: ease[token] }
                  }
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="measure font-sans text-mono text-stone-dim">{t("nota")}</p>
    </div>
  );
}
