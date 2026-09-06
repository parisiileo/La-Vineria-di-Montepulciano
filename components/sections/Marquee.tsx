"use client";

// LA FRATTURA — la banda diagonale dopo l'hero.
//
// È il momento in cui l'utente capisce che non sta guardando un template.
// Tre scelte la rendono grafica editoriale invece di un ticker di borsa:
//
//  · l'inclinazione, che nessun sistema di griglia produrrebbe da solo
//  · due livelli in direzioni opposte, uno in contorno d'ottone e uno pieno
//    di crema all'8 % — è il contrasto fra i due a fare il carattere
//  · la modulazione da velocità di scroll: scorrendo veloce la banda accelera
//
// La velocità è in pixel al secondo ed è la stessa a ogni larghezza. Legarla
// alla larghezza dello schermo — l'errore comune, perché sembra naturale
// scrivere «un giro completo in N secondi» — farebbe correre la banda su
// desktop e strisciare su mobile.
//
// L'avanzamento è calcolato per frame invece che da un'animazione CSS perché
// la modulazione da velocità richiede di poter cambiare passo a metà corsa,
// cosa che un `@keyframes` non consente. Il loop si ferma quando la banda esce
// dal viewport: una banda che gira dietro tre schermate di distanza è lavoro
// del compositore pagato per niente.

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";

import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { cn } from "@/lib/utils";

/** Pixel al secondo. Indipendente dalla larghezza dello schermo, di proposito. */
const PASSO = 42;
/** Quanto la velocità di scroll può accelerare la banda, al massimo. */
const SPINTA_MAX = 4;

interface MarqueeProps {
  voci: readonly string[];
  className?: string;
}

function Fila({ voci, contorno }: { voci: readonly string[]; contorno: boolean }) {
  return (
    <span className="flex shrink-0 items-center whitespace-nowrap">
      {voci.map((voce, i) => (
        <span key={`${voce}-${i}`} className="flex items-center">
          <span
            className={cn(
              "px-8 font-display text-h2 uppercase",
              contorno ? "marquee-contorno" : "text-cream/8",
            )}
          >
            {voce}
          </span>
          <span aria-hidden="true" className={contorno ? "text-brass/50" : "text-cream/8"}>
            ·
          </span>
        </span>
      ))}
    </span>
  );
}

function Nastro({
  voci,
  contorno,
  verso,
  spinta,
  attivo,
  copie,
}: {
  voci: readonly string[];
  contorno: boolean;
  verso: 1 | -1;
  spinta: { get: () => number };
  attivo: boolean;
  copie: number;
}) {
  const x = useMotionValue(0);
  const nastro = useRef<HTMLDivElement>(null);
  const meta = useRef(0);

  useEffect(() => {
    const misura = () => {
      if (nastro.current) meta.current = nastro.current.scrollWidth / 2;
    };
    misura();
    window.addEventListener("resize", misura);
    return () => window.removeEventListener("resize", misura);
  }, [voci, copie]);

  useAnimationFrame((_, delta) => {
    if (!attivo || !meta.current) return;
    const avanzamento = (PASSO * (delta / 1000) * spinta.get() * verso) % meta.current;
    // Il modulo tiene `x` in [-metà, 0]: il contenuto è duplicato, quindi il
    // salto di una metà esatta è invisibile.
    let prossimo = x.get() - avanzamento;
    if (prossimo <= -meta.current) prossimo += meta.current;
    if (prossimo > 0) prossimo -= meta.current;
    x.set(prossimo);
  });

  return (
    <motion.div ref={nastro} className="flex w-max" style={{ x }} data-motion-guard="">
      {Array.from({ length: copie * 2 }, (_, i) => (
        <Fila key={i} voci={voci} contorno={contorno} />
      ))}
    </motion.div>
  );
}

export function Marquee({ voci, className }: MarqueeProps) {
  const reduced = useReducedMotion();
  const banda = useRef<HTMLDivElement>(null);
  const [attivo, setAttivo] = useState(false);
  const [stretto, setStretto] = useState(false);

  const { scrollY } = useScroll();
  const velocita = useVelocity(scrollY);
  const velocitaMorbida = useSpring(velocita, { damping: 48, stiffness: 380 });
  // 1 a riposo, fino a SPINTA_MAX scorrendo forte. Il segno non conta: la
  // banda accelera in entrambe le direzioni di scroll.
  const spinta = useTransform(velocitaMorbida, (v) =>
    Math.min(SPINTA_MAX, 1 + Math.abs(v) / 900),
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setStretto(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const nodo = banda.current;
    if (!nodo) return;
    const io = new IntersectionObserver(([voce]) => setAttivo(voce.isIntersecting), {
      rootMargin: "20% 0px",
    });
    io.observe(nodo);
    return () => io.disconnect();
  }, []);

  // Su schermi stretti servono più copie perché la banda ruotata è più larga
  // del viewport e una sola coppia lascerebbe un buco al giro.
  const copie = stretto ? 3 : 2;

  return (
    <div
      ref={banda}
      aria-hidden="true"
      className={cn("full-bleed relative overflow-hidden py-[8vh]", className)}
    >
      {/* La banda è più larga del viewport perché è inclinata: senza il
          soprallargo, agli angoli comparirebbero due triangoli di fondo. */}
      <div className="w-[112%] -translate-x-[6%] -rotate-2 sm:-rotate-3">
        <div className="border-y border-border bg-tuff-light/50 py-4">
          <Nastro voci={voci} contorno verso={1} spinta={spinta} attivo={attivo && !reduced} copie={copie} />
          <Nastro voci={voci} contorno={false} verso={-1} spinta={spinta} attivo={attivo && !reduced} copie={copie} />
        </div>
      </div>
    </div>
  );
}
