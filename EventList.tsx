"use client";

import { useEffect, useRef } from "react";
import type { EventItem } from "@/lib/types";
import EventCard from "./EventCard";

interface EventListProps {
  events: EventItem[];
  selectedSlug?: string | null;
  highlightSlug?: string | null;
  onHover?: (slug: string | null) => void;
  onPick?: (slug: string) => void;
  isFavorite?: (slug: string) => boolean;
  onToggleFavorite?: (ev: EventItem) => void;
  className?: string;
}

export default function EventList({
  events,
  selectedSlug,
  highlightSlug,
  onHover,
  onPick,
  isFavorite,
  onToggleFavorite,
  className,
}: EventListProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll the selected card into view (map → list sync, FR-02).
  useEffect(() => {
    if (!selectedSlug || !ref.current) return;
    const el = ref.current.querySelector(`[data-slug="${selectedSlug}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSlug]);

  return (
    <div ref={ref} className={`space-y-4 ${className ?? ""}`}>
      {events.map((ev) => (
        <EventCard
          key={ev.slug}
          ev={ev}
          active={ev.slug === selectedSlug || ev.slug === highlightSlug}
          onMouseEnter={() => onHover?.(ev.slug)}
          onMouseLeave={() => onHover?.(null)}
          onFocusCard={() => onPick?.(ev.slug)}
          isFavorite={isFavorite ? isFavorite(ev.slug) : false}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(ev) : undefined}
        />
      ))}
    </div>
  );
}
