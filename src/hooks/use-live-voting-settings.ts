"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeVotingSettings } from "@/lib/voting-settings";
import { useVotingDeadline } from "@/components/voting-stats";
import type { PortalSettings, VotingStatus } from "@/lib/types";

export type VotingSettings = Pick<PortalSettings, "voting_status" | "voting_ends_at" | "paused_resume_at" | "winner_creator_id" | "winner_declared_at">;

export function useLiveVotingSettings(initialSettings: VotingSettings) {
  const [settings, setSettings] = useState(initialSettings);
  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
        if (!disposed && !error && data) setSettings(normalizeVotingSettings(data));
      } finally { refreshing = false; }
    };
    const safelyRefresh = () => { void refresh().catch(() => {}); };
    const channel = supabase.channel("public-voting-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings", filter: "id=eq.1" }, safelyRefresh)
      .subscribe((status: string) => { if (status === "SUBSCRIBED") safelyRefresh(); });
    safelyRefresh();
    const interval = setInterval(safelyRefresh, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") safelyRefresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, []);
  const { remaining } = useVotingDeadline(settings.voting_status === "live", settings.voting_ends_at);
  const votingStatus: VotingStatus = settings.voting_status === "live" && remaining === 0 ? "closed" : settings.voting_status;
  return { votingStatus, pausedResumeAt: settings.paused_resume_at, remaining, winnerCreatorId: settings.winner_creator_id, winnerDeclaredAt: settings.winner_declared_at };
}
