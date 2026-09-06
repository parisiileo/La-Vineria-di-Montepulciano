"use client";

// Transizione di pagina: una tenda che sale con `clip-path` e il wordmark al
// centro. La usa anche il cambio lingua, che è una navigazione come un'altra.
//
// L'unico requisito assoluto è che non ci sia MAI un lampo bianco. Il tufo è
// dipinto dal primo byte (`html` ha il fondo in globals.css) e questa tenda è
// in tufo profondo: fra la vecchia pagina e la nuova non esiste un frame in
// cui il fondo del documento non sia già il nostro.
//
// L'uscita non viene attesa prima di navigare: bloccare la navigazione per
// aspettare un'animazione è il modo più veloce per far sembrare lento un sito
// che è veloce. La tenda copre, la navigazione parte, la tenda si ritira.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { duration, ease } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

export function PageTransition() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const t = useTranslations("brand");
  const [visibile, setVisibile] = useState(false);
  const primo = useRef(true);

  useEffect(() => {
    // Al primo montaggio non c'è nulla da coprire: la pagina sta arrivando.
    if (primo.current) {
      primo.current = false;
      return;
    }
    if (reduced) return;
    setVisibile(true);
    const timer = window.setTimeout(() => setVisibile(false), duration.slow * 1000);
    return () => window.clearTimeout(timer);
  }, [pathname, reduced]);

  return (
    <AnimatePresence>
      {visibile ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-(--z-grain) flex items-center justify-center bg-tuff-deep"
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: duration.slow / 2, ease: ease.inOut }}
        >
          <motion.span
            className="font-display text-h3 text-cream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.micro, ease: ease.soft }}
          >
            {t("nome")}
          </motion.span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
