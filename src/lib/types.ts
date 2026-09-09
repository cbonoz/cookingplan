export const MEAL_TYPES = [
  "Red Meat",
  "White Meat",
  "Fish",
  "Vegetarian",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  protein?: string;
  modifier?: string;
  link?: string;
  notes?: string;
  ingredients?: string;
  date?: string;
}

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DaySlot {
  mealId?: string;
  locked?: boolean;
}

export interface WeekPlan {
  weekStart: string;
  days: (DaySlot | null)[];
  coverage?: number;
  servings?: number;
}