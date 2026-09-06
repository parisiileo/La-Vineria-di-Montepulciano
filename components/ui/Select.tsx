"use client";

// Select su Radix headless. Il `<select>` nativo non è stilizzabile in modo
// coerente su Windows e Android: qui il pannello è un elemento sollevato.

import * as RadixSelect from "@radix-ui/react-select";
import { ERRORE, etichettaCampo, guscioCampo } from "@/components/ui/campo";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  placeholder: string;
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  name?: string;
}

/** Chevron disegnato: nessuna icona di libreria, nessuna emoji. */
function Chevron() {
  return (
    <svg viewBox="0 0 12 8" aria-hidden="true" className="size-3 shrink-0 text-brass">
      <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function Select({
  label,
  placeholder,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  error,
  name,
}: SelectProps) {
  return (
    <div className={cn("relative", error && "shake")}>
      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <RadixSelect.Trigger
          aria-label={label}
          aria-invalid={error ? true : undefined}
          // Stesso guscio degli altri campi, ed è il punto: prima l'etichetta
          // di questo controllo stava FUORI dal riquadro, in maiuscoletto,
          // mentre tutti gli altri campi la portano dentro. Due trattamenti
          // per la stessa cosa nello stesso modulo si notano subito, anche
          // senza saper dire cosa non torna.
          className={cn(
            guscioCampo({ error }),
            "flex min-h-(--tap-min) items-center justify-between gap-3 pb-2 pt-6 text-start",
            "data-[placeholder]:text-stone-dim data-[state=open]:border-brass data-[state=open]:shadow-(--glow-focus)",
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <Chevron />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={8}
            className={cn(
              "z-(--z-overlay) min-w-(--radix-select-trigger-width) overflow-hidden rounded-sm border border-border bg-tuff-raised shadow-(--glow-brass)",
              "data-[state=open]:animate-none",
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "relative flex min-h-(--tap-min) cursor-pointer select-none items-center rounded-sm px-3 text-field text-stone",
                    "transition-colors duration-(--dur-micro) ease-(--ease-soft)",
                    "data-[highlighted]:bg-brass/10 data-[highlighted]:text-cream data-[highlighted]:outline-none",
                    "data-[state=checked]:text-brass",
                  )}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {/* L'etichetta sta dentro il riquadro e sempre in alto, come nei campi
          di testo: il grilletto mostra già un valore o un segnaposto, quindi
          non esiste lo stato «campo vuoto» in cui l'etichetta starebbe al
          centro. È `aria-hidden` perché il grilletto porta già `aria-label`. */}
      <span aria-hidden="true" className={etichettaCampo({ alta: true, error })}>
        {label}
      </span>

      {error ? (
        <p role="alert" className={ERRORE}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
