import seedData from "./seed-data.json";
import type { Meal, MealType } from "./types";

export interface SeedMealInput {
  name: string;
  type: MealType;
  protein?: string;
  modifier?: string;
  date?: string;
}

export const SEED_MEALS: SeedMealInput[] = seedData as SeedMealInput[];

export function mealToSeedInput(meal: Meal): SeedMealInput {
  return {
    name: meal.name,
    type: meal.type,
    protein: meal.protein,
    modifier: meal.modifier,
    date: meal.date,
  };
}