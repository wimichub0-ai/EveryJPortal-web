"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { VoteButton } from "@/components/vote-button";
import { YouTubeButton } from "@/components/youtube-button";
import type { Creator } from "@/lib/types";

type VideoModalProps = {
  creator: Creator | null;
  votingOpen: boolean;
  hasVoted: boolean;
  onClose: () => void;
  onVote: (creator: Creator) => void;
};

export function VideoModal({ creator, votingOpen, hasVoted, onClose, onVote }: VideoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!creator) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [creator, onClose]);

  if (!creator?.youtube_video_id) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${creator.name} video`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl rounded-[20px] bg-[#171717] p-3 shadow-2xl">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2B2B2B] transition hover:scale-105"
          aria-label="Close video"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${creator.youtube_video_id}?autoplay=1&rel=0`}
            title={`${creator.name} YouTube video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="space-y-3 px-1 pb-1 pt-4">
          {creator.youtube_channel_url && <YouTubeButton href={creator.youtube_channel_url} />}
          <VoteButton creator={creator} votingOpen={votingOpen} hasVoted={hasVoted} onVote={onVote} />
        </div>
      </div>
    </div>
  );
}
