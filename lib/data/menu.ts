// La carta.
//
// I piatti sono quelli indicati dal cliente. Tutto il resto è dichiarato
// mancante invece che riempito con un valore plausibile, e la ragione non è
// pedanteria: un prezzo inventato su un ristorante vero è una promessa che
// qualcuno si presenta a riscuotere, e un tag dietetico sbagliato è un
// problema di salute, non di layout.
//
//   prezzo        null  — TODO: listino dal cliente
//   tag           dichiarati solo dove il piatto NON contiene carne, che è
//                 l'unica cosa deducibile dal piatto stesso. Nessun piatto
//                 è marcato senza glutine: non lo sappiamo, e chi filtra per
//                 quel tag lo fa per necessità medica.
//   abbinamento   è un consiglio della casa, non un dato: TODO conferma.

/** Prezzo in centesimi di euro: mai float, si formatta in `formatPrezzo`. */
export type Centesimi = number;

/**
 * Tag dietetici. L'elenco è volutamente corto.
 *
 * `vegetariano` è l'unica affermazione che questa carta si permette senza
 * conferma, e solo sui piatti in cui la carne non compare in nessuna
 * versione conosciuta della ricetta. Restano da confermare i brodi e i
 * caci: vedi DA-VERIFICARE.md.
 */
export type Tag = "vegetariano";

export type Categoria = "antipasti" | "primi" | "secondi" | "dolci";

export interface Voce {
  id: string;
  categoria: Categoria;
  /** Chiave i18n del nome: `carta.piatti.<id>.nome`. */
  nomeKey: string;
  /** Chiave i18n della descrizione: `carta.piatti.<id>.descrizione`. */
  descrizioneKey: string;
  /** `null` finché il listino non è confermato. */
  prezzo: Centesimi | null;
  tag: readonly Tag[];
  /** Consiglio di abbinamento, in chiaro: è un nome di vino, non una frase. */
  abbinamento: string;
  /**
   * Piatto d'autore. Uno solo, e non è una decorazione: il Cantuccimisù ha
   * un nome che la gente ripete, e un nome che si ripete merita una cella
   * dominante invece di una riga in elenco.
   */
  signature?: true;
  /** In carta solo in certe stagioni: si dichiara, non si tace. */
  stagionale?: true;
}

export const CARTA: readonly Voce[] = [
  {
    id: "taglierePerDue",
    categoria: "antipasti",
    nomeKey: "carta.piatti.taglierePerDue.nome",
    descrizioneKey: "carta.piatti.taglierePerDue.descrizione",
    // TODO: verificare col cliente — prezzo
    prezzo: null,
    tag: [],
    // TODO: verificare col cliente — abbinamento consigliato
    abbinamento: "Il Brillo",
  },
  {
    id: "focacciaPatate",
    categoria: "antipasti",
    nomeKey: "carta.piatti.focacciaPatate.nome",
    descrizioneKey: "carta.piatti.focacciaPatate.descrizione",
    prezzo: null,
    tag: [],
    abbinamento: "Rosso di Montepulciano",
  },
  {
    id: "piciAglione",
    categoria: "primi",
    nomeKey: "carta.piatti.piciAglione.nome",
    descrizioneKey: "carta.piatti.piciAglione.descrizione",
    prezzo: null,
    tag: ["vegetariano"],
    abbinamento: "Rosso di Montepulciano",
  },
  {
    id: "tagliatelleTartufo",
    categoria: "primi",
    nomeKey: "carta.piatti.tagliatelleTartufo.nome",
    descrizioneKey: "carta.piatti.tagliatelleTartufo.descrizione",
    prezzo: null,
    tag: ["vegetariano"],
    abbinamento: "Nobile di Montepulciano",
    stagionale: true,
  },
  {
    id: "ribollita",
    categoria: "primi",
    nomeKey: "carta.piatti.ribollita.nome",
    descrizioneKey: "carta.piatti.ribollita.descrizione",
    prezzo: null,
    tag: ["vegetariano"],
    abbinamento: "Il Brillo",
  },
  {
    id: "cinghialeUmido",
    categoria: "secondi",
    nomeKey: "carta.piatti.cinghialeUmido.nome",
    descrizioneKey: "carta.piatti.cinghialeUmido.descrizione",
    prezzo: null,
    tag: [],
    abbinamento: "Nobile di Montepulciano",
    stagionale: true,
  },
  {
    id: "cantuccimisu",
    categoria: "dolci",
    nomeKey: "carta.piatti.cantuccimisu.nome",
    descrizioneKey: "carta.piatti.cantuccimisu.descrizione",
    prezzo: null,
    tag: ["vegetariano"],
    abbinamento: "Vin Santo",
    signature: true,
  },
  {
    id: "pannaCottaVinSanto",
    categoria: "dolci",
    nomeKey: "carta.piatti.pannaCottaVinSanto.nome",
    descrizioneKey: "carta.piatti.pannaCottaVinSanto.descrizione",
    prezzo: null,
    tag: ["vegetariano"],
    abbinamento: "Vin Santo",
  },
];

/** Ordine di servizio. Non alfabetico: è l'ordine in cui si mangia. */
export const CATEGORIE: readonly Categoria[] = ["antipasti", "primi", "secondi", "dolci"];

/** Il piatto d'autore, risolto una volta sola. */
export const SIGNATURE = CARTA.find((voce) => voce.signature) ?? null;

/**
 * `false` finché il cliente non conferma la composizione dei piatti.
 * Finché è falso l'interfaccia mostra i filtri ma dichiara che i tag sono
 * indicativi e rimanda alla sala: è l'unica versione onesta di un filtro
 * dietetico non verificato.
 */
export const TAG_CONFERMATI = false;

/** Formatta un prezzo in euro secondo la locale attiva. */
export function formatPrezzo(centesimi: Centesimi, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: centesimi % 100 === 0 ? 0 : 2,
  }).format(centesimi / 100);
}
