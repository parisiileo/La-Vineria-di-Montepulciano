"use client";

// Sfasamento verticale del contenuto rispetto allo scroll. Se si nota
// "l'effetto", è troppo: qui l'ampiezza totale è 18% dell'altezza extra.

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "./useReducedMotion";
import { cn } from "@/lib/utils";

/** Il contenuto è più alto del contenitore: la differenza è lo spazio di corsa. */
const CONTENT_SCALE = 1.18;
const SHIFT = 9; // percentuale, simmetrica sopra e sotto

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** 1 = ampiezza piena. Sotto i 768px viene dimezzata automaticamente. */
  intensity?: number;
}

export function Parallax({ children, className, intensity = 1 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const amount = SHIFT * intensity * (narrow ? 0.5 : 1);
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="h-full w-full"
        style={{
          height: `${CONTENT_SCALE * 100}%`,
          top: `${((CONTENT_SCALE - 1) / 2) * -100}%`,
          position: "absolute",
          y: reduced ? 0 : y,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Gemello di `Parallax` per gli elementi che devono restare nel flusso.
 *
 * `Parallax` posiziona il contenuto in assoluto dentro una scatola più alta:
 * è giusto per una fotografia che riempie un contenitore dimensionato, ma su
 * un blocco di testo farebbe collassare l'altezza della sezione. Qui lo
 * scostamento è una sola trasformazione, il layout non si muove di un pixel.
 *
 * Serve al parallasse differenziale: l'immagine a `intensity` 1, il dettaglio
 * tipografico a 0.4. È il differenziale a leggersi come distanza — se si
 * nota il movimento in sé, è già troppo.
 */
export function ParallaxShift({ children, className, intensity = 0.4 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const amount = SHIFT * intensity * (narrow ? 0.5 : 1);
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);

  return (
    <motion.div
      ref={ref}
      data-motion-guard=""
      className={cn(className)}
      style={{ y: reduced ? 0 : y }}
    >
      {children}
    </motion.div>
  );
}
