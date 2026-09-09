export interface DiscoveredRecipe {
  name: string;
  notes?: string;
  ingredients?: string;
}

const PRIVATE_HOST =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|0\.0\.0\.0|\[::1\]|::1|\[::\])$/;

export async function discoverFromUrl(rawUrl: string): Promise<DiscoveredRecipe> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }
  if (PRIVATE_HOST.test(url.hostname)) {
    throw new Error("This URL points to a local address");
  }

  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; CookingPlan/1.0)",
      accept: "text/html",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Could not fetch that page (HTTP ${res.status})`);
  const html = await res.text();

  const rawTitle =
    metaContent(html, ["og:title", "twitter:title"]) ?? titleTag(html);
  if (!rawTitle) throw new Error("No recipe title found on that page");
  const description =
    metaContent(html, ["og:description", "twitter:description"]) ??
    metaContent(html, ["description"]);
  const ingredients = recipeIngredients(html);

  return {
    name: cleanTitle(rawTitle),
    notes: description ? cleanText(description) : undefined,
    ingredients: ingredients.length > 0 ? ingredients.join("\n") : undefined,
  };
}

function recipeIngredients(html: string): string[] {
  const blocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (!blocks) return [];

  const items: string[] = [];
  for (const block of blocks) {
    const raw = block
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();
    if (!raw) continue;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    for (const entry of toArray(data)) {
      const recipe = findRecipe(entry);
      if (!recipe) continue;
      const ing = recipe.recipeIngredient ?? recipe.ingredients ?? recipe.ingredientList;
      if (!Array.isArray(ing)) continue;
      for (const item of ing) {
        const s = typeof item === "string" ? item : item?.text ?? item?.name;
        if (typeof s === "string" && s.trim()) items.push(cleanText(s));
      }
    }
  }
  return items;
}

function toArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  return value && typeof value === "object" ? [value as Record<string, unknown>] : [];
}

function findRecipe(node: Record<string, unknown>): Record<string, unknown> | null {
  if (String(node["@type"] ?? "").includes("Recipe")) return node;
  const graph = node["@graph"];
  if (Array.isArray(graph)) {
    for (const g of graph as Record<string, unknown>[]) {
      if (String(g["@type"] ?? "").includes("Recipe")) return g;
    }
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value as Record<string, unknown>[]) {
        const found = findRecipe(item);
        if (found) return found;
      }
    }
  }
  return null;
}

function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name|itemprop)=["']${name}["'][^>]+content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name|itemprop)=["']${name}["']`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const match = html.match(re);
      if (match) {
        const value = decodeEntities(match[1]);
        if (value) return value;
      }
    }
  }
  return null;
}

function titleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const value = decodeEntities(match[1]).replace(/\s+/g, " ").trim();
  return value || null;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCharCode(Number(dec)));
}

function cleanText(input: string): string {
  return decodeEntities(input).replace(/\s+/g, " ").trim();
}

function cleanTitle(raw: string): string {
  const title = raw.replace(/\s+/g, " ").trim();
  const parts = title.split(/\s*[|\u2014\u2013]\s*/).filter(Boolean);
  if (parts.length <= 1) return title;
  return parts.reduce((a, b) => (b.length > a.length ? b : a));
}