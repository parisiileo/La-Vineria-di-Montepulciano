"use client";

// Ogni primitiva in tutti i suoi stati, affiancata. Gli stati hover e active
// non si possono forzare da CSS su un elemento reale: sono etichettati e vanno
// provati col puntatore, mentre focus, disabled, loading ed error sono resi.

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { LOCALI } from "@/lib/data/locali";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border py-4">
      <span className="w-32 shrink-0 font-sans text-label uppercase text-stone-dim">{label}</span>
      {children}
    </div>
  );
}

export function Primitives() {
  const t = useTranslations("kitchenSink.primitive");
  const tf = useTranslations("kitchenSink.form");
  const td = useTranslations("kitchenSink.dialogo");
  const tc = useTranslations("common");
  const tl = useTranslations("locali");
  const ta = useTranslations("a11y");

  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const rooms = LOCALI.map((sede) => ({
    value: sede.id,
    label: `${tl(`${sede.id === "gracciano-101" ? "gracciano101" : "gracciano72"}.nome`)} — ${sede.via} ${sede.civico}`,
  }));

  return (
    <div className="space-y-16">
      <section aria-labelledby="ks-buttons">
        <h3 id="ks-buttons" className="mb-4 text-h3">{t("bottoni")}</h3>

        {(["primary", "ghost", "link"] as const).map((variant) => (
          <Row key={variant} label={variant}>
            <Button variant={variant}>{t("statoDefault")}</Button>
            <Button variant={variant} disabled>{t("statoDisabled")}</Button>
            <Button variant={variant} loading loadingLabel={tc("caricamento")}>
              {t("statoLoading")}
            </Button>
          </Row>
        ))}

        <Row label="lg">
          <Button size="lg">{tc("prenota")}</Button>
          <Button variant="ghost" size="lg">{tc("prenota")}</Button>
        </Row>
      </section>

      <section aria-labelledby="ks-fields">
        <h3 id="ks-fields" className="mb-4 text-h3">{t("campi")}</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <Input label={tf("nome")} name="ks-nome" />
          <Input label={tf("email")} name="ks-email" type="email" defaultValue="ercolani@" error={tf("erroreEmail")} />
          <Input label={tf("coperti")} name="ks-coperti" type="number" inputMode="numeric" min={1} />
          <Input label={tf("nome")} name="ks-disabled" disabled defaultValue="—" />
          <div className="sm:col-span-2">
            <Input label={tf("note")} name="ks-note" multiline />
          </div>
        </div>
      </section>

      <section aria-labelledby="ks-selection">
        <h3 id="ks-selection" className="mb-4 text-h3">{t("selezione")}</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <Select label={tf("sede")} placeholder={tf("sedePlaceholder")} options={rooms} name="ks-sede" />
          <Select label={tf("sede")} placeholder={tf("sedePlaceholder")} options={rooms} disabled />
          <Select
            label={tf("sede")}
            placeholder={tf("sedePlaceholder")}
            options={rooms}
            error={tc("obbligatorio")}
          />
          <div className="space-y-4">
            <Checkbox label={tf("consenso")} checked={agreed} onCheckedChange={setAgreed} />
            <Checkbox label={tf("consenso")} disabled />
            <Checkbox label={tf("consenso")} error={tc("obbligatorio")} />
          </div>
        </div>
      </section>

      <section aria-labelledby="ks-dialogs">
        <h3 id="ks-dialogs" className="mb-4 text-h3">{t("dialoghi")}</h3>
        <div className="flex flex-wrap items-center gap-6">
          <Button variant="ghost" onClick={() => setOpen(true)}>{tc("apri")}</Button>
          <LangSwitch />
        </div>

        <Dialog
          open={open}
          onOpenChange={setOpen}
          title={td("titolo")}
          description={td("corpo")}
          closeLabel={ta("chiudiDialogo")}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>{td("conferma")}</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>{tc("annulla")}</Button>
            </>
          }
        />
      </section>
    </div>
  );
}
