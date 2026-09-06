"use client";

// La carta, in un pannello.
//
// Non è il `Dialog` condiviso e la ragione è la forma, non il capriccio: su
// telefono questo pannello è un foglio che sale dal basso e si chiude con lo
// stesso gesto con cui è arrivato, mentre il dialogo condiviso è una finestra
// centrata. Sono due componenti diversi travestiti da uno solo, e travestirli
// costa più codice condizionale di quanto ne risparmi.
//
// Le decisioni che contano:
//
//  1. **Foglio dal basso sotto 768px, finestra centrata sopra.** Il pollice
//     non arriva in cima allo schermo: un pannello centrato su un telefono
//     mette la maniglia di chiusura dove la mano non è.
//  2. **`overscroll-contain` sul corpo scorrevole.** Senza, arrivare in fondo
//     alla lista trascina la pagina sotto, e chiudendo il foglio ci si
//     ritrova in un punto diverso da dove si era.
//  3. **I filtri sono una riga che scorre, non una pila.** Impilati mangiano
//     mezzo schermo prima del primo piatto.
//  4. **I prezzi mancano davvero**, quindi la riga lo dice invece di mostrare
//     uno zero o un trattino. I punti di guida restano: sono ciò che rende
//     una carta una carta, e sono già al posto giusto per quando i numeri
//     arriveranno.

import { useEffect, useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
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

interface CartaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Chiudi({ label }: { label: string }) {
  return (
    <RadixDialog.Close
      aria-label={label}
      className={cn(
        "absolute end-4 top-4 grid size-11 place-items-center rounded-sm text-stone-dim",
        "transition-colors duration-(--dur-micro) ease-(--ease-soft) hover:text-brass",
      )}
    >
      <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5">
        <path d="M1 1 13 13M13 1 1 13" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    </RadixDialog.Close>
  );
}

export function CartaDialog({ open, onOpenChange }: CartaDialogProps) {
  const t = useTranslations("carta");
  const ta = useTranslations("a11y");
  const reduced = useReducedMotion();
  const [foglio, setFoglio] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setFoglio(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (open) bloccaScroll();
    else sbloccaScroll();
  }, [open]);

  // Come nella tenda del menu: il contatore degli strati è un saldo, e va
  // mosso una volta sola all'apertura e una alla chiusura.
  useEffect(() => {
    if (!open) return;
    segnalaOverlay(true);
    return () => segnalaOverlay(false);
  }, [open]);

  function fineTrascinamento(_: unknown, info: PanInfo) {
    if (info.offset.y > CHIUSURA_PX || info.velocity.y > CHIUSURA_VELOCITA) onOpenChange(false);
  }

  const trascinamento =
    foglio && !reduced
      ? {
          drag: "y" as const,
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
      <AnimatePresence>
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

            <RadixDialog.Content asChild forceMount>
              <motion.div
                {...ingresso}
                {...trascinamento}
                aria-modal="true"
                className={cn(
                  "fixed z-(--z-overlay) flex flex-col border border-border bg-tuff-light",
                  foglio
                    ? "inset-x-0 bottom-0 h-[92dvh] rounded-t-md"
                    : "left-1/2 top-1/2 h-[min(46rem,88vh)] w-[min(46rem,calc(100vw-2*var(--gutter)))] -translate-x-1/2 -translate-y-1/2 rounded-md shadow-(--glow-brass)",
                )}
              >
                {/* La maniglia è anche il bersaglio del gesto: senza un
                    affordance visibile, «si chiude trascinando» è una
                    funzione che nessuno trova. */}
                {foglio ? (
                  <div aria-hidden="true" className="grid place-items-center pt-3">
                    <span className="h-1 w-10 rounded-pill bg-stone-dim/50" />
                  </div>
                ) : null}

                <header className="shrink-0 px-6 pb-4 pt-6 md:px-8 md:pt-8">
                  <RadixDialog.Title className="text-h3">{t("titolo")}</RadixDialog.Title>
                  <RadixDialog.Description className="measure mt-3 text-body text-stone">
                    {t("sottotitolo")}
                  </RadixDialog.Description>
                  <Chiudi label={ta("chiudiDialogo")} />
                </header>

                <ListaCarta
                  classeFiltri="border-y border-border px-6 py-3 md:px-8"
                  classeVoci="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8"
                  className="flex min-h-0 flex-1 flex-col"
                />
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
