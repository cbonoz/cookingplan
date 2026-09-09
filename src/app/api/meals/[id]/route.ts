import { NextResponse } from "next/server";
import { deleteMeal, updateMeal } from "@/lib/airtable";
import type { MealType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, ctx: RouteContext<"/api/meals/[id]">) {
  try {
    const { id } = await ctx.params;
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
    const meal = await updateMeal(id, {
      name: body.name.trim(),
      type: body.type ?? "Vegetarian",
      protein: body.protein?.trim() || undefined,
      modifier: body.modifier?.trim() || undefined,
      date: body.date?.trim() || undefined,
    });
    return NextResponse.json(meal);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update meal" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/meals/[id]">) {
  try {
    const { id } = await ctx.params;
    await deleteMeal(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete meal" },
      { status: 500 },
    );
  }
}