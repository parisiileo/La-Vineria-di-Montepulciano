// Mappa del sito.
//
// Elenca solo le pagine pubbliche, e le elenca in tutte le lingue: ogni voce
// porta i propri `alternates`, così un motore che trova la versione inglese
// sa che esiste l'italiana e viceversa. Le pagine di lavoro — la partitura
// degli archetipi e la kitchen-sink — sono `noindex` e non compaiono qui:
// una sitemap che elenca pagine escluse dall'indice è un segnale contrastante.

import type { MetadataRoute } from "next";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type Percorso } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

// La carta non è qui perché non è una pagina: è un pannello, e un
// pannello non ha un indirizzo da elencare. I suoi dati restano leggibili
// dai motori grazie al JSON-LD `Menu` sulla home.
const PUBBLICHE: readonly Percorso[] = ["/", "/cantina", "/locali"];

/** Priorità relative. La home e la cantina sono le due porte d'ingresso. */
const PRIORITA: Record<string, number> = {
  "/": 1,
  "/cantina": 0.9,
  "/locali": 0.8,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (href: Percorso, locale: Locale) => `${SITE_URL}${getPathname({ href, locale })}`;

  return PUBBLICHE.flatMap((href) =>
    routing.locales.map((locale) => ({
      url: url(href, locale),
      lastModified: new Date(),
      priority: PRIORITA[href] ?? 0.5,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, url(href, l)])),
      },
    })),
  );
}
