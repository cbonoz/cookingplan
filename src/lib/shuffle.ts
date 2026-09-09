import type { DaySlot, Meal, MealType, WeekPlan } from "./types";
import { weekStartOf } from "./week";

export interface ShuffleOptions {
  allowedTypes: MealType[];
  noRepeat: boolean;
}

function filterPool(meals: Meal[], options: ShuffleOptions): Meal[] {
  if (options.allowedTypes.length === 0) return meals;
  return meals.filter((m) => options.allowedTypes.includes(m.type));
}

export function shuffleWeek(
  meals: Meal[],
  options: ShuffleOptions,
  existing?: WeekPlan,
  date = new Date(),
): WeekPlan {
  const pool = filterPool(meals, options);
  const days: (DaySlot | null)[] = Array(7).fill(null);

  if (existing) {
    for (let d = 0; d < 7; d++) {
      if (existing.days[d]?.locked) days[d] = existing.days[d];
    }
  }

  if (pool.length === 0) {
    return { weekStart: weekStartOf(date), days };
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const used = new Set<string>();
  for (const day of days) {
    if (day?.mealId) used.add(day.mealId);
  }

  let idx = 0;
  for (let d = 0; d < 7; d++) {
    if (days[d] !== null) continue;
    let candidate = shuffled[idx % shuffled.length];
    if (options.noRepeat && shuffled.length >= 7) {
      let tries = 0;
      while (used.has(candidate.id) && tries < shuffled.length) {
        idx = (idx + 1) % shuffled.length;
        candidate = shuffled[idx];
        tries++;
      }
    }
    days[d] = { mealId: candidate.id };
    used.add(candidate.id);
    idx = (idx + 1) % shuffled.length;
  }

  return { weekStart: weekStartOf(date), days };
}

export function pickMeal(
  meals: Meal[],
  options: ShuffleOptions,
  usedIds: Set<string>,
): Meal | null {
  const pool = filterPool(meals, options);
  if (pool.length === 0) return null;
  let pool2 = pool;
  if (options.noRepeat) {
    const available = pool.filter((m) => !usedIds.has(m.id));
    if (available.length > 0) pool2 = available;
  }
  return pool2[Math.floor(Math.random() * pool2.length)];
}