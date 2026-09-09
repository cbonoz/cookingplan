import { useMemo } from "react";
import type { Meal } from "@/lib/types";

export interface GroceryMeal {
  meal: Meal;
  day: string;
  coversEnd: string;
}

function normalize(item: string): string {
  return item.replace(/\s+/g, " ").trim().toLowerCase().replace(/\.+$/, "");
}

function ingredientLines(meal: Meal): string[] {
  return (meal.ingredients ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function GroceryList({
  meals,
  servings,
}: {
  meals: GroceryMeal[];
  servings: number;
}) {
  const withIngredients = meals.filter((m) => ingredientLines(m.meal).length > 0);

  const combined = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const { meal } of meals) {
      const seen = new Set<string>();
      for (const line of ingredientLines(meal)) {
        const key = normalize(line);
        if (seen.has(key)) continue;
        seen.add(key);
        const entry = counts.get(key);
        if (entry) entry.count += 1;
        else counts.set(key, { label: line.trim(), count: 1 });
      }
    }
    return [...counts.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [meals]);

  const copy = async () => {
    const lines: string[] = [];
    for (const { meal, day, coversEnd } of withIngredients) {
      lines.push(`🍳 ${meal.name} (${day}–${coversEnd})`);
      for (const line of ingredientLines(meal)) lines.push(`  • ${line}`);
    }
    if (combined.length > 0) {
      lines.push("", "🛒 Combined");
      for (const item of combined) lines.push(`  • ${item.label}`);
    }
    if (lines.length === 0) return;
    await navigator.clipboard.writeText(lines.join("\n"));
  };

  if (withIngredients.length === 0 && combined.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">🛒 Grocery list</h2>
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
          No meals with ingredients in this plan. Add ingredients to meals on the{" "}
          <a className="underline" href="/meals">
            Meals
          </a>{" "}
          page or via recipe-link discovery.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          🛒 Grocery list · for {servings} {servings === 1 ? "person" : "people"}
        </h2>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Copy
        </button>
      </div>

      <div className="space-y-4">
        {withIngredients.map(({ meal, day, coversEnd }) => (
          <div key={meal.id}>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {meal.name}{" "}
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                · {day}–{coversEnd}
              </span>
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-zinc-600 dark:text-zinc-300">
              {ingredientLines(meal).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {combined.length > 0 && (
        <>
          <div className="my-4 h-px bg-zinc-200 dark:bg-zinc-800" />
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Combined</p>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            {combined.map((item) => (
              <li key={item.label} className="flex items-baseline justify-between gap-2">
                <span>{item.label}</span>
                {item.count > 1 && (
                  <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                    ×{item.count} meals
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}