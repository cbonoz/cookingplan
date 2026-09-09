import type { Meal, MealType, WeekPlan } from "./types";

const TOKEN = process.env.AIRTABLE_TOKEN ?? "";
const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "";
const MEALS_TABLE = process.env.AIRTABLE_MEALS_TABLE_ID ?? "";
const PLANS_TABLE = process.env.AIRTABLE_PLANS_TABLE_ID ?? "";

const API = `https://api.airtable.com/v0/${BASE_ID}`;

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

function mapMeal(record: AirtableRecord): Meal {
  const f = record.fields;
  return {
    id: record.id,
    name: String(f.Name ?? ""),
    type: (f.Type as MealType) ?? "Vegetarian",
    protein: f.Protein ? String(f.Protein) : undefined,
    modifier: f.Modifier ? String(f.Modifier) : undefined,
    date: f.Date ? String(f.Date) : undefined,
  };
}

export async function listMeals(): Promise<Meal[]> {
  const data = await request<{ records: AirtableRecord[] }>(
    `/${MEALS_TABLE}?pageSize=100&sort[0][field]=Name&sort[0][direction]=asc`,
  );
  return data.records.map(mapMeal);
}

export async function createMeal(
  meal: Omit<Meal, "id">,
): Promise<Meal> {
  const data = await request<{ records: AirtableRecord[] }>(
    `/${MEALS_TABLE}`,
    {
      method: "POST",
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: meal.name,
              Type: meal.type,
              Protein: meal.protein ?? "",
              Modifier: meal.modifier ?? "",
              Date: meal.date ?? "",
            },
          },
        ],
      }),
    },
  );
  return mapMeal(data.records[0]);
}

export async function updateMeal(id: string, meal: Omit<Meal, "id">): Promise<Meal> {
  const data = await request<{ records: AirtableRecord[] }>(
    `/${MEALS_TABLE}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        records: [
          {
            id,
            fields: {
              Name: meal.name,
              Type: meal.type,
              Protein: meal.protein ?? "",
              Modifier: meal.modifier ?? "",
              Date: meal.date ?? "",
            },
          },
        ],
      }),
    },
  );
  return mapMeal(data.records[0]);
}

export async function deleteMeal(id: string): Promise<void> {
  await request(`/${MEALS_TABLE}/${id}`, { method: "DELETE" });
}

interface PlanRecord {
  id: string;
  fields: {
    WeekStart?: string;
    Days?: string;
  };
}

async function findPlanRecord(weekStart: string): Promise<PlanRecord | null> {
  const encoded = encodeURIComponent(`{WeekStart}="${weekStart}"`);
  const data = await request<{ records: PlanRecord[] }>(
    `/${PLANS_TABLE}?filterByFormula=${encoded}&maxRecords=1`,
  );
  return data.records[0] ?? null;
}

export async function getPlan(weekStart: string): Promise<WeekPlan | null> {
  const record = await findPlanRecord(weekStart);
  if (!record) return null;
  return parsePlan(record.fields.Days ?? "", weekStart);
}

export async function savePlan(plan: WeekPlan): Promise<void> {
  const existing = await findPlanRecord(plan.weekStart);
  const body = {
    fields: {
      WeekStart: plan.weekStart,
      Days: JSON.stringify(plan.days),
    },
  };
  if (existing) {
    await request(`/${PLANS_TABLE}/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  } else {
    await request(`/${PLANS_TABLE}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

function parsePlan(raw: string, weekStart: string): WeekPlan | null {
  try {
    const days = JSON.parse(raw);
    if (!Array.isArray(days) || days.length !== 7) return null;
    return { weekStart, days };
  } catch {
    return null;
  }
}