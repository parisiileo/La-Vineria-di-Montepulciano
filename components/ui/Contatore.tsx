"use client";

// Contatore per i numeri piccoli e limitati: quanti siete a tavola.
//
// `<input type="number">` porta due frecce di sistema alte otto pixel — non
// tappabili col pollice, non stilizzabili, e su Firefox di forma diversa che
// su Chrome. Per un valore che nella pratica va da due a sei, due bottoni
// grandi sono più rapidi della tastiera e molto più rapidi delle frecce.
//
// Il campo resta scrivibile: chi è in dodici non deve premere dieci volte.

import { ERRORE, etichettaCampo, guscioCampo } from "@/components/ui/campo";
import { cn } from "@/lib/utils";

interface ContatoreProps {
  label: string;
  value: number;
  onChange: (valore: number) => void;
  min: number;
  max: number;
  error?: string;
  name?: string;
  etichettaMeno: string;
  etichettaPiu: string;
}

function Segno({ piu }: { piu?: boolean }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3">
      <path
        d={piu ? "M6 1.5v9M1.5 6h9" : "M1.5 6h9"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Contatore({
  label,
  value,
  onChange,
  min,
  max,
  error,
  name,
  etichettaMeno,
  etichettaPiu,
}: ContatoreProps) {
  const limita = (n: number) => Math.min(max, Math.max(min, n));

  const bottone =
    "grid size-11 shrink-0 place-items-center rounded-sm border border-border-control text-cream " +
    "transition-colors duration-(--dur-micro) ease-(--ease-soft) " +
    "hover:border-border-hover hover:text-brass disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className={cn("relative", error && "shake")}>
      <div
        className={guscioCampo({
          error,
          className: "flex min-h-(--tap-min) items-center gap-3 pb-2 pe-2 pt-6",
        })}
      >
        {/* `type="text"` con `inputMode="numeric"`: il tipo numerico
            porterebbe con sé le frecce native, che è ciò che questo
            componente esiste per sostituire. La validazione la fanno i
            limiti, non il tipo del campo. */}
        <input
          type="text"
          inputMode="numeric"
          name={name}
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ""));
            if (Number.isFinite(n)) onChange(limita(n || min));
          }}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          // Nessun `outline-none`: il campo riempie il riquadro e l'anello di
          // focus è l'unica cosa che dice a chi naviga da tastiera dove si
          // trova. Toglierlo per estetica costa più di quanto renda.
          className="w-full min-w-0 bg-transparent tabular-nums lining-nums"
        />

        <button
          type="button"
          onClick={() => onChange(limita(value - 1))}
          disabled={value <= min}
          aria-label={etichettaMeno}
          className={bottone}
        >
          <Segno />
        </button>
        <button
          type="button"
          onClick={() => onChange(limita(value + 1))}
          disabled={value >= max}
          aria-label={etichettaPiu}
          className={bottone}
        >
          <Segno piu />
        </button>
      </div>

      <span aria-hidden="true" className={etichettaCampo({ alta: true, error })}>
        {label}
      </span>

      {error ? (
        <p role="alert" className={ERRORE}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
