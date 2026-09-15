"use client";

import { OPEN_WALKTHROUGH_EVENT } from "@/lib/walkthrough";

export function VotingHelpButton() {
  return (
    <button
      type="button"
      aria-label="How to vote"
      aria-haspopup="dialog"
      title="How to vote"
      onClick={() => window.dispatchEvent(new Event(OPEN_WALKTHROUGH_EVENT))}
      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-[#287A1D] transition hover:bg-brand-soft focus-visible:bg-brand-soft"
    >
      <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-current text-lg font-bold leading-none">?</span>
    </button>
  );
}
