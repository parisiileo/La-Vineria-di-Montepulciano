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
};

export default withNextIntl(nextConfig);
