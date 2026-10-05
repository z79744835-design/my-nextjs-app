"use client";

import { CATEGORIES } from "@/lib/types";

interface CategoryFilterProps {
  selected: string[];
  onToggle: (name: string) => void;
  onClear: () => void;
}

/** Multi-select category chips (FR-03). Both map + list react to the change. */
export default function CategoryFilter({ selected, onToggle, onClear }: CategoryFilterProps) {
  return (
    <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
      <button
        onClick={onClear}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition ${
          selected.length === 0
            ? "bg-slate-900 text-white ring-slate-900"
            : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-400"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((c) => {
        const on = selected.includes(c.name);
        return (
          <button
            key={c.name}
            onClick={() => onToggle(c.name)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition ${
              on ? "text-white ring-transparent" : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-400"
            }`}
            style={on ? { backgroundColor: c.color } : undefined}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: on ? "rgba(255,255,255,0.85)" : c.color }}
            />
            {c.emoji} {c.name}
          </button>
        );
      })}
    </div>
  );
}
