"use client";

// Un solo componente per due tipi di destinazione: le ancore interne alla
// pagina, che devono passare per Lenis, e le rotte, che devono passare per il
// router localizzato.
//
// L'ancora interna non usa `href="#..."` nativo: il salto istantaneo del
// browser scavalca lo scroll smooth e ScrollTrigger si ritrova in un punto in
// cui non è mai passato. `lenis.scrollTo` porta lì con la stessa inerzia del
// resto del sito e aggiorna le timeline lungo la strada.

import { Link } from "@/i18n/navigation";
import { getLenis } from "@/lib/scroll/lenis";

interface AncoraProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function Ancora({ href, children, onClick, ...rest }: AncoraProps) {
  if (!href.startsWith("#")) {
    return (
      <Link href={href} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      onClick={(e) => {
        const lenis = getLenis();
        const bersaglio = document.querySelector(href);
        if (lenis && bersaglio) {
          e.preventDefault();
          // L'offset compensa l'altezza della barra fissa: senza, il titolo
          // della sezione finisce sotto la navigazione.
          lenis.scrollTo(bersaglio as HTMLElement, { offset: -96 });
        }
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
