import { NextResponse } from "next/server";
import { discoverFromUrl } from "@/lib/discover";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    const recipe = await discoverFromUrl(url);
    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read that link" },
      { status: 400 },
    );
  }
}