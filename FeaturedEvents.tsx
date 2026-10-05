"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { EventItem } from "@/lib/types";
import { categoryMeta } from "@/lib/types";
import { fmtDate, priceLabel } from "@/lib/format";

/** FR-07 — Featured events carousel, managed by the admin (Strapi CMS in production). */
export default function FeaturedEvents({ events }: { events: EventItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (events.length === 0) return null;

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">⭐ Featured events</h2>
            <p className="mt-1 text-sm text-slate-500">Hand-picked by our team for the coming days.</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scroll(-1)}
              aria-label="Scroll featured events left"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              ←
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scroll featured events right"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="scrollbar-none -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2"
        >
          {events.map((ev) => {
            const meta = categoryMeta(ev.category);
            return (
              <Link
                key={ev.slug}
                href={`/events/${ev.slug}`}
                className="group w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition hover:shadow-lg"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={ev.images[0]}
                    alt={`${ev.title} — featured event`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 85vw, 280px"
                    loading="lazy"
                  />
                  <span
                    className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.emoji} {ev.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-bold text-slate-900 group-hover:text-indigo-700">{ev.title}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {fmtDate(ev.dateStart)} · {priceLabel(ev.price)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{ev.shortDescription}</p>
                  <span className="mt-3 inline-block rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition group-hover:bg-indigo-700">
                    View Details
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
