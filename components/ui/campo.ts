// Il guscio condiviso di ogni campo.
//
// Esiste perché i campi di questo sito non sono tutti `<input>`: la data è un
// calendario, l'orario è una coppia di colonne, gli ospiti sono un contatore.
// Se ognuno portasse le proprie classi, il giorno in cui il bordo cambia
// cambierebbe in quattro posti su cinque — e il quinto si noterebbe solo in
// produzione.
//
// Qui c'è solo l'aspetto: bordo, fondo, stati, etichetta flottante. Il
// comportamento vive nei singoli componenti.

import { cn } from "@/lib/utils";

/** Il riquadro del campo. `aperto` vale per i controlli con un pannello. */
export function guscioCampo({
  error,
  aperto = false,
  disabled = false,
  className,
}: {
  error?: string;
  aperto?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return cn(
    // 16px esatti: sotto questa soglia iOS zooma al focus. Non è estetica.
    "w-full rounded-sm border bg-tuff-light px-4 text-field text-cream",
    "transition-[border-color,box-shadow] duration-(--dur-micro) ease-(--ease-soft)",
    "disabled:cursor-not-allowed disabled:opacity-40",
    error
      ? "border-error shadow-(--glow-error)"
      : aperto
        ? "border-brass shadow-(--glow-focus)"
        : "border-border-control hover:border-border-hover",
    disabled && "cursor-not-allowed opacity-40",
    className,
  );
}

/** L'etichetta flottante, nelle due posizioni. */
export function etichettaCampo({
  alta,
  attivo,
  error,
}: {
  alta: boolean;
  attivo?: boolean;
  error?: string;
}) {
  return cn(
    "pointer-events-none absolute start-4 origin-left text-stone-dim",
    "transition-[transform,color] duration-(--dur-micro) ease-(--ease-soft)",
    alta ? "top-2 scale-(--label-scale)" : "top-1/2 -translate-y-1/2",
    attivo && !error && "text-brass",
    error && "text-error",
  );
}

/** Il pannello sospeso di calendario e orario. */
export const PANNELLO =
  "absolute inset-x-0 top-[calc(100%+0.5rem)] z-(--z-overlay) overflow-hidden rounded-sm border border-border bg-tuff-raised shadow-(--glow-brass)";

/** Messaggio d'errore, identico ovunque. */
export const ERRORE = "mt-2 font-sans text-mono text-error";

/**
 * Da che parte si apre il pannello.
 *
 * Sotto, quasi sempre. Sopra quando sotto non ci sta — e «non ci sta» include
 * la barra fissa mobile, che non è parte del viewport ma copre lo stesso
 * l'ultimo pezzo: un selettore d'orario la cui metà inferiore finisce dietro
 * «CHIAMA» è un selettore che non si usa.
 *
 * La misura si fa all'apertura e non al montaggio: fra i due momenti la
 * pagina è scorsa, e la stessa domanda ha una risposta diversa.
 */
export const ALTEZZA_BARRA_MOBILE = 64;

export function versoPannello(
  ancora: HTMLElement | null,
  altezzaStimata: number,
): "sotto" | "sopra" {
  if (!ancora) return "sotto";
  const box = ancora.getBoundingClientRect();
  const barra = window.matchMedia("(max-width: 767px)").matches ? ALTEZZA_BARRA_MOBILE : 0;
  const sotto = window.innerHeight - barra - box.bottom;
  const sopra = box.top;
  return sotto < altezzaStimata && sopra > sotto ? "sopra" : "sotto";
}

/** Il pannello ancorato sopra, invece che sotto. */
export const PANNELLO_SOPRA =
  "absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-(--z-overlay) overflow-hidden rounded-sm border border-border bg-tuff-raised shadow-(--glow-brass)";
