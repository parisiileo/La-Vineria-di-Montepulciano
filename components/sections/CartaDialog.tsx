"use client";

// LA CARTA, IN UN PANNELLO — riscritto.
//
// IL DIFETTO CHE HA CAUSATO LA RISCRITTURA: il pannello non si scorreva.
//
// Non per un errore di CSS — quello era giusto, e lo si vede misurando il nodo
// scorrevole: `scrollHeight` 1596 contro `clientHeight` 470, `overflow-y: auto`
// regolarmente applicato. Non si scorreva perché **Lenis si prendeva la
// rotella**: ascolta l'evento sul documento e chiama `preventDefault`, e
// `lenis.stop()` ferma il suo scorrimento senza togliere il listener. Risultato:
// la pagina sotto non si muoveva — giusto — e la lista sopra nemmeno.
//
// Il rimedio sta in lib/scroll/lenis.ts, nell'opzione `allowNestedScroll`: cede
// la rotella a un'area annidata finché quell'area ha strada da fare, e se la
// riprende quando è finita. Lì è spiegato anche perché `data-lenis-prevent` —
// che sarebbe la risposta ovvia, ed è quella che avevo messo per prima — fa
// scorrere la pagina dietro il pannello appena la lista arriva in fondo.
//
// LE ALTRE DECISIONI, in ordine di quanto cambiano l'esperienza.
//
//  1. **Il pannello si adatta al contenuto.** Prima era `h-[min(46rem,88vh)]`
//     fisso: filtrando su «Dolci» restavano due piatti in una finestra alta
//     settecento pixel, per due terzi vuota. Ora è `max-h`, e la finestra è
//     alta quanto la carta che mostra.
//  2. **Le sfumature ai bordi dicono che c'è altro.** Compaiono solo dal lato
//     in cui il contenuto continua davvero. Non sono decorazione: sono la
//     sola indicazione che un elenco senza barra di scorrimento visibile
//     prosegue oltre il taglio.
//  3. **Il gesto di chiusura sta sulla maniglia, non su tutto il foglio.**
//     Prima `drag="y"` era sul pannello intero, quindi sul telefono il dito
//     che voleva scorrere la lista trascinava il foglio: le due cose si
//     contendevano lo stesso gesto e vinceva quella sbagliata.
//  4. **Cambiando filtro la lista torna in cima.** Restare a metà di un
//     elenco che nel frattempo è diventato un altro elenco è disorientante.
//  5. **La regione scorrevole è raggiungibile da tastiera** (`tabindex=0` e
//     un nome accessibile): senza, chi naviga senza mouse arriva ai filtri e
//     non ha modo di scorrere i piatti.
//  6. **`scrollbar-gutter: stable`**: fra un filtro con dieci piatti e uno con
//     due la barra compare e sparisce, e senza questo il testo salta di sei
//     pixel a ogni cambio.

import { useCallback, useEffect, useRef, useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { useTranslations } from "next-intl";

import { duration, ease } from "@/lib/motion";
import { bloccaScroll, sbloccaScroll } from "@/lib/scroll/lenis";
import { segnalaOverlay } from "@/lib/ui/overlay";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ListaCarta } from "@/components/sections/ListaCarta";
import { cn } from "@/lib/utils";

/** Oltre questo trascinamento, o questa velocità, il foglio si chiude. */
const CHIUSURA_PX = 120;
const CHIUSURA_VELOCITA = 600;

/** Tolleranza in pixel prima di dichiarare «si può ancora scorrere». Sotto i
 *  due pixel è arrotondamento del browser, non contenuto. */
const SOGLIA_BORDO = 2;

/** Altezza delle due sfumature ai bordi della lista. In basso è più alta
 *  perché lì sotto passa anche il conteggio, e una riga di testo che entra
 *  in una sfumatura corta si legge sporca invece che velata. */
const SFUMATA_SOPRA = 40;
const SFUMATA_SOTTO = 64;

interface CartaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartaDialog({ open, onOpenChange }: CartaDialogProps) {
  const t = useTranslations("carta");
  const ta = useTranslations("a11y");
  const reduced = useReducedMotion();

  const [foglio, setFoglio] = useState(false);

  const scorrevole = useRef<HTMLDivElement | null>(null);
  const controlliTrascinamento = useDragControls();

  // ------------------------------------------------------------ dimensione
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setFoglio(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // ------------------------------------------------------------ scroll lock
  useEffect(() => {
    if (open) bloccaScroll();
    else sbloccaScroll();
  }, [open]);

  // Il contatore degli strati è un saldo: una volta all'apertura, una alla
  // chiusura.
  useEffect(() => {
    if (!open) return;
    segnalaOverlay(true);
    return () => segnalaOverlay(false);
  }, [open]);

  // ------------------------------------------------------------ il fuoco
  // Radix restituisce il fuoco al proprio `Trigger`, ma qui un Trigger non
  // esiste: la carta la aprono la barra, la tenda e la sezione della cucina
  // attraverso uno stato globale, e Radix non ha modo di sapere da quale.
  // Senza queste righe, alla chiusura il fuoco cadeva sul `body` — chi naviga
  // da tastiera si ritrovava in cima al documento e doveva rifare tutta la
  // strada. Si ricorda l'elemento attivo all'apertura e glielo si rende.
  const apritore = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) apritore.current = document.activeElement as HTMLElement | null;
  }, [open]);

  // Chi ha aperto può non esistere più. Sotto i 1024px la barra nasconde le
  // sue voci e la carta si apre dalla tenda del menu, che si chiude dietro di
  // noi: alla chiusura del pannello quel bottone è un nodo staccato, e
  // `focus()` su un nodo staccato non fa niente — il fuoco cadeva sul body.
  // Il ripiego è il comando che apre la navigazione, che a quella larghezza è
  // l'unico modo per tornare alla carta.
  const restituisciFuoco = useCallback(() => {
    const chiHaAperto = apritore.current;
    if (chiHaAperto?.isConnected) {
      chiHaAperto.focus();
      return;
    }
    const ripiego =
      document.querySelector<HTMLElement>("header button[aria-expanded]") ??
      document.querySelector<HTMLElement>("header button");
    ripiego?.focus();
  }, []);

  // QUANDO rimettere il fuoco, non solo dove. Il contenuto è `forceMount`
  // dentro `AnimatePresence`: alla chiusura resta montato per tutta
  // l'animazione di uscita, e lo scope di fuoco di Radix si smonta alla fine
  // di quella. Rimettere il fuoco prima — nel callback di Radix o su un
  // effetto legato a `open` — non serve a niente: lo smontaggio successivo lo
  // rimanda sul `body`, ed è quello che si misurava sotto i 1024px.
  // `onExitComplete` è l'unico istante in cui l'uscita è finita davvero.

  // ------------------------------------------------------------ i due bordi
  //
  // La sfumatura è una MASCHERA sull'elemento che scorre, non due rettangoli
  // sovrapposti. Tre vantaggi, tutti concreti: la maschera non scorre con il
  // contenuto (si applica al box, non al flusso), non aggiunge nodi, e non
  // serve indovinare dove comincia la lista dentro il pannello — la maschera
  // È la lista. Sotto c'è il fondo del pannello, quindi il testo sfuma
  // esattamente nel tufo invece che in un rettangolo dipinto a mano.
  //
  // Si scrive direttamente sul nodo, senza passare da uno stato di React:
  // questa funzione gira a ogni evento di scorrimento, e far ridisegnare il
  // componente sessanta volte al secondo per due sfumature sarebbe lavoro
  // buttato. Non c'è nessuno stato da tenere sincronizzato — la maschera è
  // l'unica cosa che cambia, e cambia su un nodo che esiste già.
  const misuraBordi = useCallback(() => {
    const n = scorrevole.current;
    if (!n) return;
    const alto = n.scrollTop > SOGLIA_BORDO ? SFUMATA_SOPRA : 0;
    const basso =
      n.scrollTop + n.clientHeight < n.scrollHeight - SOGLIA_BORDO ? SFUMATA_SOTTO : 0;

    const maschera =
      `linear-gradient(to bottom, transparent 0, #000 ${alto}px,` +
      ` #000 calc(100% - ${basso}px), transparent 100%)`;
    n.style.maskImage = maschera;
    n.style.webkitMaskImage = maschera;
  }, []);

  // L'aggancio è una ref-callback e NON un effetto, e la differenza si vedeva:
  // con un effetto la prima misura non avveniva mai. Radix monta il contenuto
  // del portale un giro dopo, quindi quando l'effetto del genitore girava il
  // nodo non c'era ancora — `scorrevole.current` era `null`, la funzione usciva
  // subito e la maschera restava vuota finché non si scorreva a mano. Con la
  // ref-callback la misura parte nell'istante esatto in cui il nodo esiste,
  // qualunque sia l'ordine di montaggio.
  //
  // Qui vive anche l'osservatore: la sfumata di sotto deve sparire quando la
  // lista si accorcia — filtrando su «Dolci» restano due piatti e non c'è più
  // niente sotto — e quel cambiamento non produce nessun evento di scorrimento.
  const osservatore = useRef<ResizeObserver | null>(null);

  const agganciaScorrevole = useCallback(
    (n: HTMLDivElement | null) => {
      osservatore.current?.disconnect();
      osservatore.current = null;
      scorrevole.current = n;
      if (!n) return;

      misuraBordi();
      const ro = new ResizeObserver(misuraBordi);
      ro.observe(n);
      // Anche i figli: il riquadro che scorre ha altezza fissa, è il contenuto
      // dentro di lui che cresce e cala.
      for (const figlio of Array.from(n.children)) ro.observe(figlio);
      osservatore.current = ro;
    },
    [misuraBordi],
  );

  // ------------------------------------------------------------ filtri
  // Il conteggio lo mostra `ListaCarta` accanto ai filtri, che è dove sta la
  // causa: qui interessa solo il fatto che i filtri siano cambiati.
  const alCambioRisultati = useCallback(() => {
    // In cima, senza animazione: è un cambio di contenuto, non un movimento.
    scorrevole.current?.scrollTo({ top: 0 });
  }, []);

  function fineTrascinamento(_: unknown, info: PanInfo) {
    if (info.offset.y > CHIUSURA_PX || info.velocity.y > CHIUSURA_VELOCITA) onOpenChange(false);
  }

  const trascinamento =
    foglio && !reduced
      ? {
          drag: "y" as const,
          // Il pannello NON ascolta il gesto da solo: lo avvia la maniglia.
          // È ciò che restituisce lo scorrimento al dito dentro la lista.
          dragListener: false,
          dragControls: controlliTrascinamento,
          dragConstraints: { top: 0, bottom: 0 },
          dragElastic: { top: 0, bottom: 0.4 },
          onDragEnd: fineTrascinamento,
        }
      : {};

  const ingresso = reduced
    ? {}
    : foglio
      ? {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
          transition: { duration: duration.base, ease: ease.out },
        }
      : {
          initial: { opacity: 0, y: 12, filter: "blur(6px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          exit: { opacity: 0, y: 8, filter: "blur(4px)" },
          transition: { duration: duration.base, ease: ease.out },
        };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence onExitComplete={restituisciFuoco}>
        {open ? (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-(--z-overlay) bg-tuff-deep/80 backdrop-blur-xs"
                initial={reduced ? undefined : { opacity: 0 }}
                animate={reduced ? undefined : { opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: duration.micro, ease: ease.soft }}
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content
              asChild
              forceMount
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                restituisciFuoco();
              }}
            >
              <motion.div
                {...ingresso}
                {...trascinamento}
                aria-modal="true"
                data-carta=""
                className={cn(
                  "fixed z-(--z-overlay) flex flex-col overflow-hidden border border-border bg-tuff-light",
                  // `max-h` e non `h`: il pannello è alto quanto la carta che
                  // mostra. Vedi la decisione 1 in testa al file.
                  foglio
                    ? "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-md"
                    : cn(
                        "left-1/2 top-1/2 max-h-[min(46rem,86dvh)]",
                        "w-[min(46rem,calc(100vw-2*var(--gutter)))]",
                        "-translate-x-1/2 -translate-y-1/2 rounded-md shadow-(--glow-brass)",
                      ),
                )}
              >
                {/* ------------------------------------------------ maniglia
                    È l'affordance E il bersaglio del gesto. Ha un'area
                    tappabile piena anche se il segno è alto quattro pixel:
                    una maniglia che si prende solo centrando una linea
                    sottile è una maniglia che non si prende. */}
                {foglio ? (
                  <div
                    aria-hidden="true"
                    onPointerDown={(e) => controlliTrascinamento.start(e)}
                    className="grid shrink-0 cursor-grab touch-none place-items-center pt-3 pb-1 active:cursor-grabbing"
                  >
                    <span className="h-1 w-10 rounded-pill bg-stone-dim/50" />
                  </div>
                ) : null}

                {/* -------------------------------------------------- testata */}
                <header
                  onPointerDown={foglio ? (e) => controlliTrascinamento.start(e) : undefined}
                  className={cn(
                    "relative shrink-0 px-6 pb-5 md:px-8",
                    foglio ? "pt-2 touch-none" : "pt-6 md:pt-8",
                  )}
                >
                  <RadixDialog.Title className="text-h3">{t("titolo")}</RadixDialog.Title>
                  <RadixDialog.Description className="measure mt-3 text-body text-stone">
                    {t("sottotitolo")}
                  </RadixDialog.Description>

                  <RadixDialog.Close
                    aria-label={ta("chiudiDialogo")}
                    className={cn(
                      "absolute end-3 top-3 grid size-11 place-items-center rounded-sm text-stone-dim",
                      "transition-colors duration-(--dur-micro) ease-(--ease-soft)",
                      "hover:bg-tuff-raised hover:text-brass",
                    )}
                  >
                    <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5">
                      <path
                        d="M1 1 13 13M13 1 1 13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                      />
                    </svg>
                  </RadixDialog.Close>
                </header>

                {/* --------------------------------------------- corpo
                    Filtri e lista arrivano da `ListaCarta`, che è la stessa
                    carta dei dati: il pannello decide solo la forma. */}
                <ListaCarta
                  className="flex min-h-0 flex-1 flex-col"
                  classeFiltri="shrink-0 border-y border-border px-6 py-3 md:px-8"
                  classeVoci={cn(
                    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8",
                    // La barra di scorrimento occupa spazio sempre, anche
                    // quando non serve: altrimenti il testo salta di lato a
                    // ogni cambio di filtro.
                    "[scrollbar-gutter:stable]",
                  )}
                  riferimentoVoci={agganciaScorrevole}
                  onScrollVoci={misuraBordi}
                  onRisultati={alCambioRisultati}
                />

              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
