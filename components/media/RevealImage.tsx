"use client";

// L'ingresso di una fotografia. Mai un fade: una maschera che sale dal basso
// e l'immagine interna che si posa da 1.08 a 1.
//
// È il gesto più economico che esista per far entrare una fotografia — due
// proprietà componibili, nessun costo di layout — e vale quanto un'animazione
// molto più complicata. Le due velocità sono identiche di proposito: se la
// maschera e la scala divergono, si vede il meccanismo invece dell'immagine.

import { motion, type Variants } from "motion/react";

import { duration, ease, scalaIngressoFoto, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { cn } from "@/lib/utils";

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
      data-motion-guard=""
      className={cn("overflow-hidden", className)}
      variants={MASCHERA}
      initial="hidden"
      whileInView="shown"
      viewport={viewportOnce}
      transition={{ delay }}
    >
      <motion.div data-motion-guard="" className="size-full" variants={INTERNO}>
        {children}
      </motion.div>
    </motion.div>
  );
}
