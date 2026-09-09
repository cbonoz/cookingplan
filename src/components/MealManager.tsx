"use client";

import { useEffect, useMemo, useState } from "react";
import { MEAL_TYPES } from "@/lib/types";
import type { Meal, MealType } from "@/lib/types";
import { TypeBadge } from "./TypeBadge";

interface MealDraft {
  name: string;
  type: MealType;
  protein: string;
  modifier: string;
  date: string;
}

const EMPTY: MealDraft = { name: "", type: "Vegetarian", protein: "", modifier: "", date: "" };

export function MealManager() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MealType | "">("");
  const [draft, setDraft] = useState<MealDraft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/meals")
      .then((r) => r.json())
      .then(setMeals)
      .catch(() => setError("Failed to load meals"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return meals.filter((m) => {
      if (typeFilter && m.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [meals, search, typeFilter]);

  const setField = (field: keyof MealDraft, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      const created = (await res.json()) as Meal;
      setMeals((prev) => [...prev, created]);
      setDraft(EMPTY);
    } catch {
      setError("Failed to add meal");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (meal: Meal) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/meals/${meal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as Meal;
      setMeals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
    } catch {
      setError("Failed to save meal");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this meal?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Failed to delete meal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Meals</h1>

      <form onSubmit={submit} className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Add a meal</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Name *" value={draft.name} onChange={(v) => setField("name", v)} placeholder="e.g. Lasagna" />
          <Field label="Type">
            <select
              value={draft.type}
              onChange={(e) => setField("type", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Input label="Protein" value={draft.protein} onChange={(v) => setField("protein", v)} placeholder="Chicken, tofu…" />
          <Input label="Modifier (optional)" value={draft.modifier} onChange={(v) => setField("modifier", v)} placeholder="with rice / add feta…" />
          <Input label="Date (optional)" value={draft.date} onChange={(v) => setField("date", v)} placeholder="2026-09-14" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !draft.name.trim()}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            Add Meal
          </button>
          {error && <span className="text-sm text-rose-500">{error}</span>}
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meals…"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MealType | "")}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">All types</option>
          {MEAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-zinc-400">
          {filtered.length} meal{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <p className="py-16 text-center text-zinc-400">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((meal) => (
            <li
              key={meal.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {editingId === meal.id ? (
                <EditRow meal={meal} busy={busy} onCancel={() => setEditingId(null)} onSave={saveEdit} />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{meal.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <TypeBadge type={meal.type} />
                      {meal.protein && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {meal.protein}
                        </span>
                      )}
                      {meal.modifier && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{meal.modifier}</span>
                      )}
                      {meal.date && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">· {meal.date}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(meal.id)}
                      className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(meal.id)}
                      disabled={busy}
                      className="rounded-lg px-2 py-1 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-zinc-400">No meals match.</p>
          )}
        </ul>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function EditRow({
  meal,
  busy,
  onCancel,
  onSave,
}: {
  meal: Meal;
  busy: boolean;
  onCancel: () => void;
  onSave: (meal: Meal) => void;
}) {
  const [draft, setDraft] = useState<MealDraft>({
    name: meal.name,
    type: meal.type,
    protein: meal.protein ?? "",
    modifier: meal.modifier ?? "",
    date: meal.date ?? "",
  });
  return (
    <div className="space-y-3">
      <Input label="Name *" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Type">
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as MealType }))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Input label="Protein" value={draft.protein} onChange={(v) => setDraft((d) => ({ ...d, protein: v }))} />
      </div>
      <Input label="Modifier (optional)" value={draft.modifier} onChange={(v) => setDraft((d) => ({ ...d, modifier: v }))} />
      <Input label="Date (optional)" value={draft.date} onChange={(v) => setDraft((d) => ({ ...d, date: v }))} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSave({ ...meal, ...draft })}
          disabled={busy || !draft.name.trim()}
          className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}