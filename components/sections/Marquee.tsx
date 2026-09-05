"use client";

// La frattura. Fra l'immagine più densa della pagina e la prima sezione di
// lettura serve qualcosa che non sia né l'una né l'altra: una riga che si
// muove da sola, e che si legge come un'insegna invece che come un contenuto.
//
// Il contenuto è duplicato una volta e la traslazione è del 50%: il ciclo non
// ha giunta visibile. `aria-hidden` sul duplicato, altrimenti uno screen
// reader legge due volte la stessa fila di parole.

import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  /** Le voci vengono separate da un punto mediano in ottone. */
  voci: readonly string[];
  className?: string;
  /** Secondi per un giro completo. Sotto i 40s si legge come pubblicità. */
  secondi?: number;
}

function Fila({ voci, ariaHidden }: { voci: readonly string[]; ariaHidden?: boolean }) {
  return (
    <span aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {voci.map((voce, i) => (
        <span key={`${voce}-${i}`} className="flex items-center">
          <span className="px-6 font-display text-h3 text-cream/85">{voce}</span>
          <span aria-hidden="true" className="text-brass">
            ·
          </span>
        </span>
      ))}
    </span>
  );
}

export function Marquee({ voci, className, secondi = 60 }: MarqueeProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "full-bleed relative flex overflow-hidden border-y border-border bg-tuff-light/60 py-5",
        className,
      )}
    >
      <div
        className="flex w-max"
        style={
          reduced
            ? undefined
            : { animation: `marquee-x ${secondi}s linear infinite` }
        }
      >
        <Fila voci={voci} />
        <Fila voci={voci} ariaHidden />
      </div>
    </div>
  );
}
