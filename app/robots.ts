// robots.txt.
//
// Tutto aperto tranne le due pagine di lavoro e le rotte di servizio. Non è
// una precauzione teorica: la kitchen-sink contiene ogni stato di ogni
// primitiva e la partitura contiene il sito intero una seconda volta —
// indicizzate, farebbero concorrenza alle pagine vere sulle stesse parole.

import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/it/composizione", "/en/composizione", "/it/kitchen-sink", "/en/kitchen-sink"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
