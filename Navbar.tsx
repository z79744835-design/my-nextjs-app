"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/#explore", label: "Explore" },
    { href: "/events", label: "All Events" },
  ];
  if (user?.isAdmin) links.push({ href: "/admin", label: "Admin" });

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        pathname === href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm">
            📍
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Event<span className="text-indigo-600">ly</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">{links.map((l) => navLink(l.href, l.label))}</nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="hidden items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 transition hover:bg-slate-200 sm:flex"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-28 truncate text-sm font-semibold text-slate-700">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                  router.push("/");
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-rose-600"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Log in
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => navLink(l.href, l.label))}
            {user && navLink("/profile", "My Profile")}
          </nav>
        </div>
      )}
    </header>
  );
}
