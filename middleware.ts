// Negoziazione della lingua, prefisso di locale e traduzione dei percorsi.

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
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
