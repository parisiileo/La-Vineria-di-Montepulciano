"use client";

// La tenda del menu.
//
// Quattro decisioni, ognuna contro un difetto preciso.
//
// 1. **Il pannello vive in un portale sul body.** Non è un vezzo: la barra
//    porta `translate` per nascondersi allo scroll, e un valore diverso da
//    `none` su `transform`, `translate`, `rotate` o `scale` rende quell'elemento
//    il BLOCCO CONTENITORE dei discendenti `position: fixed`. Montato dentro
//    la barra, un pannello `fixed inset-0` non copre il viewport: copre la
//    barra — ottanta pixel in cima, col resto del menu che deborda sopra la
//    pagina. È lo stesso meccanismo che disattiva il `backdrop-filter` (§3.7),
//    e si manifesta senza un errore e senza un avviso, solo con un layout
//    sbagliato. Trovato guardando lo screenshot, non leggendo il codice.
//
// 2. **Il menu è montato a priori**, con `visibility: hidden` e
//    `pointer-events: none`, non creato all'apertura. Costruire l'albero DOM
//    nello stesso frame in cui parte l'animazione fa saltare il primo frame,
//    sempre: il browser deve calcolare stili e layout di un sottoalbero nuovo
//    prima di poter comporre. Montato prima, l'apertura è solo una
//    trasformazione.
//
// 3. **Il backdrop-filter si applica a fine animazione**, non durante: un
//    filtro che segue una `clip-path` in movimento costringe a ridisegnare
//    l'area sfocata a ogni frame.
//
// 4. **Lo scroll si blocca con `lenis.stop()`**, mai con `overflow: hidden`
//    sul body — quello riflette l'intera pagina nel frame dell'apertura.
//
// L'hamburger è un solo movimento e non tre: le tre aste condividono durata
// ed easing, e la centrale scompare in `scaleX` mentre le altre ruotano.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

import { Ancora } from "@/components/chrome/Ancora";
import { duration, ease, stagger } from "@/lib/motion";
import { bloccaScroll, sbloccaScroll } from "@/lib/scroll/lenis";
import { segnalaOverlay } from "@/lib/ui/overlay";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { cn } from "@/lib/utils";

interface MenuCurtainProps {
  voci: readonly { href: string; chiave: string }[];
  aperto: boolean;
  onCambio: (aperto: boolean) => void;
}

/**
 * L'hamburger che diventa una croce.
 *
 * `transformBox: "view-box"` non è un dettaglio: senza, il browser calcola
 * `transform-origin` rispetto al riquadro di ciascun tracciato invece che al
 * sistema di coordinate dell'SVG. Per una linea orizzontale quel riquadro è
 * alto zero e largo 18, quindi "12px 7px" finisce da tutt'altra parte: le due
 * aste ruotano attorno a due perni sbagliati e non si incrociano mai. Il
 * risultato non è una croce, è un accento circonflesso — e nessun errore
 * viene segnalato da nessuna parte. Trovato guardando lo scatto a 4×.
 */
function Hamburger({ aperto }: { aperto: boolean }) {
  const comune = {
    transition: { duration: duration.micro * 1.5, ease: ease.inOut },
  } as const;
  const perno = { transformBox: "view-box", transformOrigin: "12px 12px" } as const;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none">
      <motion.path
        d="M3 7h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={aperto ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
        style={perno}
        {...comune}
      />
      <motion.path
        d="M3 12h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        // Anche l'opacità, non solo la scala: con `strokeLinecap="round"`
        // un'asta schiacciata a scaleX 0 lascia in mezzo il proprio
        // terminale tondo, cioè un puntino grosso quanto il tratto.
        animate={aperto ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
        style={perno}
        {...comune}
      />
      <motion.path
        d="M3 17h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={aperto ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
        style={perno}
        {...comune}
      />
    </svg>
  );
}

export function MenuCurtain({ voci, aperto, onCambio }: MenuCurtainProps) {
  const t = useTranslations("nav");
  const ta = useTranslations("a11y");
  const reduced = useReducedMotion();
  const pannello = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [sfocato, setSfocato] = useState(false);
  const [inFocus, setInFocus] = useState<string | null>(null);
  // L'attenuazione dei fratelli esiste solo dove c'è un puntatore fine: col
  // dito non esiste hover, e resterebbe appiccicata all'ultima voce sfiorata.
  const [puntatoreFine, setPuntatoreFine] = useState(false);
  const [montato, setMontato] = useState(false);
  const id = useId();

  const chiudi = useCallback(() => onCambio(false), [onCambio]);

  useEffect(() => setMontato(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setPuntatoreFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Effetto separato, e dipendente dal SOLO `aperto`: il contatore degli
  // strati è un saldo, e un effetto che si ri-esegue per un'altra
  // dipendenza — la preferenza di movimento, per esempio — lo sbilancia.
  useEffect(() => {
    if (!aperto) return;
    segnalaOverlay(true);
    return () => segnalaOverlay(false);
  }, [aperto]);

  useEffect(() => {
    if (aperto) {
      bloccaScroll();
      const timer = window.setTimeout(
        () => setSfocato(true),
        reduced ? 0 : duration.slow * 1000,
      );
      return () => window.clearTimeout(timer);
    }
    sbloccaScroll();
    setSfocato(false);
    setInFocus(null);
  }, [aperto, reduced]);

  // Esc, trappola del focus, restituzione del focus al trigger.
  useEffect(() => {
    if (!aperto) return;
    const nodo = pannello.current;
    if (!nodo) return;

    const focusabili = () =>
      [...nodo.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
        (el) => el.offsetParent !== null,
      );

    focusabili()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        chiudi();
        trigger.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = focusabili();
      if (!lista.length) return;
      const primo = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primo) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primo.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aperto, chiudi]);

  const tenda = (
    <motion.div
      id={id}
      ref={pannello}
      role="dialog"
      aria-modal="true"
      aria-label={t("menuLabel")}
      data-menu-tenda=""
      className={cn(
        "fixed inset-0 z-(--z-overlay) bg-tuff-deep",
        aperto ? "pointer-events-auto visible" : "pointer-events-none invisible",
        sfocato && "backdrop-blur-xl",
      )}
      initial={false}
      animate={{
        clipPath: aperto
          ? "circle(150% at calc(100% - 3rem) 2.5rem)"
          : "circle(0% at calc(100% - 3rem) 2.5rem)",
      }}
      transition={{ duration: reduced ? 0 : duration.slow, ease: ease.out }}
    >
      <div className="shell flex h-full flex-col justify-center py-24">
        <nav aria-label={t("menuLabel")}>
          {/* Le voci sono più grandi e più distanziate di prima. Tolti i
              numeri progressivi, il menu rischiava di sembrare spoglio: la
              risposta è scala e respiro, non rimettere la decorazione. */}
          <ul className="space-y-4 sm:space-y-6">
            {voci.map((voce, i) => (
              <motion.li
                key={voce.href}
                data-motion-guard=""
                initial={false}
                animate={
                  aperto
                    ? { opacity: 1, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, y: 40, filter: "blur(6px)" }
                }
                transition={{
                  duration: reduced ? 0 : duration.base,
                  ease: ease.out,
                  delay: aperto && !reduced ? 0.18 + i * stagger.base : 0,
                }}
              >
                <Ancora
                  href={voce.href}
                  onClick={chiudi}
                  onMouseEnter={() => setInFocus(voce.href)}
                  onMouseLeave={() => setInFocus(null)}
                  className={cn(
                    // `block` e non `flex`: senza il numero davanti non c'è
                    // più niente da allineare, e la voce parte dal bordo
                    // della colonna come tutto il resto della pagina.
                    "block py-1",
                    "transition-opacity duration-(--dur-micro) ease-(--ease-soft)",
                    puntatoreFine && inFocus && inFocus !== voce.href
                      ? "opacity-35"
                      : "opacity-100",
                  )}
                >
                  {/* Più grande su schermo stretto, non più piccolo: la
                      tenda occupa tutto lo schermo per sei voci, e a corpo
                      h2 su 390px restava un elenco in mezzo al vuoto.
                      Su desktop `text-hero` non entrerebbe: sei voci da
                      128px sono più alte del viewport. */}
                  <span className="font-display text-hero text-cream md:text-h2">
                    {t(voce.chiave)}
                  </span>
                </Ancora>
              </motion.li>
            ))}
          </ul>
        </nav>
      </div>
    </motion.div>
  );

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-expanded={aperto}
        aria-controls={id}
        aria-label={aperto ? ta("chiudiDialogo") : t("menuLabel")}
        onClick={() => onCambio(!aperto)}
        className="tap-safe press relative z-10 inline-flex size-11 items-center justify-center rounded-sm text-cream"
      >
        <Hamburger aperto={aperto} />
      </button>

      {montato ? createPortal(tenda, document.body) : null}
    </>
  );
}
