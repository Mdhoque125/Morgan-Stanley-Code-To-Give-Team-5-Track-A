"use client";

import { useEffect, useRef, useState } from "react";
import { useEvents } from "@/context/EventsContext";

type ResourceStats = {
  total?: number;
  pantries?: number;
  kitchens?: number;
  openToday?: number;
  openThisWeek?: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

function buildContext(
  events: ReturnType<typeof useEvents>["events"],
  stats: ResourceStats | null
): string {
  const now = new Date();
  const upcoming = events.filter(
    (e) => new Date(e.end_time || e.start_time) > now
  );
  const past = events.filter(
    (e) => new Date(e.end_time || e.start_time) <= now
  );
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees.length, 0);
  const avgAttendees = events.length > 0 ? (totalAttendees / events.length).toFixed(1) : "0";
  const coverageRatio =
    stats?.total != null && stats.total > 0
      ? ((events.length / stats.total) * 100).toFixed(2)
      : null;

  const resourceParts =
    stats == null
      ? []
      : [
          stats.total != null ? `${stats.total.toLocaleString()} total` : null,
          stats.pantries != null ? `${stats.pantries.toLocaleString()} food pantries` : null,
          stats.kitchens != null ? `${stats.kitchens.toLocaleString()} soup kitchens` : null,
          stats.openToday != null ? `${stats.openToday} open today` : null,
          stats.openThisWeek != null ? `${stats.openThisWeek} open this week` : null,
        ].filter((part): part is string => part != null);

  const eventSummaries = events
    .slice(0, 20)
    .map(
      (e) =>
        `- "${e.title}" @ ${e.address}, ${e.city} | ${new Date(
          e.start_time
        ).toLocaleString()} – ${new Date(
          e.end_time
        ).toLocaleString()} | ${e.attendees.length}/20 attendees | organizer: ${
          e.organizer_name
        }`
    )
    .join("\n");

  return [
    `Total flyering events: ${events.length} (${upcoming.length} upcoming, ${past.length} past)`,
    `Total volunteer slots filled: ${totalAttendees} | avg attendees/event: ${avgAttendees}`,
    coverageRatio
      ? `Network coverage: ${coverageRatio}% (${events.length} events / ${stats!.total} total resources)`
      : "Network coverage: unavailable",
    resourceParts.length > 0
      ? `Resource network: ${resourceParts.join(" | ")}`
      : "Resource network stats: unavailable",
    events.length > 0 ? `\nEvent breakdown:\n${eventSummaries}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ZestyAdminAssistant({ resourceStats }: { resourceStats: ResourceStats | null }) {
  const { events } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showIntroBubble, setShowIntroBubble] = useState(true);
  const [hasNotification, setHasNotification] = useState(true);

  useEffect(() => {
    if (!showIntroBubble) return;
    const id = window.setTimeout(() => {
      setShowIntroBubble(false);
    }, 2000);
    return () => window.clearTimeout(id);
  }, [showIntroBubble]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNotification(false);
    }
  }, [messages, isOpen]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const context = buildContext(events, resourceStats);
      const res = await fetch("/api/zesty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");

      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach Zesty.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 flex w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-yellow-200 bg-white shadow-2xl ring-1 ring-slate-200"
          role="dialog"
          aria-label="Zesty admin assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/lemon-mascot.png" alt="Zesty" className="h-7 w-7 rounded-full object-cover" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">Zesty</h2>
                <p className="text-xs text-slate-500">LemonTree Admin Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex max-h-105 min-h-50 flex-col gap-3 overflow-y-auto bg-slate-50/50 p-4">
            {messages.length === 0 && (
              <p className="text-sm text-slate-400">
                Hi team 👋 I&apos;m Zesty. Ask me anything about the platform — coverage gaps, volunteer engagement, event trends, or what to prioritize next.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary-500 text-white"
                      : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex gap-2 border-t border-slate-100 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Zesty…"
              aria-label="Message"
              disabled={loading}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating lemon button with notification (position unchanged) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHasNotification(false);
          setShowIntroBubble(false);
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-300 bg-yellow-400 shadow-lg ring-2 ring-yellow-500/50 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label={isOpen ? "Close Zesty" : "Open Zesty"}
        aria-expanded={isOpen}
      >
        <span className="relative inline-flex">
          {hasNotification && !isOpen && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-yellow-400" />
          )}
          <img src="/lemon-mascot.png" alt="Zesty" className="h-12 w-12 rounded-full object-cover" />
        </span>
      </button>

      {/* Intro greeting bubble */}
      {showIntroBubble && !isOpen && (
        <div className="fixed bottom-9 right-[6.5rem] z-40 max-w-xs rounded-2xl bg-white px-3 py-2 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200">
          Hi team 👋 I&apos;m Zesty. Need help with the platform, ask me.
        </div>
      )}
    </>
  );
}
