"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LogOut, Play } from "lucide-react";
import { ShareCreatorButton } from "@/components/share-creator-button";
import { CreatorImage } from "@/components/creator-image";
import { VoteButton } from "@/components/vote-button";
import { YouTubeButton } from "@/components/youtube-button";
import { YouTubeMark } from "@/components/youtube-mark";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";
import type { Creator, VotingStatus } from "@/lib/types";

type CreatorCardProps = {
  index?: number;
  creator: Creator;
  count: number;
  totalVotes: number;
  votingStatus: VotingStatus;
  hasVoted: boolean;
  countChanged: boolean;
  finalStanding?: boolean;
  supportLine?: string;
  onOpenVideo: (creator: Creator) => void;
  onVote: (creator: Creator) => void;
};

export function CreatorCard({
  index = 0,
  creator,
  count,
  totalVotes,
  votingStatus,
  hasVoted,
  countChanged,
  finalStanding = false,
  supportLine,
  onOpenVideo,
  onVote,
}: CreatorCardProps) {
  const reduced = useReducedMotion();
  const percentage = totalVotes ? Math.min((count / totalVotes) * 100, 100) : 0;
  const canPlay = Boolean(creator.youtube_video_id) && !creator.is_evicted && !finalStanding;

  return (
    <motion.article initial={reduced ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: reduced ? 0 : 0.28, delay: reduced ? 0 : (index % 3) * 0.04 }} className="overflow-hidden rounded-[20px] bg-white p-3 shadow-[0_8px_30px_rgba(43,43,43,0.07)]">
      <div className="relative overflow-hidden rounded-2xl">
      <button
        type="button"
        disabled={!canPlay}
        onClick={() => canPlay && onOpenVideo(creator)}
        className={`relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#E8E8E8] text-left ${canPlay ? "group cursor-pointer" : "cursor-default"}`}
        aria-label={canPlay ? `Play ${creator.name}'s YouTube video` : `${creator.name} image`}
      >
        <CreatorImage creator={creator} className={creator.is_evicted || finalStanding ? "object-cover grayscale-[0.85] brightness-[0.55]" : "object-cover"} sizes="(max-width: 448px) calc(100vw - 56px), 400px" />
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
      {creator.is_evicted && !finalStanding && <div className="pointer-events-none absolute -left-10 top-6 z-10 w-44 -rotate-[38deg] bg-[#991B1B] py-1.5 text-center text-xs font-bold tracking-widest text-white shadow-md">{COPY.evictedRibbon}</div>}
      <ShareCreatorButton creator={{ ...creator, final_standing: finalStanding }} variant="corner-on-media" />
      </div>

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
          {!creator.is_evicted && !finalStanding && <div className={`shrink-0 text-right ${countChanged ? "count-pulse" : ""}`}>
            <div className="font-display text-2xl font-bold leading-none text-[#2B2B2B]">
              {count.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#8A8A8A]">votes</div>
          </div>}
        </div>

        {!creator.is_evicted && !finalStanding && <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EEEEEE]" aria-label={`${percentage.toFixed(1)} percent of all votes`}>
          <div
            className="h-full rounded-full bg-[#73D75C] transition-[width] duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>}

        {creator.is_evicted && !finalStanding && <div className="mt-5 flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-800">
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />{COPY.evictedPill(creator.name)}
        </div>}

        {!creator.is_evicted && !finalStanding && supportLine && (
          <p className="mt-5 text-sm leading-6 text-[#666]">{supportLine}</p>
        )}

        {finalStanding && <p className="mt-5 text-center text-sm font-semibold text-gray-600">{COPY.finalStandingCount(count)}</p>}

        <div className="mt-5 space-y-3">
          {creator.youtube_channel_url && <YouTubeButton href={creator.youtube_channel_url} />}
          {!finalStanding && (creator.is_evicted
            ? <ShareCreatorButton creator={{ ...creator, final_standing: finalStanding }} variant="vote-sheet" />
            : <VoteButton creator={creator} votingStatus={votingStatus} hasVoted={hasVoted} onVote={onVote} />)}
        </div>
      </div>
    </motion.article>
  );
}
