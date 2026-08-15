"use client";

import { CreatorImage } from "@/components/creator-image";
import type { Creator } from "@/lib/types";

type RankedCreator = Creator & { voteCount: number };

type TopCreatorsProps = {
  creators: RankedCreator[];
  changedIds: Set<string>;
};

export function TopCreators({ creators, changedIds }: TopCreatorsProps) {
  if (!creators.length) return null;

  const displayOrder = [creators[1], creators[0], creators[2]].filter(
    Boolean,
  ) as RankedCreator[];

  return (
    <section aria-labelledby="top-creators-title" className="rounded-[20px] bg-white px-4 py-6 shadow-[0_8px_30px_rgba(43,43,43,0.06)]">
      <h2 id="top-creators-title" className="mb-5 text-center font-display text-sm font-semibold uppercase tracking-[0.14em] text-[#747474]">
        Top creators
      </h2>
      <div className="grid grid-cols-3 items-end gap-2">
        {displayOrder.map((creator) => {
          const isWinner = creator.id === creators[0]?.id;
          const rank = creators.findIndex((item) => item.id === creator.id) + 1;

          return (
            <div key={creator.id} className={`flex min-w-0 flex-col items-center ${isWinner ? "pb-2" : ""}`}>
              <div className={`relative rounded-full border-[3px] bg-[#E8E8E8] shadow-sm ${isWinner ? "h-24 w-24 border-[#F2A93B]" : "h-20 w-20 border-white"}`}>
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <CreatorImage creator={creator} sizes={isWinner ? "96px" : "80px"} />
                </div>
                <span className="absolute -left-1 top-0 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2B2B2B] px-1.5 font-display text-[10px] font-bold text-white">
                  {rank}
                </span>
                <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2B2B2B] px-2.5 py-1 text-[10px] font-semibold text-white ${changedIds.has(creator.id) ? "count-pulse" : ""}`}>
                  {creator.voteCount.toLocaleString()} votes
                </span>
              </div>
              <p className="mt-4 w-full truncate text-center font-display text-xs font-bold text-[#2B2B2B]">
                {creator.name}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
