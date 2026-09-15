"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Creator, VoteCount } from "@/lib/types";

export function useLiveVoteCounts(creators: Creator[], initialCounts: VoteCount[], initialTotal: number | null) {
  const [totalVotes, setTotalVotes] = useState(initialTotal);
  const refreshing = useRef(false);
  const refreshQueued = useRef(false);
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
    clearPulseTimer.current = setTimeout(() => setChangedIds(new Set()), 350);
  }, []);

  const refreshCounts = useCallback(async () => {
    if (refreshing.current) { refreshQueued.current = true; return; }
    refreshing.current = true;
    try {
      do {
        refreshQueued.current = false;
        const [countsResult, totalResult] = await Promise.all([
          createClient().rpc("get_vote_counts"),
          createClient().rpc("get_total_votes"),
        ]);
        if (!totalResult.error) setTotalVotes(Number(totalResult.data ?? 0));
        const { data, error } = countsResult;
        if (error || !data) continue;

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
      } while (refreshQueued.current);
    } catch {
      // Keep the last known values while offline; the next refresh retries.
    } finally { refreshing.current = false; }
  }, [creators, pulseCreators]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("public-vote-counts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => void refreshCounts(),
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") void refreshCounts();
      });
    // Reconcile after dropped events or backgrounded mobile tabs.
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") void refreshCounts();
    }, 15000);
    const onVisible = () => { if (document.visibilityState === "visible") void refreshCounts(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      if (clearPulseTimer.current) clearTimeout(clearPulseTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [refreshCounts]);

  const setOptimisticCount = useCallback(
    (creatorId: string, newTotal: number) => {
      const nextCounts = { ...countsRef.current, [creatorId]: newTotal };
      countsRef.current = nextCounts;
      setCounts(nextCounts);
      pulseCreators(new Set([creatorId]));
      void refreshCounts();
    },
    [pulseCreators, refreshCounts],
  );

  return { counts, changedIds, totalVotes, setOptimisticCount };
}
