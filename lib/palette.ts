// Specchio in TypeScript dei token cromatici di app/globals.css.
// Esiste solo perché il contrasto va calcolato, non stimato: senza i valori
// in JS la kitchen-sink stamperebbe numeri scritti a mano.
// La parità con il CSS non è affidata alla buona volontà: `npm run audit`
// rilegge globals.css e fallisce se le due liste divergono di un solo byte.

import type { Hex } from "./contrast";

export const PALETTE = {
  "tuff-deep": "#14100D",
  tuff: "#1A1512",
  "tuff-light": "#241D18",
  "tuff-raised": "#2E2620",
  "wine-deep": "#4A0E1C",
  wine: "#7B1E2B",
  "wine-lit": "#93283A",
  brass: "#B08D57",
  "brass-dim": "#8A6E43",
  cream: "#F4EFE6",
  stone: "#C9BFB2",
  "stone-dim": "#9B9086",
  error: "#D4736A",
} as const satisfies Record<string, Hex>;

export type ColorToken = keyof typeof PALETTE;

/** Le superfici su cui può cadere del testo. Ogni coppia va verificata. */
export const SURFACES = ["tuff-deep", "tuff", "tuff-light", "tuff-raised"] as const;

/**
 * Coppie che il design system garantisce, con la soglia richiesta.
 * `3` significa che quel token è ammesso solo su testo grande (≥24px, o
 * ≥18.66px bold) oppure su elementi non testuali.
 */
export const CONTRACT: readonly {
  fg: ColorToken;
  bg: ColorToken;
  min: 4.5 | 3;
  /** Ruolo, come chiave leggibile: compare nella kitchen-sink. */
  ruolo: string;
}[] = [
  { fg: "cream", bg: "tuff", min: 4.5, ruolo: "Testo primario" },
  { fg: "cream", bg: "tuff-deep", min: 4.5, ruolo: "Testo primario" },
  { fg: "cream", bg: "tuff-light", min: 4.5, ruolo: "Testo primario" },
  { fg: "cream", bg: "tuff-raised", min: 4.5, ruolo: "Testo primario" },
  { fg: "stone", bg: "tuff", min: 4.5, ruolo: "Testo secondario" },
  { fg: "stone", bg: "tuff-light", min: 4.5, ruolo: "Testo secondario" },
  { fg: "stone", bg: "tuff-raised", min: 4.5, ruolo: "Testo secondario" },
  { fg: "stone-dim", bg: "tuff", min: 4.5, ruolo: "Label e terziario" },
  { fg: "stone-dim", bg: "tuff-light", min: 4.5, ruolo: "Label e terziario" },
  { fg: "stone-dim", bg: "tuff-raised", min: 4.5, ruolo: "Label e terziario" },
  { fg: "brass", bg: "tuff", min: 4.5, ruolo: "Testo di accento" },
  { fg: "brass", bg: "tuff-light", min: 4.5, ruolo: "Testo di accento" },
  { fg: "brass", bg: "tuff-raised", min: 4.5, ruolo: "Testo di accento" },
  { fg: "brass-dim", bg: "tuff", min: 3, ruolo: "Bordi e filetti (non-testo)" },
  { fg: "brass-dim", bg: "tuff-raised", min: 3, ruolo: "Bordi e filetti (non-testo)" },
  { fg: "cream", bg: "wine", min: 4.5, ruolo: "CTA primaria" },
  { fg: "cream", bg: "wine-lit", min: 4.5, ruolo: "CTA primaria in hover" },
  { fg: "cream", bg: "wine-deep", min: 4.5, ruolo: "CTA su fondo profondo" },
  { fg: "brass", bg: "wine", min: 3, ruolo: "Accento su vino (solo display)" },
  { fg: "error", bg: "tuff", min: 4.5, ruolo: "Messaggio di errore" },
  { fg: "error", bg: "tuff-light", min: 4.5, ruolo: "Errore sul campo" },
  { fg: "tuff-deep", bg: "brass", min: 4.5, ruolo: "Testo su pillola ottone" },
];

/**
 * Bordi: colore, alpha e fondo peggiore su cui compaiono.
 * WCAG 1.4.11 chiede 3:1 per il confine dei controlli; i filetti puramente
 * decorativi sono esenti e qui sono dichiarati tali.
 */
export const BORDERS: readonly {
  nome: string;
  fg: ColorToken;
  alpha: number;
  bg: ColorToken;
  /** `false` = decorativo, escluso da 1.4.11 per contratto. */
  richiede3: boolean;
}[] = [
  { nome: "--color-border", fg: "stone", alpha: 0.1, bg: "tuff", richiede3: false },
  { nome: "--color-border-control", fg: "stone", alpha: 0.52, bg: "tuff-raised", richiede3: true },
  { nome: "--color-border-hover", fg: "brass", alpha: 0.75, bg: "tuff-raised", richiede3: true },
];
