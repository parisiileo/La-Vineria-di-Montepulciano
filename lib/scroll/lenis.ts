// Istanza unica di Lenis e suo aggancio al ticker di GSAP.
//
// Tre decisioni, tutte prese per una ragione misurabile:
//
//  1. `lerp` 0.085. Sopra 0.12 lo scroll sembra gommoso — il contenuto continua
//     a muoversi dopo che il dito si è fermato; sotto 0.06 sembra scollegato
//     dal gesto. 0.085 si sente senza frustrare.
//  2. `wheelMultiplier` 0.9: la ruota rallenta appena, e la pagina acquista
//     massa. Sotto 0.8 diventa faticoso raggiungere il fondo.
//  3. **Spento su touch.** Lo scroll nativo di iOS è migliore di qualsiasi
//     emulazione, ed è il rubber-band a rendere il gesto credibile. Lenis su
//     mobile è la causa numero uno di scroll che «sembra rotto».
//
// Un solo RAF: `gsap.ticker` guida `lenis.raf`, e `lagSmoothing(0)` impedisce
// a GSAP di comprimere il tempo dopo un frame lungo — se lo facesse, lo scroll
// smoothed e le timeline legate allo scroll divergerebbero.

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const LERP = 0.085;
export const WHEEL_MULTIPLIER = 0.9;

let istanza: Lenis | null = null;
/** Contatore dei loop attivi: serve alla verifica del §2.2, non alla logica. */
let loopAttivi = 0;

/** `true` se il puntatore primario è grosso: dito, non mouse. */
export function isTouch(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function getLenis(): Lenis | null {
  return istanza;
}

/** Numero di loop rAF che questo modulo tiene attivi. Atteso: 0 o 1. */
export function contaLoop(): number {
  return loopAttivi;
}

export function creaLenis(): (() => void) | undefined {
  if (istanza) return;
  if (isTouch()) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);

  istanza = new Lenis({
    lerp: LERP,
    wheelMultiplier: WHEEL_MULTIPLIER,
    smoothWheel: true,
    // Il gesto touch resta nativo anche se l'istanza esiste per altre ragioni.
    syncTouch: false,
    autoRaf: false,
  });

  const aggiorna = () => ScrollTrigger.update();
  istanza.on("scroll", aggiorna);

  const tick = (tempo: number) => istanza?.raf(tempo * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  loopAttivi++;

  return () => {
    gsap.ticker.remove(tick);
    loopAttivi--;
    istanza?.off("scroll", aggiorna);
    istanza?.destroy();
    istanza = null;
  };
}

/**
 * Blocco dello scroll per dialoghi e menu.
 *
 * Non è `overflow: hidden` sul body: quello provoca un reflow dell'intero
 * documento nel frame esatto dell'apertura, ed è la causa più comune di menu
 * che scattano al primo frame. Quando Lenis non c'è (touch, reduced-motion)
 * si ricade sul blocco nativo, che su mobile non ha lo stesso costo perché
 * non c'è una posizione emulata da riconciliare.
 */
export function bloccaScroll(): void {
  const lenis = getLenis();
  if (lenis) {
    lenis.stop();
    return;
  }
  document.documentElement.style.setProperty("overscroll-behavior", "none");
  document.body.dataset.scrollBloccato = "on";
}

export function sbloccaScroll(): void {
  const lenis = getLenis();
  if (lenis) {
    lenis.start();
    return;
  }
  document.documentElement.style.removeProperty("overscroll-behavior");
  delete document.body.dataset.scrollBloccato;
}
