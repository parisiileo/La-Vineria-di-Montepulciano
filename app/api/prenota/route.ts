// Ricezione della richiesta di prenotazione.
//
// La rotta valida col medesimo schema del browser e poi inoltra a una
// destinazione configurata in `PRENOTAZIONI_WEBHOOK`.
//
// Se quella variabile non esiste la rotta risponde 503 e l'interfaccia dice
// che la richiesta non è partita, invitando a telefonare. È deliberato:
// mostrare "grazie, vi richiamiamo" senza che nessuno riceva niente è la
// bugia più costosa che un sito di ristorante possa raccontare — il tavolo
// non c'è, e l'ospite lo scopre sulla porta. Finché il cliente non indica
// dove devono arrivare le richieste, il canale che funziona è il telefono e
// il sito lo dice.

import { NextResponse } from "next/server";

import { schemaPrenotazione } from "@/lib/data/prenotazione.server";

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const esito = schemaPrenotazione.safeParse(corpo);
  if (!esito.success) {
    return NextResponse.json({ errore: "dati non validi" }, { status: 400 });
  }

  const destinazione = process.env.PRENOTAZIONI_WEBHOOK;
  if (!destinazione) {
    return NextResponse.json({ errore: "canale non configurato" }, { status: 503 });
  }

  const risposta = await fetch(destinazione, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(esito.data),
  }).catch(() => null);

  if (!risposta || !risposta.ok) {
    return NextResponse.json({ errore: "inoltro fallito" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
