// Lo schema Zod della prenotazione. Importato SOLO dalla rotta: è il
// controllo che conta, ed è anche l'unico posto dove Zod entra nel bundle.

import { z } from "zod";

import {
  NOME_MIN,
  NOTE_MAX,
  OSPITI_MAX,
  OSPITI_MIN,
  SEDI,
  TELEFONO_RE,
} from "@/lib/data/prenotazione";

export const schemaPrenotazione = z.object({
  nome: z.string().trim().min(NOME_MIN),
  telefono: z.string().trim().regex(TELEFONO_RE),
  data: z.string().min(1),
  orario: z.string().min(1),
  ospiti: z.coerce.number().int().min(OSPITI_MIN).max(OSPITI_MAX),
  sede: z.enum(SEDI),
  note: z.string().trim().max(NOTE_MAX).optional().or(z.literal("")),
  privacy: z.literal(true),
});
