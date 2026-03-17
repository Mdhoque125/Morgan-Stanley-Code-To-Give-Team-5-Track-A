"use client";

import { useCallback, useEffect, useRef } from "react";
import Map, {
  Marker,
  Popup,
  type MarkerEvent,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { FlyeringEvent } from "@/types/events";
import { VolunteerAIAssistant } from "@/components/VolunteerAIAssistant";

const NYC_CENTER = { longitude: -73.9857, latitude: 40.7484 };
const INITIAL_ZOOM = 10;

type VolunteerMapProps = {
  events: FlyeringEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: FlyeringEvent | null) => void;
  currentUserId: string | null;
};

function EventPin({
  hasSpots,
  isJoined,
}: {
  hasSpots: boolean;
  isJoined: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ring-2 transition-shadow duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 focus:ring-offset-yellow-100 disabled:cursor-not-allowed disabled:opacity-60 ${
        isJoined
          ? "bg-primary-100 border-4 border-primary-500 shadow-primary-500/50 ring-primary-300"
          : "bg-white border-2 border-transparent shadow-md ring-yellow-400/70"
      }`}
      aria-label={hasSpots ? "View event with open spots" : "View full event"}
    >
      <span className="relative flex items-center justify-center">
        <span
          className={`absolute h-8 w-8 rounded-full animate-pulse ${
            isJoined
              ? "bg-primary-300/60"
              : hasSpots
                ? "bg-emerald-300/40"
                : "bg-slate-400/30"
          }`}
          aria-hidden="true"
        />
        <span className="relative text-base drop-shadow-sm" aria-hidden="true">
          🍋
        </span>
      </span>
    </button>
  );
}

export function VolunteerMap({
  events,
  selectedEventId,
  onSelectEvent,
  currentUserId,
}: VolunteerMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    const selectedEvent = events.find((event) => event.id === selectedEventId);
    if (!selectedEvent) {
      return;
    }

    mapRef.current?.flyTo({
      center: [selectedEvent.lng, selectedEvent.lat],
      zoom: 13,
    });
  }, [events, selectedEventId]);

  const handleMarkerClick = useCallback(
    (e: MarkerEvent<MouseEvent>, event: FlyeringEvent) => {
      e.originalEvent?.stopPropagation();
      onSelectEvent(event);
      const center: [number, number] = [event.lng, event.lat];
      mapRef.current?.flyTo({ center, zoom: 13 });
    },
    [onSelectEvent],
  );

  const handleClosePopup = useCallback(() => {
    onSelectEvent(null);
  }, [onSelectEvent]);

  const popupEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl bg-yellow-50/80 p-8 text-center shadow-inner ring-1 ring-yellow-100">
        <p className="max-w-sm text-sm text-green-900">
          Add{" "}
          <code className="rounded bg-slate-200 px-1">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>{" "}
          to <code className="rounded bg-slate-200 px-1">.env.local</code> to
          load the map.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden rounded-3xl border border-yellow-200/80 bg-stone-50 shadow-inner">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          ...NYC_CENTER,
          zoom: INITIAL_ZOOM,
        }}
        style={{ width: "100%", height: "100%", borderRadius: "1.5rem" }}
        mapStyle="mapbox://styles/zjeon/cmms8ky1a000x01rxe2qk608w"
        styleDiffing={false}
      >
        {events.map((event) => {
          const isJoined =
            !!currentUserId && Array.isArray(event.attendees)
              ? event.attendees.includes(currentUserId)
              : false;
          return (
            <Marker
              key={event.id}
              longitude={event.lng}
              latitude={event.lat}
              anchor="center"
              onClick={(e) => handleMarkerClick(e, event)}
            >
              <EventPin
                hasSpots={event.spotsRemaining > 0}
                isJoined={isJoined}
              />
            </Marker>
          );
        })}

        {popupEvent && (
          <Popup
            key={popupEvent.id}
            longitude={popupEvent.lng}
            latitude={popupEvent.lat}
            onClose={handleClosePopup}
            closeButton
            closeOnClick={false}
            anchor="bottom"
            className="volunteer-event-popup"
          >
            <h3 className="text-sm font-semibold text-green-900 line-clamp-2">
              {popupEvent.title}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-green-700/80">
              {new Date(popupEvent.start_time).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              –{" "}
              {new Date(popupEvent.end_time).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              {popupEvent.address}
            </p>
            <p className="mt-1 line-clamp-3 text-[11px] text-slate-700">
              {popupEvent.description}
            </p>
          </Popup>
        )}
      </Map>
      <VolunteerAIAssistant />
    </div>
  );
}
