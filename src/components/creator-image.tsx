"use client";

import Image from "next/image";
import { useState } from "react";
import type { Creator } from "@/lib/types";

type CreatorImageProps = {
  creator: Creator;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function creatorImageUrl(creator: Creator) {
  if (creator.photo_url) return creator.photo_url;
  if (creator.youtube_video_id) {
    return `https://img.youtube.com/vi/${creator.youtube_video_id}/hqdefault.jpg`;
  }
  return null;
}

export function CreatorImage({
  creator,
  sizes,
  className = "object-cover",
  priority = false,
}: CreatorImageProps) {
  const [failed, setFailed] = useState(false);
  const source = creatorImageUrl(creator);

  if (!source || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#E8E8E8] font-display text-sm font-semibold text-[#9A9A9A] ${className}`}
        aria-label={`${creator.name} image placeholder`}
      >
        {creator.name.slice(0, 1)}
      </div>
    );
  }

  return (
    <Image
      src={source}
      alt={creator.name}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
