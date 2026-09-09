"use client";

import { useEffect, useMemo, useState } from "react";
import type { Meal } from "@/lib/types";
import { TypeBadge } from "./TypeBadge";

export function MealPicker({
  open,
  meals,
  onSelect,
  onClose,
}: {
  open: boolean;
  meals: Meal[];
  onSelect: (mealId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((m) => m.name.toLowerCase().includes(q));
  }, [meals, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Pick a meal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meals…"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <ul className="max-h-[55vh] flex-1 overflow-y-auto p-2">
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{m.name}</p>
                  {m.protein && (
                    <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                      {m.protein}
                      {m.modifier ? ` · ${m.modifier}` : ""}
                    </p>
                  )}
                </div>
                <TypeBadge type={m.type} />
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">No meals found.</p>
          )}
        </ul>
      </div>
    </div>
  );
}