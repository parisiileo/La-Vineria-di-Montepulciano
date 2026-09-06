"use client";

// Il bottone che apre la carta, per le pagine che sono componenti server.
//
// L'apertura è un gestore, e un gestore richiede un componente client. Isolato
// qui, la pagina che lo usa resta interamente renderizzata sul server e paga
// solo questo bottone.

import { Button } from "@/components/ui/Button";
import { apriCarta } from "@/lib/ui/carta";

export function BottoneCarta({
  etichetta,
  className,
}: {
  etichetta: string;
  className?: string;
}) {
  return (
    <Button variant="ghost" size="lg" onClick={apriCarta} className={className}>
      {etichetta}
    </Button>
  );
}
