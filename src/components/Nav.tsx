"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Planner" },
    { href: "/meals", label: "Meals" },
  ];
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          🍽️ CookingPlan
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}