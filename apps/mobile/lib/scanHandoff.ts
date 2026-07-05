import type { VisionResult } from '@genki/api';

// In-memory handoff for the camera → result navigation. The scan result and the
// base64 image are too large to pass through URL params (on web that overflows
// the dev server's header limit → HTTP 431), so we stash them here and the
// result screen reads them on mount. Lost on a hard page reload, which is fine —
// the user simply re-scans.
export interface PendingScan {
  scanData: VisionResult;
  imageUri: string;
  profileId: string;
  mealType: string;
  // Target calendar day to log into (ISO). Lets the user back-date a meal from a
  // past day's detail screen. Defaults to today when absent.
  loggedDate?: string;
}

let pending: PendingScan | null = null;

export function setPendingScan(data: PendingScan): void {
  pending = data;
}

export function getPendingScan(): PendingScan | null {
  return pending;
}

export function clearPendingScan(): void {
  pending = null;
}
