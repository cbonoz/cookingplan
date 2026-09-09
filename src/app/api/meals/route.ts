import { NextResponse } from "next/server";
import { createMeal, listMeals } from "@/lib/airtable";
import type { MealType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const meals = await listMeals();
    return NextResponse.json(meals);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load meals" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      type?: MealType;
      protein?: string;
      modifier?: string;
      date?: string;
    };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const meal = await createMeal({
      name: body.name.trim(),
      type: body.type ?? "Vegetarian",
      protein: body.protein?.trim() || undefined,
      modifier: body.modifier?.trim() || undefined,
      date: body.date?.trim() || undefined,
    });
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create meal" },
      { status: 500 },
    );
  }
}