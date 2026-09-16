type ShareCreator = { name: string; slug: string };
type ShareBrowser = {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

export function creatorShareData(creator: ShareCreator, origin: string): ShareData & { url: string } {
  return {
    title: `Support ${creator.name} in House Of Creator`,
    text: `Support ${creator.name} in House Of Creator with a vote 🗳️`,
    url: `${origin}/c/${encodeURIComponent(creator.slug)}`,
  };
}

export async function shareCreatorLink(creator: ShareCreator, origin: string, browser: ShareBrowser) {
  const data = creatorShareData(creator, origin);
  if (browser.share) {
    try {
      await browser.share(data);
      return "shared" as const;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled" as const;
      // If native sharing fails, offer the same clipboard fallback.
    }
  }
  if (!browser.clipboard) throw new Error("Clipboard unavailable");
  await browser.clipboard.writeText(data.url);
  return "copied" as const;
}
