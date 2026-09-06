"use client";

// La mappa, caricata solo quando entra in campo.
//
// Una mappa incorporata è la cosa più pesante di questa pagina: un documento
// intero, con il suo JavaScript e le sue tiles, per un elemento che la
// maggior parte dei visitatori non guarda mai. Montarla al primo paint
// significa pagarla sempre e usarla quasi mai, quindi l'iframe non esiste nel
// DOM finché la sezione non si avvicina.
//
// Due cose che questo componente NON fa, e sono decisioni:
//
//  1. Non mette un segnaposto. Le coordinate dei due ingressi non sono
//     confermate (vedi lib/data/locali.ts), e uno spillo piantato a occhio
//     su un vicolo di Montepulciano manda qualcuno alla porta sbagliata.
//     L'inquadratura è una veduta del centro, i link "Indicazioni" cercano
//     l'indirizzo per esteso, che è il dato che conosciamo davvero.
//  2. Non cattura il gesto su mobile. Una mappa scorrevole in mezzo a una
//     pagina scorrevole intrappola il pollice: qui resta inerte finché non
//     la si tocca di proposito.

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Riquadro di veduta, non una posizione.
 *
 * È costruito attorno alla geometria che OpenStreetMap ha di Via di
 * Gracciano nel Corso (43.0949–43.0954 N, 11.7828–11.7835 E), allargata a
 * circa 300×370 metri perché la via si legga nel contesto del centro. La
 * prima versione era centrata a occhio 250 metri più a sud-ovest, e il
 * risultato era una mappa in cui il paese stava nell'angolo: un errore che
 * non produce nessun avviso e che si vede solo guardando lo scatto.
 *
 * Resta una VEDUTA: non c'è nessun segnaposto, perché la posizione esatta
 * dei due ingressi non è confermata dal cliente. La via, invece, lo è.
 */
const BBOX = "11.7810,43.0938,11.7856,43.0964";
const SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik`;

export function MappaLazy({ className }: { className?: string }) {
  const t = useTranslations("home.prenota");
  const contenitore = useRef<HTMLDivElement>(null);
  const [carica, setCarica] = useState(false);
  const [attiva, setAttiva] = useState(false);
  const [tattile, setTattile] = useState(false);

  useEffect(() => {
    setTattile(window.matchMedia("(pointer: coarse)").matches);
    const nodo = contenitore.current;
    if (!nodo) return;
    // Un margine generoso: la mappa deve essere già disegnata quando arriva
    // in campo, non cominciare a caricarsi mentre la si guarda.
    const osservatore = new IntersectionObserver(
      ([voce]) => {
        if (!voce.isIntersecting) return;
        osservatore.disconnect();
        // Montata a tempo perso, non nel frame in cui la sezione entra.
        // L'iframe di OpenStreetMap è un documento intero con il suo
        // JavaScript: costruirlo mentre la pagina sta scorrendo costa un
        // frame lungo, ed è l'unico punto della pagina che ne produceva uno.
        const monta = () => setCarica(true);
        const aTempoPerso = window.requestIdleCallback;
        if (typeof aTempoPerso === "function") aTempoPerso(monta, { timeout: 2000 });
        else window.setTimeout(monta, 200);
      },
      { rootMargin: "400px 0px" },
    );
    osservatore.observe(nodo);
    return () => osservatore.disconnect();
  }, []);

  // Col puntatore fine la mappa è subito interattiva: la rotella sopra una
  // mappa non intrappola nessuno, e chiedere un clic in più sarebbe attrito
  // gratuito.
  const bloccata = tattile && !attiva;

  return (
    <div
      ref={contenitore}
      className={cn("relative isolate overflow-hidden rounded-sm border border-border bg-tuff-light", className)}
    >
      {carica ? (
        <>
          <iframe
            src={SRC}
            title={t("mappaEtichetta")}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={cn("mappa-scura size-full border-0", bloccata && "pointer-events-none")}
          />
          <div aria-hidden="true" className="mappa-tinta pointer-events-none absolute inset-0" />
        </>
      ) : null}

      {bloccata ? (
        <button
          type="button"
          onClick={() => setAttiva(true)}
          className="absolute inset-0 grid place-items-center bg-tuff-deep/45 font-sans text-label uppercase text-cream"
        >
          {t("mappaAttiva")}
        </button>
      ) : null}
    </div>
  );
}
