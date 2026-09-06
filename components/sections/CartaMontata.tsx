"use client";

// Il pannello della carta, montato una volta sola per tutto il sito.
//
// Sta nel layout e non nelle sezioni perché lo aprono in tre da rami diversi
// dell'albero. Un pannello per ogni punto di apertura significherebbe tre
// copie della stessa carta nel DOM, tre trappole del focus e tre blocchi
// dello scroll che si contendono Lenis.
//
// Il codice però NON entra nel bundle iniziale. Vivendo nel layout, il
// pannello sarebbe scaricato da ogni pagina anche da chi non lo apre mai:
// misurato, costava 18 kB su ciascuna. Qui è un import dinamico che parte a
// tempo perso subito dopo il montaggio — quando arriva il clic il codice è
// già in memoria, e chi non clicca non lo ha mai atteso.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { impostaCarta, useCartaAperta } from "@/lib/ui/carta";

const CartaDialog = dynamic(
  () => import("@/components/sections/CartaDialog").then((m) => m.CartaDialog),
  { ssr: false },
);

export function CartaMontata() {
  const aperta = useCartaAperta();
  const [pronta, setPronta] = useState(false);

  useEffect(() => {
    const carica = () => setPronta(true);
    const aTempoPerso = window.requestIdleCallback;
    if (typeof aTempoPerso === "function") aTempoPerso(carica, { timeout: 3000 });
    else window.setTimeout(carica, 400);
  }, []);

  // Finché non è pronta non c'è niente da montare; se qualcuno riesce ad
  // aprirla prima — improbabile ma non impossibile — si monta subito.
  if (!pronta && !aperta) return null;

  return <CartaDialog open={aperta} onOpenChange={impostaCarta} />;
}
