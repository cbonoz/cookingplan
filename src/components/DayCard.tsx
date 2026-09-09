import type { DayMode, Meal } from "@/lib/types";
import { TypeBadge } from "./TypeBadge";

const MODES: { value: DayMode; label: string; title: string }[] = [
  { value: "cook", label: "Cook", title: "Cook on this day" },
  { value: "leftover", label: "Leftover", title: "Eat leftovers from the previous cook" },
  { value: "off", label: "Off", title: "Don't plan this day" },
];

export function DayCard({
  day,
  dateLabel,
  mode,
  meal,
  hasSource,
  locked,
  mealOptions,
  onModeChange,
  onPickMeal,
  onShuffle,
  onToggleLock,
  onClear,
}: {
  day: string;
  dateLabel: string;
  mode: DayMode;
  meal?: Meal;
  hasSource?: boolean;
  locked: boolean;
  mealOptions: Meal[];
  onModeChange: (mode: DayMode) => void;
  onPickMeal: (mealId: string) => void;
  onShuffle: () => void;
  onToggleLock: () => void;
  onClear: () => void;
}) {
  const dimmed = mode !== "cook";

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900 ${
        mode === "off"
          ? "border-dashed border-zinc-200 opacity-60 dark:border-zinc-800"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{day}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{dateLabel}</p>
        </div>
        {mode === "cook" && (
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
                title="Clear meal"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className={`rounded-full border p-0.5 text-center text-xs font-medium ${
          mode === "cook"
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
            : "border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        }`}
      >
        <div className="flex divide-x divide-inherit">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              title={m.title}
              onClick={() => onModeChange(m.value)}
              className={`flex-1 rounded-full py-1 transition-colors ${
                mode === m.value ? "" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-3 ${dimmed ? "opacity-70" : ""}`}>
        {mode === "off" ? (
          <p className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">Not planned</p>
        ) : mode === "leftover" ? (
          meal ? (
            <>
              <div className="mb-2">
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                  ♻️ Leftover
                </span>
              </div>
              <p className="font-medium leading-snug text-zinc-900 dark:text-zinc-100">{meal.name}</p>
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
            </>
          ) : (
            <p className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
              {hasSource === false ? "No cook before this day" : "Eat leftovers from yesterday"}
            </p>
          )
        ) : (
          <div className="space-y-3">
            {meal ? (
              <>
                <p className="font-medium leading-snug text-zinc-900 dark:text-zinc-100">{meal.name}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <TypeBadge type={meal.type} />
                  {meal.protein && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {meal.protein}
                    </span>
                  )}
                </div>
                {meal.modifier && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{meal.modifier}</p>
                )}
              </>
            ) : (
              <p className="pt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
                Pick from menu or shuffle to fill
              </p>
            )}
            <select
              value={meal?.id ?? ""}
              onChange={(e) => onPickMeal(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="" disabled>
                Select a meal…
              </option>
              {mealOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}