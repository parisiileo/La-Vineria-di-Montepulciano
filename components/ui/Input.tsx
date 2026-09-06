"use client";

// Campo con etichetta flottante. Validazione al blur, mai al change: correggere
// qualcuno mentre sta ancora scrivendo è ostile, e fa lampeggiare il bordo.

import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  /** Messaggio di errore già localizzato. Presente = campo in errore. */
  error?: string;
  /** Textarea invece di input a riga singola. */
  multiline?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, multiline = false, className, id, onFocus, onBlur, onChange, value, defaultValue, ...rest },
  ref,
) {
  // I campi data, ora e numero disegnano SEMPRE qualcosa: il segnaposto del
  // formato ("mm/gg/aaaa", "--:--") o un valore iniziale. L'etichetta
  // flottante, che presume un campo visivamente vuoto, ci finisce sopra e le
  // due scritte si sovrappongono. Su questi tipi l'etichetta parte già alta.
  const sempreAlta = ["date", "time", "datetime-local", "month", "week", "number"].includes(
    String(rest.type ?? ""),
  );
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;

  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState<boolean>(
    String(value ?? defaultValue ?? "").length > 0,
  );
  const lifted = focused || filled || sempreAlta;

  const field = cn(
    // 16px minimo: sotto, iOS zooma al focus e rompe il layout.
    "peer w-full rounded-sm border bg-tuff-light px-4 pb-2 pt-6 text-field text-cream",
    "transition-[border-color,box-shadow] duration-(--dur-micro) ease-(--ease-soft)",
    "disabled:cursor-not-allowed disabled:opacity-40",
    error
      ? "border-error shadow-(--glow-error)"
      : "border-border-control hover:border-border-hover focus-visible:border-brass focus-visible:shadow-(--glow-focus)",
    multiline ? "min-h-32 resize-y" : "min-h-(--tap-min)",
    className,
  );

  const shared = {
    id: fieldId,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? errorId : undefined,
    value,
    defaultValue,
    onFocus: (e: React.FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setFocused(true);
      onFocus?.(e as React.FocusEvent<HTMLInputElement>);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setFocused(false);
      setFilled(e.target.value.length > 0);
      onBlur?.(e as React.FocusEvent<HTMLInputElement>);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setFilled(e.target.value.length > 0);
      onChange?.(e as React.ChangeEvent<HTMLInputElement>);
    },
  };

  return (
    <div className={cn("relative", error && "shake")}>
      {multiline ? (
        <textarea {...shared} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={field} />
      ) : (
        <input ref={ref} {...shared} {...rest} className={field} />
      )}

      <label
        htmlFor={fieldId}
        className={cn(
          "pointer-events-none absolute start-4 origin-left text-stone-dim",
          "transition-[transform,color] duration-(--dur-micro) ease-(--ease-soft)",
          lifted ? "top-2 scale-(--label-scale)" : "top-1/2 -translate-y-1/2",
          multiline && lifted && "top-2 translate-y-0",
          multiline && !lifted && "top-6 translate-y-0",
          focused && !error && "text-brass",
          error && "text-error",
        )}
      >
        {label}
      </label>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 font-sans text-mono text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
