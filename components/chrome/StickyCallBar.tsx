"use client";

// Barra fissa mobile: chiamare e farsi portare qui.
//
// È l'elemento con più effetto sulle conversioni di tutta la pagina, e il
// motivo è il contesto d'uso, non il design: chi apre questo sito da telefono
// molto spesso è in Via di Gracciano nel Corso con la mappa aperta, e vuole
// due cose — il numero o la strada. Su desktop non esiste: lì il telefono non
// si tocca, si legge.
//
// Tre comportamenti che la rendono sopportabile invece che invadente:
//
//  1. Entra solo DOPO l'hero. Sopra l'hero ci sono già due CTA, e una terza
//     incollata in basso sarebbe rumore sopra la prima impressione.
//  2. Sparisce quando un pannello modale è aperto. Una barra che galleggia
//     sopra la carta aperta è la prima cosa che il pollice trova, e non è
//     quella che l'utente stava guardando.
//  3. Il footer riceve un'imbottitura pari alla sua altezza, così l'ultima
//     riga della pagina non finisce mai sotto la barra.

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { duration, ease } from "@/lib/motion";
import { useOverlayAperto } from "@/lib/ui/overlay";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { TELEFONO_HREF, LOCALI, linkMappe } from "@/lib/data/locali";
import { cn } from "@/lib/utils";

/** L'elemento oltre il quale la barra entra. */
const SENTINELLA = "#hero";

function Telefono() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 shrink-0">
      <path
        d="M4.5 2.5h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.7 1.5C8.4 16.3 3.7 11.6 3 4.2A1.5 1.5 0 0 1 4.5 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bussola() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 shrink-0">
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m13 7-2.2 5.8L7 15l2.2-5.8Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function StickyCallBar() {
  const t = useTranslations("home.barra");
  const ta = useTranslations("common");
  const reduced = useReducedMotion();
  const overlayAperto = useOverlayAperto();
  const [oltreHero, setOltreHero] = useState(false);
  const osservatore = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const hero = document.querySelector(SENTINELLA);
    if (!hero) return;
    // La soglia è l'uscita dell'hero, non una quota in pixel: l'altezza
    // dell'hero cambia con la barra di Safari, e un numero fisso entrerebbe
    // troppo presto o troppo tardi a seconda di come è messo il browser.
    osservatore.current = new IntersectionObserver(
      ([voce]) => setOltreHero(!voce.isIntersecting),
      { rootMargin: "0px" },
    );
    osservatore.current.observe(hero);
    return () => osservatore.current?.disconnect();
  }, []);

  const visibile = oltreHero && !overlayAperto;
  const mappe = linkMappe(LOCALI[0]);

  return (
    <motion.div
      data-barra-mobile=""
      // `inert` non basta da solo su tutti i browser: quando è fuori scena
      // la barra è anche nascosta all'albero di accessibilità, così il focus
      // da tastiera non ci finisce dentro mentre non si vede.
      aria-hidden={!visibile}
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-overlay) md:hidden",
        "border-t border-border bg-tuff/92 backdrop-blur-xl",
        visibile ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      initial={false}
      animate={{ y: visibile ? "0%" : "100%" }}
      transition={reduced ? { duration: 0 } : { duration: duration.base, ease: ease.out }}
    >
      <div className="grid h-16 grid-cols-2 divide-x divide-border">
        <a
          href={TELEFONO_HREF}
          tabIndex={visibile ? undefined : -1}
          className="flex items-center justify-center gap-2 font-sans text-label uppercase text-cream"
        >
          <Telefono />
          {t("chiama")}
        </a>
        <a
          href={mappe.google}
          target="_blank"
          rel="noreferrer noopener"
          tabIndex={visibile ? undefined : -1}
          className="flex items-center justify-center gap-2 font-sans text-label uppercase text-brass"
        >
          <Bussola />
          {t("indicazioni")}
          <span className="sr-only">{ta("nuovaScheda")}</span>
        </a>
      </div>
    </motion.div>
  );
}
