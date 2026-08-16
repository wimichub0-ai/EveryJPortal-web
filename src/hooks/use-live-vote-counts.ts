"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Creator, VoteCount } from "@/lib/types";

export function useLiveVoteCounts(creators: Creator[], initialCounts: VoteCount[]) {
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialCounts.map((item) => [item.creator_id, item.vote_count])),
  );
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const countsRef = useRef(counts);
  const clearPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseCreators = useCallback((creatorIds: Set<string>) => {
    if (!creatorIds.size) return;
    setChangedIds(creatorIds);
    if (clearPulseTimer.current) clearTimeout(clearPulseTimer.current);
    clearPulseTimer.current = setTimeout(() => setChangedIds(new Set()), 650);
  }, []);

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
    pulseCreators(changed);
  }, [creators, pulseCreators]);

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
    () => Object.values(counts).reduce((total, count) => total + count, 0),
    [counts],
  );

  const setOptimisticCount = useCallback(
    (creatorId: string, newTotal: number) => {
      const nextCounts = { ...countsRef.current, [creatorId]: newTotal };
      countsRef.current = nextCounts;
      setCounts(nextCounts);
      pulseCreators(new Set([creatorId]));
    },
    [pulseCreators],
  );

  return { counts, changedIds, totalVotes, setOptimisticCount };
}
