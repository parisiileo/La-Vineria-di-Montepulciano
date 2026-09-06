"use client";

// La cucina: griglia asimmetrica più il bottone che apre la carta.
//
// Esiste come componente a sé perché il bottone ha un gestore, e un gestore
// costringe il ramo a essere client. Isolandolo qui, la pagina resta un
// componente server. Lo stato del pannello non è più suo: la carta la
// aprono in tre da punti diversi del sito, e vive in `lib/ui/carta.ts`.

import { useTranslations } from "next-intl";

import { FOTO } from "@/lib/data/foto";
import { AsymmetricGrid } from "@/components/sections/AsymmetricGrid";
import { Button } from "@/components/ui/Button";
import { apriCarta } from "@/lib/ui/carta";

export function Cucina({ id = "cucina" }: { id?: string }) {
  const t = useTranslations("home.cucina");
  const tf = useTranslations("foto");
  return (
    <AsymmetricGrid
        id={id}
        titolo={t("titolo")}
        testo={t("testo")}
        azione={
        <Button variant="ghost" size="lg" onClick={apriCarta}>
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
  );
}
