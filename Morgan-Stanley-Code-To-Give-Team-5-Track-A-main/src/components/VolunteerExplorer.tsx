"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useEvents, type FlyeringEvent } from "@/context/EventsContext";
import { useAuth } from "@/context/AuthContext";
import { useVolunteerProgress } from "@/context/VolunteerProgressContext";
import { VolunteerMap } from "./VolunteerMap";
import { VolunteerLeaderboard } from "./VolunteerLeaderboard";
import { FlyerTutorialModal } from "./FlyerTutorialModal";
import { PosterConfirmationModal } from "./PosterConfirmationModal";
import { downloadAreaFlyer } from "@/lib/downloadFlyer";
import { isUserJoined } from "@/lib/attendance";

export function VolunteerExplorer() {
  const { events, loading, error, refetch, toggleJoin } = useEvents();
  const { user, logout } = useAuth();
  const { awardFlyerPosted, adjustEventJoin } = useVolunteerProgress();
  const currentUserId = user?.id ?? null;
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);
  const [flyerLoading, setFlyerLoading] = useState(false);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [joinLoadingId, setJoinLoadingId] = useState<string | null>(null);
  const [scoreboardExpanded, setScoreboardExpanded] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [posterConfirmOpen, setPosterConfirmOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const eventCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    // Treat an event as upcoming/active as long as its end_time is in the future;
    // fall back to start_time if end_time is missing for legacy rows.
    let futureEvents = events.filter((e) =>
      new Date(e.end_time || e.start_time) > now
    );

    if (showOnlyJoined) {
      if (!currentUserId) {
        return [];
      }
      futureEvents = futureEvents.filter((e) => isUserJoined(e, currentUserId));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return futureEvents;
    return futureEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.address?.toLowerCase().includes(q)) ||
        (e.description?.toLowerCase().includes(q)) ||
        (e.organizer_name?.toLowerCase().includes(q)) ||
        (e.city?.toLowerCase().includes(q))
    );
  }, [events, searchQuery, showOnlyJoined, currentUserId]);

  useEffect(() => {
    if (!selectedEventId) return;
    const rafId = window.requestAnimationFrame(() => {
      eventCardRefs.current[selectedEventId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [selectedEventId, filteredEvents.length]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inAvatar = profileMenuRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inAvatar && !inDropdown) setIsProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen || !avatarButtonRef.current) {
      setDropdownPosition(null);
      return;
    }
    const rect = avatarButtonRef.current.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, [isProfileMenuOpen]);

  const selectedEvent: FlyeringEvent | null =
    events.find((event) => event.id === selectedEventId) ?? null;
  const isSelectedEventJoined =
    !!(currentUserId && selectedEvent && isUserJoined(selectedEvent, currentUserId));

  const handleSelectEvent = useCallback((event: FlyeringEvent | null) => {
    setSelectedEventId((prev) => {
      const nextId = event?.id ?? null;
      if (!nextId) return null;
      return prev === nextId ? null : nextId;
    });
    setStatusMessage(null);
    setShowFullDetails(false);
  }, []);

  const handleFlyerDownload = useCallback(async () => {
    if (!selectedEvent) {
      return;
    }

    setFlyerError(null);
    setStatusMessage(null);
    setFlyerLoading(true);

    const result = await downloadAreaFlyer(
      selectedEvent.lat,
      selectedEvent.lng,
      selectedEvent.title,
      currentUserId ?? "guest",
      { flyerLang: "en" }
    );

    setFlyerLoading(false);
    if (!result.ok) {
      setFlyerError(result.error);
      return;
    }

    setStatusMessage(`Flyer downloaded: ${result.filename}`);
  }, [selectedEvent, currentUserId]);

  const handleOpenTutorial = useCallback(() => {
    if (!selectedEvent) {
      return;
    }

    setFlyerError(null);
    setStatusMessage(null);
    setTutorialOpen(true);
  }, [selectedEvent]);

  const handleContinueFromTutorial = useCallback(async () => {
    setTutorialOpen(false);
    await handleFlyerDownload();
  }, [handleFlyerDownload]);

  const handleJoin = useCallback(
    async (eventId: string) => {
      if (!currentUserId) return;
      const event = events.find((item) => item.id === eventId);
      if (!event || isUserJoined(event, currentUserId)) return;
      setJoinLoadingId(eventId);
      try {
        await toggleJoin(eventId);
        await adjustEventJoin(true);
        setStatusMessage("You joined the event and earned event points.");
      } finally {
        setJoinLoadingId(null);
      }
    },
    [events, toggleJoin, currentUserId, adjustEventJoin]
  );

  const handleLeave = useCallback(
    async (eventId: string) => {
      if (!currentUserId) return;
      const event = events.find((item) => item.id === eventId);
      if (!event || !isUserJoined(event, currentUserId)) return;
      setJoinLoadingId(eventId);
      try {
        await toggleJoin(eventId);
        await adjustEventJoin(false);
        setStatusMessage("You left the event.");
      } finally {
        setJoinLoadingId(null);
      }
    },
    [events, toggleJoin, currentUserId, adjustEventJoin]
  );

  const handleConfirmPosterAdded = useCallback(async () => {
    await awardFlyerPosted();
    setPosterConfirmOpen(false);
    setStatusMessage("Poster logged and flyer-posting points added.");
  }, [awardFlyerPosted]);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "linear-gradient(135deg, #FFF9E6, #FFE066)" }}>
      <header className="flex shrink-0 items-center justify-between border-b border-yellow-200 bg-yellow-400 px-6 py-4 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-300 shadow-md">
            <img src="/lemontree-logo.svg" alt="Lemontree logo" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-800">
              Volunteer Flyering Hub
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-800/80">
              Explore events · Download flyers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md transition-colors duration-200 hover:bg-white"
          >
            Admin
          </a>
          <a
            href="/messages"
            className="rounded-full bg-primary-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md transition-colors duration-200 hover:bg-primary-600"
          >
            Messages
          </a>
          <a
            href="/organizer"
            className="rounded-full bg-primary-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md transition-colors duration-200 hover:bg-primary-600"
          >
            Create Event
          </a>
          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                ref={avatarButtonRef}
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/90 text-center font-bold leading-none text-slate-800 shadow-md ring-1 ring-amber-200/80 transition-colors hover:bg-amber-200/90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-yellow-400"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                aria-label="Profile menu"
              >
                <span className="inline-flex items-center justify-center">{(user.name || "U").charAt(0).toUpperCase()}</span>
              </button>
              {typeof document !== "undefined" &&
                isProfileMenuOpen &&
                dropdownPosition &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    role="menu"
                    className="fixed z-[9999] w-56 rounded-xl border border-slate-100 bg-white py-2 shadow-lg"
                    style={{
                      top: dropdownPosition.top,
                      right: dropdownPosition.right,
                      left: "auto",
                    }}
                  >
                    <div className="px-4 py-3">
                      <p className="font-bold text-slate-800">{user.name || "User"}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
                    </div>
                    <div className="my-1 border-t border-slate-100" />
                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          ) : (
            <a
              href="/login"
              className="rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md transition-colors duration-200 hover:bg-white"
            >
              Log in
            </a>
          )}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row md:p-6">
        <section className="flex min-h-0 w-full flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-100 md:w-95 md:shrink-0">
          <div className="flex shrink-0 flex-col border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold text-slate-800">
                  Upcoming flyering events
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Tap a map marker or event card to see details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnlyJoined((prev) => !prev)}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 ${
                  showOnlyJoined
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>Joined Events</span>
              </button>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events…"
              aria-label="Search events by title, address, organizer, or city"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
            />
          </div>

          <div className="sidebar-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-8 pt-2">
            {loading ? (
              <p className="py-4 text-center text-[11px] text-slate-500">Loading events…</p>
            ) : error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-800" role="alert">{error}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-2 text-[11px] font-semibold text-primary-500 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const isActive = event.id === selectedEventId;
                  const isJoined =
                    !!currentUserId && isUserJoined(event, currentUserId);
                  return (
                    <div
                      key={event.id}
                      ref={(el) => {
                        eventCardRefs.current[event.id] = el;
                      }}
                      className={`rounded-2xl border px-3 py-2.5 text-left text-xs shadow-sm transition-colors duration-150 ${
                        isActive
                          ? "border-primary-500 bg-primary-50/70"
                          : "border-slate-100 bg-white hover:border-primary-200 hover:bg-primary-50/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectEvent(event)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3
                              className={`truncate text-xs font-semibold ${
                                isActive ? "text-primary-800" : "text-slate-800"
                              }`}
                            >
                              {event.title}
                            </h3>
                            <p
                              className={`mt-0.5 text-[11px] ${
                                isActive ? "text-primary-600" : "text-slate-500"
                              }`}
                            >
                              {new Date(event.start_time).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}{" "}
                              –{" "}
                              {new Date(event.end_time).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                            <p
                              className={`mt-0.5 line-clamp-1 text-[11px] ${
                                isActive ? "text-primary-600" : "text-slate-600"
                              }`}
                            >
                              {event.address}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                              isActive
                                ? "bg-primary-100 text-primary-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span aria-hidden="true">👥</span>
                            {(event.attendees?.length ?? 0)}
                          </span>
                        </div>
                        {isJoined ? (
                          <div className="mt-2">
                            <span
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-gradient-to-r from-emerald-50 to-lime-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800 shadow-sm"
                              aria-label="You have joined this event"
                            >
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"
                              />
                              Joined
                            </span>
                          </div>
                        ) : null}
                      </button>

                      {isActive ? (
                        <div className="mb-4 max-h-[45vh] shrink-0 overflow-y-auto border-b-2 border-slate-100 px-1 pb-4 pt-3 md:max-h-[38vh]">
                          <div className="px-3 pb-2">
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                              <span aria-hidden="true">People</span>
                              <span className="font-medium">
                                {(event.attendees?.length ?? 0)} Volunteers Joining
                              </span>
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {isJoined ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleLeave(event.id)}
                                    disabled={joinLoadingId === event.id}
                                    className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 disabled:opacity-70"
                                  >
                                    {joinLoadingId === event.id ? (
                                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                      "Leave event"
                                    )}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleJoin(event.id)}
                                  disabled={joinLoadingId === event.id || !currentUserId}
                                  className="rounded-full bg-primary-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-colors duration-200 hover:bg-primary-600 disabled:opacity-70"
                                >
                                  {joinLoadingId === event.id ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : !currentUserId ? (
                                    "Log in to join"
                                  ) : (
                                    "Join Event"
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleOpenTutorial}
                                disabled={flyerLoading}
                                className="rounded-full bg-primary-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-colors duration-200 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {flyerLoading ? "Generating..." : "Download Area Flyer"}
                              </button>
                              <button
                                type="button"
                                onClick={handleOpenTutorial}
                                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50"
                              >
                                View Instructions
                              </button>
                              {isJoined ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusMessage(null);
                                    setPosterConfirmOpen(true);
                                  }}
                                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition-colors duration-200 hover:bg-emerald-100"
                                >
                                  Poster Added
                                </button>
                              ) : null}
                            </div>
                            <div className="mt-4 border-t border-slate-100 pt-3">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                {new Date(event.start_time).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}{" "}
                                –{" "}
                                {new Date(event.end_time).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                              {event.organizer_name ? (
                                <p className="mt-0.5 text-[11px] text-slate-600">
                                  Organizer:{" "}
                                  <span className="font-medium text-slate-800">
                                    {event.organizer_name}
                                  </span>
                                </p>
                              ) : null}
                              <p className="mt-1 text-[11px] text-slate-600">{event.address}</p>
                              <p
                                className={`mt-2 text-[11px] leading-relaxed text-slate-700 ${
                                  showFullDetails ? "" : "line-clamp-3"
                                }`}
                              >
                                {event.description}
                              </p>
                              {event.description.length > 160 ? (
                                <button
                                  type="button"
                                  onClick={() => setShowFullDetails((prev) => !prev)}
                                  className="mt-1 text-[11px] font-semibold text-primary-500 hover:underline"
                                >
                                  {showFullDetails ? "Show less" : "Show more"}
                                </button>
                              ) : null}
                              {flyerError ? (
                                <p className="mt-2 text-[11px] font-medium text-red-600" role="alert">
                                  {flyerError}
                                </p>
                              ) : null}
                              {statusMessage ? (
                                <p className="mt-2 text-[11px] font-medium text-emerald-700" role="status">
                                  {statusMessage}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <p className="py-4 text-center text-[11px] text-slate-500">
                    {showOnlyJoined
                      ? "You haven't joined any events yet! Turn off this filter to explore upcoming flyering campaigns."
                      : events.length === 0
                        ? "No events yet. Be the first to create one in the Organizer Hub."
                        : !events.some(
                            (e) => new Date(e.end_time || e.start_time) > new Date()
                          )
                          ? "No upcoming events right now."
                          : "No events match your search. Try a different term."}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-green-900/5 p-3 shadow-inner ring-1 ring-green-800/10">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-stone-50 shadow-md ring-1 ring-green-900/10">
            <VolunteerMap
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              currentUserId={currentUserId}
            />
            <div className="pointer-events-none absolute right-2 top-2 z-20 flex justify-end md:right-4 md:top-4">
              <div className="pointer-events-auto w-full max-w-xs">
                <VolunteerLeaderboard
                  isExpanded={scoreboardExpanded}
                  onToggle={() => setScoreboardExpanded((prev) => !prev)}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <FlyerTutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onContinue={handleContinueFromTutorial}
        isDownloading={flyerLoading}
        eventTitle={selectedEvent?.title ?? "this event"}
      />
      <PosterConfirmationModal
        isOpen={posterConfirmOpen}
        onClose={() => setPosterConfirmOpen(false)}
        onConfirm={handleConfirmPosterAdded}
        eventTitle={selectedEvent?.title ?? "this event"}
      />
    </div>
  );
}
