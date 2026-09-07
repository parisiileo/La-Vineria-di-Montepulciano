// Negoziazione della lingua, prefisso di locale e traduzione dei percorsi.
//
// Si chiamava `middleware.ts`. Da Next 16 la convenzione è `proxy.ts`: stesso
// contratto — export default e `config.matcher` — solo un altro nome di file,
// e il vecchio è deprecato con avviso a ogni build. La funzione la costruisce
// ancora `next-intl/middleware`, che è il nome del SUO modulo e non della
// convenzione di Next: non c'è niente da rinominare lì dentro.

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Il doppio backslash è obbligatorio e non è pedanteria: dentro una stringa
  // TypeScript `"\."` non è un punto letterale, è una sequenza di escape non
  // valida che il motore riduce a `.` — cioè «un carattere qualsiasi».
  // Il matcher diventava `(?!… |.*..*)`, che esclude ogni percorso lungo due
  // caratteri o più: il middleware girava solo sulla radice.
  //
  // Per mesi non si è visto niente, perché le pagine con `generateStaticParams`
  // si risolvono da sole senza passare di qui. Si è visto al primo percorso
  // che ha BISOGNO di una riscrittura — `/en/the-cellar` → `/en/cantina` —
  // che rispondeva 404 mentre `/en/cantina` rispondeva 200.
  // `apple-icon` e compagnia sono elencati per nome, e la ragione è che
  // l'esclusione generica qui sopra riconosce un file dal PUNTO nel nome.
  // `/icon.svg`, `/robots.txt`, `/sitemap.xml`, `/og/home.jpg` ce l'hanno e
  // passano; `/apple-icon` no — è una rotta di metadati generata da Next senza
  // estensione — e finiva prefissata a `/it/apple-icon`, che non esiste: 404
  // sull'icona che iOS mette in schermata home. Trovato chiedendo al server
  // ognuna delle risorse che un motore o un telefono va a cercare.
  matcher: "/((?!api|_next|_vercel|apple-icon|icon|opengraph-image|twitter-image|.*\\..*).*)",
};
