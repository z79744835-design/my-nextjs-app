import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white">📍</span>
            <span className="text-lg font-extrabold tracking-tight">
              Event<span className="text-indigo-600">ly</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            The event discovery &amp; community engagement platform for Lahore. Find it on the map, filter by what
            you love, and show up.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Categories</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {CATEGORIES.map((c) => (
              <li key={c.name}>
                <Link href="/#explore" className="flex items-center gap-2 transition hover:text-indigo-600">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/#explore" className="hover:text-indigo-600">Explore events</Link></li>
            <li><Link href="/events" className="hover:text-indigo-600">All events</Link></li>
            <li><Link href="/login" className="hover:text-indigo-600">Log in / Register</Link></li>
            <li><Link href="/profile" className="hover:text-indigo-600">My profile &amp; RSVPs</Link></li>
            <li><Link href="/admin" className="hover:text-indigo-600">Admin dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>📧 hello@evently.pk</li>
            <li>📞 +92 42 111 000 000</li>
            <li>📍 Gulberg III, Lahore, Punjab</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
        © 2026 Evently — built with Next.js, Leaflet &amp; Tailwind CSS. Demo data layer mirrors the Strapi v5 REST
        API.
      </div>
    </footer>
  );
}
