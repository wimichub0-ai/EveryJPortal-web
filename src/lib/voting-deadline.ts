export function getVotingDeadline(configuredOpen: boolean, endsAt: string | null, now: number | null) {
  const deadline = endsAt ? Date.parse(endsAt) : NaN;
  const remaining = Number.isFinite(deadline) && now !== null
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : null;
  return { votingOpen: configuredOpen && remaining !== 0, remaining };
}
