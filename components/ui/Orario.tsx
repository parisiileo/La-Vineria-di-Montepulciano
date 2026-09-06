"use client";

// Campo orario con pannello proprio.
//
// Stesso problema del calendario: il pannello di `<input type="time">` lo
// disegna il sistema operativo, porta il proprio segnaposto `--:--` e su
// alcune piattaforme impone il formato a 12 ore con AM/PM, che in Italia non
// si usa per prenotare un tavolo.
//
// Due colonne e non un elenco di turni. È una decisione di contenuto, non di
// interfaccia: i turni di servizio non sono confermati dal cliente (vedi
// DA-VERIFICARE.md §3), e offrire «19:30 / 20:00 / 21:30» significherebbe
// pubblicare orari di apertura inventati dentro un menu a tendina, dove
// sembrano ancora più veri. Ore e minuti coprono la giornata intera e non
// affermano niente.
//
// Il valore resta `HH:MM`, come il controllo nativo.

import { useEffect, useRef, useState } from "react";

import {
  ERRORE,
  PANNELLO,
  PANNELLO_SOPRA,
  etichettaCampo,
  guscioCampo,
  versoPannello,
} from "@/components/ui/campo";
import { cn } from "@/lib/utils";

/** Passo dei minuti. Cinque: quarti d'ora sono troppo pochi per un tavolo. */
const PASSO_MINUTI = 5;

const ORE = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTI = Array.from({ length: 60 / PASSO_MINUTI }, (_, i) =>
  String(i * PASSO_MINUTI).padStart(2, "0"),
);

interface OrarioProps {
  label: string;
  /** `HH:MM`, o stringa vuota. */
  value: string;
  onChange: (valore: string) => void;
  error?: string;
  name?: string;
  etichettaApri: string;
  etichettaOre: string;
  etichettaMinuti: string;
}

function Quadrante() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 text-brass">
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.4V8l2.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Colonna({
  voci,
  scelta,
  onScegli,
  etichetta,
}: {
  voci: readonly string[];
  scelta: string;
  onScegli: (v: string) => void;
  etichetta: string;
}) {
  const lista = useRef<HTMLDivElement>(null);

  // La voce scelta viene portata in vista all'apertura: una colonna di
  // ventiquattro ore che si apre sulla mezzanotte è una colonna da scorrere.
  useEffect(() => {
    const attiva = lista.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    attiva?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div
      ref={lista}
      role="listbox"
      aria-label={etichetta}
      className="max-h-56 flex-1 overflow-y-auto overscroll-contain p-1"
    >
      {voci.map((v) => {
        const attiva = v === scelta;
        return (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={attiva}
            onClick={() => onScegli(v)}
            className={cn(
              "flex min-h-11 w-full items-center justify-center rounded-sm font-mono text-field tabular-nums lining-nums",
              "transition-colors duration-(--dur-micro) ease-(--ease-soft)",
              attiva ? "bg-brass text-tuff-deep" : "text-stone hover:bg-brass/12 hover:text-cream",
            )}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function Orario({
  label,
  value,
  onChange,
  error,
  name,
  etichettaApri,
  etichettaOre,
  etichettaMinuti,
}: OrarioProps) {
  const [aperto, setAperto] = useState(false);
  const [verso, setVerso] = useState<"sotto" | "sopra">("sotto");
  const [bozza, setBozza] = useState<string | null>(null);
  const contenitore = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const [ora = "", minuto = ""] = value.split(":");
  const testo = bozza ?? value;

  useEffect(() => {
    if (!aperto) return;
    const fuori = (e: MouseEvent) => {
      if (!contenitore.current?.contains(e.target as Node)) setAperto(false);
    };
    const tasto = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setAperto(false);
      trigger.current?.focus();
    };
    document.addEventListener("mousedown", fuori);
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("mousedown", fuori);
      document.removeEventListener("keydown", tasto);
    };
  }, [aperto]);

  /** Accetta «20», «20:3», «2030», «20.30»: la gente scrive l'ora così. */
  function leggi(grezzo: string): string {
    const cifre = grezzo.replace(/\D/g, "").slice(0, 4);
    if (cifre.length < 3) {
      const h = Number(cifre);
      return cifre.length && h < 24 ? `${String(h).padStart(2, "0")}:00` : "";
    }
    const h = Number(cifre.slice(0, cifre.length - 2));
    const m = Number(cifre.slice(-2));
    if (h > 23 || m > 59) return "";
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function scegli(h: string, m: string) {
    onChange(`${h}:${m}`);
  }

  return (
    <div className={cn("relative", error && "shake")} ref={contenitore}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={testo}
        placeholder="--:--"
        onChange={(e) => setBozza(e.target.value)}
        onBlur={() => {
          if (bozza === null) return;
          onChange(leggi(bozza));
          setBozza(null);
        }}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        className={guscioCampo({
          error,
          aperto,
          className:
            "min-h-(--tap-min) pb-2 pe-14 pt-6 placeholder:text-stone-dim/60 tabular-nums lining-nums",
        })}
      />

      <input type="hidden" name={name} value={value} readOnly />

      <span aria-hidden="true" className={etichettaCampo({ alta: true, attivo: aperto, error })}>
        {label}
      </span>

      <button
        ref={trigger}
        type="button"
        onClick={() => {
          setVerso(versoPannello(contenitore.current, 260));
          setAperto((a) => !a);
        }}
        aria-expanded={aperto}
        aria-label={etichettaApri}
        className="absolute end-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-sm text-brass"
      >
        <Quadrante />
      </button>

      {aperto ? (
        <div className={cn(verso === "sopra" ? PANNELLO_SOPRA : PANNELLO, "flex divide-x divide-border")}>
          <Colonna
            voci={ORE}
            scelta={ora}
            etichetta={etichettaOre}
            onScegli={(h) => scegli(h, minuto || "00")}
          />
          <Colonna
            voci={MINUTI}
            scelta={minuto}
            etichetta={etichettaMinuti}
            onScegli={(m) => scegli(ora || "20", m)}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className={ERRORE}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
