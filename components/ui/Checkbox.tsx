"use client";

// Checkbox su Radix. Il segno di spunta è un tratto d'ottone disegnato che
// si scrive da sinistra: nessuna icona di libreria, nessun glifo di sistema.

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  name?: string;
}

export function Checkbox({
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  error,
  name,
}: CheckboxProps) {
  const id = useId();

  return (
    <div className={cn(error && "shake")}>
      {/* L'area tappabile è tutta la riga, non solo il quadratino di 20px. */}
      <div className="flex min-h-(--tap-min) items-center gap-3">
        <RadixCheckbox.Root
          id={id}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={(next) => onCheckedChange?.(next === true)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            "group grid size-5 shrink-0 place-items-center rounded-xs border bg-tuff-light",
            "transition-[border-color,background-color] duration-(--dur-micro) ease-(--ease-soft)",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error
              ? "border-error"
              : "border-border-control hover:border-border-hover data-[state=checked]:border-brass data-[state=checked]:bg-brass/12",
          )}
        >
          <RadixCheckbox.Indicator forceMount>
            <svg viewBox="0 0 14 11" aria-hidden="true" className="size-3 text-brass">
              <path
                d="M1 5.5 5 9.5 13 1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                className="[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-(--dur-micro) ease-(--ease-out) group-data-[state=checked]:[stroke-dashoffset:0]"
              />
            </svg>
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>

        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-field text-stone",
            disabled && "cursor-not-allowed opacity-40",
          )}
        >
          {label}
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-1 font-sans text-mono text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
