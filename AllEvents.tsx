"use client";

import { useEffect, useState } from "react";
import type { EventItem } from "@/lib/types";
import { apiGetEvents, type EventPage } from "@/lib/api";
import { getFavorites, toggleFavorite } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import EventList from "./EventList";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";

const PAGE_SIZE = 8;

/** /events — full listing with pagination + filters (FR-02, FR-03, FR-08). */
export default function AllEvents() {
  const { user } = useAuth();
  const { push } = useToast();

  const [result, setResult] = useState<EventPage | null>(null);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [status, setStatus] = useState<"upcoming" | "past" | "all">("all");

  const [favBump, setFavBump] = useState(0);
  const favs = user ? getFavorites(user.id) : [];

  useEffect(() => {
    let on = true;
    const t = setTimeout(() => {
      apiGetEvents({
        search: q || undefined,
        category: cats.length ? cats : undefined,
        status,
        page,
        pageSize: PAGE_SIZE,
      }).then((r) => on && setResult(r));
    }, 150);
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, [q, cats, status, page]);

  const loading = !result;
  const meta = result?.meta.pagination;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <a href="/" className="hover:text-indigo-600">Home</a> <span className="mx-1">/</span>
        <span className="font-semibold text-slate-800">All events</span>
      </nav>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">All events</h1>
      <p className="mt-1 text-sm text-slate-500">
        {loading ? "Loading…" : `${meta?.total ?? 0} events in total`} — upcoming and past.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <div className="flex flex-wrap items-center gap-3">
          <CategoryFilter
            selected={cats}
            onToggle={(name) => {
              setCats((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]));
              setPage(1);
            }}
            onClear={() => {
              setCats([]);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 w-fit">
          {(["upcoming", "past", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
                status === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : (result?.data.length ?? 0) === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-200">
            <div className="text-4xl">🕵️</div>
            <h3 className="mt-3 font-bold text-slate-800">No results found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Nothing matches “{q || "your filters"}”. Try a different keyword or reset the filters.
            </p>
            <button
              onClick={() => {
                setQ("");
                setCats([]);
                setStatus("all");
                setPage(1);
              }}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <EventList
              events={result!.data}
              isFavorite={(slug) => favs.includes(slug)}
              onToggleFavorite={(ev) => {
                if (!user) {
                  push("Please log in to save events.", "info");
                  return;
                }
                const saved = toggleFavorite(user.id, ev.slug);
                setFavBump((b) => b + 1);
                push(saved ? "Saved to your favorites ♥" : "Removed from favorites", saved ? "success" : "info");
              }}
            />
            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition enabled:hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Previous
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-10 w-10 rounded-xl text-sm font-semibold transition ${
                      p === page
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition enabled:hover:bg-slate-50 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
