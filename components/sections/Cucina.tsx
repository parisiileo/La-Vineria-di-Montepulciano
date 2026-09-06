"use client";

// 04 — La cucina. Griglia asimmetrica più la carta.
//
// Esiste come componente a sé solo per una ragione: la carta è uno stato, e
// uno stato costringe il ramo a essere client. Isolandolo qui, la pagina
// resta un componente server e l'unico JavaScript in più è quello che serve
// ad aprire un pannello.

import { useState } from "react";
import { useTranslations } from "next-intl";

import { FOTO } from "@/lib/data/foto";
import { AsymmetricGrid } from "@/components/sections/AsymmetricGrid";
import { CartaDialog } from "@/components/sections/CartaDialog";
import { Button } from "@/components/ui/Button";

export function Cucina({ id = "cucina" }: { id?: string }) {
  const t = useTranslations("home.cucina");
  const tf = useTranslations("foto");
  const [carta, setCarta] = useState(false);

  return (
    <>
      <AsymmetricGrid
        id={id}
        titolo={t("titolo")}
        testo={t("testo")}
        azione={
          <Button variant="ghost" size="lg" onClick={() => setCarta(true)}>
            {t("cta")}
          </Button>
        }
        dominante={{
          foto: FOTO.taglieroAffettati,
          alt: tf("taglieroAffettati"),
          rapporto: "3/2",
        }}
        secondarie={[
          {
            foto: FOTO.pecoriniEMarmellate,
            alt: tf("pecoriniEMarmellate"),
            rapporto: "4/5",
            didascalia: t("d1"),
          },
          { foto: FOTO.pastaFattaAMano, alt: tf("pastaFattaAMano"), rapporto: "1/1" },
          {
            foto: FOTO.maniAlBancone,
            alt: tf("maniAlBancone"),
            rapporto: "16/9",
            didascalia: t("d3"),
          },
        ]}
      />

      <CartaDialog open={carta} onOpenChange={setCarta} />
    </>
  );
}
