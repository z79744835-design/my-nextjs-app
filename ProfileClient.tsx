"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { apiGetEvents } from "@/lib/api";
import { CATEGORIES, type Category, type EventItem } from "@/lib/types";
import {
  addSubmission,
  cancelRsvp,
  deleteReview,
  getFavorites,
  getRsvps,
  getReviews,
  getSubmissions,
} from "@/lib/store";
import { fmtDate, fmtTime, priceLabel, slugify } from "@/lib/format";
import EventCard from "./EventCard";

type Tab = "rsvps" | "saved" | "reviews" | "submit" | "account";

const PALETTE = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

function Empty({ icon, text, ctaHref, cta }: { icon: string; text: string; ctaHref?: string; cta?: string }) {
  return (
    <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-slate-200">
      <div className="text-4xl">{icon}</div>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
      {ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

function ReviewsTab({ name, events, onDeleted }: { name: string; events: EventItem[]; onDeleted: () => void }) {
  const { push } = useToast();
  const myReviews = events
    .flatMap((ev) => getReviews(ev.slug).filter((r) => r.userName === name).map((r) => ({ ev, r })))
    .sort((a, b) => +new Date(b.r.date) - +new Date(a.r.date));

  return (
    <div className="space-y-3">
      {myReviews.length === 0 && <Empty icon="⭐" text="You haven't written any reviews yet." ctaHref="/#explore" cta="Find an event" />}
      {myReviews.map(({ ev, r }) => (
        <div key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/events/${ev.slug}`} className="font-semibold text-slate-900 hover:text-indigo-700">
              {ev.title}
            </Link>
            <button
              onClick={() => {
                deleteReview(r.id);
                onDeleted();
                push("Review deleted.", "info");
              }}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Delete
            </button>
          </div>
          <p className="mt-1 text-sm text-amber-500">
            {"★".repeat(r.rating)}
            {"☆".repeat(5 - r.rating)}
          </p>
          <p className="mt-1.5 text-sm text-slate-600">{r.text}</p>
          <p className="mt-1 text-xs text-slate-400">{fmtDate(r.date)}</p>
        </div>
      ))}
    </div>
  );
}

function AccountTab({ onSaved }: { onSaved: () => void }) {
  const { user, updateProfile } = useAuth();
  const { push } = useToast();
  const [name, setName] = useState(user!.name);
  const [color, setColor] = useState(user!.avatarColor);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return push("Name cannot be empty.", "error");
    let newPass = user.password;
    if (pw) {
      if (cur !== user.password) return push("Current password is incorrect.", "error");
      if (pw.length < 6) return push("New password must be at least 6 characters.", "error");
      if (pw !== pw2) return push("New passwords do not match.", "error");
      newPass = pw;
    }
    updateProfile({ name: name.trim(), avatarColor: color, password: newPass });
    setCur("");
    setPw("");
    setPw2("");
    onSaved();
  };

  return (
    <form onSubmit={save} className="max-w-lg space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <div>
        <label className="text-xs font-semibold text-slate-600">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Email</label>
        <input value={user!.email} disabled className="mt-1 w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Avatar color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Avatar color ${c}`}
              className={`h-8 w-8 rounded-full transition ${color === c ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-600">Change password (optional)</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <input
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            placeholder="Current"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Confirm new"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>
      <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
        Save changes
      </button>
    </form>
  );
}

function SubmitTab({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [f, setF] = useState({
    title: "",
    category: "Music" as Category,
    date: "",
    time: "18:00",
    venue: "",
    street: "",
    city: "Lahore",
    price: "0",
    short: "",
    description: "",
  });
  const [bump, setBump] = useState(0);
  const submissions = user ? getSubmissions().filter((s) => s.by === user.id) : [];

  const set = (k: keyof typeof f) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!f.title.trim() || !f.date || !f.venue.trim() || !f.short.trim()) {
      push("Please fill in the title, date, venue and short description.", "error");
      return;
    }
    const [y, m, d] = f.date.split("-");
    const dateStart = new Date(`${y}-${m}-${d}T${f.time || "18:00"}:00+05:00`).toISOString();
    addSubmission({
      slug: slugify(f.title) + "-" + Math.random().toString(36).slice(2, 6),
      title: f.title.trim(),
      category: f.category,
      dateStart,
      venue: {
        name: f.venue.trim(),
        street: f.street.trim() || "TBA",
        city: f.city.trim() || "Lahore",
        region: "Punjab",
      },
      price: Math.max(0, Number(f.price) || 0),
      shortDescription: f.short.trim(),
      description: f.description.trim() || f.short.trim(),
      by: user.id,
      byName: user.name,
    });
    setF({ title: "", category: "Music", date: "", time: "18:00", venue: "", street: "", city: "Lahore", price: "0", short: "", description: "" });
    setBump((b) => b + 1);
    onSubmitted();
    push("Submitted! An admin will review your event. ✓");
  };

  const input =
    "mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  const label = "text-xs font-semibold text-slate-600";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200 lg:col-span-2">
        <div>
          <h3 className="font-bold text-slate-900">Submit a new event</h3>
          <p className="text-xs text-slate-500">Your event will be published after an admin approves it.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Event title *</label>
            <input value={f.title} onChange={set("title")} placeholder="e.g. Weekend Sufi Night" className={input} />
          </div>
          <div>
            <label className={label}>Category *</label>
            <select value={f.category} onChange={set("category")} className={input}>
              {CATEGORIES.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Date *</label>
              <input type="date" value={f.date} onChange={set("date")} className={input} />
            </div>
            <div>
              <label className={label}>Time</label>
              <input type="time" value={f.time} onChange={set("time")} className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Venue name *</label>
            <input value={f.venue} onChange={set("venue")} placeholder="e.g. Anarkali Bazaar Hall" className={input} />
          </div>
          <div>
            <label className={label}>Street address</label>
            <input value={f.street} onChange={set("street")} placeholder="e.g. 45-Zabtan Market Road" className={input} />
          </div>
          <div>
            <label className={label}>City</label>
            <input value={f.city} onChange={set("city")} className={input} />
          </div>
          <div>
            <label className={label}>Ticket price (PKR, 0 = Free)</label>
            <input type="number" min="0" value={f.price} onChange={set("price")} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Short description *</label>
            <textarea
              value={f.short}
              onChange={set("short")}
              rows={2}
              placeholder="One or two lines shown in cards"
              className={input}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Full description</label>
            <textarea
              value={f.description}
              onChange={set("description")}
              rows={4}
              placeholder="Everything attendees should know…"
              className={input}
            />
          </div>
        </div>
        <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
          Submit for approval
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">Your submissions</h3>
        {submissions.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            Nothing submitted yet.
          </p>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-slate-900">{s.title}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  s.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : s.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {s.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {fmtDate(s.dateStart)} · {s.category} · submitted {fmtDate(s.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileClient() {
  const { user } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("rsvps");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    apiGetEvents({ status: "all", pageSize: 500 }).then((r) => setEvents(r.data));
  }, [bump]);

  const rsvps = useMemo(
    () => (user ? getRsvps(user.id) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, bump]
  );
  const favs = useMemo(
    () => (user ? getFavorites(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, bump]
  );
  const submissions = useMemo(
    () => (user ? getSubmissions().filter((s) => s.by === user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, bump]
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 text-2xl font-extrabold">Log in to see your profile</h1>
        <p className="mt-2 text-sm text-slate-500">Your RSVPs, saved events and reviews live here.</p>
        <Link
          href="/login?next=/profile"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Log in / Register
        </Link>
      </div>
    );
  }

  const rsvpEvents = Object.entries(rsvps)
    .map(([slug, entry]) => ({ ev: events.find((e) => e.slug === slug), entry }))
    .filter((x): x is { ev: EventItem; entry: { code: string; date: string } } => !!x.ev);

  const favEvents = favs.map((s) => events.find((e) => e.slug === s)).filter((e): e is EventItem => !!e);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "rsvps", label: "My RSVPs", count: rsvpEvents.length },
    { id: "saved", label: "Saved", count: favEvents.length },
    { id: "reviews", label: "My Reviews" },
    { id: "submit", label: "Submit Event", count: submissions.filter((s) => s.status === "pending").length },
    { id: "account", label: "Account" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200">
        <span
          className="grid h-16 w-16 place-items-center rounded-2xl text-2xl font-extrabold text-white"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Member since {fmtDate(user.joinedAt)} {user.isAdmin && "· 🛡️ Admin"}
          </p>
        </div>
      </div>

      <div className="scrollbar-none mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "rsvps" && (
          <div className="space-y-3">
            {rsvpEvents.length === 0 && (
              <Empty icon="🎟️" text="No RSVPs yet — find an event and reserve your spot." ctaHref="/#explore" cta="Explore events" />
            )}
            {rsvpEvents.map(({ ev, entry }) => (
              <div key={ev.slug} className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <Image src={ev.images[0]} alt="" fill className="object-cover" sizes="96px" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/events/${ev.slug}`} className="line-clamp-1 font-semibold text-slate-900 hover:text-indigo-700">
                    {ev.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {fmtDate(ev.dateStart)} · {fmtTime(ev.dateStart)} · {ev.venue.city}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Ticket <span className="font-mono font-bold text-slate-600">{entry.code}</span> · {priceLabel(ev.price)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    cancelRsvp(user.id, ev.slug);
                    setBump((b) => b + 1);
                    push("RSVP cancelled.", "info");
                  }}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "saved" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {favEvents.length === 0 ? (
              <div className="sm:col-span-2">
                <Empty icon="♥" text="Nothing saved yet — tap the heart on any event." ctaHref="/#explore" cta="Explore events" />
              </div>
            ) : (
              favEvents.map((ev) => <EventCard key={ev.slug} ev={ev} />)
            )}
          </div>
        )}

        {tab === "reviews" && <ReviewsTab name={user.name} events={events} onDeleted={() => setBump((b) => b + 1)} />}
        {tab === "submit" && <SubmitTab onSubmitted={() => setBump((b) => b + 1)} />}
        {tab === "account" && <AccountTab onSaved={() => push("Profile updated ✓")} />}
      </div>
    </div>
  );
}
