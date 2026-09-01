// Dati delle due sedi. Sorgente unica per contatti, indirizzi e schema.org.
// Regola di progetto: nessun dato inventato su un'attività reale.
// Ogni campo non confermato è marcato e vale `null`, non un valore plausibile.

/** Chiave i18n: il testo visibile vive in messages/{locale}.json, non qui. */
export type MessageKey = string;

export interface Locale {
  /** Identificatore stabile, usato negli anchor e nelle chiavi i18n. */
  id: "gracciano-101" | "gracciano-72";
  /** Numero civico: si compone in mono, è un dato documentario. */
  civico: string;
  via: string;
  cap: string;
  citta: string;
  provincia: string;
  paese: string;
  /** Chiave i18n del nome d'uso del locale. */
  nomeKey: MessageKey;
  /** Chiave i18n della descrizione breve. */
  sommarioKey: MessageKey;
  /** Tratti distintivi confermati dal cliente, come chiavi i18n. */
  trattiKeys: MessageKey[];
  /** `null` finché il cliente non conferma gli orari reali. */
  orari: null;
  coordinate: { lat: number; lng: number } | null;
}

export const TELEFONO = "+39 0578 850153" as const;
export const TELEFONO_HREF = "tel:+390578850153" as const;

/** Etichetta di produzione propria della famiglia Ercolani. */
export const ETICHETTA_PROPRIA = "Il Brillo" as const;

export const LOCALI: readonly Locale[] = [
  {
    id: "gracciano-101",
    civico: "101",
    via: "Via di Gracciano nel Corso",
    cap: "53045",
    citta: "Montepulciano",
    provincia: "SI",
    paese: "IT",
    nomeKey: "locali.gracciano101.nome",
    sommarioKey: "locali.gracciano101.sommario",
    trattiKeys: ["locali.gracciano101.tratti.cantina", "locali.gracciano101.tratti.tunnel"],
    // TODO: verificare col cliente — orari reali della sede al 101
    orari: null,
    // TODO: verificare col cliente — coordinate esatte dell'ingresso
    coordinate: null,
  },
  {
    id: "gracciano-72",
    civico: "72",
    via: "Via di Gracciano nel Corso",
    cap: "53045",
    citta: "Montepulciano",
    provincia: "SI",
    paese: "IT",
    nomeKey: "locali.gracciano72.nome",
    sommarioKey: "locali.gracciano72.sommario",
    trattiKeys: ["locali.gracciano72.tratti.pozzo", "locali.gracciano72.tratti.vetro"],
    // TODO: verificare col cliente — orari reali della sede al 72
    orari: null,
    // TODO: verificare col cliente — coordinate esatte dell'ingresso
    coordinate: null,
  },
] as const;

/**
 * Fatti sotterranei. Sono il cuore del concetto verticale del sito, quindi
 * sono anche i più pericolosi da approssimare: una misura sbagliata pubblicata
 * su un'attività reale è un danno, non un dettaglio.
 */
export const SOTTOSUOLO = {
  /** Confermato: la cantina è scavata in tunnel medievali ed è visitabile. */
  tunnelVisitabili: true,
  // TODO: verificare col cliente — profondità in metri dei tunnel
  profonditaMetri: null,
  // TODO: verificare col cliente — estensione/sviluppo lineare dei tunnel
  estensioneMetri: null,
  // TODO: verificare col cliente — il tour della cantina è gratuito?
  tourGratuito: null,
  /** Confermato: pozzo medievale sotto pavimento di vetro, sede al 72. */
  pozzoSottoVetro: true,
} as const;

/**
 * Storia dell'attività.
 * TODO: verificare col cliente — anno di fondazione. Nessun anno viene
 * pubblicato finché non è confermato: meglio nessuna data che una falsa.
 */
export const ANNO_FONDAZIONE: number | null = null;

/**
 * TODO: verificare col cliente — esistenza, indirizzo e stato della sede di
 * Cortona. Finché è `false` nessuna interfaccia la menziona.
 */
export const SEDE_CORTONA_CONFERMATA = false;
