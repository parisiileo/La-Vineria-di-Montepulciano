// Definizione delle rotte localizzate. `it` è la lingua del locale, `en` è la
// versione per chi arriva a Montepulciano da fuori: entrambe sempre prefissate.

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
