"use client";

import Link from "next/link";
import { WinnerSpotlight } from "@/components/winner-spotlight";
import { useDeclaredWinner } from "@/hooks/use-declared-winner";
import { useCreatorEvictions } from "@/hooks/use-creator-evictions";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";
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
  creator: initialCreator,
  initialCounts,
  initialSettings,
  initialTotal,
}: CreatorSpotlightProps) {
  const { votingStatus, pausedResumeAt, remaining, winnerCreatorId } = useLiveVotingSettings(initialSettings);
  const initialCreators = useMemo(() => [initialCreator], [initialCreator]);
  const creators = useCreatorEvictions(initialCreators);
  const creator = creators[0];
  const winner = useDeclaredWinner(winnerCreatorId, creator.id === winnerCreatorId ? creator : null);
  const portalVotingStatus = winnerCreatorId ? "closed" : votingStatus;
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
      {!winnerCreatorId && <VotingStats pausedResumeAt={pausedResumeAt} votingStatus={portalVotingStatus} remaining={remaining} />}
      {winner && winner.id !== creator.id && <Link className="mb-5 block rounded-xl bg-brand-pale px-4 py-3 text-center text-sm font-bold text-brand-ink" href={`/c/${encodeURIComponent(winner.slug)}`}>{COPY.seeWinner}</Link>}
      {winnerCreatorId === creator.id ? <WinnerSpotlight creator={creator} count={counts[creator.id] ?? 0} /> : (
        <CreatorCard
          creator={creator}
          count={counts[creator.id] ?? 0}
          totalVotes={totalVotes ?? Object.values(counts).reduce((sum, count) => sum + count, 0)}
          votingStatus={portalVotingStatus}
          hasVoted={hasVoted}
          countChanged={changedIds.has(creator.id)}
          finalStanding={Boolean(winnerCreatorId)}
          supportLine={COPY.supportLine(creator.name)}
          onOpenVideo={setVideoCreator}
          onVote={openVoteSheet}
        />
      )}

      <VideoModal
        creator={!winnerCreatorId && videoCreator ? creator : null}
        votingStatus={portalVotingStatus}
        hasVoted={hasVoted}
        onClose={() => setVideoCreator(null)}
        onVote={openVoteSheet}
      />

      {!winnerCreatorId && voteCreator && (
        <VoteSheet
          pausedResumeAt={pausedResumeAt}
          key={voteCreator.id}
          creator={creator}
          votingStatus={portalVotingStatus}
          onClose={() => setVoteCreator(null)}
          onVoteResolved={handleVoteResolved}
        />
      )}
    </>
  );
}
