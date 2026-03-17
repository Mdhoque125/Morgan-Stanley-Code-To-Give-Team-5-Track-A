"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  decrementScore,
  getScoreboard,
  incrementScore,
  type ApiScoreboardRow,
} from "@/lib/api";

export type VolunteerScoreEntry = {
  id: string;
  name: string;
  flyersPosted: number;
  eventsJoined: number;
  points: number;
  rank: number;
};

type VolunteerProgressContextValue = {
  scoreboard: VolunteerScoreEntry[];
  currentVolunteer: VolunteerScoreEntry | null;
  currentRank: number | null;
  visibleScoreboard: VolunteerScoreEntry[];
  isAuthenticated: boolean;
  isProfileLoading: boolean;
  awardFlyerPosted: () => Promise<void>;
  adjustEventJoin: (joined: boolean) => Promise<void>;
  refreshScoreboard: () => Promise<void>;
};

const VolunteerProgressContext = createContext<
  VolunteerProgressContextValue | undefined
>(undefined);

function mapScoreRow(row: ApiScoreboardRow, rank: number): VolunteerScoreEntry {
  return {
    id: row.user_id,
    name: row.profiles?.display_name?.trim() || "Anonymous",
    flyersPosted: row.flyers_posted ?? 0,
    eventsJoined: row.events_joined ?? row.event_joined ?? 0,
    points: row.points ?? 0,
    rank,
  };
}

export function VolunteerProgressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [scoreboard, setScoreboard] = useState<VolunteerScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshScoreboard = useCallback(async () => {
    const response = await getScoreboard(100);
    const rows = (response.scoreboard ?? []).map((row, index) =>
      mapScoreRow(row, index + 1)
    );
    setScoreboard(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const response = await getScoreboard(100);
        if (cancelled) {
          return;
        }
        setScoreboard(
          (response.scoreboard ?? []).map((row, index) => mapScoreRow(row, index + 1))
        );
      } catch {
        if (!cancelled) {
          setScoreboard([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentVolunteer = useMemo(() => {
    if (!user) {
      return null;
    }
    return scoreboard.find((entry) => entry.id === user.id) ?? null;
  }, [scoreboard, user]);

  const currentRank = currentVolunteer?.rank ?? null;

  const visibleScoreboard = useMemo(() => {
    const topSeven = scoreboard.slice(0, 7);
    if (!user || !currentVolunteer || currentVolunteer.rank <= 7) {
      return topSeven;
    }
    return [...topSeven, currentVolunteer];
  }, [currentVolunteer, scoreboard, user]);

  const awardFlyerPosted = useCallback(async () => {
    if (!user) {
      return;
    }
    await incrementScore(user.id, "flyer_posted");
    await refreshScoreboard();
  }, [refreshScoreboard, user]);

  const adjustEventJoin = useCallback(
    async (joined: boolean) => {
      if (!user) {
        return;
      }
      if (joined) {
        await incrementScore(user.id, "event_joined");
      } else {
        await decrementScore(user.id, "event_joined");
      }
      await refreshScoreboard();
    },
    [refreshScoreboard, user]
  );

  const value = useMemo(
    () => ({
      scoreboard,
      currentVolunteer,
      currentRank,
      visibleScoreboard,
      isAuthenticated: !!user,
      isProfileLoading: authLoading || isLoading,
      awardFlyerPosted,
      adjustEventJoin,
      refreshScoreboard,
    }),
    [
      scoreboard,
      currentVolunteer,
      currentRank,
      visibleScoreboard,
      user,
      authLoading,
      isLoading,
      awardFlyerPosted,
      adjustEventJoin,
      refreshScoreboard,
    ]
  );

  return (
    <VolunteerProgressContext.Provider value={value}>
      {children}
    </VolunteerProgressContext.Provider>
  );
}

export function useVolunteerProgress() {
  const context = useContext(VolunteerProgressContext);
  if (!context) {
    throw new Error(
      "useVolunteerProgress must be used within a VolunteerProgressProvider"
    );
  }

  return context;
}

export function getVolunteerPoints(entry: VolunteerScoreEntry) {
  return entry.points;
}
