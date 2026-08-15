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
};

export type PortalSettings = {
  campaign_title: string;
  campaign_subtitle: string;
  voting_open: boolean;
};

export type VoteCount = {
  creator_id: string;
  vote_count: number;
};
