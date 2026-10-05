"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { EventItem, Review } from "@/lib/types";
import { categoryMeta } from "@/lib/types";
import { apiGetEvent, apiGetEvents } from "@/lib/api";
import {
  addReview,
  cancelRsvp,
  getFavorites,
  getRsvps,
  getReviews,
  rsvpFor,
  toggleFavorite,
  type RsvpEntry,
} from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import MapView from "./MapView";
import EventCard from "./EventCard";
import { directionsUrl, fmtDate, fmtDayMonth, fmtTimeRange, fullAddress, priceLabel } from "@/lib/format";

function Stars({ value, onChange, size = "text-base" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${n <= value ? "text-amber-400" : "text-slate-300"} ${onChange ? "cursor-pointer transition hover:scale-110" : "cursor-default"}`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function DetailClient({ slug }: { slug: string }) {
  const { user } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [ev, setEv] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<EventItem[]>([]);

  const [imgIdx, setImgIdx] = useState(0);
  const [rsvp, setRsvp] = useState<RsvpEntry | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    let on = true;
    setLoading(true);
    apiGetEvent(slug).then((e) => {
      if (!on) return;
      setEv(e);
      setNotFound(!e);
      setLoading(false);
      if (e) {
        if (user) {
          setRsvp(getRsvps(user.id)[e.slug] ?? null);
          setFavs(getFavorites(user.id));
        }
        setReviews(getReviews(e.slug));
        apiGetEvents({ category: [e.category], status: "upcoming", pageSize: 20 }).then((r) => {
          if (on) setRelated(r.data.filter((x) => x.slug !== e.slug).slice(0, 3));
        });
      }
    });
    return () => {
      on = false;
    };
  }, [slug, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-6 h-10 w-2/3 animate-pulse rounded-lg bg-slate-200" />
      </div>
    );
  }

  if (notFound || !ev) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="text-5xl">🧭</div>
        <h1 className="mt-4 text-2xl font-extrabold">Event not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          This event may have been removed or the link is incorrect.
        </p>
        <Link href="/events" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          Browse all events
        </Link>
      </div>
    );
  }

  const meta = categoryMeta(ev.category);
  const going = !!rsvp;
  const canReview = !!user && (going || ev.status === "past");

  const doRsvp = () => {
    if (!user) {
      router.push(`/login?next=/events/${ev.slug}`);
      return;
    }
    const entry = rsvpFor(user.id, ev.slug);
    setRsvp(entry);
    push(`You're going! Confirmation ${entry.code} sent to ${user.email} (demo).`);
  };

  const doCancel = () => {
    if (!user) return;
    cancelRsvp(user.id, ev.slug);
    setRsvp(null);
    push("RSVP cancelled.", "info");
  };

  const submitReview = () => {
    if (!user) return;
    if (reviewText.trim().length < 5) {
      push("Please write a few words about your experience.", "error");
      return;
    }
    addReview({
      id: "rev-" + Date.now(),
      slug: ev.slug,
      userName: user.name,
      rating,
      text: reviewText.trim(),
      date: new Date().toISOString(),
    });
    setReviews(getReviews(ev.slug));
    setReviewText("");
    setRating(5);
    push("Thanks for your review! ⭐");
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      push("Link copied to clipboard ✓");
    } catch {
      push("Could not copy the link.", "error");
    }
  };

  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb (FR-04) */}
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <a href="/" className="hover:text-indigo-600">Home</a>
        <span className="mx-1.5">/</span>
        <a href="/events" className="hover:text-indigo-600">All events</a>
        <span className="mx-1.5">/</span>
        <span className="max-w-52 truncate font-semibold text-slate-800 inline-block align-bottom">
          {ev.title}
        </span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Gallery (FR-05) */}
          <div className="relative z-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
            <div className="relative aspect-[16/9]">
              {ev.images.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={`${ev.title} — photo ${i + 1} of ${ev.images.length}`}
                  fill
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  className={`object-cover transition-opacity duration-300 ${i === imgIdx ? "opacity-100" : "opacity-0 absolute inset-0"}`}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ))}
              {ev.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + ev.images.length) % ev.images.length)}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % ev.images.length)}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
                  >
                    →
                  </button>
                </>
              )}
            </div>
            {ev.images.length > 1 && (
              <div className="flex items-center justify-center gap-2 bg-white p-2">
                {ev.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Show photo ${i + 1}`}
                    className={`h-14 w-20 overflow-hidden rounded-lg ring-2 transition ${
                      i === imgIdx ? "ring-indigo-500" : "ring-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: meta.color }}
            >
              {meta.emoji} {ev.category}
            </span>
            {ev.featured && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">⭐ Featured</span>
            )}
            {ev.status === "past" && (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">Past event</span>
            )}
            <span className="text-sm font-semibold text-slate-700">
              {fmtDate(ev.dateStart)} · {fmtTimeRange(ev.dateStart, ev.dateEnd)}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{ev.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Organized by <span className="font-semibold text-slate-700">{ev.organizer.name}</span>
          </p>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">About this event</h2>
            <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-slate-700">
              {ev.description.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Reviews ({reviews.length})</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <Stars value={Math.round(avg)} />
                  <span className="text-sm font-semibold text-slate-700">{avg.toFixed(1)}</span>
                </div>
              )}
            </div>

            {canReview ? (
              <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-700">Rate your experience</p>
                <div className="mt-2">
                  <Stars value={rating} onChange={setRating} size="text-2xl" />
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  placeholder="What was it like? Venue, crowd, organization…"
                  className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={submitReview}
                  className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Submit review
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                {user
                  ? "RSVP for this event (or attend a past one) to leave a review."
                  : "Log in and RSVP to leave a review."}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {reviews.length === 0 && (
                <p className="text-sm text-slate-500">No reviews yet — be the first after the event.</p>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {r.userName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{r.userName}</p>
                        <p className="text-xs text-slate-400">{fmtDayMonth(r.date)}</p>
                      </div>
                    </div>
                    <Stars value={r.rating} size="text-sm" />
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{r.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar (FR-04, FR-06 mini-map, FR-09) */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            <div className="relative z-0 h-44">
              <MapView events={[ev]} selectedSlug={ev.slug} mini className="h-full w-full" />
            </div>
            <div className="space-y-4 p-5 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <p className="font-semibold text-slate-800">{fmtDate(ev.dateStart)}</p>
                  <p className="text-slate-500">{fmtTimeRange(ev.dateStart, ev.dateEnd)} (PKT)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="font-semibold text-slate-800">{ev.venue.name}</p>
                  <p className="text-slate-500">{fullAddress(ev.venue)}</p>
                  <a
                    href={directionsUrl(ev.lat, ev.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Get Directions →
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🎟️</span>
                <div>
                  <p className="font-semibold text-slate-800">{priceLabel(ev.price)}</p>
                  <p className="text-slate-500">{ev.price > 0 ? "Pay at the venue / ticket desk" : "Free entry — just RSVP"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👤</span>
                <div>
                  <p className="font-semibold text-slate-800">{ev.organizer.name}</p>
                  <a href={`mailto:${ev.organizer.email}`} className="text-xs text-indigo-600 hover:underline">
                    {ev.organizer.email}
                  </a>
                  <br />
                  <a href={`tel:${ev.organizer.phone.replace(/\s/g, "")}`} className="text-xs text-indigo-600 hover:underline">
                    {ev.organizer.phone}
                  </a>
                </div>
              </div>

              {/* RSVP (Role 2) */}
              <div className="border-t border-slate-100 pt-4">
                {going ? (
                  <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
                    <p className="text-sm font-bold text-emerald-700">✓ You're going!</p>
                    <p className="mt-1 text-xs text-emerald-600">
                      Ticket code <span className="font-mono font-bold">{rsvp!.code}</span> — confirmation sent to{" "}
                      {user?.email} (demo).
                    </p>
                    <button
                      onClick={doCancel}
                      className="mt-2.5 text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Cancel RSVP
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={doRsvp}
                      className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      {user ? `🎟️ RSVP — ${priceLabel(ev.price)}` : "🎟️ Log in to RSVP"}
                    </button>
                    {ev.status === "past" && (
                      <p className="mt-2 text-center text-xs text-slate-400">This event has already taken place.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Save &amp; share</h3>
              <button
                onClick={() => {
                  if (!user) {
                    push("Please log in to save events.", "info");
                    return;
                  }
                  const saved = toggleFavorite(user.id, ev.slug);
                  setFavs(getFavorites(user.id));
                  push(saved ? "Saved to your favorites ♥" : "Removed from favorites", saved ? "success" : "info");
                }}
                className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${
                  favs.includes(ev.slug) ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-400 hover:text-rose-400"
                }`}
                aria-label="Save event"
              >
                {favs.includes(ev.slug) ? "♥" : "♡"}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={share}
                className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                🔗 Copy link
              </button>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://evently.pk/events/${ev.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                f Share
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://evently.pk/events/${ev.slug}`)}&text=${encodeURIComponent(ev.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                𝕏 Post
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-900">More in {ev.category}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <EventCard key={r.slug} ev={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
