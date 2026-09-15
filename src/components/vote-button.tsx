"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import type { Creator } from "@/lib/types";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";

type VoteButtonProps = {
  creator: Creator;
  votingOpen: boolean;
  hasVoted?: boolean;
  onVote: (creator: Creator) => void;
};

export function VoteButton({ creator, votingOpen, hasVoted = false, onVote }: VoteButtonProps) {
  const reduced = useReducedMotion();
  if (hasVoted) {
    return (
      <button
        type="button"
        disabled
        className="min-h-12 w-full cursor-default rounded-full bg-[#EEF1EE] px-5 font-display text-sm font-semibold text-[#607064]"
      >
        {COPY.votedButton}
      </button>
    );
  }
  if (!votingOpen) {
    return (
      <button
        type="button"
        disabled
        className="min-h-12 w-full cursor-not-allowed rounded-full bg-[#D8D8D8] px-5 font-display text-sm font-semibold text-[#777]"
      >
        Voting has ended
      </button>
    );
  }

  return (
    <motion.button
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.12 }}
      type="button"
      onClick={() => onVote(creator)}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#73D75C] px-5 font-display text-sm font-bold text-[#173512] shadow-[0_6px_18px_rgba(115,215,92,0.22)] transition hover:bg-[#60C449]"
    >
      Vote for {creator.name}
      <ThumbsUp className="h-[18px] w-[18px]" aria-hidden="true" />
    </motion.button>
  );
}
