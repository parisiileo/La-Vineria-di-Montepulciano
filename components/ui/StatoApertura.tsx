"use client";

// Badge di stato: aperto, chiuso, o — oggi — orari non confermati.
//
// Due vincoli, entrambi già risolti in `statoApertura`:
//
//  1. Il fuso è Europe/Rome imposto, non quello del visitatore. Chi guarda
//     da Chicago vuole sapere se la sala è aperta ADESSO a Montepulciano.
//  2. Il calcolo avviene DOPO il montaggio, mai durante il render del
//     server: l'ora del server e quella del browser non coincidono mai
//     esattamente, e un badge calcolato in entrambi i posti produce un
//     mismatch di idratazione ogni volta che il minuto cambia in mezzo.
//     Prima del montaggio si mostra lo stato "sconosciuto", che è anche la
//     verità finché gli orari non sono confermati.

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { statoApertura, type Orari, type StatoApertura as Stato } from "@/lib/data/locali";
import { cn } from "@/lib/utils";

/** Ricalcolo al minuto: un badge che dice "aperto" un'ora dopo la chiusura
 *  è peggio di nessun badge. */
const PERIODO_MS = 60_000;

export function StatoAperturaBadge({
  orari,
  className,
}: {
  orari: Orari | null;
  className?: string;
}) {
  const t = useTranslations("home.stato");
  const [stato, setStato] = useState<Stato>("sconosciuto");

  useEffect(() => {
    const calcola = () => setStato(statoApertura(orari));
    calcola();
    const id = window.setInterval(calcola, PERIODO_MS);
    return () => window.clearInterval(id);
  }, [orari]);

  const etichetta =
    stato === "aperto" ? t("apertoOra") : stato === "chiuso" ? t("chiusoOra") : t("nonDisponibile");

  return (
    <p
      // `polite` e non `assertive`: il passaggio da aperto a chiuso è
      // un'informazione, non un allarme.
      aria-live="polite"
      className={cn("flex items-center gap-2 font-mono text-mono uppercase", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-pill",
          stato === "aperto" ? "bg-brass" : stato === "chiuso" ? "bg-stone-dim" : "bg-brass-dim",
        )}
      />
      <span className={stato === "aperto" ? "text-brass" : "text-stone-dim"}>{etichetta}</span>
      {stato === "sconosciuto" ? (
        <span className="text-stone-dim">· {t("chiamaPerConferma")}</span>
      ) : null}
    </p>
  );
}
