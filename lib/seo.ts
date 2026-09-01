// Helper di metadata e dati strutturati. Lo Step 5 li estende;
// qui esistono già per non disseminare stringhe SEO nei layout.

import type { Metadata } from "next";
import { LOCALI, TELEFONO, type Locale as Sede } from "@/lib/data/locali";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_URL = "https://www.lavineriadimontepulciano.it";

/** Mappa le locale interne ai tag BCP-47 usati da hreflang e da `<html lang>`. */
export const HREFLANG: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

/** Alternate `hreflang` complete per una data rotta, `x-default` incluso. */
export function alternatesFor(path: string): Metadata["alternates"] {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: `${SITE_URL}/${routing.defaultLocale}${clean === "/" ? "" : clean}`,
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [HREFLANG[l], `${SITE_URL}/${l}${clean === "/" ? "" : clean}`]),
      ),
      "x-default": `${SITE_URL}/${routing.defaultLocale}${clean === "/" ? "" : clean}`,
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
    telephone: TELEFONO,
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
