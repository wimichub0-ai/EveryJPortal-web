"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Creator } from "@/lib/types";

// Keep already-open cards and vote sheets current when an author evicts someone.
export function useCreatorEvictions(initialCreators: Creator[]) {
  const [evictions, setEvictions] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || !initialCreators.length) return;
      refreshing = true;
      try {
        const { data, error } = await supabase.from("creators").select("id, is_evicted")
          .in("id", initialCreators.map((creator) => creator.id));
        if (!disposed && !error && data) {
          const next = Object.fromEntries(data.map((row: { id: string; is_evicted: boolean }) => [row.id, row.is_evicted]));
          setEvictions((previous) => Object.keys(next).length === Object.keys(previous).length &&
            Object.keys(next).every((id) => next[id] === previous[id]) ? previous : next);
        }
      } finally { refreshing = false; }
    };
    const refreshSafely = () => { void refresh().catch(() => {}); };
    const channel = supabase.channel("public-creator-evictions")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "creators" }, refreshSafely)
      .subscribe((status: string) => { if (status === "SUBSCRIBED") refreshSafely(); });
    refreshSafely();
    const interval = setInterval(refreshSafely, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") refreshSafely(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [initialCreators]);
  return useMemo(() => initialCreators.map((creator) => ({ ...creator,
    is_evicted: evictions[creator.id] ?? creator.is_evicted,
  })), [initialCreators, evictions]);
}
