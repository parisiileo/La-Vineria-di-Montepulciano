// Regole della richiesta di prenotazione.
//
// Il file è diviso in due metà per una ragione di peso, non di ordine.
//
// La metà ALTA non importa niente: sono i vincoli in chiaro, e li usa il
// browser per validare mentre si scrive. La metà BASSA costruisce lo schema
// Zod, e la usa solo la rotta.
//
// Zod sul client costava ~60 kB di JavaScript per validare otto campi che il
// browser sa già validare da solo, e il controllo che conta non è mai quello
// del client: è quello del server, che è l'unico che nessuno può aggirare.
// Le due metà condividono le costanti, quindi non possono divergere sui
// numeri; divergono solo su chi le applica.
//
// Nota sugli orari: il campo è un orario libero e non un elenco di turni.
// I turni di servizio non sono confermati (vedi lib/data/locali.ts), e
// offrire "19:30 / 20:00 / 21:30" significherebbe inventare gli orari di
// apertura dentro un menu a tendina, dove sembrano ancora più veri.

export const OSPITI_MIN = 1;
export const OSPITI_MAX = 20;
export const NOME_MIN = 2;
export const NOTE_MAX = 500;

/** Permissiva di proposito: i numeri internazionali hanno mille formati e
 *  rifiutarne uno valido costa una prenotazione. */
export const TELEFONO_RE = /^[+\d][\d\s().-]{5,24}$/;

export const SEDI = ["gracciano-101", "gracciano-72"] as const;
export type SedeId = (typeof SEDI)[number];

/** Forma dei dati inviati. È anche il tipo dei campi del modulo. */
export interface Prenotazione {
  nome: string;
  telefono: string;
  data: string;
  orario: string;
  ospiti: number;
  sede: SedeId;
  note?: string;
  privacy: boolean;
}
