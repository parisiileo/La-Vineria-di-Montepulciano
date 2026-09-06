"use client";

// Indicatore di scroll: un filetto d'ottone che scende dentro una fessura e
// ricompare dall'alto. Ciclo discreto e lungo — un indicatore che pulsa forte
// dice «non hai capito», e chi arriva su una pagina lunga lo ha già capito.
//
// Entra per ultimo nella cronologia dell'hero, a 1.20s. Sparisce al primo
// scroll: la sua unica ragione è l'istante in cui l'utente non si è mosso.

import { motion, useScroll, useTransform } from "motion/react";

import { duration, ease } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

const RITARDO_HERO = 1.2;

export function ScrollIndicator({ etichetta }: { etichetta: React.ReactNode }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const opacita = useTransform(scrollY, [0, 160], [1, 0]);

  const filetto = (
    <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-brass/25">
      {reduced ? null : (
        <motion.span
          data-motion-guard=""
          className="absolute inset-x-0 top-0 block h-4 bg-brass"
          animate={{ y: ["-100%", "250%"] }}
          transition={{
            duration: duration.drift,
            ease: ease.drift,
            repeat: Infinity,
            repeatDelay: 0.4,
          }}
        />
      )}
    </span>
  );

  if (reduced) {
    return (
      <span className="flex flex-col items-center gap-3">
        <span className="font-mono text-mono uppercase text-stone-dim">{etichetta}</span>
        {filetto}
      </span>
    );
  }

  // Due nodi e non uno: l'entrata è un'animazione, la sparizione allo scroll
  // è un valore legato allo scroll. Sullo stesso nodo il secondo vincerebbe
  // sul primo e l'indicatore comparirebbe di colpo, senza entrare.
  return (
    <motion.span
      data-motion-guard=""
      style={{ opacity: opacita }}
      className="block"
    >
      <motion.span
        data-motion-guard=""
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.base, ease: ease.out, delay: RITARDO_HERO }}
      >
        <span className="font-mono text-mono uppercase text-stone-dim">{etichetta}</span>
        {filetto}
      </motion.span>
    </motion.span>
  );
}
