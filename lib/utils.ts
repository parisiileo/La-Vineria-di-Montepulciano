// Utility trasversali minime: composizione di classi e helper di formato.

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Le dimensioni tipografiche del progetto, come le conosce `tailwind-merge`.
 *
 * Senza questo elenco `cn()` CANCELLA IN SILENZIO il corpo del testo.
 * `tailwind-merge` risolve i conflitti per gruppo, e non sa niente dei token
 * dichiarati in `@theme`: davanti a `text-hero text-brass` non vede una
 * dimensione e un colore, vede due classi `text-*` dello stesso gruppo, e
 * tiene solo l'ultima. Il colore vince sempre, perché il colore si scrive
 * sempre dopo.
 *
 * L'effetto non produce nessun errore e nessun avviso: il testo esce
 * semplicemente al corpo del body. Il numero civico 101 del dittico, che
 * dovrebbe essere alto 108px e sbordare dalla fotografia, era diventato una
 * scritta di 17px appoggiata all'angolo. Trovato guardando lo scatto, non
 * leggendo il codice — dal codice quella riga è corretta.
 *
 * L'elenco deve restare allineato ai token `--text-*` di app/globals.css:
 * la parità è verificata in scripts/audit.mjs.
 */
export const CORPI_TESTO = [
  "hero",
  "h2",
  "h3",
  "lead",
  "body",
  "label",
  "mono",
  "field",
] as const;

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: [...CORPI_TESTO] }] } },
});

/** Compone classi Tailwind risolvendo i conflitti a favore dell'ultima. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Colore del tema per la meta tag `theme-color` e per i manifest.
 * Deve rispecchiare `--color-tuff` in app/globals.css: la sorgente di verità
 * resta il CSS, questa è la sola copia ammessa e va aggiornata insieme.
 */
export const THEME_COLOR = "#1A1512";
