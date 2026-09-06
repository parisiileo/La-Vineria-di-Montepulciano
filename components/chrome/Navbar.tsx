"use client";

// Barra di navigazione.
//
// Due trappole note, entrambe evitate qui per costruzione e non per fortuna.
//
// 1. `backdrop-filter` e `opacity` sullo STESSO nodo. Su iOS Safari un nodo
//    che porta un backdrop-filter e la cui opacità viene animata non viene
//    disegnato affatto: né la sfocatura né il colore sotto. Qui il velo con
//    la sfocatura è un nodo separato dal contenuto della barra, e ciò che si
//    anima è l'opacità del velo, mai quella del nodo che porta il filtro.
//    Per la stessa ragione il fondo è SOLIDO e non solo sfocato: dove il
//    backdrop-filter non viene applicato, resta comunque un fondo leggibile.
//
// 2. Un antenato con `transform`, `filter` o `perspective` crea un contesto
//    di contenimento e disattiva silenziosamente il backdrop-filter. La barra
//    è quindi montata come figlia diretta del body, fuori da `main`, che è il
//    ramo dove vivono i parallassi.

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Ancora } from "@/components/chrome/Ancora";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { MenuCurtain } from "@/components/chrome/MenuCurtain";
import { cn } from "@/lib/utils";

/** Oltre questa soglia la barra prende il fondo. Bassa di proposito: il
 *  cambio deve avvenire al primo gesto, non a metà pagina. */
const SOGLIA_FONDO = 24;
/** Sotto questa quota non si nasconde mai: in cima la barra serve sempre. */
const SOGLIA_NASCONDI = 160;

export interface VoceNav {
  href: string;
  chiave: string;
}

export function Navbar({ voci }: { voci: readonly VoceNav[] }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const [conFondo, setConFondo] = useState(false);
  const [nascosta, setNascosta] = useState(false);
  const [aperto, setAperto] = useState(false);
  const ultimo = useRef(0);

  useEffect(() => {
    // Listener passivo: senza `passive` il browser deve attendere che il
    // gestore finisca prima di scorrere, ed è un modo garantito di perdere
    // frame su ogni ruota.
    const onScroll = () => {
      const y = window.scrollY;
      setConFondo(y > SOGLIA_FONDO);
      setNascosta(y > SOGLIA_NASCONDI && y > ultimo.current);
      ultimo.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-navbar=""
      className={cn(
        "fixed inset-x-0 top-0 z-(--z-nav) transition-transform duration-(--dur-micro) ease-(--ease-soft)",
        nascosta && !aperto ? "-translate-y-full" : "translate-y-0",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Velatura permanente. In cima alla pagina la barra è trasparente per
          scelta, ma sopra una fotografia chiara le voci in `stone` scendono
          sotto soglia: al primo schermo l'hero ha un soffitto illuminato, e
          il menu ci spariva dentro. È un gradiente, non un fondo, e protegge
          anche le fotografie che il cliente manderà.

          I valori sono quelli che portano la voce più debole della barra
          sopra 4.5:1 misurata da scripts/leggibilita.mjs sulla fotografia
          più chiara del corpus, non quelli che «sembravano giusti». */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-linear-to-b from-tuff-deep/96 via-tuff-deep/72 to-transparent"
      />

      {/* Il velo: solo lui porta il backdrop-filter, e solo la sua opacità
          viene animata. Il contenuto della barra non lo tocca mai. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 border-b border-border bg-tuff/92",
          "transition-opacity duration-(--dur-micro) ease-(--ease-soft)",
          // Il filtro viene MONTATO solo quando serve, non solo reso
          // trasparente: un nodo con `backdrop-filter` e opacità 0 costa
          // comunque un passaggio di sfocatura a ogni frame. È anche il modo
          // di restare entro il limite di due filtri attivi insieme quando
          // la tenda del menu è aperta.
          conFondo && !aperto ? "opacity-100 backdrop-blur-xl" : "opacity-0",
        )}
      />

      <div className="shell relative flex h-20 items-center justify-between gap-6">
        <Ancora
          href="/"
          className="underline-grow relative font-display text-h3 leading-none text-cream"
        >
          {tb("nome")}
        </Ancora>

        <nav aria-label={t("menuLabel")} className="hidden items-center gap-8 lg:flex">
          {voci.map((voce) => (
            <Ancora
              key={voce.href}
              href={voce.href}
              className="underline-grow relative font-sans text-label uppercase text-stone hover:text-cream"
            >
              {t(voce.chiave)}
            </Ancora>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <LangSwitch />
          <MenuCurtain voci={voci} aperto={aperto} onCambio={setAperto} />
        </div>
      </div>
    </header>
  );
}
