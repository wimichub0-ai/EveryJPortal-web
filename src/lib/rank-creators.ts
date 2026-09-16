import type { Creator } from "./types";

export function rankCreators(creators: Creator[], counts: Record<string, number>) {
  return creators
    .filter((creator) => !creator.is_evicted)
    .map((creator) => ({ ...creator, voteCount: counts[creator.id] ?? 0 }))
    .filter((creator) => creator.voteCount > 0)
    .sort((a, b) => b.voteCount - a.voteCount || a.display_order - b.display_order)
    .slice(0, 3);
}
