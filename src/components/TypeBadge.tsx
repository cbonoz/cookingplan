import type { MealType } from "@/lib/types";

const COLORS: Record<MealType, string> = {
  "Red Meat": "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  "White Meat": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Fish: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  Vegetarian: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
};

export function TypeBadge({ type }: { type: MealType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[type]}`}
    >
      {type}
    </span>
  );
}