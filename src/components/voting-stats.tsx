"use client";

import { useEffect, useState } from "react";
import { getVotingDeadline } from "@/lib/voting-deadline";
import { VotingStatusBanner } from "@/components/voting-status-banner";
import type { VotingStatus } from "@/lib/types";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";
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

export function VotingStats({ votingStatus, pausedResumeAt, remaining }: { votingStatus: VotingStatus; pausedResumeAt: string | null; remaining: number | null }) {
  const units = remaining === null ? [] : [
    [Math.floor(remaining / 86400), COPY.days],
    [Math.floor(remaining / 3600) % 24, COPY.hours],
    [Math.floor(remaining / 60) % 60, COPY.minutes],
    [remaining % 60, COPY.seconds],
  ] as const;
  if (votingStatus === "live" && remaining === null) return null;
  return <Reveal className="mb-6 space-y-4 text-center">
    <VotingStatusBanner status={votingStatus} pausedResumeAt={pausedResumeAt} />
    {votingStatus === "live" && remaining !== null && (
      <div role="timer" aria-label={COPY.closesTimerLabel} className="flex justify-center gap-2">
        {units.map(([value, label]) => <div key={label} className="min-w-14 rounded-xl border border-brand/40 bg-brand-pale px-3 py-2">
          <span className="block font-display text-xl font-bold tabular-nums text-brand-ink">{String(value).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase tracking-wide text-brand-ink">{label}</span>
        </div>)}
      </div>
    )}
  </Reveal>;
}
