"use client";

import Link from "next/link";
import Image from "next/image";
import type { EventItem } from "@/lib/types";
import { categoryMeta } from "@/lib/types";
import { fmtDate, fmtTime, priceLabel } from "@/lib/format";

interface EventCardProps {
  ev: EventItem;
  active?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocusCard?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function EventCard({
  ev,
  active,
  onMouseEnter,
  onMouseLeave,
  onFocusCard,
  isFavorite,
  onToggleFavorite,
}: EventCardProps) {
  const meta = categoryMeta(ev.category);

  return (
    <div
      data-slug={ev.slug}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocusCard}
      tabIndex={0}
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition ${
        active ? "shadow-md ring-2 ring-indigo-500" : "ring-slate-200 hover:shadow-md"
      }`}
    >
      <Link href={`/events/${ev.slug}`} className="group block">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
          <Image
            src={ev.images[0]}
            alt={`${ev.title} — ${meta.emoji} ${ev.category} event thumbnail`}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 40vw"
            loading="lazy"
          />
          <span
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: meta.color }}
          >
            {meta.emoji} {ev.category}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
            {priceLabel(ev.price)}
          </span>
          {ev.status === "past" && (
            <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">
              Past event
            </span>
          )}
        </div>

        <div className="space-y-1.5 p-4">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-indigo-700">
            {ev.title}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>📅</span> {fmtDate(ev.dateStart)} · {fmtTime(ev.dateStart)}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>📍</span> {ev.venue.name}, {ev.venue.city}
          </p>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{ev.shortDescription}</p>
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span className="text-xs font-semibold text-indigo-600">View details →</span>
            {onToggleFavorite && (
              <button
                type="button"
                aria-label={isFavorite ? "Remove from saved events" : "Save event"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`grid h-8 w-8 place-items-center rounded-full text-base transition ${
                  isFavorite ? "bg-rose-50 text-rose-500" : "text-slate-400 hover:bg-slate-100 hover:text-rose-400"
                }`}
              >
                {isFavorite ? "♥" : "♡"}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
