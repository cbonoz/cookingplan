import { NextResponse } from "next/server";
import { getPlan, savePlan } from "@/lib/airtable";
import { weekStartOf } from "@/lib/week";
import type { WeekPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart") ?? weekStartOf(new Date());
    const plan = await getPlan(weekStart);
    return NextResponse.json(plan ?? { weekStart, days: Array(7).fill(null) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load plan" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const plan = (await request.json()) as WeekPlan;
    if (!plan.weekStart || !Array.isArray(plan.days) || plan.days.length !== 7) {
      return NextResponse.json({ error: "Invalid plan payload" }, { status: 400 });
    }
    await savePlan(plan);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save plan" },
      { status: 500 },
    );
  }
}