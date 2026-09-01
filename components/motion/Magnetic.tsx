"use client";

// Attrazione magnetica del cursore entro un raggio breve, con parallasse
// interno: il contenuto si muove meno del contenitore, e questo dà spessore.

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Raggio di attrazione in pixel, misurato dal centro dell'elemento. */
const RADIUS = 80;
/** Il contenuto interno segue al 40% dell'offset del contenitore. */
const INNER_RATIO = 0.4;

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** Moltiplicatore del raggio, per elementi più o meno "pesanti". */
  strength?: number;
}

export function Magnetic({ children, className, strength = 1 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Il puntatore grossolano non ha un cursore da inseguire: niente effetto,
  // e nessun listener appeso.
  const [isFine, setIsFine] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring.soft);
  const sy = useSpring(y, spring.soft);
  const ix = useTransform(sx, (v) => v * INNER_RATIO);
  const iy = useTransform(sy, (v) => v * INNER_RATIO);

  function handleEnter() {
    setIsFine(window.matchMedia("(pointer: fine)").matches);
  }

  function handleMove(event: React.MouseEvent<HTMLSpanElement>) {
    if (!isFine || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const reach = RADIUS * strength;
    const distance = Math.hypot(dx, dy);
    if (distance > reach * 2) return;
    const pull = Math.min(1, reach / Math.max(distance, 1));
    x.set(dx * 0.35 * pull);
    y.set(dy * 0.35 * pull);
  }

  function handleLeave() {
    // Il ritorno passa dalla molla, non da una transizione lineare:
    // un elemento che torna a zero in modo uniforme sembra un'animazione CSS.
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: sx, y: sy }}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.span className="inline-block" style={{ x: ix, y: iy }}>
        {children}
      </motion.span>
    </motion.span>
  );
}
