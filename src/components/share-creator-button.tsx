"use client";

import { ExternalLink, Share2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { shareCreatorLink } from "@/lib/share-creator";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";
import type { Creator } from "@/lib/types";

type ShareCreatorButtonProps = {
  creator: Pick<Creator, "name" | "slug">;
  variant: "corner-on-media" | "vote-sheet";
};

export function ShareCreatorButton({ creator, variant }: ShareCreatorButtonProps) {
  const corner = variant === "corner-on-media";
  const reduced = useReducedMotion();
  const [feedback, setFeedback] = useState<"copied" | "error" | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const share = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (timer.current) clearTimeout(timer.current);
    setFeedback(null);
    try {
      const result = await shareCreatorLink(creator, window.location.origin, navigator);
      if (mounted.current && result === "copied") setFeedback("copied");
    } catch {
      if (mounted.current) setFeedback("error");
    } finally {
      inFlight.current = false;
      if (mounted.current && corner) timer.current = setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <div className={corner ? "absolute right-[10px] top-[10px] z-20" : "relative"}>
      <motion.button
        type="button"
        aria-label={`Share ${creator.name}`}
        whileTap={reduced ? undefined : { scale: 0.94 }}
        transition={{ duration: 0.12 }}
        onClick={(event) => {
          event.stopPropagation();
          void share();
        }}
        className={corner
          ? "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
          : "flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#2B2B2B]/25 bg-white px-5 font-display text-sm font-semibold text-[#2B2B2B] transition hover:border-[#2B2B2B] hover:bg-[#FAFAFA]"}
      >
        {corner ? <Share2 className="h-4 w-4" aria-hidden="true" /> : <>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {feedback === "copied" ? COPY.copied : COPY.share(creator.name)}
        </>}
      </motion.button>
      <span role="status" aria-live="polite" className={feedback && (corner || feedback === "error")
        ? corner
          ? "pointer-events-none absolute right-0 top-[42px] w-max max-w-52 rounded-lg bg-[#2B2B2B] px-3 py-2 text-xs text-white shadow-lg"
          : "mt-2 block text-center text-xs text-red-600"
        : "sr-only"}>
        {feedback === "copied" ? COPY.copied : feedback === "error" ? "Couldn't share the link. Please try again." : ""}
      </span>
    </div>
  );
}
