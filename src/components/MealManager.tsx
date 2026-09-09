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
  link: string;
  notes: string;
  ingredients: string;
}

const EMPTY: MealDraft = {
  name: "",
  type: "Vegetarian",
  protein: "",
  modifier: "",
  link: "",
  notes: "",
  ingredients: "",
};

export function MealManager() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MealType | "">("");
  const [draft, setDraft] = useState<MealDraft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [discoverUrl, setDiscoverUrl] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoverMsg, setDiscoverMsg] = useState<string | null>(null);
  const [discoverErr, setDiscoverErr] = useState<string | null>(null);

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

  const handleDiscover = async () => {
    const url = discoverUrl.trim();
    if (!url) return;
    setDiscovering(true);
    setDiscoverMsg(null);
    setDiscoverErr(null);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        name?: string;
        notes?: string;
        ingredients?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to read that link");
      setDraft((d) => ({
        ...d,
        name: data.name ?? d.name,
        link: url,
        notes: data.notes ?? d.notes,
        ingredients: data.ingredients ?? d.ingredients,
      }));
      setDiscoverMsg(`Found "${data.name}". Review the fields below and add it.`);
    } catch (err) {
      setDiscoverErr(err instanceof Error ? err.message : "Could not read that link");
    } finally {
      setDiscovering(false);
    }
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
      setDiscoverMsg(null);
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

        <div className="mb-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Discover from a recipe link
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={discoverUrl}
              onChange={(e) => setDiscoverUrl(e.target.value)}
              placeholder="https://… paste any recipe URL"
              className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleDiscover}
              disabled={discovering || !discoverUrl.trim()}
              className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              {discovering ? "Fetching…" : "Suggest details"}
            </button>
          </div>
          {discoverMsg && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{discoverMsg}</p>}
          {discoverErr && <p className="mt-2 text-sm text-rose-500">{discoverErr}</p>}
        </div>

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
          <Input label="Recipe link (optional)" value={draft.link} onChange={(v) => setField("link", v)} placeholder="https://…" />
        </div>
        <Field label="Ingredients (one per line)">
          <textarea
            value={draft.ingredients}
            onChange={(e) => setField("ingredients", e.target.value)}
            rows={3}
            placeholder={"2 chicken breasts\n1 cup rice\n… (used for the grocery list)"}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </Field>
        <Field label="Notes (optional)">
          <textarea
            value={draft.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={2}
            placeholder="Custom notes, ingredients to grab, tweaks…"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </Field>
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
                <div className="flex items-start gap-3">
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
                    </div>
                    {meal.notes && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-400 dark:text-zinc-500">{meal.notes}</p>
                    )}
                    {meal.ingredients && (
                      <p className="mt-1 text-[11px] text-zinc-300 dark:text-zinc-600">
                        🛒 {meal.ingredients.split("\n").filter(Boolean).length} ingredients
                      </p>
                    )}
                    {meal.link && (
                      <a
                        href={meal.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                      >
                        🔗 Recipe link
                      </a>
                    )}
                    <p className="mt-1 text-[11px] text-zinc-300 dark:text-zinc-600">Added {meal.date}</p>
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
    link: meal.link ?? "",
    notes: meal.notes ?? "",
    ingredients: meal.ingredients ?? "",
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
      <Input label="Recipe link (optional)" value={draft.link} onChange={(v) => setDraft((d) => ({ ...d, link: v }))} />
      <Field label="Ingredients (one per line)">
        <textarea
          value={draft.ingredients}
          onChange={(e) => setDraft((d) => ({ ...d, ingredients: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </Field>
      <Field label="Notes (optional)">
        <textarea
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          rows={2}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </Field>
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