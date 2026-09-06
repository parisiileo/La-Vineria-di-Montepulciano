// Definizione delle rotte localizzate. `it` è la lingua del locale, `en` è la
// versione per chi arriva a Montepulciano da fuori: entrambe sempre prefissate.
//
// I percorsi sono tradotti, non solo prefissati. Non è un vezzo: chi cerca
// «cellar tour Montepulciano» e riceve un risultato che punta a
// `/en/cantina` legge una parola che non conosce nella riga più visibile
// della SERP, e un URL in una lingua che non è la sua è un motivo in meno per
// cliccare. La chiave interna resta italiana ovunque nel codice — è il nome
// della cosa — e la traduzione avviene solo all'uscita.

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/cantina": { it: "/cantina", en: "/the-cellar" },
    "/locali": { it: "/locali", en: "/the-rooms" },
    "/composizione": "/composizione",
    "/kitchen-sink": "/kitchen-sink",
  },
});

export type Locale = (typeof routing.locales)[number];
export type Percorso = keyof typeof routing.pathnames;
