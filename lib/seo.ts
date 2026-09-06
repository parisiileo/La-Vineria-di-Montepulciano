// Helper di metadata e dati strutturati. Lo Step 5 li estende;
// qui esistono già per non disseminare stringhe SEO nei layout.

import type { Metadata } from "next";
import { LOCALI, type Locale as Sede } from "@/lib/data/locali";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type Percorso } from "@/i18n/routing";

export const SITE_URL = "https://www.lavineriadimontepulciano.it";

/** Mappa le locale interne ai tag BCP-47 usati da hreflang e da `<html lang>`. */
export const HREFLANG: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

/**
 * Alternate `hreflang` complete per una data rotta, `x-default` incluso.
 *
 * L'URL di ogni lingua lo costruisce `getPathname`, non una concatenazione:
 * dallo Step 07 i percorsi sono tradotti, e `/en` + `/cantina` darebbe
 * `/en/cantina` — che esiste solo come redirect verso `/en/the-cellar`.
 * Un hreflang che punta a un redirect è un hreflang che Google ignora.
 */
export function alternatesFor(href: Percorso, locale: Locale): Metadata["alternates"] {
  const url = (l: Locale) => `${SITE_URL}${getPathname({ href, locale: l })}`;
  return {
    // Canonica su SE STESSA, non sulla versione italiana. Una canonical che
    // punta all'altra lingua dice a Google che quella pagina è un duplicato
    // e non va indicizzata: è il modo più rapido di cancellare metà sito
    // dalla ricerca. Le due versioni si dichiarano parenti con `hreflang`,
    // che è la relazione giusta fra traduzioni.
    canonical: url(locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [HREFLANG[l], url(l)])),
      "x-default": url(routing.defaultLocale),
    },
  };
}

/**
 * Nodo schema.org per una sede. Volutamente parziale: `openingHours` e
 * `geo` restano fuori finché il cliente non conferma orari e coordinate.
 * Marcare orari inventati in JSON-LD è il modo più veloce per mandare
 * clienti davanti a una porta chiusa.
 */
export function restaurantJsonLd(sede: Sede, nome: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: nome,
    // Il telefono della SEDE, non quello principale: il 72 ha un numero suo,
    // e uno schema che li dà entrambi come 850153 fa squillare la sala
    // sbagliata a chi chiama dal risultato di ricerca.
    telephone: sede.telefono,
    servesCuisine: "Italian",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${sede.via}, ${sede.civico}`,
      postalCode: sede.cap,
      addressLocality: sede.citta,
      addressRegion: sede.provincia,
      addressCountry: sede.paese,
    },
  } as const;
}

export const SEDI_JSONLD_SOURCES = LOCALI;
