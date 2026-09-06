"use client";

// Il footer.
//
// Il wordmark in contorno occupa tutta la larghezza ed è l'ultimo gesto
// tipografico della pagina: un marchio che si legge come disegno e non come
// firma. È `aria-hidden` perché il nome dell'attività è già nel titolo del
// documento e nella barra — ripeterlo qui a uno screen reader significa farlo
// sentire tre volte senza aggiungere niente.
//
// L'imbottitura inferiore tiene conto di due cose insieme: l'incavo del
// dispositivo e la barra fissa mobile, che altrimenti coprirebbe l'ultima
// riga della pagina proprio dove stanno i dati legali.

import { useTranslations } from "next-intl";
import { motion, useScroll, useSpring } from "motion/react";

import { Ancora } from "@/components/chrome/Ancora";
import { LOCALI, PARTITA_IVA, SOCIAL, TELEFONO, TELEFONO_HREF } from "@/lib/data/locali";
import { spring } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { getLenis } from "@/lib/scroll/lenis";
import { apriCarta } from "@/lib/ui/carta";
import type { VoceNav } from "@/lib/data/navigazione";

/** Raggio dell'anello di progresso, in unità del viewBox. */
const R = 20;
const CIRCONFERENZA = 2 * Math.PI * R;

function TornaSu({ etichetta }: { etichetta: string }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // La molla evita che l'anello sussulti a ogni frame di scroll: il progresso
  // è un valore continuo, l'anello è materia.
  const progresso = useSpring(scrollYProgress, reduced ? { duration: 0 } : spring.soft);

  function su() {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={su}
      aria-label={etichetta}
      className="press group relative grid size-14 shrink-0 place-items-center rounded-pill text-brass"
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
        <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20" />
        <motion.circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={CIRCONFERENZA}
          style={{ pathLength: progresso }}
        />
      </svg>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
        <path d="M8 13V3m0 0L3.5 7.5M8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function SiteFooter({ voci }: { voci: readonly VoceNav[] }) {
  const t = useTranslations("home.footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");

  return (
    <footer
      className="border-t border-border pt-16"
      // L'altezza della barra fissa mobile più l'incavo. Su desktop la barra
      // non esiste e resta solo il respiro normale.
      style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-sans text-label uppercase text-stone-dim">{tc("telefono")}</p>
            <a
              href={TELEFONO_HREF}
              className="underline-grow relative mt-2 inline-block font-display text-h3 text-cream"
            >
              {TELEFONO}
            </a>
          </div>

          <nav aria-label={tn("menuLabel")} className="flex flex-wrap gap-x-8 gap-y-3">
            {voci.map((voce) => {
              const classe =
                "underline-grow relative font-sans text-label uppercase text-stone hover:text-cream";
              // La carta apre un pannello anche da qui: stessa regola della
              // barra, un bottone e non un link.
              return voce.azione === "carta" ? (
                <button key={voce.chiave} type="button" onClick={apriCarta} className={classe}>
                  {tn(voce.chiave)}
                </button>
              ) : (
                <Ancora key={voce.chiave} href={voce.href!} className={classe}>
                  {tn(voce.chiave)}
                </Ancora>
              );
            })}
          </nav>

          <TornaSu etichetta={t("tornaSu")} />
        </div>

        <div className="mt-12 grid gap-8 border-t border-border pt-8 sm:grid-cols-3">
          {LOCALI.map((sede) => (
            <div key={sede.id}>
              <p className="font-mono text-mono text-brass tabular-nums lining-nums">{sede.civico}</p>
              <p className="mt-2 text-body text-stone">{sede.via}</p>
              <p className="text-body text-stone-dim">
                {sede.cap} {sede.citta} ({sede.provincia})
              </p>
            </div>
          ))}

          <div>
            {/* I profili social restano fuori finché non sono confermati:
                linkare il clone di un locale è peggio che non linkare niente. */}
            {SOCIAL.length > 0 ? (
              <>
                <p className="font-sans text-label uppercase text-stone-dim">{t("seguici")}</p>
                <ul className="mt-2 space-y-1">
                  {SOCIAL.map((profilo) => (
                    <li key={profilo.url}>
                      <a
                        href={profilo.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline-grow relative text-body text-stone hover:text-cream"
                      >
                        {profilo.nome}
                        <span className="sr-only"> {tc("nuovaScheda")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {PARTITA_IVA ? (
              <p className="mt-6 font-mono text-mono text-stone-dim">
                {t("legale")} {PARTITA_IVA}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Il wordmark: larghezza piena, contorno d'ottone, nessun ruolo
          semantico. `select-none` perché è disegno, e selezionarlo per errore
          scrollando è solo fastidio. */}
      <p
        aria-hidden="true"
        className="wordmark-contorno mt-16 select-none whitespace-nowrap px-(--gutter) text-center font-display leading-none"
        style={{ fontSize: "clamp(3rem, 15.5vw, 15rem)" }}
      >
        {t("wordmark")}
      </p>
    </footer>
  );
}
