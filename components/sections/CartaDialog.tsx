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

import { useEffect, useMemo, useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useLocale, useTranslations } from "next-intl";

import { CARTA, CATEGORIE, TAG_CONFERMATI, formatPrezzo, type Categoria } from "@/lib/data/menu";
import { duration, ease } from "@/lib/motion";
import { bloccaScroll, sbloccaScroll } from "@/lib/scroll/lenis";
import { segnalaOverlay } from "@/lib/ui/overlay";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { Checkbox } from "@/components/ui/Checkbox";
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
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [foglio, setFoglio] = useState(false);
  const [categoria, setCategoria] = useState<Categoria | "tutte">("tutte");
  const [soloVegetariano, setSoloVegetariano] = useState(false);

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

  const voci = useMemo(
    () =>
      CARTA.filter(
        (voce) =>
          (categoria === "tutte" || voce.categoria === categoria) &&
          (!soloVegetariano || voce.tag.includes("vegetariano")),
      ),
    [categoria, soloVegetariano],
  );

  const perCategoria = CATEGORIE.map((c) => ({
    categoria: c,
    voci: voci.filter((v) => v.categoria === c),
  })).filter((gruppo) => gruppo.voci.length > 0);

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

                {/* Filtri: una riga sola, che scorre. Su mobile impilarli
                    significa far scorrere mezzo schermo prima del cibo. */}
                <div className="shrink-0 border-y border-border">
                  {/* Riga che scorre sotto 768px, riga che va a capo sopra: su desktop
                      lo scorrimento nasconderebbe l'ultimo filtro dietro il bordo
                      senza che niente lo annunci. */}
                  <div className="flex items-center gap-3 overflow-x-auto px-6 py-3 md:flex-wrap md:overflow-x-visible md:px-8">
                    <span className="sr-only">{t("filtriEtichetta")}</span>
                    {(["tutte", ...CATEGORIE] as const).map((c) => {
                      const attivo = categoria === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={attivo}
                          onClick={() => setCategoria(c)}
                          className={cn(
                            "press shrink-0 rounded-pill border px-4 py-2 font-sans text-label uppercase",
                            attivo
                              ? "border-brass bg-brass/12 text-brass"
                              : "border-border text-stone-dim hover:border-border-hover hover:text-cream",
                          )}
                        >
                          {c === "tutte" ? t("filtroTutti") : t(`categorie.${c}`)}
                        </button>
                      );
                    })}
                    {/* Il filetto separa i due gruppi di filtri finché stanno sulla
                        stessa riga. Quando la riga va a capo non separa più
                        niente: resta appeso in fondo alla prima riga. */}
                    <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border md:hidden" />
                    <div className="shrink-0">
                      <Checkbox
                        label={t("filtroVegetariano")}
                        checked={soloVegetariano}
                        onCheckedChange={setSoloVegetariano}
                      />
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8">
                  {perCategoria.length === 0 ? (
                    <p className="text-body text-stone-dim">{t("vuoto")}</p>
                  ) : null}

                  {perCategoria.map((gruppo) => (
                    <section key={gruppo.categoria} className="mb-10 last:mb-0">
                      <h3 className="font-mono text-mono uppercase text-brass">
                        {t(`categorie.${gruppo.categoria}`)}
                      </h3>
                      <ul className="mt-4 space-y-6">
                        {gruppo.voci.map((voce) => (
                          <li
                            key={voce.id}
                            className={cn(
                              voce.signature && "border-s-2 border-brass ps-4",
                            )}
                          >
                            {/* Punti di guida: il nome e il prezzo stanno
                                agli estremi e la fila di punti li lega. È il
                                dettaglio che distingue una carta da un
                                elenco puntato. */}
                            {/* `items-end` e non `items-baseline`: quando il
                                nome va a capo — e su 390px va a capo spesso —
                                la linea di punti e il prezzo devono allinearsi
                                all'ULTIMA riga del nome. Sulla prima, sembrano
                                il prezzo di mezzo piatto. */}
                            <p className="flex items-end gap-2">
                              <span className="font-display text-h3 leading-tight text-cream">
                                {t(`piatti.${voce.id}.nome`)}
                              </span>
                              <span
                                aria-hidden="true"
                                className="relative bottom-1.5 min-w-6 flex-1 border-b border-dotted border-border-control"
                              />
                              <span className="shrink-0 font-mono text-mono text-stone-dim">
                                {voce.prezzo === null
                                  ? t("prezzoAssente")
                                  : formatPrezzo(voce.prezzo, locale)}
                              </span>
                            </p>

                            <p className="measure mt-2 text-body text-stone">
                              {t(`piatti.${voce.id}.descrizione`)}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                              {voce.signature ? (
                                <span className="font-mono text-mono uppercase text-brass">
                                  {t("signature")}
                                </span>
                              ) : null}
                              {voce.tag.includes("vegetariano") ? (
                                <span className="font-mono text-mono uppercase text-stone-dim">
                                  {t("filtroVegetariano")}
                                </span>
                              ) : null}
                              <span className="border-s-2 border-wine ps-3 font-mono text-mono text-stone-dim">
                                {t("abbinamento")} · {voce.abbinamento}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}

                  {/* Non è una nota legale di rito: i tag di questa carta non
                      sono ancora confermati dal cliente, e chi filtra per
                      motivi medici deve saperlo prima di ordinare. */}
                  <p
                    className={cn(
                      "mt-8 border-t border-border pt-4 font-sans text-mono",
                      TAG_CONFERMATI ? "text-stone-dim" : "text-stone",
                    )}
                  >
                    {t("allergeni")}
                  </p>
                </div>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
