"use client";

import { markWalkthroughSeen } from "@/lib/walkthrough";
import { YouTubeMark } from "@/components/youtube-mark";
import { ArrowDown, ThumbsUp, ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    title: "Find your creator",
    description: "Scroll through the creators and find the person you want to support.",
    icon: ArrowDown,
  },
  {
    title: "Subscribe on YouTube",
    description: "Tap on YouTube button to open the channel and subscribe. Then come back here to vote.",
    icon: null,
  },
  {
    title: "Vote your favourite creator",
    description: "Tap Vote, enter your name and email, then use the code in your inbox to confirm your vote.",
    icon: ThumbsUp,
  },
  {
    title: "Share your favourite creator",
    description: "Share your favourite creator’s link with friends and family so they can vote too.",
    icon: ExternalLink,
  },
];

export function HowItWorks({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDivElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const current = steps[step];
  const Icon = current.icon;

  useEffect(() => {
    markWalkthroughSeen();
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nextButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#F5F5F5]/95 px-5 py-8 backdrop-blur-sm"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.18 }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
        aria-describedby="how-it-works-description"
        className="my-auto w-full max-w-sm rounded-[28px] border border-black bg-white p-6 text-center shadow-[0_16px_60px_rgba(115,215,92,0.12)]"
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); onClose(); }
          if (event.key !== "Tab") return;
          const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>("button");
          if (!buttons?.length) return;
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }}
      >
        <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-brand-ink">How to vote</p>
        <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
          {steps.map((item, index) => <span key={item.title} className={`h-1.5 w-9 rounded-full ${index <= step ? "bg-[#73D75C]" : "bg-brand-soft"}`} />)}
        </div>
        <motion.div key={step} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.22 }}>
          <div className={`mx-auto mt-7 flex items-center justify-center ${Icon ? "h-20 w-20 rounded-3xl bg-brand-pale text-[#287A1D]" : "h-28 w-28"}`}>
            {Icon ? <Icon className="h-9 w-9" aria-hidden="true" /> : (
              <YouTubeMark className="h-8 w-12 scale-150" />
            )}
          </div>
          <div aria-live="polite" aria-atomic="true">
            <p className="mt-5 text-xs font-semibold text-[#888]">Step {step + 1} of {steps.length}</p>
            <h2 id="how-it-works-title" className="mt-2 font-display text-2xl font-bold leading-tight text-[#2B2B2B]">{current.title}</h2>
            <p id="how-it-works-description" className="mt-3 min-h-20 text-sm leading-6 text-[#737373]">{current.description}</p>
          </div>
        </motion.div>
        <button
          ref={nextButton}
          type="button"
          onClick={() => step === steps.length - 1 ? onClose() : setStep(step + 1)}
          className="mt-6 min-h-12 w-full rounded-full bg-[#73D75C] px-5 font-display text-sm font-bold text-[#173512] transition hover:bg-[#60C449] active:scale-[0.98]"
        >Got it</button>
        <button type="button" onClick={onClose} className="mt-2 min-h-11 w-full rounded-full text-sm font-semibold text-[#737373] transition hover:bg-black/5">Skip</button>
      </div>
    </motion.div>
  );
}
