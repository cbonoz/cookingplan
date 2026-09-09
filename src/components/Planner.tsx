"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DAYS } from "@/lib/types";
import type { DayMode, DaySlot, Meal, MealType, WeekPlan } from "@/lib/types";
import { weekStartOf } from "@/lib/week";
import { pickMeal, shuffleWeek } from "@/lib/shuffle";
import { DayCard } from "./DayCard";
import { TypeFilter } from "./TypeFilter";

type SaveState = "idle" | "saving" | "saved" | "error";

const EVERY_OTHER_DAY: DayMode[] = ["cook", "leftover", "cook", "leftover", "cook", "leftover", "cook"];

function normalizePlan(raw: WeekPlan): WeekPlan {
  if (raw.days.every((slot) => slot === null)) {
    return { weekStart: raw.weekStart, days: EVERY_OTHER_DAY.map((mode) => ({ mode })) };
  }
  return {
    weekStart: raw.weekStart,
    days: raw.days.map((slot) => {
      if (!slot) return { mode: "off" };
      if (!slot.mode) {
        return slot.mealId ? { ...slot, mode: "cook" } : { mode: "off" };
      }
      return { ...slot };
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

  const dayView = (i: number): { meal?: Meal; leftover?: boolean; hasSource?: boolean } => {
    const slot = plan?.days[i];
    if (!slot) return {};
    if (slot.mode === "cook") return { meal: mealFor(slot.mealId) };
    if (slot.mode === "leftover") {
      const prev = plan?.days[i - 1];
      if (prev?.mode === "cook" && prev.mealId) {
        const meal = mealFor(prev.mealId);
        return meal ? { meal, leftover: true, hasSource: true } : { hasSource: true };
      }
      return { hasSource: false };
    }
    return {};
  };

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
    setPlan(shuffleWeek(meals, { allowedTypes: selectedTypes, noRepeat }, plan));
  };

  const handleDayShuffle = (dayIndex: number) => {
    if (!plan) return;
    const usedIds = new Set<string>();
    plan.days.forEach((slot, i) => {
      if (i !== dayIndex && slot?.mode === "cook" && slot.mealId) usedIds.add(slot.mealId);
    });
    const meal = pickMeal(meals, { allowedTypes: selectedTypes, noRepeat }, usedIds);
    if (!meal) return;
    const days = [...plan.days];
    days[dayIndex] = { ...(days[dayIndex] ?? {}), mode: "cook", mealId: meal.id };
    updateDays(days);
  };

  const handlePickMeal = (dayIndex: number, mealId: string) => {
    if (!plan || !mealId) return;
    const days = [...plan.days];
    days[dayIndex] = { ...(days[dayIndex] ?? {}), mode: "cook", mealId };
    updateDays(days);
  };

  const handleModeChange = (dayIndex: number, mode: DayMode) => {
    if (!plan) return;
    const days = [...plan.days];
    if (mode === "cook") {
      days[dayIndex] = { ...(days[dayIndex] ?? {}), mode: "cook" };
    } else {
      days[dayIndex] = { mode };
    }
    updateDays(days);
  };

  const handleToggleLock = (dayIndex: number) => {
    if (!plan) return;
    const days = [...plan.days];
    const slot = days[dayIndex] ?? { mode: "cook" as DayMode };
    days[dayIndex] = { ...slot, locked: !slot.locked };
    updateDays(days);
  };

  const handleClear = (dayIndex: number) => {
    if (!plan) return;
    const days = [...plan.days];
    days[dayIndex] = { mode: "cook" };
    updateDays(days);
  };

  const handleSetPattern = (pattern: DayMode[]) => {
    if (!plan) return;
    const days = pattern.map((mode) => ({ mode }));
    updateDays(days);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">This Week&apos;s Plan</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {weekStart} · a cooked meal covers the next day as leftovers
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
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Presets:</span>
          <PresetButton label="Cook every other day" onClick={() => handleSetPattern(EVERY_OTHER_DAY)} />
          <PresetButton label="Cook daily" onClick={() => handleSetPattern(Array(7).fill("cook") as DayMode[])} />
          <PresetButton label="All off" onClick={() => handleSetPattern(Array(7).fill("off") as DayMode[])} />
        </div>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((day, i) => {
            const slot = plan?.days[i];
            const mode = slot?.mode ?? "off";
            const view = dayView(i);
            return (
              <DayCard
                key={day}
                day={day}
                dateLabel={dateLabel(i)}
                mode={mode}
                meal={view.meal}
                hasSource={view.hasSource}
                locked={slot?.locked ?? false}
                mealOptions={mealOptions}
                onModeChange={(m) => handleModeChange(i, m)}
                onPickMeal={(id) => handlePickMeal(i, id)}
                onShuffle={() => handleDayShuffle(i)}
                onToggleLock={() => handleToggleLock(i)}
                onClear={() => handleClear(i)}
              />
            );
          })}
        </div>
      )}

      {selectedTypes.length > 0 && (
        <p className="mt-4 text-sm text-zinc-400">
          Shuffle only picks from: {selectedTypes.join(", ")}
          {noRepeat ? " · no repeats" : ""}
        </p>
      )}
    </div>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
    >
      {label}
    </button>
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