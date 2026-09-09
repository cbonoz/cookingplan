"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DAYS } from "@/lib/types";
import type { DaySlot, Meal, MealType, WeekPlan } from "@/lib/types";
import { weekStartOf } from "@/lib/week";
import { pickMeal, shuffleWeek } from "@/lib/shuffle";
import { DayCard } from "./DayCard";
import { GroceryList } from "./GroceryList";
import { MealPicker } from "./MealPicker";
import { TypeFilter } from "./TypeFilter";

type SaveState = "idle" | "saving" | "saved" | "error";

function normalizePlan(raw: WeekPlan): WeekPlan {
  return {
    weekStart: raw.weekStart,
    coverage: raw.coverage && raw.coverage >= 1 && raw.coverage <= 7 ? raw.coverage : 2,
    servings: raw.servings && raw.servings >= 1 ? raw.servings : 4,
    days: raw.days.map((slot) => {
      if (!slot) return null;
      return { mealId: slot.mealId, locked: slot.locked };
    }),
  };
}

export function Planner() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [noRepeat, setNoRepeat] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const loadedRef = useRef(false);

  const weekStart = useMemo(() => weekStartOf(new Date()), []);

  useEffect(() => {
    (async () => {
      try {
        const [mealsRes, planRes] = await Promise.all([
          fetch("/api/meals").then((r) => r.json()),
          fetch(`/api/plans?weekStart=${weekStart}`).then((r) => r.json()),
        ]);
        setMeals(mealsRes);
        setPlan(normalizePlan(planRes));
        loadedRef.current = true;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      } finally {
        setLoading(false);
      }
    })();
  }, [weekStart]);

  useEffect(() => {
    if (!plan || !loadedRef.current) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plan),
        });
        if (!res.ok) throw new Error();
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [plan]);

  const dateLabel = (dayIndex: number) => {
    const base = new Date(`${weekStart}T00:00:00Z`);
    base.setUTCDate(base.getUTCDate() + dayIndex);
    return base.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const mealFor = (mealId?: string) => meals.find((m) => m.id === mealId);

  const coverage = plan?.coverage ?? 2;

  const dayInfo = (i: number): { meal?: Meal; served?: boolean; servedFrom?: string } => {
    const slot = plan?.days[i];
    if (slot?.mealId) return { meal: mealFor(slot.mealId) };
    for (let j = i - 1; j >= Math.max(0, i - coverage + 1); j--) {
      const prev = plan?.days[j];
      if (prev?.mealId) {
        const meal = mealFor(prev.mealId);
        return meal ? { meal, served: true, servedFrom: DAYS[j] } : { served: true, servedFrom: DAYS[j] };
      }
    }
    return {};
  };

  const coversEndLabel = (i: number) =>
    dateLabel(Math.min(6, i + coverage - 1));

  const groceryMeals = useMemo(() => {
    if (!plan) return [];
    return plan.days.flatMap((slot, i) => {
      if (!slot?.mealId) return [];
      const meal = meals.find((m) => m.id === slot.mealId);
      if (!meal) return [];
      const end = new Date(`${weekStart}T00:00:00Z`);
      end.setUTCDate(end.getUTCDate() + Math.min(6, i + coverage - 1));
      const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return [{ meal, day: DAYS[i], coversEnd: endLabel }];
    });
  }, [plan, meals, coverage, weekStart]);

  const mealOptions = useMemo(() => {
    let opts = selectedTypes.length
      ? meals.filter((m) => selectedTypes.includes(m.type))
      : meals;
    const assigned = new Set(plan?.days.map((d) => d?.mealId).filter(Boolean) as string[]);
    for (const m of meals) {
      if (assigned.has(m.id) && !opts.some((o) => o.id === m.id)) opts = [...opts, m];
    }
    return [...opts].sort((a, b) => a.name.localeCompare(b.name));
  }, [meals, selectedTypes, plan]);

  const updateDays = (days: (DaySlot | null)[]) => {
    if (!plan) return;
    setPlan({ ...plan, days });
  };

  const handleShuffleWeek = () => {
    if (!plan) return;
    setPlan(
      shuffleWeek(meals, { allowedTypes: selectedTypes, noRepeat }, plan, plan.coverage ?? 2),
    );
  };

  const handleCoverageChange = (coverage: number) => {
    if (!plan) return;
    setPlan(shuffleWeek(meals, { allowedTypes: selectedTypes, noRepeat }, plan, coverage));
  };

  const handleServingsChange = (servings: number) => {
    if (!plan) return;
    setPlan({ ...plan, servings });
  };

  const handleDayShuffle = (dayIndex: number) => {
    if (!plan) return;
    const usedIds = new Set<string>();
    plan.days.forEach((slot, i) => {
      if (i !== dayIndex && slot?.mealId) usedIds.add(slot.mealId);
    });
    const meal = pickMeal(meals, { allowedTypes: selectedTypes, noRepeat }, usedIds);
    if (!meal) return;
    const days = [...plan.days];
    days[dayIndex] = { ...(days[dayIndex] ?? {}), mealId: meal.id };
    updateDays(days);
  };

  const handlePickMeal = (dayIndex: number, mealId: string) => {
    if (!plan || !mealId) return;
    const days = [...plan.days];
    days[dayIndex] = { ...(days[dayIndex] ?? {}), mealId };
    updateDays(days);
  };

  const handleToggleLock = (dayIndex: number) => {
    if (!plan) return;
    const days = [...plan.days];
    const slot = days[dayIndex] ?? {};
    days[dayIndex] = { ...slot, locked: !slot.locked };
    updateDays(days);
  };

  const handleClear = (dayIndex: number) => {
    if (!plan) return;
    const days = [...plan.days];
    days[dayIndex] = null;
    updateDays(days);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">This Week&apos;s Plan</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {weekStart} · click an empty day to pick a meal
          </p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <TypeFilter selected={selectedTypes} onChange={setSelectedTypes} />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={noRepeat}
            onChange={(e) => setNoRepeat(e.target.checked)}
            className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
          />
          No repeats in the week
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="text-zinc-500 dark:text-zinc-400">Each meal covers</span>
          <select
            value={coverage}
            onChange={(e) => handleCoverageChange(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="text-zinc-500 dark:text-zinc-400">People</span>
          <input
            type="number"
            min={1}
            max={30}
            value={plan?.servings ?? 4}
            onChange={(e) => handleServingsChange(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <button
          type="button"
          onClick={handleShuffleWeek}
          disabled={!plan || meals.length === 0}
          className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          Shuffle Week
        </button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-zinc-400">Loading…</p>
      ) : meals.length === 0 ? (
        <p className="py-16 text-center text-zinc-400">
          No meals yet. Add some on the{" "}
          <a className="underline" href="/meals">
            Meals
          </a>{" "}
          page.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {DAYS.map((day, i) => {
              const slot = plan?.days[i];
              const info = dayInfo(i);
              return (
                <DayCard
                  key={day}
                  day={day}
                  dateLabel={dateLabel(i)}
                  meal={info.meal}
                  locked={slot?.locked ?? false}
                  served={info.served}
                  servedFrom={info.servedFrom}
                  covers={slot?.mealId && info.meal ? coverage : undefined}
                  coversEnd={slot?.mealId && info.meal ? coversEndLabel(i) : undefined}
                  onOpenPicker={() => setPickerDay(i)}
                  onShuffle={() => handleDayShuffle(i)}
                  onToggleLock={() => handleToggleLock(i)}
                  onClear={() => handleClear(i)}
                />
              );
            })}
          </div>

          <div className="mt-6">
            <GroceryList meals={groceryMeals} servings={plan?.servings ?? 4} />
          </div>
        </>
      )}

      <MealPicker
        key={pickerDay}
        open={pickerDay !== null}
        meals={mealOptions}
        onSelect={(mealId) => {
          if (pickerDay !== null) handlePickMeal(pickerDay, mealId);
          setPickerDay(null);
        }}
        onClose={() => setPickerDay(null)}
      />

      {selectedTypes.length > 0 && (
        <p className="mt-4 text-sm text-zinc-400">
          Shuffle only picks from: {selectedTypes.join(", ")}
          {noRepeat ? " · no repeats" : ""}
        </p>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { label: string; cls: string }> = {
    idle: { label: "", cls: "" },
    saving: { label: "Saving…", cls: "text-zinc-400" },
    saved: { label: "Saved", cls: "text-emerald-500" },
    error: { label: "Save failed", cls: "text-rose-500" },
  };
  const { label, cls } = map[state];
  if (!label) return null;
  return <span className={`text-sm ${cls}`}>{label}</span>;
}