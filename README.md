# 📍 Evently — Event Discovery & Community Engagement Platform

A production-style demo of the **"Event Discovery & Community Engagement Platform"** project proposal:
users find, explore and attend local events via an interactive map + synchronized list, with
category filters, search, featured events, RSVPs, reviews, and a full admin console.

Built with **Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Leaflet.js**.

---

## 🚀 Run it

```bash
npm install
npm run dev        # http://localhost:3000
# or production:
npm run build && npm start
```

### Demo accounts

| Role   | Email             | Password   |
| ------ | ----------------- | ---------- |
| User   | demo@evently.pk   | demo1234   |
| Admin  | admin@evently.pk  | admin1234  |

(Or register a fresh account from the login page.)

---

## ✅ Functional requirements coverage

| FR | Requirement | Where |
|----|-------------|-------|
| FR-01 | Interactive map (Leaflet), all events as markers on load, color-coded per category, zoom/pan/fit-bounds | `components/MapView.tsx` + `/#explore` |
| FR-02 | List view (name, category, thumbnail, date/time, short description), pagination ("Load more" + paged `/events`), map⇄list sync (hover/click highlights marker, marker click highlights card) | `components/EventList.tsx`, `EventCard.tsx`, `Home.tsx`, `AllEvents.tsx` |
| FR-03 | Multi-select category filters (Music, Sports, Technology, Art & Culture, Food & Drink, Health & Wellness, Community Service); map + list update without reload | `components/CategoryFilter.tsx` |
| FR-04 | Detail page at `/events/:slug` with full info, venue, schedule, ticket price, organizer contact, mini-map, breadcrumb | `app/events/[slug]/page.tsx`, `components/DetailClient.tsx` |
| FR-05 | Image gallery/carousel with lazy loading, alt-text, short + full descriptions | `DetailClient.tsx` (gallery), `EventCard.tsx` |
| FR-06 | Marker highlighting (bigger icon + pulse ring), auto pan/center when outside viewport, popup with name/date/category | `MapView.tsx` |
| FR-07 | Featured Events carousel on the homepage, managed from the admin (⭐ toggle) | `components/FeaturedEvents.tsx`, `AdminClient.tsx` |
| FR-08 | Search by name / category / organizer / venue, sent to the API layer, real-time update of list + map, clear button, friendly "No results found" | `SearchBar.tsx`, `Home.tsx`, `AllEvents.tsx`, `lib/api.ts` |
| FR-09 | Full venue address (street, city, region) consistently formatted in cards + detail page, ticket price or "Free", organizer contact, **Get Directions** link (Google Maps) | `EventCard.tsx`, `DetailClient.tsx`, `lib/format.ts` |
| FR-10 | Mobile-first responsive UI; mobile **List / Map tab toggle**; touch-friendly targets | `Home.tsx` (tabs), Tailwind breakpoints throughout |

### Roles

- **Guest** — browse map/list, filter, search, view details (all pages).
- **Registered user** — everything above + RSVP with confirmation code, save favorites, reviews (after RSVP), profile, account settings, **submit events for approval**.
- **Admin** — full event CRUD (add/edit/delete/feature), approve/reject community submissions, user management (activate/deactivate), analytics overview.

In production the admin console *is* the **Strapi v5 admin panel** (see below); this demo ships an equivalent in-app console so the whole system is testable without a backend.

---

## 🏗 Architecture & the Strapi connection

```
Next.js 16 frontend
 ├─ lib/api.ts      ← mock API layer that MIRRORS the Strapi v5 REST API
 │                    (same endpoints & { data, meta.pagination } shape)
 ├─ lib/store.ts    ← write side (RSVPs, favorites, reviews, submissions,
 │                    admin edits) persisted in localStorage — stands in for
 │                    Strapi mutations + PostgreSQL
 └─ lib/auth.tsx    ← session/auth — stands in for NextAuth.js + Strapi JWT
```

To connect the real backend: set `NEXT_PUBLIC_STRAPI_URL` and replace the bodies
of `apiGetEvents / apiGetEvent` in `lib/api.ts` with `fetch` calls — the UI
components never change.

### Strapi content-types (for the production backend)

```js
// config/content-types/event.js  (Strapi v5)
module.exports = {
  kind: "collectionType",
  schema: {
    attributes: {
      title:          { type: "string", required: true },
      slug:           { type: "uid", targetField: "title", unique: true },
      category:       { type: "relation", relation: "manyToOne", target: "category", required: true },
      shortDescription: { type: "text" },
      description:    { type: "textarea" },
      images:         { type: "media", multiple: true },
      venue:          { type: "component", repeatable: false, component: "venue" },
      dateStart:      { type: "date", required: true },
      dateEnd:        { type: "date" },
      price:          { type: "integer", default: 0 },   // 0 = Free (PKR)
      organizer:      { type: "component", repeatable: false, component: "organizer" },
      featured:       { type: "boolean", default: false },
    },
  },
};
```

Additional components: `venue { name, street, city, region, lat, lng }`,
`organizer { name, email, phone }`.
Collections: `rsvp`, `favorite`, `review`, `submission` (status: pending/approved/rejected).

**Roles in Strapi:**
- `Public` → read on `event` (published only)
- `Authenticated` → read + write own `rsvp / favorite / review / submission`
- `Super Admin` (or custom `Admin`) → full CRUD on everything

---

## 🗺 Map note

The demo uses a hand-drawn, **offline stylized basemap** (`public/images/citymap.svg`)
loaded as a Leaflet `imageOverlay`, so the map works with zero network access
(ideal for grading/kiosk use). Swap `L.imageOverlay(...)` in `MapView.tsx` for
`L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", ...)` to use live
OpenStreetMap tiles.

## 📁 Key files

```
app/
  page.tsx                 Home (hero, featured, explore: map + list)
  events/page.tsx          All events (filters + pagination)
  events/[slug]/page.tsx   Event detail (SEO metadata + Event JSON-LD)
  login/page.tsx           Login / register
  profile/page.tsx         RSVPs, saved, reviews, submit event, account
  admin/page.tsx           Admin dashboard
components/
  MapView.tsx              Leaflet map (markers, highlight, popup, fit)
  Home.tsx / AllEvents.tsx / DetailClient.tsx / AdminClient.tsx / ProfileClient.tsx
lib/
  api.ts                   Mock Strapi-compatible API
  store.ts                 Client persistence (demo backend)
  auth.tsx                 Session + role context
  data.ts                  Seed events (Lahore)
  types.ts / format.ts / storage.ts / toast.tsx
```

## 📄 SEO & performance

- Per-event `<title>`, meta description, OpenGraph tags
- `schema.org/Event` JSON-LD structured data on every detail page
- `next/image` with lazy loading + responsive `sizes`, meaningful alt text
- Static prerendering for all list pages; client fetch only for data

## 📦 Deployment (per proposal)

- **Frontend** → Vercel/Netlify (`npm run build`, framework: Next.js)
- **Backend** → Railway/DigitalOcean: Strapi v5 + PostgreSQL, images on Cloudinary/S3
- Set `NEXT_PUBLIC_STRAPI_URL` on the frontend, swap `lib/api.ts` bodies to `fetch`
