import { normalizeVotingSettings } from "@/lib/voting-settings";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Creator, PortalSettings, VoteCount } from "@/lib/types";

const fallbackSettings: PortalSettings = {
  campaign_title: "Everything Jos",
  campaign_subtitle:
    "Vote for the creator you want to see win the grand prize of 1 million naira",
  voting_open: true,
  voting_status: "live",
  paused_resume_at: null,
  voting_ends_at: null,
};

// Normalize legacy rows only while the status migration is pending.
async function getSettings(supabase: ReturnType<typeof createClient>) {
  const result = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return { ...result, data: result.data ? { ...result.data, ...normalizeVotingSettings(result.data) } : null };
}

export const getPortalData = cache(async () => {
  const supabase = createClient();
  const [settingsResult, creatorsResult, countsResult, totalResult] = await Promise.all([
    getSettings(supabase),
    supabase
      .from("creators")
      .select(
        "id, name, slug, tagline, photo_url, youtube_video_id, youtube_channel_url, display_order, is_active, is_evicted, evicted_at",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.rpc("get_vote_counts"),
    supabase.rpc("get_total_votes"),
  ]);

  return {
    totalVotes: totalResult.error ? null : Number(totalResult.data ?? 0),
    settings: (settingsResult.data as PortalSettings | null) ?? fallbackSettings,
    creators: (creatorsResult.data as Creator[] | null) ?? [],
    counts:
      (countsResult.data as VoteCount[] | null)?.map((count) => ({
        ...count,
        vote_count: Number(count.vote_count),
      })) ?? [],
    error: Boolean(settingsResult.error || creatorsResult.error || countsResult.error),
  };
});

export const getCreatorPageData = cache(async (slug: string) => {
  const supabase = createClient();
  const [settingsResult, creatorResult, countsResult, totalResult] = await Promise.all([
    getSettings(supabase),
    supabase
      .from("creators")
      .select(
        "id, name, slug, tagline, photo_url, youtube_video_id, youtube_channel_url, display_order, is_active, is_evicted, evicted_at",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle(),
    supabase.rpc("get_vote_counts"),
    supabase.rpc("get_total_votes"),
  ]);

  return {
    totalVotes: totalResult.error ? null : Number(totalResult.data ?? 0),
    settings: (settingsResult.data as PortalSettings | null) ?? fallbackSettings,
    creator: (creatorResult.data as Creator | null) ?? null,
    counts:
      (countsResult.data as VoteCount[] | null)?.map((count) => ({
        ...count,
        vote_count: Number(count.vote_count),
      })) ?? [],
  };
});
