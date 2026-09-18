"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";
import type { PortalSettings } from "@/lib/types";

type AnnouncementSettings = Pick<PortalSettings, "announcement_text" | "announcement_active">;

export function AnnouncementTicker({ initialSettings }: { initialSettings: AnnouncementSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const { data, error } = await supabase.from("settings")
          .select("announcement_text, announcement_active").eq("id", 1).maybeSingle();
        if (!disposed && !error) setSettings({
          announcement_text: data?.announcement_text ?? null,
          announcement_active: data?.announcement_active === true,
        });
      } finally { refreshing = false; }
    };
    const safelyRefresh = () => { void refresh().catch(() => {}); };
    const channel = supabase.channel("public-announcement-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings", filter: "id=eq.1" }, safelyRefresh)
      .subscribe((status: string) => { if (status === "SUBSCRIBED") safelyRefresh(); });
    safelyRefresh();
    const interval = setInterval(safelyRefresh, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") safelyRefresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, []);

  const text = settings.announcement_text?.trim();
  if (!settings.announcement_active || !text) return null;

  return (
    <aside aria-label={COPY.announcementLabel} className="mb-6 w-full overflow-hidden rounded-[8px] bg-[#1a1a1a] text-white">
      <button
        type="button"
        className="announcement-control flex min-h-[42px] w-full items-stretch text-left text-[12.5px] focus-visible:outline-offset-[-3px]"
        onClick={() => setPaused((value) => !value)}
        aria-label={`${text}. ${paused ? COPY.resumeAnnouncement : COPY.pauseAnnouncement}`}
        aria-pressed={paused}
      >
        <span aria-hidden="true" className="flex w-[42px] shrink-0 items-center justify-center border-r border-white/12 text-lg">📢</span>
        <span className="flex min-w-0 flex-1 items-center overflow-hidden" aria-hidden="true">
          <span className="announcement-track" style={{ animationPlayState: paused ? "paused" : "running" }}>
            <span className="announcement-copy">{text}</span>
            <span className="announcement-copy">{text}</span>
          </span>
        </span>
      </button>
      <div className="announcement-static min-h-[42px] items-stretch">
        <span aria-hidden="true" className="flex w-[42px] shrink-0 items-center justify-center border-r border-white/12 text-lg">📢</span>
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words px-3 py-3 text-[12.5px]">{text}</p>
      </div>
    </aside>
  );
}
