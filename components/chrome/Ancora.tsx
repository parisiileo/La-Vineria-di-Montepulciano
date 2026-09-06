"use client";

// Un solo componente per tre tipi di destinazione, e ognuno ha un motivo.
//
//  `#sezione`   ancora dentro la pagina corrente. Non usa il salto nativo:
//               quello scavalca lo scroll smooth e ScrollTrigger si ritrova
//               in un punto in cui non è mai passato. `lenis.scrollTo` porta
//               lì con la stessa inerzia del resto del sito.
//
//  `/#sezione`  ancora nella home, chiamata da una pagina qualsiasi. È il
//               caso nato con le pagine dedicate: dalla carta, «La famiglia»
//               non è un'ancora — è un viaggio. Se siamo già in home si
//               comporta come il primo caso; altrimenti è una rotta.
//
//  `/rotta`     pagina vera, che passa dal router localizzato.

import { Link, usePathname } from "@/i18n/navigation";
import type { Percorso } from "@/i18n/routing";
import { getLenis } from "@/lib/scroll/lenis";

interface AncoraProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: React.ReactNode;
}

/** Porta lo scroll sulla sezione, compensando l'altezza della barra fissa. */
function vaiAllaSezione(hash: string) {
  const lenis = getLenis();
  const bersaglio = document.querySelector(hash);
  if (!lenis || !bersaglio) return false;
  lenis.scrollTo(bersaglio as HTMLElement, { offset: -96 });
  return true;
}

export function Ancora({ href, children, onClick, ...rest }: AncoraProps) {
  const pathname = usePathname();
  const inHome = pathname === "/";
  const hash = href.startsWith("/#") ? href.slice(1) : href.startsWith("#") ? href : null;

  // Ancora interna, e siamo nella pagina che la contiene.
  if (hash && (href.startsWith("#") || inHome)) {
    return (
      <a
        href={hash}
        onClick={(e) => {
          if (vaiAllaSezione(hash)) e.preventDefault();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }

  // Ancora nella home chiamata da un'altra pagina: prima si arriva, poi si
  // scende. Il frammento sopravvive alla navigazione perché `main > section[id]`
  // ha uno `scroll-margin-top` che tiene il titolo sotto la barra.
  if (hash) {
    return (
      <Link href={{ pathname: "/", hash: hash.slice(1) }} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <Link href={href as Percorso} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
