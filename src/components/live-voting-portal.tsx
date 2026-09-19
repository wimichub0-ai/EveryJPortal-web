"use client";

import { rankCreators } from "@/lib/rank-creators";
import { WinnerSpotlight } from "@/components/winner-spotlight";
import { useDeclaredWinner } from "@/hooks/use-declared-winner";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";
import type { ReactNode } from "react";
import { useCreatorEvictions } from "@/hooks/use-creator-evictions";
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
  hero: ReactNode;
  creators: Creator[];
  initialCounts: VoteCount[];
  initialSettings: VotingSettings;
  initialTotal: number | null;
};

export function LiveVotingPortal({ creators: initialCreators, initialCounts, initialSettings, initialTotal, hero }: LiveVotingPortalProps) {
  const creators = useCreatorEvictions(initialCreators);
  const { votingStatus, pausedResumeAt, remaining, winnerCreatorId } = useLiveVotingSettings(initialSettings);
  const { counts, changedIds, totalVotes, setOptimisticCount } =
    useLiveVoteCounts(creators, initialCounts, initialTotal);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [voteCreator, setVoteCreator] = useState<Creator | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const rankedCreators = useMemo(() => rankCreators(creators, counts), [counts, creators]);
  const winner = useDeclaredWinner(winnerCreatorId, creators.find((creator) => creator.id === winnerCreatorId));
  const portalVotingStatus = winnerCreatorId ? "closed" : votingStatus;

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
      {winner && <WinnerSpotlight key={winner.id} creator={winner} count={counts[winner.id] ?? 0} />}
      {hero}
      {!winnerCreatorId && <VotingStats pausedResumeAt={pausedResumeAt} votingStatus={portalVotingStatus} remaining={remaining} />}
      {!winnerCreatorId && <TopCreators creators={rankedCreators} changedIds={changedIds} />}

      <section aria-labelledby="creator-list-heading">
        <h2 id="creator-list-heading" className="mb-4 font-display text-xl font-bold tracking-[-0.02em] text-[#2B2B2B]">
          {winnerCreatorId ? COPY.finalStandings : COPY.voteForCreator}
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
                votingStatus={portalVotingStatus}
                hasVoted={hasVoted}
                countChanged={changedIds.has(creator.id)}
                finalStanding={Boolean(winnerCreatorId)}
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
        creator={!winnerCreatorId && selectedCreator ? creators.find((creator) => creator.id === selectedCreator.id) ?? selectedCreator : null}
        votingStatus={portalVotingStatus}
        hasVoted={hasVoted}
        onClose={() => setSelectedCreator(null)}
        onVote={openVoteSheet}
      />
      {!winnerCreatorId && voteCreator && (
        <VoteSheet
          pausedResumeAt={pausedResumeAt}
          key={voteCreator.id}
          creator={creators.find((creator) => creator.id === voteCreator.id) ?? voteCreator}
          votingStatus={portalVotingStatus}
          onClose={() => setVoteCreator(null)}
          onVoteResolved={handleVoteResolved}
        />
      )}
    </>
  );
}
