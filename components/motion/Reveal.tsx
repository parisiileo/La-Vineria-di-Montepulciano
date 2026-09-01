"use client";

// Entrata di base al primo ingresso in viewport: opacità, scarto di 24px e
// una sfocatura di 6px che si dissolve. Il blur è ciò che rende il movimento
// "costoso": senza, l'entrata sembra un fade da template.

import { motion, type Variants } from "motion/react";
import { duration, ease, stagger as staggerTokens, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "./useReducedMotion";
import { cn } from "@/lib/utils";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  li: motion.li,
  p: motion.p,
  span: motion.span,
} as const;

export type RevealTag = keyof typeof TAGS;
export type RevealDirection = "up" | "down" | "start" | "end" | "none";

const OFFSET: Record<RevealDirection, { x?: number; y?: number }> = {
  up: { y: 24 },
  down: { y: -24 },
  start: { x: -24 },
  end: { x: 24 },
  none: {},
};

interface RevealProps {
  children: React.ReactNode;
  as?: RevealTag;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  /** Se valorizzato, i figli diretti entrano in sequenza con questo sfasamento. */
  staggerChildren?: keyof typeof staggerTokens;
}

export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  direction = "up",
  staggerChildren,
}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = TAGS[as];
  const step = staggerChildren ? staggerTokens[staggerChildren] : undefined;

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const variants: Variants = {
    hidden: { opacity: 0, filter: "blur(6px)", ...OFFSET[direction] },
    shown: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: duration.base,
        ease: ease.out,
        delay,
        ...(step ? { staggerChildren: step, delayChildren: delay } : {}),
      },
    },
  };

  return (
    <Tag
      data-motion-guard=""
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={viewportOnce}
    >
      {children}
    </Tag>
  );
}

/** Figlio di un Reveal con `staggerChildren`: eredita la sequenza del padre. */
export function RevealItem({
  children,
  as = "div",
  className,
}: Pick<RevealProps, "children" | "as" | "className">) {
  const reduced = useReducedMotion();
  const Tag = TAGS[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      data-motion-guard=""
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
        shown: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: duration.base, ease: ease.out },
        },
      }}
    >
      {children}
    </Tag>
  );
}
