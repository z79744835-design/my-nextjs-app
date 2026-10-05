"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { apiGetEvents, submissionToEvent, getAllEventsMerged } from "@/lib/api";
import { CATEGORIES, IMAGE_PRESETS, type Category, type EventItem, type Submission } from "@/lib/types";
import {
  countRsvps,
  deleteEvent,
  getCustomEvents,
  getSubmissions,
  getReviews,
  getUsers,
  isUserDisabled,
  makeUniqueSlug,
  saveCustomEvent,
  setFeatured,
  setSubmissionStatus,
  toggleUserDisabled,
  updateEvent,
} from "@/lib/store";
import { fmtDate, fmtTime, priceLabel } from "@/lib/format";

type Tab = "overview" | "events" | "submissions" | "users";

interface FormState {
  title: string;
  category: Category;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  price: string;
  featured: boolean;
  venue: string;
  street: string;
  city: string;
  lat: string;
  lng: string;
  image: string;
  short: string;
  description: string;
}

const emptyForm: FormState = {
  title: "",
  category: "Music",
  date: "",
  time: "18:00",
  endDate: "",
  endTime: "",
  price: "0",
  featured: false,
  venue: "",
  street: "",
  city: "Lahore",
  lat: "31.52",
  lng: "74.35",
  image: IMAGE_PRESETS[0].src,
  short: "",
  description: "",
};

export default function AdminClient() {
  const { user } = useAuth();
  const { push } = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [bump, setBump] = useState(0);

  const [editing, setEditing] = useState<EventItem | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    const all = getAllEventsMerged();
    setEvents(all);
    setSubmissions(getSubmissions());
  }, [bump]);

  const stats = useMemo(() => {
    const upcoming = events.filter((e) => e.status === "upcoming").length;
    const featured = events.filter((e) => e.featured).length;
    const pending = submissions.filter((s) => s.status === "pending").length;
    const users = getUsers();
    const reviews = events.reduce((n, e) => n + getReviews(e.slug).length, 0);
    return {
      total: events.length,
      upcoming,
      featured,
      pending,
      users: users.length,
      rsvps: countRsvps(),
      reviews,
    };
  }, [events, submissions]);

  const byCategory = useMemo(() => {
    return CATEGORIES.map((c) => ({
      ...c,
      count: events.filter((e) => e.category === c.name).length,
    })).filter((c) => c.count > 0);
  }, [events]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">🛡️</div>
        <h1 className="mt-4 text-2xl font-extrabold">Admin access required</h1>
        <p className="mt-2 text-sm text-slate-500">Log in with an admin account to manage events, users and submissions.</p>
        <Link href="/login?next=/admin" className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
          Log in
        </Link>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">⛔</div>
        <h1 className="mt-4 text-2xl font-extrabold">403 — Admins only</h1>
        <p className="mt-2 text-sm text-slate-500">
          You are logged in as <b>{user.email}</b>, which is a regular user account.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 ring-1 ring-slate-200 hover:bg-slate-50">
          Back to home
        </Link>
      </div>
    );
  }

  const openNew = () => {
    setForm(emptyForm);
    setEditing("new");
  };

  const openEdit = (ev: EventItem) => {
    const [d, t] = ev.dateStart.split("T");
    setForm({
      title: ev.title,
      category: ev.category,
      date: d,
      time: (t ?? "18:00").slice(0, 5),
      endDate: ev.dateEnd ? ev.dateEnd.split("T")[0] : "",
      endTime: ev.dateEnd ? ev.dateEnd.split("T")[1].slice(0, 5) : "",
      price: String(ev.price),
      featured: ev.featured,
      venue: ev.venue.name,
      street: ev.venue.street,
      city: ev.venue.city,
      lat: String(ev.lat),
      lng: String(ev.lng),
      image: ev.images[0] === "/images/placeholder.svg" ? IMAGE_PRESETS[0].src : ev.images[0],
      short: ev.shortDescription,
      description: ev.description,
    });
    setEditing(ev);
  };

  const saveForm = () => {
    if (!form.title.trim() || !form.date || !form.venue.trim()) {
      push("Title, date and venue name are required.", "error");
      return;
    }
    const [y, m, d] = form.date.split("-");
    const dateStart = new Date(`${y}-${m}-${d}T${form.time || "18:00"}:00+05:00`).toISOString();
    const dateEnd = form.endDate
      ? new Date(`${form.endDate}T${form.endTime || "21:00"}:00+05:00`).toISOString()
      : undefined;
    const price = Math.max(0, Number(form.price) || 0);

    if (editing === "new") {
      const existing = getAllEventsMerged().map((e) => e.slug);
      const slug = makeUniqueSlug(form.title, existing);
      const ev: EventItem = {
        id: Date.now(),
        slug,
        title: form.title.trim(),
        category: form.category,
        shortDescription: form.short.trim() || form.title.trim(),
        description: form.description.trim() || form.short.trim() || form.title.trim(),
        images: [form.image],
        venue: { name: form.venue.trim(), street: form.street.trim() || "TBA", city: form.city.trim() || "Lahore", region: "Punjab" },
        lat: Number(form.lat) || 31.52,
        lng: Number(form.lng) || 74.35,
        dateStart,
        dateEnd,
        price,
        organizer: { name: "Evently Team", email: "admin@evently.pk", phone: "+92 42 111 000 000" },
        featured: form.featured,
        status: +new Date(dateStart) >= Date.now() ? "upcoming" : "past",
        createdAt: new Date().toISOString(),
      };
      saveCustomEvent(ev);
      push("Event created ✓");
    } else if (editing) {
      updateEvent(editing.slug, {
        title: form.title.trim(),
        category: form.category,
        shortDescription: form.short.trim() || form.title.trim(),
        description: form.description.trim() || form.short.trim(),
        images: [form.image],
        venue: { name: form.venue.trim(), street: form.street.trim() || "TBA", city: form.city.trim() || "Lahore", region: "Punjab" },
        lat: Number(form.lat) || 31.52,
        lng: Number(form.lng) || 74.35,
        dateStart,
        dateEnd,
        price,
        featured: form.featured,
        status: +new Date(dateStart) >= Date.now() ? "upcoming" : "past",
      });
      push("Event updated ✓");
    }
    setEditing(null);
    setBump((b) => b + 1);
  };

  const approve = (s: Submission) => {
    const ev = submissionToEvent(s);
    saveCustomEvent(ev);
    setSubmissionStatus(s.id, "approved");
    setBump((b) => b + 1);
    push(`Approved — “${s.title}” is now live. ✓`);
  };

  const reject = (s: Submission) => {
    setSubmissionStatus(s.id, "rejected");
    setBump((b) => b + 1);
    push("Submission rejected.", "info");
  };

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "events", label: "Events" },
    { id: "submissions", label: "Submissions", badge: stats.pending },
    { id: "users", label: "Users" },
  ];

  const input =
    "mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  const label = "text-xs font-semibold text-slate-600";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            In production this maps to the Strapi v5 admin panel — here it runs as an in-app console.
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
        >
          + Add event
        </button>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* ---------------- Overview ---------------- */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total events", value: stats.total, icon: "📅" },
                { label: "Upcoming", value: stats.upcoming, icon: "⏭️" },
                { label: "Featured", value: stats.featured, icon: "⭐" },
                { label: "Total RSVPs", value: stats.rsvps, icon: "🎟️" },
                { label: "Registered users", value: stats.users, icon: "👥" },
                { label: "Reviews", value: stats.reviews, icon: "⭐" },
                { label: "Pending submissions", value: stats.pending, icon: "⏳" },
                { label: "Custom events", value: getCustomEvents().length, icon: "✨" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <div className="text-2xl">{c.icon}</div>
                  <div className="mt-2 text-3xl font-extrabold">{c.value}</div>
                  <div className="text-xs font-medium text-slate-500">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <h3 className="font-bold text-slate-900">Events by category</h3>
              <div className="mt-4 space-y-3">
                {byCategory.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs font-semibold text-slate-600">{c.name}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.count / Math.max(1, stats.total)) * 100}%`, backgroundColor: c.color }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs font-bold text-slate-700">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Events ---------------- */}
        {tab === "events" && (
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.slug} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image src={ev.images[0]} alt="" fill className="object-cover" sizes="64px" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/events/${ev.slug}`} className="line-clamp-1 font-semibold text-slate-900 hover:text-indigo-700">
                            {ev.title}
                          </Link>
                          <span className="text-xs text-slate-400">{ev.venue.city}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{ev.category}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {fmtDate(ev.dateStart)}{" "}
                      {ev.status === "past" && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">PAST</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{priceLabel(ev.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setFeatured(ev.slug, !ev.featured);
                          setBump((b) => b + 1);
                          push(ev.featured ? "Removed from featured." : "Added to featured ⭐");
                        }}
                        aria-label="Toggle featured"
                        className={`text-xl transition hover:scale-110 ${ev.featured ? "" : "opacity-30 grayscale"}`}
                      >
                        ⭐
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(ev)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete “${ev.title}”? This removes it from the platform.`)) {
                              deleteEvent(ev.slug);
                              setBump((b) => b + 1);
                              push("Event deleted.", "info");
                            }
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- Submissions ---------------- */}
        {tab === "submissions" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900">Pending review</h3>
              {submissions.filter((s) => s.status === "pending").length === 0 ? (
                <p className="mt-3 rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
                  🎉 No pending submissions.
                </p>
              ) : (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {submissions
                    .filter((s) => s.status === "pending")
                    .map((s) => (
                      <div key={s.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900">{s.title}</p>
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                            {s.category}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {fmtDate(s.dateStart)} · {s.venue.name}, {s.venue.city} · {priceLabel(s.price)}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{s.shortDescription}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          Submitted by <b>{s.byName}</b> on {fmtDate(s.createdAt)}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => approve(s)}
                            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            ✓ Approve &amp; publish
                          </button>
                          <button
                            onClick={() => reject(s)}
                            className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-900">History</h3>
              {submissions.filter((s) => s.status !== "pending").length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No processed submissions yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {submissions
                    .filter((s) => s.status !== "pending")
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{s.title}</p>
                          <p className="text-xs text-slate-400">
                            {s.byName} · {fmtDate(s.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            s.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- Users ---------------- */}
        {tab === "users" && (
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">RSVPs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getUsers().map((u) => {
                  const disabled = isUserDisabled(u.email);
                  const self = u.id === user.id;
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: u.avatarColor, opacity: disabled ? 0.4 : 1 }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{fmtDate(u.joinedAt)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{countRsvps(u.id)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            disabled ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {disabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!self && !u.isAdmin ? (
                          <button
                            onClick={() => {
                              const nowActive = toggleUserDisabled(u.email);
                              setBump((b) => b + 1);
                              push(nowActive ? `${u.name} re-activated ✓` : `${u.name} disabled.`, nowActive ? "success" : "info");
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              disabled ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                            }`}
                          >
                            {disabled ? "Enable" : "Disable"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">{self ? "You" : "Protected"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- Add / Edit modal ---------------- */}
      {editing && (
        <div className="fixed inset-0 z-[1200] overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="mx-auto my-6 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{editing === "new" ? "Add event" : "Edit event"}</h2>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
              </div>
              <div>
                <label className={label}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className={input}>
                  {CATEGORIES.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Ticket price (PKR, 0 = Free)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Start date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
                </div>
                <div>
                  <label className={label}>Start time</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={input} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>End date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={input} />
                </div>
                <div>
                  <label className={label}>End time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={input} />
                </div>
              </div>
              <div>
                <label className={label}>Venue name *</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={input} />
              </div>
              <div>
                <label className={label}>Street address</label>
                <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className={input} />
              </div>
              <div>
                <label className={label}>City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Latitude</label>
                  <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className={input} />
                </div>
                <div>
                  <label className={label}>Longitude</label>
                  <input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className={input} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Short description</label>
                <textarea rows={2} value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Full description</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Cover image</label>
                <div className="mt-2 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
                  {IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => setForm({ ...form, image: p.src })}
                      title={p.label}
                      className={`relative aspect-video overflow-hidden rounded-lg ring-2 transition ${
                        form.image === p.src ? "ring-indigo-500" : "ring-transparent hover:ring-slate-300"
                      }`}
                    >
                      <Image src={p.src} alt={p.label} fill className="object-cover" sizes="120px" />
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4 accent-indigo-600"
                />
                ⭐ Feature on the homepage
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={saveForm} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
                {editing === "new" ? "Create event" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
