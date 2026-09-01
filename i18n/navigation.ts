// Wrapper di navigazione consapevoli della lingua: Link, router e pathname
// mantengono il prefisso di locale senza che i componenti se ne occupino.

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
