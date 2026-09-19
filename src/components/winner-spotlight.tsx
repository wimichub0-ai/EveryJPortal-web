"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import { CreatorImage } from "@/components/creator-image";
import { WinnerCrown } from "@/components/winner-crown";
import { ShareCreatorButton } from "@/components/share-creator-button";
import { YouTubeButton } from "@/components/youtube-button";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";
import type { Creator } from "@/lib/types";

const confetti = [
  [8, 18, "#73D75C"], [91, 12, "#E56B60"], [5, 42, "#69A4D4"],
  [94, 38, "#73D75C"], [13, 65, "#E56B60"], [89, 70, "#73D75C"],
  [20, 9, "#73D75C"], [80, 25, "#69A4D4"],
] as const;

export function WinnerSpotlight({ creator, count }: { creator: Creator; count: number }) {
  const reduced = useReducedMotion();
  return <motion.section
    initial={reduced ? false : { opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0 : 0.35 }}
    aria-label={COPY.winnerBadge}
    className="relative isolate overflow-hidden rounded-[24px] bg-[#F2FBEF] px-5 py-8 text-center shadow-[0_12px_40px_rgba(40,122,29,0.12)] sm:px-8"
  >
    <div aria-hidden="true" className="absolute left-0 top-0 h-20 w-20 bg-[#73D75C] [clip-path:polygon(0_0,100%_0,0_100%)]"><Trophy className="ml-3 mt-3 h-6 w-6 text-[#287A1D]" /></div>
    {confetti.map(([left, top, color], index) => <motion.span key={index} aria-hidden="true"
      className={`pointer-events-none absolute ${index % 2 ? "h-3 w-1.5" : "h-2 w-2 rounded-full"}`}
      style={{ left: `${left}%`, top: `${top}%`, backgroundColor: color, rotate: index * 31 }}
      animate={reduced ? undefined : { y: [0, 12, 0], opacity: [0.7, 0.3, 0.7] }}
      transition={{ duration: 4, delay: index * 0.25, repeat: Infinity }} />)}
    <div className="relative mx-auto flex w-fit max-w-full items-center justify-center gap-2 rounded-full bg-[#242424] px-4 py-2 text-[10px] font-bold tracking-wider text-white">
      <Trophy className="h-4 w-4 shrink-0 text-[#73D75C]" aria-hidden="true" />{COPY.winnerBadge}
    </div>
    <div className="relative mx-auto my-7 flex h-56 w-56 items-center justify-center">
      <motion.div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(#D4F0CA 0deg 15deg, #E5F8DF 15deg 30deg)" }}
        animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 60, ease: "linear", repeat: Infinity }} />
      <div className="relative h-40 w-40 overflow-hidden rounded-full border-[5px] border-[#73D75C] bg-gradient-to-br from-[#E5F8DF] to-[#73D75C] shadow-lg">
        <CreatorImage creator={{ ...creator, youtube_video_id: null }} sizes="160px" className="object-cover !bg-transparent !text-4xl !text-[#287A1D]" />
      </div>
      <motion.div className="absolute -top-2 left-[72px] z-10" initial={reduced ? false : { scale: 0.8, rotate: -10 }} animate={{ scale: reduced ? 1 : [0.8, 1.05, 1], rotate: reduced ? 0 : [-10, 3, 0] }} transition={{ duration: reduced ? 0 : 0.38 }}>
        <WinnerCrown className="h-16 w-20 drop-shadow-md" />
      </motion.div>
    </div>
    <h2 className="relative font-display text-3xl font-bold text-[#2B2B2B]">{creator.name}</h2>
    {creator.tagline && <p className="relative mt-2 text-sm text-[#42663A]">{creator.tagline}</p>}
    <div className="relative mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold tracking-[0.16em] text-[#42663A]">{COPY.finalVoteCount}</p>
      <p className="mt-1 font-display text-4xl font-bold tabular-nums">{count.toLocaleString()}</p>
      <hr className="my-4 border-[#D4F0CA]" />
      <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#42663A]">{COPY.grandPrize}</p>
      <div className="rounded-xl bg-gradient-to-r from-[#73D75C] via-[#C6F2BB] to-[#73D75C] px-3 py-3 font-display text-3xl font-bold text-[#215E19]">{COPY.winnerPrize}</div>
    </div>
    <p className="relative my-5 text-xs leading-5 text-[#42663A]">{COPY.winnerThanks}</p>
    <div className="relative space-y-3">
      {creator.youtube_channel_url && <YouTubeButton href={creator.youtube_channel_url} />}
      <ShareCreatorButton creator={{ ...creator, is_winner: true }} variant="winner" />
    </div>
  </motion.section>;
}
