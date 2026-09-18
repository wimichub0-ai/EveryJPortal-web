export type Creator = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  photo_url: string | null;
  youtube_video_id: string | null;
  youtube_channel_url: string | null;
  display_order: number;
  is_active: boolean;
  is_evicted: boolean;
  evicted_at: string | null;
};

export type VotingStatus = "live" | "paused" | "closed";

export type PortalSettings = {
  campaign_title: string;
  campaign_subtitle: string;
  voting_open: boolean;
  voting_status: VotingStatus;
  paused_resume_at: string | null;
  voting_ends_at: string | null;
  announcement_text: string | null;
  announcement_active: boolean;
};

export type VoteCount = {
  creator_id: string;
  vote_count: number;
};
