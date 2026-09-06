"use client";

// Campo data con calendario proprio.
//
// Il `<input type="date">` nativo è l'unico controllo del sito che non
// obbediva al design system, e non per pigrizia: il suo pannello è disegnato
// dal sistema operativo e non è stilizzabile in nessun modo. Su un sito che
// ha calibrato il nero delle fotografie, un calendario azzurro di Chrome è
// una finestra su un'altra applicazione. Portava anche il proprio segnaposto
// di formato — «mm/dd/yyyy» — nella lingua del BROWSER, non in quella della
// pagina: su un sito italiano visitato da un telefono inglese, la data si
// chiedeva in inglese.
//
// Il valore resta nel formato ISO `YYYY-MM-DD`, lo stesso del controllo
// nativo: lo schema del server non cambia di una riga.
//
// Accessibilità: il pannello è una griglia navigabile da tastiera con le
// frecce, PagSu/PagGiù cambiano mese, Esc chiude e restituisce il focus. Il
// giorno corrente ha un anello, quello scelto il pieno d'ottone. Chi non apre
// il pannello può comunque scrivere la data: sotto c'è un campo di testo
// vero, non un bottone travestito.

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";

import {
  ERRORE,
  PANNELLO,
  PANNELLO_SOPRA,
  etichettaCampo,
  guscioCampo,
  versoPannello,
} from "@/components/ui/campo";
import { cn } from "@/lib/utils";

const GIORNI_GRIGLIA = 42; // 6 righe da 7: il mese più lungo ci sta sempre

interface CalendarioProps {
  label: string;
  /** `YYYY-MM-DD`, o stringa vuota. */
  value: string;
  onChange: (valore: string) => void;
  error?: string;
  /** Nessuna data prima di oggi: una prenotazione per ieri non esiste. */
  minOggi?: boolean;
  name?: string;
  etichettaMesePrecedente: string;
  etichettaMeseSuccessivo: string;
  etichettaApri: string;
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const daIso = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

function Freccia({ verso }: { verso: "sinistra" | "destra" }) {
  return (
    <svg viewBox="0 0 8 12" aria-hidden="true" className="size-3">
      <path
        d={verso === "sinistra" ? "M6.5 1 1.5 6l5 5" : "M1.5 1 6.5 6l-5 5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Glifo del calendario. È funzionale: dice che il campo apre un pannello. */
function Griglia() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 text-brass">
      <rect x="1.5" y="3" width="13" height="11.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function Calendario({
  label,
  value,
  onChange,
  error,
  minOggi = true,
  name,
  etichettaMesePrecedente,
  etichettaMeseSuccessivo,
  etichettaApri,
}: CalendarioProps) {
  const locale = useLocale();
  const [aperto, setAperto] = useState(false);
  const [verso, setVerso] = useState<"sotto" | "sopra">("sotto");
  const [fuoco, setFuoco] = useState<Date>(() => daIso(value) ?? new Date());
  const contenitore = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const griglia = useRef<HTMLDivElement>(null);

  const scelto = daIso(value);
  const oggi = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // I nomi di mesi e giorni arrivano da Intl con la lingua ATTIVA della
  // pagina, non con quella del browser: è la differenza che il controllo
  // nativo non sapeva fare.
  const nomeMese = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long" }).format(fuoco),
    [locale, fuoco],
  );
  const iniziali = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2024-01-01 è un lunedì: la settimana comincia di lunedì in italiano
    // come in inglese britannico, e partire dalla domenica sarebbe una
    // convenzione americana importata.
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i)).slice(0, 2));
  }, [locale]);
  /**
   * Ordine dei campi nella data breve della lingua attiva.
   *
   * Non è una tabella scritta a mano: `formatToParts` dice come quella lingua
   * scrive una data, e da lì si ricava sia il segnaposto sia il modo di
   * leggere ciò che l'utente digita. È la ragione per cui in italiano il
   * campo chiede `gg/mm/aaaa` e in inglese `dd/mm/yyyy` — e perché
   * `03/04` non viene interpretato al contrario.
   */
  const formato = useMemo(() => {
    const parti = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(new Date(2024, 2, 5));
    const ordine = parti.filter((p) => p.type !== "literal").map((p) => p.type);
    const segnaposto = parti
      .map((p) =>
        p.type === "day"
          ? locale === "it"
            ? "gg"
            : "dd"
          : p.type === "month"
            ? "mm"
            : p.type === "year"
              ? locale === "it"
                ? "aaaa"
                : "yyyy"
              : p.value,
      )
      .join("");
    return { ordine, segnaposto };
  }, [locale]);

  const inChiaro = useMemo(
    () =>
      scelto
        ? new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(scelto)
        : "",
    [locale, scelto],
  );

  // Il testo mostrato: quello che l'utente sta scrivendo mentre scrive, la
  // data formattata quando ha finito.
  const [bozza, setBozza] = useState<string | null>(null);
  const testo = bozza ?? inChiaro;

  /** Legge ciò che è stato digitato secondo l'ordine della lingua attiva. */
  function leggi(grezzo: string): string | null {
    const n = grezzo.match(/\d+/g);
    if (!n || n.length < 3) return null;
    const campi: Record<string, number> = {};
    formato.ordine.forEach((tipo, i) => {
      campi[tipo] = Number(n[i]);
    });
    const { month, day } = campi as { month: number; day: number };
    let { year } = campi as { year: number };
    if (!year || !month || !day) return null;
    // Due cifre significano gli anni Duemila: nessuno prenota per il 1926.
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    // Il giro completo smaschera il 31 febbraio: se la data rientra diversa
    // da come è stata scritta, non esisteva.
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return iso(d);
  }

  const primo = new Date(fuoco.getFullYear(), fuoco.getMonth(), 1);
  // `getDay()` dà 0 per domenica: qui la griglia parte di lunedì.
  const scarto = (primo.getDay() + 6) % 7;
  const celle = Array.from({ length: GIORNI_GRIGLIA }, (_, i) => {
    const d = new Date(primo);
    d.setDate(1 - scarto + i);
    return d;
  });

  const passato = (d: Date) => minOggi && d < oggi;

  // Chiusura al clic fuori e con Esc, col focus che torna al trigger.
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

  // Il focus entra nella griglia all'apertura e insegue il giorno a fuoco:
  // senza, le frecce muovono la pagina invece del calendario.
  useEffect(() => {
    if (!aperto) return;
    const bersaglio = griglia.current?.querySelector<HTMLElement>('[data-fuoco="true"]');
    bersaglio?.focus();
  }, [aperto, fuoco]);

  function muovi(giorni: number) {
    const d = new Date(fuoco);
    d.setDate(d.getDate() + giorni);
    setFuoco(d);
  }

  function tastiera(e: React.KeyboardEvent) {
    const passi: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (e.key in passi) {
      e.preventDefault();
      muovi(passi[e.key]);
      return;
    }
    if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      const d = new Date(fuoco);
      d.setMonth(d.getMonth() + (e.key === "PageUp" ? -1 : 1));
      setFuoco(d);
      return;
    }
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const giornoSettimana = (fuoco.getDay() + 6) % 7;
      muovi(e.key === "Home" ? -giornoSettimana : 6 - giornoSettimana);
    }
  }

  function scegli(d: Date) {
    if (passato(d)) return;
    onChange(iso(d));
    setAperto(false);
    trigger.current?.focus();
  }

  return (
    <div className={cn("relative", error && "shake")} ref={contenitore}>
      {/* Il campo vero. Chi preferisce scrivere scrive; il pannello è un
          aiuto, non l'unico modo di rispondere alla domanda. */}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={testo}
        placeholder={formato.segnaposto}
        onChange={(e) => setBozza(e.target.value)}
        onBlur={() => {
          if (bozza === null) return;
          const letta = leggi(bozza);
          onChange(letta ?? "");
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

      {/* Il valore ISO viaggia in un campo nascosto: è ciò che la rotta si
          aspetta, e non è ciò che ha senso mostrare a un essere umano. */}
      <input type="hidden" name={name} value={value} readOnly />

      <span aria-hidden="true" className={etichettaCampo({ alta: true, attivo: aperto, error })}>
        {label}
      </span>

      <button
        ref={trigger}
        type="button"
        onClick={() => {
          setVerso(versoPannello(contenitore.current, 400));
          setAperto((a) => !a);
        }}
        aria-expanded={aperto}
        aria-label={etichettaApri}
        className="absolute end-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-sm text-brass"
      >
        <Griglia />
      </button>

      {aperto ? (
        <div className={cn(verso === "sopra" ? PANNELLO_SOPRA : PANNELLO, "p-4")} role="dialog" aria-label={label}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={etichettaMesePrecedente}
              onClick={() => {
                const d = new Date(fuoco);
                d.setMonth(d.getMonth() - 1);
                setFuoco(d);
              }}
              className="grid size-11 place-items-center rounded-sm text-stone hover:text-brass"
            >
              <Freccia verso="sinistra" />
            </button>

            <p className="flex items-baseline gap-2">
              <span className="font-display text-h3 capitalize text-cream">{nomeMese}</span>
              <span className="font-mono text-mono tabular-nums lining-nums text-brass">
                {fuoco.getFullYear()}
              </span>
            </p>

            <button
              type="button"
              aria-label={etichettaMeseSuccessivo}
              onClick={() => {
                const d = new Date(fuoco);
                d.setMonth(d.getMonth() + 1);
                setFuoco(d);
              }}
              className="grid size-11 place-items-center rounded-sm text-stone hover:text-brass"
            >
              <Freccia verso="destra" />
            </button>
          </div>

          <div aria-hidden="true" className="mb-2 grid grid-cols-7 gap-1">
            {iniziali.map((g, i) => (
              <span
                key={i}
                className="grid h-8 place-items-center font-mono text-mono uppercase text-stone-dim"
              >
                {g}
              </span>
            ))}
          </div>

          <div ref={griglia} role="grid" onKeyDown={tastiera} className="grid grid-cols-7 gap-1">
            {celle.map((d) => {
              const altroMese = d.getMonth() !== fuoco.getMonth();
              const eScelto = scelto ? iso(d) === iso(scelto) : false;
              const eOggi = iso(d) === iso(oggi);
              const inFuoco = iso(d) === iso(fuoco);
              const bloccato = passato(d);
              return (
                <button
                  key={iso(d)}
                  type="button"
                  role="gridcell"
                  data-fuoco={inFuoco}
                  tabIndex={inFuoco ? 0 : -1}
                  disabled={bloccato}
                  aria-selected={eScelto}
                  aria-current={eOggi ? "date" : undefined}
                  onClick={() => scegli(d)}
                  className={cn(
                    "grid h-10 place-items-center rounded-sm font-mono text-mono tabular-nums lining-nums",
                    "transition-colors duration-(--dur-micro) ease-(--ease-soft)",
                    bloccato && "cursor-not-allowed opacity-25",
                    altroMese ? "text-stone-dim/60" : "text-stone",
                    !bloccato && !eScelto && "hover:bg-brass/12 hover:text-cream",
                    eOggi && !eScelto && "ring-1 ring-brass-dim",
                    eScelto && "bg-brass text-tuff-deep",
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
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
