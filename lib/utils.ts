// Utility trasversali minime: composizione di classi e helper di formato.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
