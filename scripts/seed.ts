import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const TOKEN = process.env.AIRTABLE_TOKEN ?? "";
const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "";
const MEALS_TABLE = process.env.AIRTABLE_MEALS_TABLE_ID ?? "";

if (!TOKEN || !BASE_ID || !MEALS_TABLE) {
  console.error("Missing Airtable env vars. Run with: node --env-file=.env.local scripts/seed.ts");
  process.exit(1);
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const seedDataPath = path.join(dir, "../src/lib/seed-data.json");
const meals = JSON.parse(readFileSync(seedDataPath, "utf8"));

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function existingCount(): Promise<number> {
  const data = await api(`/${MEALS_TABLE}?pageSize=1`);
  return data.offset ? Infinity : data.records.length;
}

async function main() {
  const count = await existingCount();
  if (count > 0) {
    console.log(`Meals table already has ${count} records; skipping seed.`);
    return;
  }

  const chunks: typeof meals[] = [];
  for (let i = 0; i < meals.length; i += 10) {
    chunks.push(meals.slice(i, i + 10));
  }

  let created = 0;
  for (const chunk of chunks) {
    const records = chunk.map((m: (typeof meals)[number]) => ({
      fields: {
        Name: m.name,
        Type: m.type,
        Protein: m.protein ?? "",
        Modifier: m.modifier ?? "",
        Link: m.link ?? "",
        Notes: m.notes ?? "",
        Ingredients: m.ingredients ?? "",
        Date: m.date ?? todayISO(),
      },
    }));
    const data = await api(`/${MEALS_TABLE}`, {
      method: "POST",
      body: JSON.stringify({ records }),
    });
    created += data.records.length;
  }
  console.log(`Seeded ${created} meals into Airtable.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});