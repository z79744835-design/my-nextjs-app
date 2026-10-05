"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventItem } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { apiGetEvents, apiGetFeatured } from "@/lib/api";
import { getFavorites, toggleFavorite } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import Hero from "./Hero";
import FeaturedEvents from "./FeaturedEvents";
import MapView from "./MapView";
import EventList from "./EventList";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";

const PAGE_SIZE = 6;

export default function Home() {
  const { user } = useAuth();
  const { push } = useToast();

  const [featured, setFeatured] = useState<EventItem[]>([]);
  const [list, setList] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [status, setStatus] = useState<"upcoming" | "all">("upcoming");

  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list"); // mobile tabs (FR-10)
  const [page, setPage] = useState(1);

  const [favBump, setFavBump] = useState(0);
  const favs = useMemo(
    () => (user ? getFavorites(user.id) : []),
    [user, favBump] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Featured events (FR-07)
  useEffect(() => {
    let on = true;
    apiGetFeatured().then((r) => on && setFeatured(r));
    return () => {
      on = false;
    };
  }, []);

  // Explore list — every change goes through the (mock) API (FR-03, FR-08)
  useEffect(() => {
    let on = true;
    setLoading(true);
    const t = setTimeout(() => {
      apiGetEvents({
        search: q || undefined,
        category: cats.length ? cats : undefined,
        status,
        pageSize: 200,
      }).then((r) => {
        if (!on) return;
        setList(r.data);
        setTotal(r.meta.pagination.total);
        setPage(1);
        setLoading(false);
      });
    }, 180);
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, [q, cats, status]);

  const toggleCat = (name: string) =>
    setCats((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]));

  const scrollToExplore = () =>
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const stats = useMemo(() => {
    let up = 0;
    let seen = new Set<string>();
    for (const e of list) {
      if (e.status === "upcoming") up++;
      seen.add(e.category);
    }
    return { upcoming: up, categories: cats.length ? cats.length : CATEGORIES.length };
  }, [list, cats]);

  const shown = list.slice(0, page * PAGE_SIZE);
  const filtersActive = q !== "" || cats.length > 0;

  return (
    <>
      <Hero query={q} onQueryChange={setQ} onSearch={scrollToExplore} stats={stats} />
      <FeaturedEvents events={featured} />

      <section id="explore" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Explore events</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? "Loading events…" : `${total} ${total === 1 ? "event" : "events"} found`} — hover a card to
              see it on the map.
            </p>
          </div>

          {/* Mobile map/list toggle (FR-10) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 lg:hidden">
            <button
              onClick={() => setView("list")}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setView("map")}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                view === "map" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              🗺️ Map
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchBar value={q} onChange={setQ} onSubmit={scrollToExplore} className="md:max-w-md md:flex-1" />
            <div className="flex items-center gap-2 self-start rounded-xl bg-slate-100 p-1 md:self-auto">
              {(["upcoming", "all"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                    status === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s === "upcoming" ? "Upcoming" : "All events"}
                </button>
              ))}
            </div>
          </div>
          <CategoryFilter selected={cats} onToggle={toggleCat} onClear={() => setCats([])} />
        </div>

        {filtersActive && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>
              Filters: {q && `“${q}”`} {cats.map((c) => c).join(", ")}
            </span>
            <button
              onClick={() => {
                setQ("");
                setCats([]);
              }}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Reset
            </button>
          </div>
        )}

        <div className="mt-6 gap-6 lg:grid lg:grid-cols-5">
          {/* Map (FR-01) */}
          <div className={`${view === "map" ? "block" : "hidden"} relative z-0 lg:col-span-3 lg:block`}>
            <div className="relative z-0 h-[480px] overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200 lg:h-[560px]">
              <MapView
                events={list}
                selectedSlug={selected}
                highlightSlug={hover ?? selected}
                onSelect={(slug) => {
                  setSelected(slug);
                  setView("list");
                }}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* List (FR-02) */}
          <div className={`${view === "list" ? "block" : "hidden"} mt-6 lg:col-span-2 lg:mt-0`}>
            <div className="lg:overflow-y-auto lg:pb-2 lg:pr-1" style={{ maxHeight: "560px" }}>
              {loading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
                  ))}
                </div>
              ) : shown.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
                  <div className="text-4xl">🕵️</div>
                  <h3 className="mt-3 font-bold text-slate-800">No results found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    We couldn't find any events matching your filters. Try a different keyword or category.
                  </p>
                  <button
                    onClick={() => {
                      setQ("");
                      setCats([]);
                      setStatus("all");
                    }}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <EventList
                  events={shown}
                  selectedSlug={selected}
                  highlightSlug={hover}
                  onHover={setHover}
                  onPick={setSelected}
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
              )}
            </div>
            {!loading && shown.length < list.length && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Showing {shown.length} of {list.length}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-slate-200 transition hover:bg-indigo-50"
                >
                  Load more ↓
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-3">
          {[
            {
              icon: "🗺️",
              title: "Browse the map",
              text: "Every event is pinned on an interactive, color-coded map — zoom, pan and find the one nearest to you.",
            },
            {
              icon: "🎟️",
              title: "RSVP in one tap",
              text: "Create a free account, reserve your spot and get an instant confirmation code for your tickets.",
            },
            {
              icon: "🤝",
              title: "Built for community",
              text: "Save favorites, review events you've attended and submit your own events for admin approval.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
