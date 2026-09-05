// Token di movimento condivisi da tutti i componenti animati.
// Nessun componente definisce mai easing, durata o molla inline: si importa da qui.

/**
 * Curve. Sono quattro perché il sito ha quattro registri di movimento distinti,
 * non perché quattro sia un numero elegante.
 *
 * out    expo-out. Entrate e reveal: parte veloce, si posa senza rimbalzo.
 * inOut  transizioni bidirezionali (apertura/chiusura), simmetriche.
 * soft   hover e micro-interazioni: reattiva ma non nervosa.
 * drift  materia lenta e pesante — scena 3D, parallasse. Accelera tardi e
 *        decelera a lungo: è il profilo di qualcosa che ha massa.
 */
type Cubic = [number, number, number, number];

export const ease = {
  out: [0.16, 1, 0.3, 1] as Cubic,
  inOut: [0.65, 0, 0.35, 1] as Cubic,
  soft: [0.22, 1, 0.36, 1] as Cubic,
  drift: [0.33, 0, 0.15, 1] as Cubic,
} as const;

/** Rappresentazione CSS delle stesse curve, per le transizioni non-Framer. */
export const easeCss = {
  out: "var(--ease-out)",
  inOut: "var(--ease-inout)",
  soft: "var(--ease-soft)",
  drift: "var(--ease-drift)",
} as const;

/** Durate in secondi (unità di Framer Motion). I gemelli in ms sono in globals.css. */
export const duration = {
  micro: 0.2, // hover, focus
  base: 0.6, // reveal
  slow: 1.1, // entrate di sezione, overlay
  drift: 2.2, // movimenti ambientali
} as const;

/**
 * Molle. `heavy` esiste per lo stesso motivo di `drift`: nel sito convivono
 * due velocità, le interazioni (rapide, reattive) e la materia (lenta, con
 * inerzia). La pietra non scatta.
 */
export const spring = {
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  soft: { type: "spring", stiffness: 150, damping: 15 },
  layout: { type: "spring", stiffness: 350, damping: 30 },
  heavy: { type: "spring", stiffness: 90, damping: 22 },
} as const;

/** Sfasamenti di sequenza, in secondi. */
export const stagger = {
  tight: 0.06,
  base: 0.08,
  loose: 0.12,
} as const;

/**
 * Scala di partenza dell'immagine dentro RevealImage: entra piu grande e si
 * posa. Gemello di --foto-scala-ingresso in globals.css, la parita e
 * verificata in scripts/audit.mjs.
 */
export const scalaIngressoFoto = 1.08;

/** Margine di ingresso condiviso da tutti i reveal legati allo scroll. */
export const viewportOnce = { once: true, margin: "-12% 0px" } as const;

export type EaseToken = keyof typeof ease;
export type DurationToken = keyof typeof duration;
export type SpringToken = keyof typeof spring;
