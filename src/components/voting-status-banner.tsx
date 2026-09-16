"use client";

import { Pause } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { VotingStatus } from "@/lib/types";
import { resumeSeconds } from "@/lib/voting-settings";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";

export function VotingStatusBanner({ status, pausedResumeAt }: { status: VotingStatus; pausedResumeAt: string | null }) {
  const reduced = useReducedMotion();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (status !== "paused" || !pausedResumeAt) return;
    const tick = () => setNow(Date.now());
    const start = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, [status, pausedResumeAt]);
  if (status === "live") return null;
  if (status === "closed") {
    return <div className="rounded-[18px] bg-[#EEEEEE] px-4 py-[22px] text-center" role="status">
      <p className="font-display text-base font-semibold text-[#2B2B2B]">{COPY.closedTitle}</p>
      <p className="mt-2 text-xs text-[#777]">{COPY.closedSubtext}</p>
    </div>;
  }
  const remaining = resumeSeconds(pausedResumeAt, now);
  const units = remaining === null ? [] : [
    [Math.floor(remaining / 3600), COPY.hours],
    [Math.floor(remaining / 60) % 60, COPY.minutes],
    [remaining % 60, COPY.seconds],
  ] as const;
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#73D75C]/40 bg-brand-pale px-4 py-[22px] text-center">
      <div className="relative mx-auto mb-5 mt-2 flex h-[52px] w-[52px] items-center justify-center" aria-hidden="true">
        {!reduced && [0, 0.4].map((delay) => (
          <motion.span key={delay} className="absolute inset-0 rounded-full bg-[#73D75C]"
            initial={{ scale: 1, opacity: 0 }} animate={{ scale: [1, 1.9], opacity: [0.45, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay, ease: "easeOut" }} />
        ))}
        <motion.div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#73D75C] text-[#173512]"
          animate={reduced ? { scale: 1 } : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2.2, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }}>
          <Pause className="h-6 w-6 fill-current" />
        </motion.div>
      </div>
      <div role="status">
        <p className="font-display text-base font-semibold text-[#2B2B2B]">{COPY.pausedTitle}</p>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-brand-ink">{COPY.pausedSubtext}</p>
      </div>
      {remaining === 0 ? <p className="mt-4 text-xs font-semibold text-brand-ink" role="status">{COPY.pausedLonger}</p> : remaining !== null && (
        <div className="mt-4 flex justify-center gap-2" role="timer" aria-label={COPY.resumeTimerLabel}>
          {units.map(([value, label]) => <div key={label} className="min-w-14 rounded-full bg-white px-3 py-2 shadow-sm">
            <motion.span key={value} className="block font-display text-lg font-bold tabular-nums text-brand-ink"
              animate={reduced ? { y: 0 } : { y: [0, -3, 0] }} transition={{ duration: 0.22 }}>
              {String(value).padStart(2, "0")}
            </motion.span>
            <span className="block text-[10px] text-brand-ink">{label}</span>
          </div>)}
        </div>
      )}
    </div>
  );
}
