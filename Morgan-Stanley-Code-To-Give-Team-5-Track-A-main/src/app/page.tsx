"use client";

import Link from "next/link";

const features = [
  {
    icon: "📣",
    title: "Run Your Own Campaign",
    desc: "Create and promote flyering events in your neighborhood with a simple self-serve form. No staff help needed.",
  },
  {
    icon: "🖨️",
    title: "Download Localized Flyers",
    desc: "Get print-ready PDFs customized for your area — with Lemontree's branding automatically included.",
  },
  {
    icon: "🤝",
    title: "Coordinate Volunteers",
    desc: "Invite friends, assign roles, and communicate with your team — all in one place.",
  },
  {
    icon: "📊",
    title: "Track Your Impact",
    desc: "Log outreach numbers and see how your events contribute to expanding food access across the city.",
  },
];

const steps = [
  { num: "01", title: "Create an Account", desc: "Sign up in seconds — no approval process required." },
  { num: "02", title: "Plan Your Event", desc: "Set a location, date, and description. We'll geocode the address and put it on the map." },
  { num: "03", title: "Download & Flyer", desc: "Grab your localized flyer, gather volunteers, and hit the streets!" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FCF8F2] text-slate-800 font-[var(--font-geist-sans)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-yellow-200 bg-yellow-400/95 px-6 py-3 shadow-md backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-300 shadow-sm">
            <img src="/lemontree-logo.svg" alt="Lemontree logo" className="h-6 w-6 object-contain" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-800">Lemontree</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-yellow-300/60"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-600"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20 text-center md:pb-28 md:pt-28">
        {/* decorative blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2">
          <div className="h-[480px] w-[480px] rounded-full bg-yellow-300/30 blur-3xl" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0">
          <div className="h-72 w-72 rounded-full bg-primary-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-yellow-300/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700">
            Volunteer Flyering Hub
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Spread the word about{" "}
            <span className="text-primary-500">food resources</span>{" "}
            in your community
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
            Lemontree empowers volunteers to independently run flyering campaigns — no staff overhead, consistent brand, real impact.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-primary-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-600 hover:shadow-primary-200 hover:shadow-xl"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/hub"
              className="rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
            >
              Browse events
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-yellow-200 bg-yellow-50">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-yellow-200">
          {[
            { value: "2,400+", label: "Food resources mapped" },
            { value: "50+", label: "Events organized" },
            { value: "10K+", label: "Families reached" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-6 text-center">
              <p className="text-2xl font-extrabold text-primary-500">{s.value}</p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Everything you need to run a great campaign
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-500">
            A complete self-serve toolkit — from event creation to impact reporting.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-2xl shadow-sm group-hover:bg-yellow-200 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-800">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-start">
                {i < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-[2.25rem] top-5 hidden h-0.5 w-[calc(100%+2rem)] bg-gradient-to-r from-yellow-300 to-yellow-100 md:block"
                  />
                )}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-sm font-extrabold text-slate-800 shadow-md">
                  {s.num}
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-800">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden bg-primary-500 px-6 py-16 text-center text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/50 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary-500/50 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <p className="text-3xl font-extrabold tracking-tight">Ready to make a difference?</p>
          <p className="mt-3 text-sm text-primary-200">
            Join hundreds of volunteers already using Lemontree to connect families with food resources.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-yellow-400 px-8 py-3.5 text-sm font-bold text-slate-800 shadow-lg transition-all hover:bg-yellow-300"
            >
              Create your account
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-yellow-200 bg-yellow-50 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/lemontree-logo.svg" alt="Lemontree logo" className="h-5 w-5 object-contain" />
            <span className="font-semibold text-slate-700">Lemontree Volunteer Hub</span>
          </div>
          <p>Helping communities access food resources — one flyer at a time.</p>
          <div className="flex gap-4">
            <Link href="/hub" className="hover:text-slate-700">Browse events</Link>
            <Link href="/signup" className="hover:text-slate-700">Sign up</Link>
            <Link href="/admin" className="hover:text-slate-700">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
