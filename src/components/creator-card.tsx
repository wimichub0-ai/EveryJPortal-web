"use client";

import { Play } from "lucide-react";
import { CreatorImage } from "@/components/creator-image";
import { VoteButton } from "@/components/vote-button";
import { YouTubeButton } from "@/components/youtube-button";
import { YouTubeMark } from "@/components/youtube-mark";
import type { Creator } from "@/lib/types";

type CreatorCardProps = {
  creator: Creator;
  count: number;
  totalVotes: number;
  votingOpen: boolean;
  hasVoted: boolean;
  countChanged: boolean;
  onOpenVideo: (creator: Creator) => void;
  onVote: (creator: Creator) => void;
};

export function CreatorCard({
  creator,
  count,
  totalVotes,
  votingOpen,
  hasVoted,
  countChanged,
  onOpenVideo,
  onVote,
}: CreatorCardProps) {
  const percentage = totalVotes ? Math.min((count / totalVotes) * 100, 100) : 0;
  const canPlay = Boolean(creator.youtube_video_id);

  return (
    <article className="overflow-hidden rounded-[20px] bg-white p-3 shadow-[0_8px_30px_rgba(43,43,43,0.07)]">
      <button
        type="button"
        disabled={!canPlay}
        onClick={() => canPlay && onOpenVideo(creator)}
        className={`relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#E8E8E8] text-left ${canPlay ? "group cursor-pointer" : "cursor-default"}`}
        aria-label={canPlay ? `Play ${creator.name}'s YouTube video` : `${creator.name} image`}
      >
        <CreatorImage creator={creator} sizes="(max-width: 448px) calc(100vw - 56px), 400px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        {canPlay && (
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-black/45">
            <Play className="ml-1 h-6 w-6 fill-current" aria-hidden="true" />
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-[10px] font-bold text-[#2B2B2B] backdrop-blur-sm">
          <YouTubeMark className="h-3 w-[18px]" />
          YouTube
        </span>
      </button>

      <div className="px-2 pb-2 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold leading-tight text-[#2B2B2B]">
              {creator.name}
            </h3>
            {creator.tagline && (
              <p className="mt-1.5 text-sm leading-5 text-[#777]">{creator.tagline}</p>
            )}
          </div>
          <div className={`shrink-0 text-right ${countChanged ? "count-pulse" : ""}`}>
            <div className="font-display text-2xl font-bold leading-none text-[#2B2B2B]">
              {count.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#8A8A8A]">votes</div>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EEEEEE]" aria-label={`${percentage.toFixed(1)} percent of all votes`}>
          <div
            className="h-full rounded-full bg-[#F2A93B] transition-[width] duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-5 space-y-3">
          {creator.youtube_channel_url && <YouTubeButton href={creator.youtube_channel_url} />}
          <VoteButton creator={creator} votingOpen={votingOpen} hasVoted={hasVoted} onVote={onVote} />
        </div>
      </div>
    </article>
  );
}
