"use client";

import { useCallback, useMemo, useState } from "react";
import { CreatorCard } from "@/components/creator-card";
import { VideoModal } from "@/components/video-modal";
import { VoteSheet } from "@/components/vote-sheet";
import { useLiveVoteCounts } from "@/hooks/use-live-vote-counts";
import type { Creator, VoteCount } from "@/lib/types";

type CreatorSpotlightProps = {
  creator: Creator;
  initialCounts: VoteCount[];
  votingOpen: boolean;
};

export function CreatorSpotlight({
  creator,
  initialCounts,
  votingOpen,
}: CreatorSpotlightProps) {
  const creators = useMemo(() => [creator], [creator]);
  const { counts, changedIds, totalVotes, setOptimisticCount } =
    useLiveVoteCounts(creators, initialCounts);
  const [videoCreator, setVideoCreator] = useState<Creator | null>(null);
  const [voteCreator, setVoteCreator] = useState<Creator | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const openVoteSheet = useCallback((selected: Creator) => {
    setVideoCreator(null);
    setVoteCreator(selected);
  }, []);

  const handleVoteResolved = useCallback(
    (creatorId: string, newTotal?: number) => {
      setHasVoted(true);
      if (newTotal !== undefined) setOptimisticCount(creatorId, newTotal);
    },
    [setOptimisticCount],
  );

  return (
    <>
      <CreatorCard
        creator={creator}
        count={counts[creator.id] ?? 0}
        totalVotes={totalVotes}
        votingOpen={votingOpen}
        hasVoted={hasVoted}
        countChanged={changedIds.has(creator.id)}
        supportLine={`Support ${creator.name} in House Of Creators with a vote — and subscribe to the YouTube channel.`}
        onOpenVideo={setVideoCreator}
        onVote={openVoteSheet}
      />

      <VideoModal
        creator={videoCreator}
        votingOpen={votingOpen}
        hasVoted={hasVoted}
        onClose={() => setVideoCreator(null)}
        onVote={openVoteSheet}
      />

      {voteCreator && (
        <VoteSheet
          key={voteCreator.id}
          creator={voteCreator}
          votingOpen={votingOpen}
          onClose={() => setVoteCreator(null)}
          onVoteResolved={handleVoteResolved}
        />
      )}
    </>
  );
}
