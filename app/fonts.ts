// Definizione dei tre caratteri, self-hosted. I file .woff2 sono varianti
// variabili con subset latin: un file per famiglia e stile, 160KB in tutto.

import localFont from "next/font/local";

/** Display editoriale. Cormorant Garamond: fallback dichiarato dello spec,
 *  usato perche il cliente non ha licenza Ogg ne Canela. Vedi DESIGN_NOTES §4. */
export const cormorant = localFont({
  src: [
    { path: "./fonts/CormorantGaramond-Variable.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/CormorantGaramond-VariableItalic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  preload: true,
});

/** Grottesco neutro per corpo e interfaccia. */
export const inter = localFont({
  src: [{ path: "./fonts/Inter-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: true,
});

/** Accento numerico: civici, annate, prezzi, numerazione delle sezioni.
 *  Nessun adjustFontFallback: sostituire le metriche di un mono con quelle di
 *  Arial peggiorerebbe lo scarto invece di ridurlo. */
export const jetbrains = localFont({
  src: [{ path: "./fonts/JetBrainsMono-Variable.woff2", weight: "100 800", style: "normal" }],
  variable: "--font-jetbrains",
  display: "swap",
  adjustFontFallback: false,
  preload: false,
});

export const fontVariables = `${cormorant.variable} ${inter.variable} ${jetbrains.variable}`;
