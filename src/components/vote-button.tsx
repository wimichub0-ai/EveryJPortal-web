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
    <button
      type="button"
      onClick={() => onVote(creator)}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F2A93B] px-5 font-display text-sm font-bold text-white shadow-[0_6px_18px_rgba(242,169,59,0.22)] transition hover:bg-[#E99C29] active:scale-[0.99]"
    >
      Vote for {creator.name}
      <ThumbsUp className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
