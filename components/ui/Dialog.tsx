"use client";

// Dialogo su Radix: focus trap, Esc e aria-modal arrivano dalla libreria.
//
// Debito dello Step 01 saldato qui: lo scroll lock era quello di Radix, che
// agisce sul body. Dallo Step 03 lo scroll appartiene a Lenis, e fermarlo dal
// body significherebbe fermarne uno e lasciar correre l'altro — oltre a
// pagare un reflow dell'intera pagina nel frame esatto dell'apertura.

import { useEffect } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { duration, ease } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { bloccaScroll, sbloccaScroll } from "@/lib/scroll/lenis";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  footer,
}: DialogProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (open) bloccaScroll();
    else sbloccaScroll();
    return sbloccaScroll;
  }, [open]);

  const motionProps = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 12, filter: "blur(6px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: 8, filter: "blur(4px)" },
        transition: { duration: duration.base, ease: ease.out },
      };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-(--z-overlay) bg-tuff-deep/80 backdrop-blur-xs"
                initial={reduced ? undefined : { opacity: 0 }}
                animate={reduced ? undefined : { opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: duration.micro, ease: ease.soft }}
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content asChild forceMount>
              <motion.div
                {...motionProps}
                // Radix segnala la modalità nascondendo i fratelli con
                // aria-hidden e non emette più aria-modal. Alcuni screen reader
                // più vecchi si appoggiano ancora all'attributo: dichiararlo
                // costa nulla e non contraddice il resto dell'albero.
                aria-modal="true"
                className={cn(
                  "fixed left-1/2 top-1/2 z-(--z-overlay) w-[min(34rem,calc(100vw-2*var(--gutter)))]",
                  "-translate-x-1/2 -translate-y-1/2 rounded-md border border-border",
                  "bg-tuff-light p-8 shadow-(--glow-brass)",
                )}
              >
                <RadixDialog.Title className="text-h3">{title}</RadixDialog.Title>

                {description ? (
                  <RadixDialog.Description className="measure mt-4 text-body text-stone">
                    {description}
                  </RadixDialog.Description>
                ) : null}

                {children}

                {footer ? <div className="mt-8 flex flex-wrap gap-4">{footer}</div> : null}

                <RadixDialog.Close
                  aria-label={closeLabel}
                  className={cn(
                    "absolute end-4 top-4 grid size-11 place-items-center rounded-sm text-stone-dim",
                    "transition-colors duration-(--dur-micro) ease-(--ease-soft) hover:text-brass",
                  )}
                >
                  <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5">
                    <path
                      d="M1 1 13 13M13 1 1 13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                    />
                  </svg>
                </RadixDialog.Close>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        ) : null}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
