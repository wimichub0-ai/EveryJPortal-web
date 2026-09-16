"use client";

import { useCallback, useMemo, useState } from "react";
import { useLiveVotingSettings, type VotingSettings } from "@/hooks/use-live-voting-settings";
import { VotingStats } from "@/components/voting-stats";
import { CreatorCard } from "@/components/creator-card";
import { TopCreators } from "@/components/top-creators";
import { VideoModal } from "@/components/video-modal";
import { VoteSheet } from "@/components/vote-sheet";
import { useLiveVoteCounts } from "@/hooks/use-live-vote-counts";
import type { Creator, VoteCount } from "@/lib/types";

type LiveVotingPortalProps = {
  creators: Creator[];
  initialCounts: VoteCount[];
  initialSettings: VotingSettings;
  initialTotal: number | null;
};

export function LiveVotingPortal({ creators, initialCounts, initialSettings, initialTotal }: LiveVotingPortalProps) {
  const { votingStatus, pausedResumeAt, remaining } = useLiveVotingSettings(initialSettings);
  const { counts, changedIds, totalVotes, setOptimisticCount } =
    useLiveVoteCounts(creators, initialCounts, initialTotal);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [voteCreator, setVoteCreator] = useState<Creator | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const rankedCreators = useMemo(
    () =>
      creators
        .map((creator) => ({ ...creator, voteCount: counts[creator.id] ?? 0 }))
        .filter((creator) => creator.voteCount > 0)
        .sort((a, b) => b.voteCount - a.voteCount || a.display_order - b.display_order)
        .slice(0, 3),
    [counts, creators],
  );

  const openVoteSheet = useCallback((creator: Creator) => {
    setSelectedCreator(null);
    setVoteCreator(creator);
  }, []);

  const handleVoteResolved = useCallback((creatorId: string, newTotal?: number) => {
    setHasVoted(true);
    if (newTotal === undefined) return;

    setOptimisticCount(creatorId, newTotal);
  }, [setOptimisticCount]);

  return (
    <>
      <VotingStats totalVotes={totalVotes} pausedResumeAt={pausedResumeAt} votingStatus={votingStatus} remaining={remaining} />
      <TopCreators creators={rankedCreators} changedIds={changedIds} />

      <section aria-labelledby="creator-list-heading">
        <h2 id="creator-list-heading" className="mb-4 font-display text-xl font-bold tracking-[-0.02em] text-[#2B2B2B]">
          Vote your favourite creator
        </h2>

        {creators.length ? (
          <div className="space-y-6">
            {creators.map((creator, index) => (
              <CreatorCard
                key={creator.id}
                index={index}
                creator={creator}
                count={counts[creator.id] ?? 0}
                totalVotes={totalVotes ?? Object.values(counts).reduce((sum, count) => sum + count, 0)}
                votingStatus={votingStatus}
                hasVoted={hasVoted}
                countChanged={changedIds.has(creator.id)}
                onOpenVideo={setSelectedCreator}
                onVote={openVoteSheet}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] bg-white px-6 py-12 text-center shadow-[0_8px_30px_rgba(43,43,43,0.06)]">
            <p className="font-display text-lg font-bold">Creators coming soon</p>
            <p className="mt-2 text-sm text-[#777]">Check back soon to meet the lineup.</p>
          </div>
        )}
      </section>

      <VideoModal
        creator={selectedCreator}
        votingStatus={votingStatus}
        hasVoted={hasVoted}
        onClose={() => setSelectedCreator(null)}
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
