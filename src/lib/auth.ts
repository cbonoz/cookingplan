import { timingSafeEqual } from "node:crypto";

export function isSitePassword(input: string): boolean {
  const expected = process.env.SITE_PASSWORD ?? "";
  if (!expected || !input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}