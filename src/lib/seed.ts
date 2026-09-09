import seedData from "./seed-data.json";
import type { Meal, MealType } from "./types";

export interface SeedMealInput {
  name: string;
  type: MealType;
  protein?: string;
  modifier?: string;
  link?: string;
  notes?: string;
  ingredients?: string;
  date?: string;
}

export const SEED_MEALS: SeedMealInput[] = seedData as SeedMealInput[];

export function mealToSeedInput(meal: Meal): SeedMealInput {
  return {
    name: meal.name,
    type: meal.type,
    protein: meal.protein,
    modifier: meal.modifier,
    link: meal.link,
    notes: meal.notes,
    ingredients: meal.ingredients,
    date: meal.date,
  };
}