"use client";

import { useCallback, useMemo, useState } from "react";
import { VotingStats, useVotingDeadline } from "@/components/voting-stats";
import { CreatorCard } from "@/components/creator-card";
import { VideoModal } from "@/components/video-modal";
import { VoteSheet } from "@/components/vote-sheet";
import { useLiveVoteCounts } from "@/hooks/use-live-vote-counts";
import type { Creator, VoteCount } from "@/lib/types";

type CreatorSpotlightProps = {
  creator: Creator;
  initialCounts: VoteCount[];
  votingOpen: boolean;
  votingEndsAt: string | null;
  initialTotal: number | null;
};

export function CreatorSpotlight({
  creator,
  initialCounts,
  votingOpen: configuredOpen,
  votingEndsAt,
  initialTotal,
}: CreatorSpotlightProps) {
  const { votingOpen, remaining } = useVotingDeadline(configuredOpen, votingEndsAt);
  const creators = useMemo(() => [creator], [creator]);
  const { counts, changedIds, totalVotes, setOptimisticCount } =
    useLiveVoteCounts(creators, initialCounts, initialTotal);
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
      <VotingStats totalVotes={totalVotes} votingOpen={votingOpen} remaining={remaining} />
      <CreatorCard
        creator={creator}
        count={counts[creator.id] ?? 0}
        totalVotes={totalVotes ?? Object.values(counts).reduce((sum, count) => sum + count, 0)}
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
