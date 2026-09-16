import type { PortalSettings, VotingStatus } from "./types";

export function normalizeVotingSettings(settings: Partial<PortalSettings>) {
  const status = settings.voting_status;
  return {
    voting_status: (status === "live" || status === "paused" || status === "closed"
      ? status : settings.voting_open === false ? "closed" : "live") as VotingStatus,
    voting_ends_at: settings.voting_ends_at ?? null,
    paused_resume_at: settings.paused_resume_at ?? null,
  };
}

export function resumeSeconds(resumeAt: string | null, now: number | null) {
  const target = resumeAt ? Date.parse(resumeAt) : NaN;
  return now === null || !Number.isFinite(target) ? null : Math.max(0, Math.ceil((target - now) / 1000));
}
