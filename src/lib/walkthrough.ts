export const OPEN_WALKTHROUGH_EVENT = "portal:open-walkthrough";
const SEEN_KEY = "portal:how-to-vote-seen";
let seenThisVisit = false;

export function hasSeenWalkthrough() {
  try {
    return seenThisVisit || window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return seenThisVisit;
  }
}

export function markWalkthroughSeen() {
  seenThisVisit = true;
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Keep help usable when browser storage is unavailable.
  }
}
