"use client";

import { useCallback, useMemo, useState } from "react";
import { useLiveVotingSettings, type VotingSettings } from "@/hooks/use-live-voting-settings";
import { VotingStats } from "@/components/voting-stats";
import { CreatorCard } from "@/components/creator-card";
import { VideoModal } from "@/components/video-modal";
import { VoteSheet } from "@/components/vote-sheet";
import { useLiveVoteCounts } from "@/hooks/use-live-vote-counts";
import type { Creator, VoteCount } from "@/lib/types";

type CreatorSpotlightProps = {
  creator: Creator;
  initialCounts: VoteCount[];
  initialSettings: VotingSettings;
  initialTotal: number | null;
};

export function CreatorSpotlight({
  creator,
  initialCounts,
  initialSettings,
  initialTotal,
}: CreatorSpotlightProps) {
  const { votingStatus, pausedResumeAt, remaining } = useLiveVotingSettings(initialSettings);
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
      <VotingStats totalVotes={totalVotes} pausedResumeAt={pausedResumeAt} votingStatus={votingStatus} remaining={remaining} />
      <CreatorCard
        creator={creator}
        count={counts[creator.id] ?? 0}
        totalVotes={totalVotes ?? Object.values(counts).reduce((sum, count) => sum + count, 0)}
        votingStatus={votingStatus}
        hasVoted={hasVoted}
        countChanged={changedIds.has(creator.id)}
        supportLine={`Support ${creator.name} in House Of Creators with a vote — and subscribe to the YouTube channel.`}
        onOpenVideo={setVideoCreator}
        onVote={openVoteSheet}
      />

      <VideoModal
        creator={videoCreator}
        votingStatus={votingStatus}
        hasVoted={hasVoted}
        onClose={() => setVideoCreator(null)}
        onVote={openVoteSheet}
      />

      {voteCreator && (
        <VoteSheet
          pausedResumeAt={pausedResumeAt}
          key={voteCreator.id}
          creator={voteCreator}
          votingStatus={votingStatus}
          onClose={() => setVoteCreator(null)}
          onVoteResolved={handleVoteResolved}
        />
      )}
    </>
  );
}
