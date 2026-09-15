"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getVotingDeadline } from "@/lib/voting-deadline";
import { Reveal } from "@/components/reveal";

export function useVotingDeadline(configuredOpen: boolean, endsAt: string | null) {
  const deadline = endsAt ? Date.parse(endsAt) : NaN;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!configuredOpen || !Number.isFinite(deadline)) return;
    const tick = () => setNow(Date.now());
    const start = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, [configuredOpen, deadline]);
  return getVotingDeadline(configuredOpen, endsAt, now);
}

export function VotingStats({ totalVotes, votingOpen, remaining }: { totalVotes: number | null; votingOpen: boolean; remaining: number | null }) {
  const number = useRef<HTMLSpanElement>(null);
  const previous = useRef(totalVotes);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (totalVotes === null || !number.current) return;
    const target = number.current;
    if (reduced || previous.current === null) {
      target.textContent = totalVotes.toLocaleString();
      previous.current = totalVotes;
      return;
    }
    const animation = animate(previous.current, totalVotes, {
      duration: 0.32,
      onUpdate: (value) => { target.textContent = Math.round(value).toLocaleString(); },
    });
    previous.current = totalVotes;
    return () => animation.stop();
  }, [totalVotes, reduced]);
  const units = remaining === null ? [] : [
    [Math.floor(remaining / 86400), "days"],
    [Math.floor(remaining / 3600) % 24, "hrs"],
    [Math.floor(remaining / 60) % 60, "min"],
    [remaining % 60, "sec"],
  ] as const;
  if (totalVotes === null && votingOpen && remaining === null) return null;
  return <Reveal className="mb-6 space-y-4 text-center">
    {totalVotes !== null && <p className="font-display text-xl font-bold" aria-label={`${totalVotes.toLocaleString()} votes cast`}>
      <span aria-hidden="true">🔥 <span ref={number} className="tabular-nums">{totalVotes.toLocaleString()}</span> votes cast</span>
    </p>}
    {!votingOpen ? <p role="status" className="inline-flex rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-ink">Voting has ended</p> : remaining !== null && (
      <div role="timer" aria-label="Time until voting closes" className="flex justify-center gap-2">
        {units.map(([value, label]) => <div key={label} className="min-w-14 rounded-xl border border-brand/40 bg-brand-pale px-3 py-2">
          <span className="block font-display text-xl font-bold tabular-nums text-brand-ink">{String(value).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase tracking-wide text-brand-ink">{label}</span>
        </div>)}
      </div>
    )}
  </Reveal>;
}
