// L'icona per la schermata home di iOS, 180×180.
//
// Esiste perché iOS NON usa il favicon SVG: se manca questa, Safari si arrangia
// con uno screenshot della pagina — che su un sito a fondo scuro dà un
// quadratino nero indistinguibile.
//
// Il disegno è lo stesso file del favicon, letto e non ridisegnato: un marchio
// che vive in due copie diverge alla prima correzione. Qui viene solo posato
// su un campo di tufo con un margine, perché iOS arrotonda l'angolo per conto
// suo e un disegno a filo del bordo verrebbe tagliato.

import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PALETTE } from "@/lib/palette";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icona() {
  const marchio =
    "data:image/svg+xml;base64," +
    readFileSync(join(process.cwd(), "app/icon.svg")).toString("base64");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: PALETTE["tuff-deep"],
        }}
      >
        {/* 132 su 180: il marchio ha già il proprio riquadro, quindi il
            margine qui serve solo a tenerlo lontano dall'angolo arrotondato.

            Le due regole disattivate qui sotto valgono per l'HTML, e questo
            non è HTML: satori legge questo albero e ne stampa un PNG. Non c'è
            nessun LCP da ottimizzare — l'immagine è un'icona da 180 pixel
            generata una volta in build — e nessun testo alternativo da
            leggere, perché il risultato è un file, non un elemento in pagina. */}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={marchio} width={132} height={132} />
      </div>
    ),
    size,
  );
}
