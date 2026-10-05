"use client";

import Image from "next/image";

interface HeroProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  stats: { upcoming: number; categories: number };
}

export default function Hero({ query, onQueryChange, onSearch, stats }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Lahore · Pakistan</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          Discover events worth showing up for.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
          Workshops, concerts, food festivals, community drives — find them on the map, filter by what you love, and
          RSVP in one tap.
        </p>

        <form
          className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
          role="search"
        >
          <span className="pl-3 text-lg">🔎</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search events, venues, organizers…"
            className="w-full bg-transparent px-1 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            aria-label="Search events"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-200">
          <div>
            <span className="text-2xl font-extrabold text-white">{stats.upcoming}</span>{" "}
            <span className="text-slate-300">upcoming events</span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">{stats.categories}</span>{" "}
            <span className="text-slate-300">categories</span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white">100%</span>{" "}
            <span className="text-slate-300">free to explore</span>
          </div>
        </div>
      </div>
    </section>
  );
}
