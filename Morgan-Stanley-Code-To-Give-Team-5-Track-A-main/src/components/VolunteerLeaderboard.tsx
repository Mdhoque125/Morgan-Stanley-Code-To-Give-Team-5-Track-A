"use client";

import {
  getVolunteerPoints,
  useVolunteerProgress,
} from "@/context/VolunteerProgressContext";

type VolunteerLeaderboardProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

function getScoreEmoji(score: number, rank: number): string {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";

  if (score >= 100) return "🌟";
  if (score >= 75) return "🔥";
  if (score >= 50) return "💪";
  if (score >= 25) return "🌱";
  return "✨";
}

function getScoreEmojiClass(rank: number): string {
  if (rank === 1) return "ml-1 inline-block align-middle animate-bounce";
  if (rank === 2 || rank === 3) return "ml-1 inline-block align-middle animate-bounce";
  return "ml-1 inline-block align-middle opacity-80";
}

export function VolunteerLeaderboard({
  isExpanded,
  onToggle,
}: VolunteerLeaderboardProps) {
  const {
    currentVolunteer,
    currentRank,
    visibleScoreboard,
    isAuthenticated,
  } = useVolunteerProgress();

  return (
    <div className="flex w-full max-w-md flex-col gap-4 overflow-hidden rounded-3xl border border-amber-200/80 bg-amber-50 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 shadow-md transition-all duration-300">
      <div className="flex w-full flex-row items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
            Leaderboard
          </p>
          <p className="text-xl font-black leading-none text-slate-900">
            {isAuthenticated && currentRank !== null ? `#${currentRank}` : "--"}
          </p>
          <div className="mt-1 text-[11px] text-slate-600">
            <p>
              Flyers posted:{" "}
              {isAuthenticated && currentVolunteer
                ? currentVolunteer.flyersPosted
                : "--"}
            </p>
            <p>
              Events joined:{" "}
              {isAuthenticated && currentVolunteer
                ? currentVolunteer.eventsJoined
                : "--"}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-50"
          >
            {isExpanded ? "Hide Full Board" : "Full Board"}
          </button>

          <div className="rounded-xl bg-primary-500/90 px-3 py-1.5 text-white shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/80">
              Total points
            </p>
            <p className="text-right text-base font-bold">
              {isAuthenticated && currentVolunteer
                ? getVolunteerPoints(currentVolunteer)
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 flex w-full flex-col gap-3 border-t-2 border-slate-200 pt-4">
          <div className="mb-2 flex w-full justify-between px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Rank &amp; Volunteer</span>
            <span>Score</span>
          </div>
          <div className="-mr-2 flex max-h-64 flex-col gap-3 overflow-y-auto pr-3 pb-2">
            {visibleScoreboard.map((entry) => {
              const rank =
                visibleScoreboard.length > 7 &&
                currentVolunteer?.id === entry.id &&
                currentRank
                  ? currentRank
                  : visibleScoreboard.findIndex((item) => item.id === entry.id) + 1;
              const isCurrentVolunteer =
                !!currentVolunteer && entry.id === currentVolunteer.id;
              const score = getVolunteerPoints(entry);
              const scoreEmoji = getScoreEmoji(score, rank);
              const scoreEmojiClass = getScoreEmojiClass(rank);

              return (
                <div
                  key={entry.id}
                  className={`shrink-0 rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-sm ${
                    isCurrentVolunteer ? "bg-amber-50/80 ring-2 ring-amber-300" : ""
                  } ${rank === 1 ? "shadow-md shadow-amber-300" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900">
                        #{rank} {entry.name}
                        {isCurrentVolunteer ? " (You)" : ""}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {entry.flyersPosted} flyers · {entry.eventsJoined} events
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {score}
                      <span className={scoreEmojiClass}>{scoreEmoji}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
