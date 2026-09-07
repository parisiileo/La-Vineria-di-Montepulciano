// Manifesto dell'applicazione web.
//
// Non è una PWA e non vuole esserlo: non c'è niente da usare offline in un
// sito che serve a decidere dove cenare stasera. Il manifesto esiste per due
// ragioni più modeste e più concrete:
//
//  1. chi aggiunge il sito alla schermata home di Android trova il nome giusto
//     e il fondo di tufo invece di «lavineriadimontepulciano.it» su bianco;
//  2. `display: "browser"` dichiara esplicitamente che il sito va aperto nel
//     browser. Senza, alcuni sistemi lo lanciano a schermo intero senza barra
//     degli indirizzi — e su un sito con due lingue e link a Google Maps
//     togliere la barra è togliere l'uscita.
//
// Il nome breve è quello che sta sotto l'icona: «La Vineria» e non la ragione
// sociale, perché Android tronca a dodici caratteri circa.

import type { MetadataRoute } from "next";

import { THEME_COLOR } from "@/lib/utils";
import { PALETTE } from "@/lib/palette";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Vineria di Montepulciano",
    short_name: "La Vineria",
    description:
      "Due locali su Via di Gracciano nel Corso, una cantina scavata nel tufo e il vino che facciamo noi.",
    lang: "it-IT",
    start_url: "/it",
    display: "browser",
    background_color: PALETTE["tuff-deep"],
    theme_color: THEME_COLOR,
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
