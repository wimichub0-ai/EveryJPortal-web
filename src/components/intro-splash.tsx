"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { hasSeenWalkthrough, OPEN_WALKTHROUGH_EVENT } from "@/lib/walkthrough";
import { HowItWorks } from "@/components/how-it-works";

const SPLASH_DURATION_MS = 3000;
const EXIT_DURATION_MS = 180;

export function IntroSplash({ title }: { title: string }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "splash" | "instructions">("hidden");
  const reduced = useReducedMotion();
  const dismiss = useCallback(() => {
    const nextPhase = hasSeenWalkthrough() ? "hidden" : "instructions";
    setPhase((current) => current === "splash" ? nextPhase : current);
  }, []);

  useEffect(() => {
    const show = setTimeout(() => setPhase("splash"), 0);
    const hide = setTimeout(dismiss, SPLASH_DURATION_MS - EXIT_DURATION_MS);
    const openHelp = () => {
      clearTimeout(show);
      clearTimeout(hide);
      setPhase("instructions");
    };
    window.addEventListener(OPEN_WALKTHROUGH_EVENT, openHelp);
    return () => {
      window.removeEventListener(OPEN_WALKTHROUGH_EVENT, openHelp);
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [dismiss, pathname]);

  return <AnimatePresence mode="wait">{phase === "splash" && (
    <motion.button key="splash" type="button" aria-label="Skip introduction" onClick={dismiss}
      className="fixed inset-0 z-50 flex h-dvh w-full flex-col items-center justify-center bg-gradient-to-b from-[#E5F8DF] to-[#F5F5F5] px-6 text-center"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: reduced ? 1 : 1.025, pointerEvents: "none" }} transition={{ duration: 0.18 }}>
      <motion.div
        className="relative"
        initial={reduced ? false : { opacity: 0, scale: 0.65, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute -inset-5 rounded-full bg-brand/25 blur-xl"
          animate={reduced ? undefined : { scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          animate={reduced ? undefined : { y: [0, -7, 0], scale: [1, 1.045, 1], rotate: [0, 2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.38 }}
        >
          <Image src="/everythingjos.png" alt="Everything Jos logo" width={112} height={112} sizes="112px" className="relative rounded-full object-contain shadow-[0_12px_32px_rgba(115,215,92,0.18)]" />
        </motion.div>
      </motion.div>
      <p className="mt-7 font-display text-2xl font-bold">{title}</p>
    </motion.button>
  )}
    {phase === "instructions" && <HowItWorks key="instructions" onClose={() => setPhase("hidden")} />}
  </AnimatePresence>;
}
