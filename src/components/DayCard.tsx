import type { Meal } from "@/lib/types";
import { TypeBadge } from "./TypeBadge";

export function DayCard({
  day,
  dateLabel,
  meal,
  locked,
  onShuffle,
  onToggleLock,
  onClear,
}: {
  day: string;
  dateLabel: string;
  meal?: Meal;
  locked: boolean;
  onShuffle: () => void;
  onToggleLock: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{day}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleLock}
            title={locked ? "Unlock day" : "Lock day"}
            className={`rounded-lg p-1.5 transition-colors ${
              locked
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            {locked ? "🔒" : "🔓"}
          </button>
          <button
            type="button"
            onClick={onShuffle}
            title="Reshuffle this day"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            🎲
          </button>
          {meal && (
            <button
              type="button"
              onClick={onClear}
              title="Clear day"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {meal ? (
        <div className="mt-auto">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-medium leading-snug text-zinc-900 dark:text-zinc-100">{meal.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={meal.type} />
            {meal.protein && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {meal.protein}
              </span>
            )}
          </div>
          {meal.modifier && (
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{meal.modifier}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center py-6">
          <p className="text-sm text-zinc-300 dark:text-zinc-600">Empty day</p>
        </div>
      )}
    </div>
  );
}