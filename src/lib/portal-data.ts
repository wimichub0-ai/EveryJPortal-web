import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Creator, PortalSettings, VoteCount } from "@/lib/types";

const fallbackSettings: PortalSettings = {
  campaign_title: "Everything Jos",
  campaign_subtitle:
    "Vote for the creator you want to see win the grand prize of 1 million naira",
  voting_open: true,
};

export const getPortalData = cache(async () => {
  const supabase = createClient();
  const [settingsResult, creatorsResult, countsResult] = await Promise.all([
    supabase
      .from("settings")
      .select("campaign_title, campaign_subtitle, voting_open")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("creators")
      .select(
        "id, name, slug, tagline, photo_url, youtube_video_id, youtube_channel_url, display_order, is_active",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.rpc("get_vote_counts"),
  ]);

  return {
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
