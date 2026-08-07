"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface RecentToolVisit {
  slug: string;
  visitedAt: string; // ISO timestamp
}

// v2: stores a real timestamp per visit (v1 only stored slugs, which made
// "X minutes ago" on the dashboard impossible without faking a number —
// bumping the key rather than migrating v1 data, since losing a
// best-effort recency list on upgrade is harmless).
const KEY = "recent-tools-v2";
const MAX_RECENT = 5;

export function useRecentTools() {
  const [recentVisits, setRecentVisits] = useLocalStorage<RecentToolVisit[]>(KEY, []);

  const recordVisit = useCallback(
    (slug: string) => {
      const next = [{ slug, visitedAt: new Date().toISOString() }, ...recentVisits.filter((v) => v.slug !== slug)].slice(
        0,
        MAX_RECENT
      );
      setRecentVisits(next);
    },
    [recentVisits, setRecentVisits]
  );

  return { recentVisits, recordVisit };
}
