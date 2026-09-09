"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "cookingplan_unlocked";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const unlocked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [granted, setGranted] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (unlocked || granted) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      localStorage.setItem(STORAGE_KEY, "1");
      setGranted(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="mb-1 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          🍽️ CookingPlan
        </h1>
        <p className="mb-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
          This site is password protected.
        </p>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        {error && <p className="mt-2 text-sm text-rose-500">Incorrect password</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}