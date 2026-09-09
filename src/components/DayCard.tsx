import type { Meal } from "@/lib/types";
import { TypeBadge } from "./TypeBadge";

export function DayCard({
  day,
  dateLabel,
  meal,
  locked,
  served,
  servedFrom,
  covers,
  coversEnd,
  onOpenPicker,
  onShuffle,
  onToggleLock,
  onClear,
}: {
  day: string;
  dateLabel: string;
  meal?: Meal;
  locked: boolean;
  served?: boolean;
  servedFrom?: string;
  covers?: number;
  coversEnd?: string;
  onOpenPicker: () => void;
  onShuffle: () => void;
  onToggleLock: () => void;
  onClear: () => void;
}) {
  if (served && meal) {
    return (
      <div className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-4 opacity-80 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{day}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onOpenPicker}
            title="Put a different meal here"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            ✎
          </button>
        </div>
        <span className="mb-2 w-fit rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          ♻️ Serves from {servedFrom}
        </span>
        <div className="mt-auto">
          <p className="font-medium leading-snug text-zinc-600 dark:text-zinc-300">{meal.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={meal.type} />
            {meal.protein && (
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                {meal.protein}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          <button
            type="button"
            onClick={onOpenPicker}
            title={meal ? "Change meal" : "Add a meal"}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            ✎
          </button>
          {meal && (
            <button
              type="button"
              onClick={onClear}
              title="Clear meal"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {covers && covers > 1 && (
        <p className="mb-2 rounded-lg bg-zinc-100 px-2 py-1 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          🍱 Covers {covers} days{coversEnd ? ` · through ${coversEnd}` : ""}
        </p>
      )}

      {meal ? (
        <div className="mt-auto">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium leading-snug text-zinc-900 dark:text-zinc-100">{meal.name}</p>
            {meal.link && (
              <a
                href={meal.link}
                target="_blank"
                rel="noreferrer"
                title="Open recipe"
                className="shrink-0 rounded-lg p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                🔗
              </a>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
          {meal.notes && (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400 dark:text-zinc-500">{meal.notes}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-200 py-8 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
        >
          <span className="text-base font-medium">＋ Add a meal</span>
          <span className="text-xs">Search your meals or shuffle</span>
        </button>
      )}
    </div>
  );
}