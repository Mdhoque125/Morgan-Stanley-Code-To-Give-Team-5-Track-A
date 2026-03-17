"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { createEvent, type ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function toDatetimeLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function OrganizerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    title: "",
    address: "",
    date: "",
    endDate: "",
    description: "",
    organization: "",
  });
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgmentError, setAcknowledgmentError] = useState<string | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const [minDatetime, setMinDatetime] = useState("");
  const [maxDatetime, setMaxDatetime] = useState("");
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, authLoading, router]);
  useEffect(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    setMinDatetime(toDatetimeLocal(now));
    const maxDate = new Date(now);
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    setMaxDatetime(toDatetimeLocal(maxDate));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setAcknowledgmentError(null);

      if (!acknowledged) {
        setAcknowledgmentError("Please acknowledge that you will supply the materials to continue.");
        return;
      }

      if (
        !form.title.trim() ||
        !form.address.trim() ||
        !form.date.trim() ||
        !form.description.trim()
      ) {
        setError("Please fill in all required fields, including description.");
        return;
      }

      if (!form.endDate?.trim()) {
        setError("Please select an end time for your event.");
        return;
      }

      const eventStart = new Date(form.date);
      const eventEnd = new Date(form.endDate);
      const now = new Date();

      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
        setError("Please enter valid start and end times.");
        return;
      }

      if (eventStart <= now) {
        setError("Event start time must be in the future.");
        return;
      }

      if (eventEnd <= eventStart) {
        setError("End time must be after the start time.");
        return;
      }

      if (!mapboxToken) {
        setError(
          "Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to enable address geocoding."
        );
        return;
      }

      try {
        setIsSubmitting(true);
        const query = encodeURIComponent(form.address.trim());
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&limit=1`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Geocoding failed (${res.status})`);
        }
        const data = await res.json();
        const first = data?.features?.[0];
        if (!first || !Array.isArray(first.center) || first.center.length < 2) {
          throw new Error("Could not find that address. Please try a more specific location.");
        }
        const [lng, lat] = first.center;

        // Extract city from Mapbox: locality/place context or first part of place_name
        const ctx = first.context as Array<{ id: string; text: string }> | undefined;
        const cityPart = ctx?.find(
          (c) => c.id.startsWith("place") || c.id.startsWith("locality")
        );
        const city =
          cityPart?.text ??
          (typeof first.place_name === "string"
            ? first.place_name.split(",")[1]?.trim() ?? ""
            : "");

        const startTime = eventStart.toISOString();
        const endTime = eventEnd.toISOString();

        await createEvent({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          address: form.address.trim(),
          city: city || undefined,
          lat: Number(lat),
          long: Number(lng), // backend expects "long"
          start_time: startTime,
          end_time: endTime,
          organizer_name: form.organization.trim() || "",
        });

        router.push("/hub");
      } catch (err) {
        const apiErr = err as ApiError;
        const message =
          apiErr?.message ??
          (err instanceof Error ? err.message : "Something went wrong. Please try again.");
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, acknowledged, mapboxToken, router]
  );

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-amber-50">
      <header className="flex shrink-0 items-center justify-between border-b border-yellow-200 bg-yellow-400 px-6 py-4 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-300 shadow-md">
            <img src="/lemontree-logo.svg" alt="Lemontree logo" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
              Organizer Hub
            </h1>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-800/80">
              Create a new flyering event
            </p>
          </div>
        </div>
        <Link
          href="/hub"
          className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors duration-200 hover:bg-primary-600"
        >
          Back to Explorer
        </Link>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 pb-16 md:px-6">
        <div className="mx-auto w-full max-w-xl rounded-3xl bg-white p-6 pb-8 shadow-md ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            New flyering event
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Share where volunteers should meet, when, and what the action is about.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-800"
              >
                Event name
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Harlem Community Flyering"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
              />
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-800"
              >
                Address
              </label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="e.g. 14th Street – Union Square, New York, NY"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                We&apos;ll geocode this into coordinates using Mapbox.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="date"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-800"
                >
                  Start date &amp; time
                </label>
                <input
                  id="date"
                  type="datetime-local"
                  value={form.date}
                  min={minDatetime || undefined}
                  max={maxDatetime || undefined}
                  onChange={(e) =>
                    setForm((f) => {
                      const value = e.target.value;
                      return {
                        ...f,
                        date: value,
                        endDate:
                          f.endDate && new Date(f.endDate) > new Date(value)
                            ? f.endDate
                            : value,
                      };
                    })
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Event start must be in the future.
                </p>
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-800"
                >
                  End date &amp; time
                </label>
                <input
                  id="endDate"
                  type="datetime-local"
                  value={form.endDate || ""}
                  min={form.date || minDatetime || undefined}
                  max={maxDatetime || undefined}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      endDate: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  End time must be after the start time.
                </p>
              </div>
            </div>
            <div>
              <label
                htmlFor="organization"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-800"
              >
                Affiliated Organization (Optional)
              </label>
              <input
                id="organization"
                type="text"
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                placeholder="e.g. Lincoln High Eco Club, Local Food Pantry"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-800"
              >
                Organizer description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Tell volunteers what this flyering action is about, who you’re trying to reach, and any instructions."
                rows={3}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Description is required so volunteers know what to expect.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-3">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => {
                    setAcknowledged(e.target.checked);
                    setAcknowledgmentError(null);
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-primary-500 focus:ring-2 focus:ring-primary-500/70 focus:ring-offset-0"
                />
                <span>
                  I acknowledge that I am responsible for printing and supplying all flyers and materials for this event.
                </span>
              </label>
              {acknowledgmentError && (
                <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                  {acknowledgmentError}
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !acknowledged}
              className="mt-2 mb-2 w-full rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-primary-600 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-amber-50"
            >
              {isSubmitting ? "Creating event…" : "Submit Event"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

