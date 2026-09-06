"use client";

// Prenotazione e contatti.
//
// L'ordine dei due blocchi cambia col dispositivo, e non è una preferenza
// estetica. Su desktop il modulo viene prima: chi è alla scrivania sta
// pianificando, e compilare gli va bene. Su telefono vengono prima i
// contatti: chi arriva dal telefono, molto spesso, vuole chiamare — e mettere
// otto campi fra lui e il numero è un modo di perdere una prenotazione.
// In DOM l'ordine è uno solo e l'inversione è `order` di flexbox, così la
// sequenza di lettura da tastiera e da screen reader resta quella scritta.
//
// Il modulo non finge. Non esiste ancora un canale dove far arrivare le
// richieste: la rotta risponde 503, e questa interfaccia lo dice e rimanda al
// telefono invece di ringraziare per un messaggio che nessuno ha ricevuto.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { LOCALI, THEFORK_URL, linkMappe } from "@/lib/data/locali";
import {
  NOME_MIN,
  NOTE_MAX,
  OSPITI_MAX,
  OSPITI_MIN,
  TELEFONO_RE,
  type Prenotazione as Dati,
} from "@/lib/data/prenotazione";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MappaLazy } from "@/components/chrome/MappaLazy";
import { StatoAperturaBadge } from "@/components/ui/StatoApertura";
import { Reveal } from "@/components/motion/Reveal";
import { SectionNumber } from "@/components/sections/SectionNumber";

type Esito = "fermo" | "invio" | "fatto" | "errore";

export function Prenotazione({ id = "prenota" }: { id?: string }) {
  const t = useTranslations("home.prenota");
  const tf = useTranslations("home.form");
  const tl = useTranslations("locali");
  const tc = useTranslations("common");
  const [esito, setEsito] = useState<Esito>("fermo");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    // Tre parametri e non uno: i campi che il modulo SCRIVE non coincidono
    // con i dati che lo schema PRODUCE — `ospiti` esce da un input come
    // stringa ed entra nella rotta come numero. Dichiararne uno solo
    // costringe a un cast, e il cast nasconde proprio la conversione che si
    // vuole avere sotto controllo.
    // Nessun resolver Zod: le regole stanno nei `register` qui sotto, e le
    // costanti arrivano dallo stesso file che lo schema del server importa.
    // È il client a non avere Zod, non la validazione: la rotta valida
    // comunque, ed è l'unico controllo che nessuno può aggirare.
  } = useForm<Dati>({
    // Validazione al blur e non a ogni tasto: correggere qualcuno mentre sta
    // ancora scrivendo è ostile, ed è la stessa regola già scritta in Input.
    mode: "onBlur",
    defaultValues: { sede: "gracciano-101", privacy: false, ospiti: 2 },
  });

  // Due campi non hanno un `<input>` proprio da agganciare — la sede passa
  // da un Select di Radix, il consenso da una Checkbox — e senza questa
  // registrazione esplicita le loro regole non esistono: il modulo si
  // lascerebbe inviare senza consenso.
  register("sede", { required: true });
  register("privacy", { validate: (valore) => valore === true });

  async function invia(dati: Dati) {
    setEsito("invio");
    const risposta = await fetch("/api/prenota", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(dati),
    }).catch(() => null);
    setEsito(risposta?.ok ? "fatto" : "errore");
  }

  const opzioniSede = LOCALI.map((sede) => ({
    value: sede.id,
    label: tl(sede.id === "gracciano-101" ? "gracciano101.nome" : "gracciano72.nome"),
  }));

  return (
    <section id={id} className="section-y border-t border-border">
      <Reveal>
        <SectionNumber numero="06" titolo={t("etichetta")} />
        <h2 className="mt-6 text-h2">{t("titolo")}</h2>
        <p className="measure mt-6 text-lead text-stone">{t("testo")}</p>
      </Reveal>

      <div className="mt-16 flex flex-col gap-12 lg:flex-row lg:gap-(--grid-gap)">
        {/* ------------------------------------------------------ il modulo */}
        <div className="order-2 lg:order-1 lg:w-7/12">
          <h3 className="font-mono text-mono uppercase text-brass">{t("formTitolo")}</h3>

          {esito === "fatto" ? (
            <div className="mt-6 border-s-2 border-brass ps-6">
              <p className="text-lead text-cream">{t("inviato")}</p>
              <Button variant="link" className="mt-4" onClick={() => setEsito("fermo")}>
                {t("inviaAltra")}
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit(invia)} className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label={tf("nome")} autoComplete="name" error={errors.nome ? tf("erroreNome") : undefined} {...register("nome", { required: true, minLength: NOME_MIN })} />
              </div>
              <Input label={tf("telefono")} type="tel" inputMode="tel" autoComplete="tel" error={errors.telefono ? tf("erroreTelefono") : undefined} {...register("telefono", { required: true, pattern: TELEFONO_RE })} />
              <Input label={tf("ospiti")} type="number" inputMode="numeric" min={1} max={20} error={errors.ospiti ? tf("erroreOspiti") : undefined} {...register("ospiti", { required: true, valueAsNumber: true, min: OSPITI_MIN, max: OSPITI_MAX })} />
              <Input label={tf("data")} type="date" error={errors.data ? tf("erroreData") : undefined} {...register("data", { required: true })} />
              <Input label={tf("orario")} type="time" error={errors.orario ? tf("erroreOrario") : undefined} {...register("orario", { required: true })} />

              <div className="sm:col-span-2">
                <Select
                  label={tf("sede")}
                  placeholder={tf("sedePlaceholder")}
                  options={opzioniSede}
                  value={watch("sede")}
                  onValueChange={(v) => setValue("sede", v as Dati["sede"], { shouldValidate: true })}
                  error={errors.sede ? tf("erroreSede") : undefined}
                />
              </div>

              <div className="sm:col-span-2">
                <Input label={tf("note")} multiline error={undefined} {...register("note", { maxLength: NOTE_MAX })} />
              </div>

              <div className="sm:col-span-2">
                <Checkbox
                  label={tf("privacy")}
                  checked={watch("privacy")}
                  onCheckedChange={(v) => setValue("privacy", v, { shouldValidate: true })}
                  error={errors.privacy ? tf("errorePrivacy") : undefined}
                />
              </div>

              {esito === "errore" ? (
                <p role="alert" className="sm:col-span-2 border-s-2 border-error ps-4 text-body text-cream">
                  {t("nonInviato")}{" "}
                  <a href={LOCALI[0].telefonoHref} className="underline-grow relative text-brass">
                    {LOCALI[0].telefono}
                  </a>
                </p>
              ) : null}

              <div className="sm:col-span-2 flex flex-wrap items-center gap-6">
                <Button type="submit" size="lg" loading={esito === "invio"} loadingLabel={tf("inviando")}>
                  {esito === "errore" ? t("riprova") : tf("invia")}
                </Button>
                <p className="font-sans text-mono text-stone-dim">{tf("nota")}</p>
              </div>
            </form>
          )}
        </div>

        {/* -------------------------------------------------- le coordinate */}
        <div className="order-1 lg:order-2 lg:w-5/12">
          <h3 className="font-mono text-mono uppercase text-brass">{t("informazioniTitolo")}</h3>

          <a
            href={LOCALI[0].telefonoHref}
            className="underline-grow relative mt-6 inline-block font-display text-h2 text-cream"
          >
            {LOCALI[0].telefono}
          </a>

          {THEFORK_URL ? (
            <p className="mt-4">
              <a
                href={THEFORK_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="underline-grow relative font-sans text-label uppercase text-brass"
              >
                {t("theFork")}
                <span className="sr-only"> {tc("nuovaScheda")}</span>
              </a>
            </p>
          ) : null}

          <ul className="mt-10 space-y-8">
            {LOCALI.map((sede) => {
              const chiave = sede.id === "gracciano-101" ? "gracciano101" : "gracciano72";
              const mappe = linkMappe(sede);
              return (
                <li key={sede.id} className="border-t border-border pt-6">
                  <p className="flex items-baseline gap-3">
                    <span className="font-mono text-mono text-brass tabular-nums lining-nums">
                      {sede.civico}
                    </span>
                    <span className="font-display text-h3 text-cream">{tl(`${chiave}.nome`)}</span>
                  </p>
                  <p className="mt-2 text-body text-stone">
                    {sede.via} {sede.civico} · {sede.cap} {sede.citta} ({sede.provincia})
                  </p>
                  <p className="mt-1">
                    <a href={sede.telefonoHref} className="underline-grow relative font-mono text-mono text-stone">
                      {sede.telefono}
                    </a>
                  </p>
                  <StatoAperturaBadge orari={sede.orari} className="mt-3" />
                  <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <a
                      href={mappe.google}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline-grow relative font-sans text-label uppercase text-brass"
                    >
                      Google Maps
                      <span className="sr-only"> {tc("nuovaScheda")}</span>
                    </a>
                    <a
                      href={mappe.apple}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline-grow relative font-sans text-label uppercase text-brass"
                    >
                      Apple Maps
                      <span className="sr-only"> {tc("nuovaScheda")}</span>
                    </a>
                  </p>
                </li>
              );
            })}
          </ul>

          <MappaLazy className="mt-10 aspect-[4/3] w-full" />
        </div>
      </div>
    </section>
  );
}
