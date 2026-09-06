"use client";

// L'ingresso di una fotografia. Mai un fade: una maschera che sale dal basso
// e l'immagine interna che si posa da 1.08 a 1.
//
// È il gesto più economico che esista per far entrare una fotografia — due
// proprietà componibili, nessun costo di layout — e vale quanto un'animazione
// molto più complicata. Le due velocità sono identiche di proposito: se la
// maschera e la scala divergono, si vede il meccanismo invece dell'immagine.
//
// TRE NODI, NON DUE, E IL MOTIVO È UN BUG DEL BROWSER.
//
// Il nodo osservato non porta la maschera. Chromium calcola l'intersezione di
// un elemento DOPO avergli applicato il proprio `clip-path`: un elemento che
// si ritaglia con `inset(100% 0 0 0)` risulta quindi grande zero, e
// `isIntersecting` è sempre `false`. Se fosse lui l'elemento osservato, si
// nasconderebbe da solo e non potrebbe mai essere visto entrare — la
// fotografia resterebbe ritagliata per sempre.
//
// Misurato: stesso elemento, stesso osservatore, con e senza la maschera.
//   con  clip-path → isIntersecting=false, altezza dell'intersezione 0
//   senza clip-path → isIntersecting=true,  altezza dell'intersezione 684
//
// Da qui la struttura: il nodo esterno è osservato e non si ritaglia mai, e
// propaga le varianti ai due interni — uno per la maschera, uno per la scala.
// È lo stesso motivo per cui SplitText osserva il contenitore e non le parole.
//
// Tutti e tre portano `size-full`. Dove il chiamante impone un'altezza — la
// fotografia dell'hero, che riempie la sezione — un nodo intermedio senza
// altezza fa collassare l'immagine a zero pixel; dove l'altezza viene dal
// rapporto della Figure, `height: 100%` su un padre di altezza automatica
// vale `auto` e non cambia nulla. Un solo valore copre i due casi.

import { motion, type Variants } from "motion/react";

import { duration, ease, scalaIngressoFoto, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { cn } from "@/lib/utils";

/** Il nodo osservato: nessuna proprietà visiva, solo la propagazione. */
const OSSERVATO: Variants = {
  hidden: {},
  shown: {},
};

const MASCHERA: Variants = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  shown: {
    clipPath: "inset(0% 0 0 0)",
    transition: { duration: duration.slow, ease: ease.out },
  },
};

const INTERNO: Variants = {
  hidden: { scale: scalaIngressoFoto },
  shown: { scale: 1, transition: { duration: duration.slow, ease: ease.out } },
};

interface RevealImageProps {
  children: React.ReactNode;
  className?: string;
  /** Ritardo in secondi, per sfalsare due immagini nella stessa sezione. */
  delay?: number;
}

export function RevealImage({ children, className, delay = 0 }: RevealImageProps) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={cn(className)}>{children}</div>;

  return (
    <motion.div
      className={cn(className)}
      variants={OSSERVATO}
      initial="hidden"
      whileInView="shown"
      viewport={viewportOnce}
      transition={{ delayChildren: delay }}
    >
      <motion.div data-motion-guard="" className="size-full overflow-hidden" variants={MASCHERA}>
        <motion.div data-motion-guard="" className="size-full" variants={INTERNO}>
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
