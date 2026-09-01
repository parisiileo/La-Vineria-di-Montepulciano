// Tipi della carta e struttura delle sezioni. I contenuti reali arrivano
// dal cliente nello Step 4: qui non viene inventato nessun piatto e nessun prezzo.

/** Prezzo in centesimi di euro: mai float, si formatta in `formatPrezzo`. */
export type Centesimi = number;

export interface Voce {
  id: string;
  /** Chiave i18n del nome del piatto o del vino. */
  nomeKey: string;
  /** Chiave i18n della descrizione, opzionale. */
  descrizioneKey?: string;
  /** `null` finché il listino non è confermato. */
  prezzo: Centesimi | null;
  /** Annata, per i vini. Si compone in mono. */
  annata?: number;
  allergeni?: readonly string[];
}

export interface SezioneCarta {
  id: string;
  /** Numerazione documentaria della sezione, composta in mono. */
  numero: string;
  titoloKey: string;
  voci: readonly Voce[];
}

/**
 * Scheletro della carta. Le sezioni sono confermate come struttura,
 * le voci no.
 * TODO: verificare col cliente — carta completa, prezzi e allergeni.
 */
export const CARTA: readonly SezioneCarta[] = [];

/** Formatta un prezzo in euro secondo la locale attiva. */
export function formatPrezzo(centesimi: Centesimi, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: centesimi % 100 === 0 ? 0 : 2,
  }).format(centesimi / 100);
}
