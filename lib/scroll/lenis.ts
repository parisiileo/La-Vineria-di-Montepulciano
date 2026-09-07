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
    // Le aree che scorrono per conto loro — la lista della carta dentro il
    // pannello — scorrono davvero.
    //
    // Serve capire l'ordine dei controlli dentro Lenis, perché è lì che sta la
    // differenza fra questa opzione e `data-lenis-prevent`. Il gestore della
    // rotella fa, in quest'ordine: (1) se l'evento nasce dentro un elemento
    // «prevenuto», ESCE SUBITO senza `preventDefault`; (2) altrimenti, se
    // Lenis è fermo, chiama `preventDefault` e la pagina non si muove.
    //
    // Con `data-lenis-prevent` si esce sempre al punto 1. Finché la lista ha
    // strada da fare va bene — scorre lei, nativamente — ma appena arriva in
    // fondo l'evento resta senza padrone e il browser lo passa al documento:
    // la pagina scorreva dietro il pannello aperto. Misurato: y=10643 con la
    // carta aperta su un viewport da 768.
    //
    // `allowNestedScroll` interroga invece l'elemento: «puoi ancora scorrere
    // in questa direzione?». Se sì esce al punto 1 e scorre lui; se no, cade
    // al punto 2, Lenis è fermo, `preventDefault`, e la pagina resta dov'era.
    // È la stessa regola per tutti i contenitori annidati del sito, e non
    // richiede di ricordarsi un attributo su ognuno.
    allowNestedScroll: true,
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

/** Dove era arrivata la pagina prima del blocco. Serve a rimettercela. */
let posizioneBloccata = 0;

/**
 * Blocco dello scroll per dialoghi e menu.
 *
 * Dove c'è Lenis basta fermarlo: la posizione è emulata da lui, e `stop()` la
 * congela senza toccare il documento — niente `overflow: hidden` sul body,
 * che provocherebbe un reflow dell'intera pagina nel frame esatto
 * dell'apertura ed è la causa più comune di menu che scattano al primo frame.
 *
 * DOVE LENIS NON C'È — cioè su ogni telefono, perché `creaLenis` si spegne da
 * sé sul puntatore grosso — qui non c'era un blocco ma solo un ATTRIBUTO:
 * `data-scroll-bloccato` veniva scritto sul body e nessun CSS, in nessun file,
 * lo leggeva. La pagina continuava a scorrere dietro il pannello della carta,
 * dietro la tenda del menu e dietro ogni dialogo, e chiudendo ci si ritrovava
 * a diecimila pixel da dove si era. Trovato misurando lo scorrimento della
 * pagina mentre il pannello era aperto: `y=8974` invece di `y=0`.
 *
 * Il blocco vero è `position: fixed` sul body con l'offset della posizione
 * corrente, e non `overflow: hidden`, che su iOS Safari non ferma lo
 * scorrimento del documento. È la tecnica standard, e l'unica che non lascia
 * la pagina saltare in cima alla riapertura: la posizione si salva prima e si
 * rimette dopo, nello stesso gesto.
 */
export function bloccaScroll(): void {
  const lenis = getLenis();
  if (lenis) {
    lenis.stop();
    // Fermare Lenis NON basta, e questa riga è il risultato di una misura.
    // Lenis marca la radice con `lenis-stopped`, ma quella classe fa qualcosa
    // solo se si importa il CSS della libreria, che qui non si importa; la
    // difesa vera è il `preventDefault` nel suo gestore della rotella. Con
    // `allowNestedScroll` acceso, però, quel gestore esce PRIMA di arrivarci
    // ogni volta che trova un antenato scorrevole nel percorso dell'evento —
    // e il `body` lo è. Sopra il velo, con il pannello aperto, la pagina
    // scorreva: misurata a y=9956 su un viewport da 768.
    //
    // `overflow: hidden` sulla radice chiude la questione senza dipendere
    // dagli interni di Lenis. Qui — e non sul ramo touch — perché Lenis esiste
    // solo dove il puntatore è fine, cioè non su iOS, dove `overflow: hidden`
    // sul documento è notoriamente inaffidabile e serve il `position: fixed`
    // qui sotto. La posizione di scorrimento non si perde: `overflow: hidden`
    // la congela, non la azzera.
    document.documentElement.style.setProperty("overflow", "hidden");
    return;
  }
  if (document.body.dataset.scrollBloccato) return;

  posizioneBloccata = window.scrollY;
  document.documentElement.style.setProperty("overscroll-behavior", "none");
  document.body.style.position = "fixed";
  document.body.style.top = `-${posizioneBloccata}px`;
  document.body.style.insetInline = "0";
  document.body.dataset.scrollBloccato = "on";
}

export function sbloccaScroll(): void {
  const lenis = getLenis();
  if (lenis) {
    document.documentElement.style.removeProperty("overflow");
    lenis.start();
    return;
  }
  // Senza questa guardia, ogni chiusura di un overlay che non aveva bloccato
  // niente rimanderebbe la pagina all'ultima posizione salvata.
  if (!document.body.dataset.scrollBloccato) return;

  document.documentElement.style.removeProperty("overscroll-behavior");
  document.body.style.removeProperty("position");
  document.body.style.removeProperty("top");
  document.body.style.removeProperty("inset-inline");
  delete document.body.dataset.scrollBloccato;
  // `instant`: rimettere la pagina dov'era non è un movimento, è il ripristino
  // di uno stato. Animarlo si vedrebbe come uno scatto alla chiusura.
  window.scrollTo({ top: posizioneBloccata, behavior: "instant" });
}
