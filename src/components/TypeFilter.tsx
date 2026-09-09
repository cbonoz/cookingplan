import type { MealType } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";

export function TypeFilter({
  selected,
  onChange,
}: {
  selected: MealType[];
  onChange: (types: MealType[]) => void;
}) {
  const toggle = (type: MealType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Types:</span>
      {MEAL_TYPES.map((type) => {
        const active = selected.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              active
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
                : "border-zinc-300 text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            {type}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([])}
        className="text-sm text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
      >
        All
      </button>
    </div>
  );
}