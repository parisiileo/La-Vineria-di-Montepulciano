"use client";

// Cursore custom: un punto che segue il mouse senza ritardo e un anello che
// arriva dopo. Il ritardo dell'anello è tutto l'effetto — un anello che segue
// il punto perfettamente è solo un cerchio più grande.
//
// Tre vincoli non negoziabili:
//  · solo `(pointer: fine)`: col dito non esiste un cursore da sostituire
//  · non sostituisce mai il focus da tastiera, che resta l'anello d'ottone
//    del design system
//  · `mix-blend-mode: difference` sul punto, così resta visibile sia sul tufo
//    sia sopra una fotografia chiara senza dover conoscere lo sfondo

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

import { spring } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

/** Selettore degli elementi che espandono l'anello. */
const INTERATTIVI = 'a[href], button:not([disabled]), [role="button"], input, select, textarea';
/** Elementi che mostrano un'etichetta: il dato sta nel DOM, non qui. */
const CON_ETICHETTA = "[data-cursore]";

export function Cursor() {
  const reduced = useReducedMotion();
  const [attivo, setAttivo] = useState(false);
  const [espanso, setEspanso] = useState(false);
  const [etichetta, setEtichetta] = useState<string | null>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const anelloX = useSpring(x, spring.soft);
  const anelloY = useSpring(y, spring.soft);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setAttivo(true);

    const muovi = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const sotto = e.target as Element | null;
      const conEtichetta = sotto?.closest?.(CON_ETICHETTA) as HTMLElement | null;
      setEtichetta(conEtichetta?.dataset.cursore ?? null);
      setEspanso(!!conEtichetta || !!sotto?.closest?.(INTERATTIVI));
    };

    // Passivo: il cursore non deve mai poter ritardare uno scroll.
    window.addEventListener("pointermove", muovi, { passive: true });
    return () => window.removeEventListener("pointermove", muovi);
  }, [reduced, x, y]);

  if (!attivo) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-(--z-grain)">
      <motion.span
        className="absolute -ml-1 -mt-1 block size-2 rounded-pill bg-cream mix-blend-difference"
        style={{ x, y }}
      />
      <motion.span
        className="absolute flex items-center justify-center rounded-pill border border-brass/60 font-mono text-mono uppercase text-brass"
        style={{ x: anelloX, y: anelloY }}
        animate={{
          width: espanso ? 60 : 32,
          height: espanso ? 60 : 32,
          marginLeft: espanso ? -30 : -16,
          marginTop: espanso ? -30 : -16,
        }}
        transition={spring.snappy}
      >
        {etichetta}
      </motion.span>
    </div>
  );
}
