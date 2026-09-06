"use client";

// I numeri civici. Sono grandi e devono avere peso: entrano cifra per cifra
// con `spring.heavy`, che è la molla della materia — accelera tardi e si posa
// a lungo. Con `spring.snappy` un 101 alto centoventi pixel schizzerebbe in
// posizione come un badge di notifica.
//
// La divisione per cifre è ammessa qui e vietata in SplitText per una ragione
// tipografica: in una parola le lettere hanno crenature e legature che la
// divisione distrugge, mentre le cifre in `lining-nums` hanno tutte la stessa
// larghezza e nessuna relazione fra loro. Un numero è una sequenza di segni,
// non una parola.

import { motion, type Variants } from "motion/react";

import { spring, stagger } from "@/lib/motion";
import { useReducedMotion } from "./useReducedMotion";
import { cn } from "@/lib/utils";

const CONTENITORE: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: stagger.base } },
};

const CIFRA: Variants = {
  hidden: { y: "108%" },
  shown: { y: "0%", transition: spring.heavy },
};

interface SplitDigitsProps {
  /** Il numero, come stringa: gli zeri iniziali contano. */
  numero: string;
  className?: string;
  /** Il numero è decorativo quando il dato è già scritto in chiaro altrove. */
  decorativo?: boolean;
}

export function SplitDigits({ numero, className, decorativo = false }: SplitDigitsProps) {
  const reduced = useReducedMotion();
  const cifre = [...numero];

  if (reduced) {
    return (
      <span aria-hidden={decorativo || undefined} className={cn(className)}>
        {numero}
      </span>
    );
  }

  return (
    <motion.span
      aria-hidden={decorativo || undefined}
      className={cn("inline-flex", className)}
      variants={CONTENITORE}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {!decorativo ? <span className="sr-only">{numero}</span> : null}
      {cifre.map((cifra, i) => (
        <span
          key={`${cifra}-${i}`}
          aria-hidden="true"
          className="inline-flex overflow-hidden align-bottom"
          style={{
            paddingBottom: "var(--split-descender)",
            marginBottom: "calc(var(--split-descender) * -1)",
          }}
        >
          <motion.span data-motion-guard="" className="inline-block" variants={CIFRA}>
            {cifra}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
