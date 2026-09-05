// Registro fotografico. Sorgente unica di ogni immagine del sito.
//
// Le fotografie sono quelle reali del cliente, recuperate dalla libreria di
// lavineriadimontepulciano.it (51 scatti veri su 255 media). Non c'è una sola
// stock photo, e non ci sarà: su un'attività familiare vera una foto comprata
// si riconosce e costa credibilità. Vedi DESIGN_NOTES §10.3.
//
// L'import è statico e non un percorso in /public: così Next conosce
// dimensioni e blurDataURL a build time, e il layout non salta mai.

import type { StaticImageData } from "next/image";

import salaBancone from "@/assets/foto/sala-bancone.jpg";
import salaPareteBottiglie from "@/assets/foto/sala-parete-bottiglie.jpg";
import pareteBottiglie from "@/assets/foto/parete-bottiglie.jpg";
import squadraInVia from "@/assets/foto/squadra-in-via.jpg";
import archivioErcolani from "@/assets/foto/archivio-ercolani.jpg";
import caliceInciso from "@/assets/foto/calice-inciso.jpg";
import taglieroAffettati from "@/assets/foto/tagliere-affettati.jpg";
import pastaFattaAMano from "@/assets/foto/pasta-fatta-a-mano.jpg";
import maniAlBancone from "@/assets/foto/mani-al-bancone.jpg";
import pecoriniEMarmellate from "@/assets/foto/pecorini-e-marmellate.jpg";
import facciata101 from "@/assets/foto/facciata-101.jpg";
import facciata72 from "@/assets/foto/facciata-72.jpg";
import caliciSulRipiano from "@/assets/foto/calici-sul-ripiano.jpg";
import tavoloCondiviso from "@/assets/foto/tavolo-condiviso.jpg";

/**
 * Registro di trattamento.
 *
 * `presente`  documenta le sale, i piatti e le persone di oggi: resta a colori.
 * `archivio`  non documenta il presente: prende il duotone tufo→ottone.
 *
 * La regola di appartenenza è una sola e non ammette eccezioni estetiche:
 * una fotografia che non documenta il presente non può stare a colori accanto
 * a una che lo fa. Oggi l'archivio contiene un solo scatto; la regola vale
 * comunque, ed è ciò che rende il duotone un sistema invece di un incidente.
 */
export type Registro = "presente" | "archivio";

export interface Foto {
  src: StaticImageData;
  /** Chiave i18n del testo alternativo: l'alt è contenuto, non dato tecnico. */
  altKey: string;
  registro: Registro;
  /**
   * `object-position` scelto sul soggetto, mai lasciato al centro per inerzia.
   * Ogni crop di questo progetto è dichiarato: vedi DESIGN_NOTES §10.3.
   */
  fuoco: string;
  /**
   * Override sotto i 768px, dove il ritaglio si stringe e il soggetto può
   * uscire dall'inquadratura. Assente = il fuoco desktop regge anche stretto.
   */
  fuocoStretto?: string;
}

/** Chiavi stabili: le sezioni citano il registro, non i percorsi dei file. */
export const FOTO = {
  salaBancone: {
    src: salaBancone,
    altKey: "foto.salaBancone",
    registro: "presente",
    fuoco: "50% 46%",
    fuocoStretto: "58% 46%",
  },
  salaPareteBottiglie: {
    src: salaPareteBottiglie,
    altKey: "foto.salaPareteBottiglie",
    registro: "presente",
    fuoco: "60% 50%",
    fuocoStretto: "70% 50%",
  },
  pareteBottiglie: {
    src: pareteBottiglie,
    altKey: "foto.pareteBottiglie",
    registro: "presente",
    fuoco: "50% 50%",
  },
  squadraInVia: {
    src: squadraInVia,
    altKey: "foto.squadraInVia",
    registro: "presente",
    fuoco: "50% 42%",
    fuocoStretto: "48% 40%",
  },
  archivioErcolani: {
    src: archivioErcolani,
    altKey: "foto.archivioErcolani",
    registro: "archivio",
    fuoco: "50% 42%",
  },
  caliceInciso: {
    src: caliceInciso,
    altKey: "foto.caliceInciso",
    registro: "presente",
    // Il calice sta in basso: il centro dell'inquadratura sarebbe cielo.
    fuoco: "50% 66%",
  },
  taglieroAffettati: {
    src: taglieroAffettati,
    altKey: "foto.taglieroAffettati",
    registro: "presente",
    fuoco: "55% 50%",
  },
  pastaFattaAMano: {
    src: pastaFattaAMano,
    altKey: "foto.pastaFattaAMano",
    registro: "presente",
    fuoco: "50% 46%",
  },
  maniAlBancone: {
    src: maniAlBancone,
    altKey: "foto.maniAlBancone",
    registro: "presente",
    fuoco: "50% 56%",
  },
  pecoriniEMarmellate: {
    src: pecoriniEMarmellate,
    altKey: "foto.pecoriniEMarmellate",
    registro: "presente",
    fuoco: "50% 50%",
  },
  facciata101: {
    src: facciata101,
    altKey: "foto.facciata101",
    registro: "presente",
    fuoco: "56% 56%",
    fuocoStretto: "64% 56%",
  },
  facciata72: {
    src: facciata72,
    altKey: "foto.facciata72",
    registro: "presente",
    // La porta e l'insegna stanno a destra: al centro c'è solo muro.
    fuoco: "78% 50%",
  },
  caliciSulRipiano: {
    src: caliciSulRipiano,
    altKey: "foto.caliciSulRipiano",
    registro: "presente",
    fuoco: "42% 50%",
  },
  tavoloCondiviso: {
    src: tavoloCondiviso,
    altKey: "foto.tavoloCondiviso",
    registro: "presente",
    fuoco: "50% 46%",
  },
} as const satisfies Record<string, Foto>;

export type ChiaveFoto = keyof typeof FOTO;

/**
 * Soggetti dichiarati critici dalla direzione artistica e assenti dalla
 * libreria del cliente. Non sono un dettaglio di produzione: sono la ragione
 * per cui la sezione della cantina è tipografica e non fotografica.
 *
 * TODO: richiedere al cliente. Finché mancano, nessuna sezione le simula.
 */
export const FOTO_MANCANTI = [
  "tunnel della cantina scavata nel tufo",
  "pozzo medievale sotto il pavimento di vetro, sede al 72",
] as const;
