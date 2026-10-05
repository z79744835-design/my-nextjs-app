"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

export default function LoginClient() {
  const { user, login, register } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="mt-4 text-2xl font-extrabold">You're already logged in</h1>
        <p className="mt-2 text-sm text-slate-500">Signed in as {user.email}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/profile" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Go to profile
          </Link>
          <Link href="/events" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = mode === "login" ? await login(email, password) : await register(name, email, password);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      push(mode === "login" ? "Welcome back! ✓" : "Account created — welcome to Evently! 🎉");
      router.push(next);
    }
  };

  const fill = (em: string, pw: string) => {
    setMode("login");
    setEmail(em);
    setPassword(pw);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login" ? "Log in to RSVP, save events and leave reviews." : "RSVP for events, save favorites and submit your own."}
        </p>

        <div className="mt-5 flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {m === "login" ? "Log in" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayesha Khan"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={mode === "register" ? 6 : undefined}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-600 ring-1 ring-rose-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-2xl bg-indigo-50 p-4 text-sm ring-1 ring-indigo-100">
        <p className="font-bold text-indigo-900">🔑 Demo accounts</p>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-indigo-800">
              <b>User:</b> demo@evently.pk / demo1234
            </span>
            <button onClick={() => fill("demo@evently.pk", "demo1234")} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100">
              Use
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-indigo-800">
              <b>Admin:</b> admin@evently.pk / admin1234
            </span>
            <button onClick={() => fill("admin@evently.pk", "admin1234")} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100">
              Use
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
