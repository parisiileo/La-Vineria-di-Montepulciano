// Configurazione Next. `turbopack.root` è fissata perché esiste un lockfile
// nella cartella superiore e senza questo Turbopack sceglie la radice sbagliata.

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,

  // `/carta` è esistita come pagina fra due deploy, e per un momento è stata
  // un indirizzo pubblico. Ora la carta è un pannello e quell'indirizzo non
  // esiste più: chi ci arriva da un link salvato o da un risultato di ricerca
  // rimasto in cache trova la home invece di un 404. Il redirect è permanente
  // perché la decisione lo è.
  async redirects() {
    return [
      { source: "/it/carta", destination: "/it", permanent: true },
      { source: "/en/menu", destination: "/en", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
