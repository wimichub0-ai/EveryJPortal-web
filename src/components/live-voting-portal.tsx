"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreatorCard } from "@/components/creator-card";
import { TopCreators } from "@/components/top-creators";
import { VideoModal } from "@/components/video-modal";
import { VoteSheet } from "@/components/vote-sheet";
import { createClient } from "@/lib/supabase/client";
import type { Creator, VoteCount } from "@/lib/types";

type LiveVotingPortalProps = {
  creators: Creator[];
  initialCounts: VoteCount[];
  votingOpen: boolean;
};

export function LiveVotingPortal({ creators, initialCounts, votingOpen }: LiveVotingPortalProps) {
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialCounts.map((item) => [item.creator_id, item.vote_count])),
  );
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [voteCreator, setVoteCreator] = useState<Creator | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const countsRef = useRef(counts);
  const clearPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCounts = useCallback(async () => {
    const { data, error } = await createClient().rpc("get_vote_counts");
    if (error || !data) return;

    const nextCounts = Object.fromEntries(
      (data as VoteCount[]).map((item) => [item.creator_id, Number(item.vote_count)]),
    );

    const changed = new Set(
      creators
        .filter(
          (creator) =>
            (countsRef.current[creator.id] ?? 0) !== (nextCounts[creator.id] ?? 0),
        )
        .map((creator) => creator.id),
    );

    countsRef.current = nextCounts;
    setCounts(nextCounts);
    if (changed.size) {
      setChangedIds(changed);
      if (clearPulseTimer.current) clearTimeout(clearPulseTimer.current);
      clearPulseTimer.current = setTimeout(() => setChangedIds(new Set()), 650);
    }
  }, [creators]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("public-vote-counts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes" },
        () => void refreshCounts(),
      )
      .subscribe();

    return () => {
      if (clearPulseTimer.current) clearTimeout(clearPulseTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [refreshCounts]);

  const totalVotes = useMemo(
    () => creators.reduce((total, creator) => total + (counts[creator.id] ?? 0), 0),
    [counts, creators],
  );

  const rankedCreators = useMemo(
    () =>
      creators
        .map((creator) => ({ ...creator, voteCount: counts[creator.id] ?? 0 }))
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

    const nextCounts = { ...countsRef.current, [creatorId]: newTotal };
    countsRef.current = nextCounts;
    setCounts(nextCounts);
    setChangedIds(new Set([creatorId]));
    if (clearPulseTimer.current) clearTimeout(clearPulseTimer.current);
    clearPulseTimer.current = setTimeout(() => setChangedIds(new Set()), 650);
  }, []);

  return (
    <>
      <TopCreators creators={rankedCreators} changedIds={changedIds} />

      <section aria-labelledby="creator-list-heading">
        <h2 id="creator-list-heading" className="mb-4 font-display text-xl font-bold tracking-[-0.02em] text-[#2B2B2B]">
          Vote your favourite creator
        </h2>

        {creators.length ? (
          <div className="space-y-6">
            {creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                count={counts[creator.id] ?? 0}
                totalVotes={totalVotes}
                votingOpen={votingOpen}
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
        votingOpen={votingOpen}
        hasVoted={hasVoted}
        onClose={() => setSelectedCreator(null)}
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
