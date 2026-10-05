"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { EventItem } from "@/lib/types";
import { categoryMeta } from "@/lib/types";
import { fmtDate, fmtTimeRange, priceLabel } from "@/lib/format";

/** Stylized offline basemap bounds for the demo city (Lahore area). */
const BOUNDS: [[number, number], [number, number]] = [
  [31.43, 74.25],
  [31.63, 74.49],
];

type L = any;

function makeIcon(L: L, ev: EventItem, active: boolean) {
  const c = categoryMeta(ev.category).color;
  const s = active ? 46 : 34;
  const html = `<span class="pin${active ? " pin--active" : ""}"><svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${c}" stroke="#ffffff" stroke-width="1.5"/><circle cx="12" cy="9" r="3.2" fill="#ffffff"/></svg></span>`;
  return L.divIcon({ className: "evt-pin", html, iconSize: [s, s], iconAnchor: [s / 2, s], popupAnchor: [0, -s + 6] });
}

function popupHtml(ev: EventItem): string {
  const meta = categoryMeta(ev.category);
  return `<div class="evt-pop">
    <div class="t">${ev.title}</div>
    <div class="m">${fmtDate(ev.dateStart)} · ${fmtTimeRange(ev.dateStart, ev.dateEnd)} · ${priceLabel(ev.price)}
      <span class="cat" style="background:${meta.color}">${meta.emoji} ${ev.category}</span>
    </div>
    <a href="/events/${ev.slug}">View details →</a>
  </div>`;
}

interface MapViewProps {
  events: EventItem[];
  selectedSlug?: string | null;
  highlightSlug?: string | null;
  onSelect?: (slug: string) => void;
  className?: string;
  mini?: boolean;
}

export default function MapView({ events, selectedSlug, highlightSlug, onSelect, className, mini }: MapViewProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ map: L; L: L } | null>(null);
  const markersRef = useRef<Record<string, L>>({});

  const eventsRef = useRef(events);
  eventsRef.current = events;
  const selectedRef = useRef(selectedSlug);
  selectedRef.current = selectedSlug;
  const highlightRef = useRef(highlightSlug);
  highlightRef.current = highlightSlug;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const syncMarkers = () => {
    const st = stateRef.current;
    if (!st) return;
    const { map, L } = st;
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
    for (const ev of eventsRef.current) {
      const active = ev.slug === selectedRef.current || ev.slug === highlightRef.current;
      const m = L.marker([ev.lat, ev.lng], { icon: makeIcon(L, ev, active) });
      m.bindPopup(popupHtml(ev), { closeButton: false, maxWidth: 260 });
      m.on("click", () => onSelectRef.current?.(ev.slug));
      m.addTo(map);
      markersRef.current[ev.slug] = m;
    }
  };
  const syncRef = useRef(syncMarkers);
  syncRef.current = syncMarkers;

  // Initialize the map once (client only, via dynamic import).
  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    import("leaflet").then((mod) => {
      if (disposed || !divRef.current) return;
      const L: L = mod.default;
      const map = L.map(divRef.current, {
        zoomControl: !mini,
        attributionControl: true,
        scrollWheelZoom: !mini,
      });
      map.attributionControl.setPrefix(false);
      map.attributionControl.addAttribution("Evently demo basemap · OSM-style");
      L.imageOverlay("/images/citymap.svg", BOUNDS, { opacity: 1 }).addTo(map);
      const first = eventsRef.current[0];
      if (mini && first) map.setView([first.lat, first.lng], 14);
      else map.fitBounds(BOUNDS);
      stateRef.current = { map, L };
      syncRef.current();
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(divRef.current);
    }).catch(() => {
      if (divRef.current) divRef.current.innerHTML = '<div style="padding:24px;text-align:center;color:#64748b">Map could not be loaded.</div>';
    });
    return () => {
      disposed = true;
      ro?.disconnect();
      stateRef.current?.map.remove();
      stateRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mini]);

  // Re-render markers when the event set changes (filters / search).
  useEffect(() => {
    syncRef.current();
  }, [events]);

  // Highlight selected marker + pan into view + popup (FR-06).
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    const { map, L } = st;
    const sel = selectedSlug ?? null;
    const hl = highlightSlug ?? sel;
    for (const [slug, m] of Object.entries(markersRef.current)) {
      const ev = eventsRef.current.find((e) => e.slug === slug);
      if (ev) m.setIcon(makeIcon(L, ev, slug === sel || slug === hl));
    }
    if (sel) {
      const m = markersRef.current[sel];
      if (m) {
        const ll = m.getLatLng();
        if (!map.getBounds().pad(-0.08).contains(ll)) {
          map.flyTo(ll, Math.max(map.getZoom(), mini ? 14 : 13), { duration: 0.7 });
        }
        m.openPopup();
        // Marker (Leaflet 1.9) has no public bringToFront — use zIndex offset to raise it.
        m.setZIndexOffset(1000);
      }
    }
  }, [selectedSlug, highlightSlug, mini]);

  const fitAll = () => {
    const st = stateRef.current;
    if (!st) return;
    const evts = eventsRef.current;
    if (evts.length) st.map.fitBounds(st.L.latLngBounds(evts.map((e: EventItem) => [e.lat, e.lng])).pad(0.18));
    else st.map.fitBounds(BOUNDS);
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={divRef} className="h-full w-full" />
      {!mini && (
        <button
          onClick={fitAll}
          className="absolute right-3 top-3 z-[1000] rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow ring-1 ring-slate-200 transition hover:bg-white"
        >
          ⤢ Fit all
        </button>
      )}
      {events.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[1000] text-center text-xs font-medium text-slate-500">
          No events to show on the map
        </div>
      )}
    </div>
  );
}
