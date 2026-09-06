"use client";

// La carta: filtri e voci. Una sola volta, in due posti.
//
// Vive nel pannello che si apre dalla cucina — lo sguardo veloce, in
// contesto — e nella pagina `/carta`, che è la destinazione che la gente
// cerca e condivide. Sono due lavori diversi, ma è la stessa carta: tenerla
// in due file significa che un giorno un prezzo cambierà in uno solo.

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CARTA, CATEGORIE, TAG_CONFERMATI, formatPrezzo, type Categoria } from "@/lib/data/menu";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

export function ListaCarta({
  className,
  classeFiltri,
  classeVoci,
  classeGruppi,
}: {
  className?: string;
  /** Il pannello e la pagina impaginano i filtri in modo diverso. */
  classeFiltri?: string;
  classeVoci?: string;
  /**
   * L'impaginazione dei gruppi. Nel pannello è una colonna sola, perché il
   * pannello è stretto e si scorre; nella pagina sono due, perché una carta
   * a colonna singola su uno schermo largo lascia metà foglio vuoto e non
   * assomiglia più a una carta.
   */
  classeGruppi?: string;
}) {
  const t = useTranslations("carta");
  const locale = useLocale();
  const [categoria, setCategoria] = useState<Categoria | "tutte">("tutte");
  const [soloVegetariano, setSoloVegetariano] = useState(false);

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

  return (
    <div className={className}>
      {/* Riga che scorre sotto 768px, riga che va a capo sopra: su desktop
          lo scorrimento nasconderebbe l'ultimo filtro dietro il bordo senza
          che niente lo annunci. */}
      <div
        className={cn(
          "flex items-center gap-3 overflow-x-auto md:flex-wrap md:overflow-x-visible",
          classeFiltri,
        )}
      >
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
        <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border md:hidden" />
        <div className="shrink-0">
          <Checkbox
            label={t("filtroVegetariano")}
            checked={soloVegetariano}
            onCheckedChange={setSoloVegetariano}
          />
        </div>
      </div>

      <div className={classeVoci}>
        {perCategoria.length === 0 ? (
          <p className="text-body text-stone-dim">{t("vuoto")}</p>
        ) : null}

        <div className={classeGruppi}>
        {perCategoria.map((gruppo) => (
          <section key={gruppo.categoria} className="mb-12 break-inside-avoid last:mb-0">
            <h3 className="font-mono text-mono uppercase text-brass">
              {t(`categorie.${gruppo.categoria}`)}
            </h3>
            <ul className="mt-6 space-y-8">
              {gruppo.voci.map((voce) => (
                <li key={voce.id} className={cn(voce.signature && "border-s-2 border-brass ps-4")}>
                  {/* `items-end` e non `items-baseline`: quando il nome va a
                      capo — e su 390px va a capo spesso — la linea di punti e
                      il prezzo devono allinearsi all'ULTIMA riga del nome.
                      Sulla prima, sembrano il prezzo di mezzo piatto. */}
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
        </div>

        {/* Non è una nota legale di rito: i tag di questa carta non sono
            ancora confermati dal cliente, e chi filtra per motivi medici deve
            saperlo prima di ordinare. */}
        <p
          className={cn(
            "measure mt-10 border-t border-border pt-4 font-sans text-mono",
            TAG_CONFERMATI ? "text-stone-dim" : "text-stone",
          )}
        >
          {t("allergeni")}
        </p>
      </div>
    </div>
  );
}
