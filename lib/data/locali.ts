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
  orari: Orari | null;
  coordinate: { lat: number; lng: number } | null;
  /**
   * Telefono proprio della sede, se diverso da quello principale.
   * Il 72 ne ha uno suo: mandare tutti sul 101 significa far squillare la
   * sala sbagliata.
   */
  telefono: string;
  telefonoHref: string;
}

/**
 * Orari di apertura. `giorni` usa la numerazione di `Date.getDay()` in
 * Europe/Rome — 0 domenica — e ogni fascia è una coppia di minuti dalla
 * mezzanotte, così una chiusura dopo le 24 si esprime senza casi speciali.
 */
export interface Fascia {
  giorni: readonly number[];
  /** Minuti dalla mezzanotte. 1140 = 19:00. */
  apre: number;
  /** Minuti dalla mezzanotte, anche oltre 1440 per le chiusure a notte. */
  chiude: number;
}

export type Orari = readonly Fascia[];

/** Telefono principale: è quello della sala al 101, ed è quello che compare
 *  nella barra fissa e nell'hero. */
export const TELEFONO = "+39 0578 850153" as const;
export const TELEFONO_HREF = "tel:+390578850153" as const;

/**
 * Prenotazione esterna. `null` finché il cliente non conferma il proprio
 * profilo: un link a una scheda sbagliata manda le prenotazioni a un altro
 * ristorante, ed è peggio di nessun link.
 * TODO: verificare col cliente — URL del profilo TheFork.
 */
export const THEFORK_URL: string | null = null;

/**
 * Profili social. Vuoto finché non sono confermati gli account ufficiali:
 * i cloni esistono, e linkarne uno è un danno reputazionale.
 * TODO: verificare col cliente — Instagram, Facebook, TripAdvisor.
 */
export const SOCIAL: readonly { nome: string; url: string }[] = [];

/** TODO: verificare col cliente — partita IVA e ragione sociale. */
export const PARTITA_IVA: string | null = null;

/**
 * Valutazione media dichiarata nel brief dello Step 04.
 * Non è stata verificata su nessuna fonte: resta qui, in un solo posto, per
 * poter essere corretta o rimossa con una riga. Vedi DA-VERIFICARE.md.
 * TODO: verificare col cliente — media e numero di recensioni, e su quale
 * piattaforma sono contate.
 */
export const VALUTAZIONE_DA_VERIFICARE = true;

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
    telefono: TELEFONO,
    telefonoHref: TELEFONO_HREF,
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
    // Numero proprio del 72, trovato sul sito del cliente allo Step 02.
    telefono: "+39 0578 850195",
    telefonoHref: "tel:+390578850195",
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

/**
 * Query di indirizzo per le mappe. È costruita dai campi dell'indirizzo e non
 * da coordinate: le coordinate non sono confermate, l'indirizzo sì, e una
 * ricerca per indirizzo porta alla porta giusta senza inventare un punto.
 */
export function queryIndirizzo(sede: Locale): string {
  return `${sede.via} ${sede.civico}, ${sede.cap} ${sede.citta} ${sede.provincia}, Italia`;
}

/** Google Maps e Apple Maps, entrambe per ricerca d'indirizzo. */
export function linkMappe(sede: Locale) {
  const q = encodeURIComponent(queryIndirizzo(sede));
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: `https://maps.apple.com/?q=${q}`,
  };
}

export type StatoApertura = "aperto" | "chiuso" | "sconosciuto";

/**
 * Stato di apertura al momento indicato, nel fuso di Montepulciano.
 *
 * Il fuso è imposto con `Intl` e non letto dall'orologio del visitatore:
 * chi guarda il sito da Chicago deve leggere se la sala è aperta ADESSO a
 * Montepulciano, non se lo sarebbe alla sua ora.
 *
 * Senza orari confermati restituisce `sconosciuto`, e l'interfaccia dice di
 * chiamare. Non esiste un ramo che tiri a indovinare.
 */
export function statoApertura(orari: Orari | null, adesso: Date = new Date()): StatoApertura {
  if (!orari || orari.length === 0) return "sconosciuto";

  const parti = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(adesso);
  const trova = (tipo: string) => parti.find((p) => p.type === tipo)?.value ?? "";
  const GIORNI = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const giorno = GIORNI.indexOf(trova("weekday"));
  const minuti = Number(trova("hour")) * 60 + Number(trova("minute"));
  if (giorno < 0) return "sconosciuto";

  const ieri = (giorno + 6) % 7;
  for (const fascia of orari) {
    // Fascia del giorno corrente.
    if (fascia.giorni.includes(giorno) && minuti >= fascia.apre && minuti < fascia.chiude) {
      return "aperto";
    }
    // Coda di una fascia iniziata ieri e finita dopo la mezzanotte.
    if (fascia.chiude > 1440 && fascia.giorni.includes(ieri) && minuti + 1440 < fascia.chiude) {
      return "aperto";
    }
  }
  return "chiuso";
}
