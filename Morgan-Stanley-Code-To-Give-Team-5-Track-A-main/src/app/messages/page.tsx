"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useEvents } from "@/context/EventsContext";
import { useAuth } from "@/context/AuthContext";
import type { FlyeringEvent } from "@/types/events";
import {
  getChatMessages,
  getChatPresence,
  getUserProfile,
  postChatPresence,
  sendChatMessage,
  type ApiChatMessageRow,
  type SendChatMessageResponse,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
};

type Photo = {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  uploadedAt: Date;
};

type Member = {
  id: string;
  name: string;
  role: "organizer" | "volunteer";
  online: boolean;
};

type Tab = "chat" | "photos";

// ─── Mock data ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-yellow-300 text-yellow-900",
  "bg-primary-100 text-primary-800",
  "bg-emerald-100 text-emerald-800",
  "bg-blue-100 text-blue-800",
  "bg-pink-100 text-pink-800",
  "bg-orange-100 text-orange-800",
] as const;

const POLL_INTERVAL_MS = 4000;

function mapApiMessageToMessage(
  row: ApiChatMessageRow | SendChatMessageResponse,
  currentUserId: string | null,
  currentUserDisplayName?: string | null,
): Message {
  const isYou = currentUserId !== null && row.user_id === currentUserId;
  const senderName = isYou
    ? (currentUserDisplayName ?? "You")
    : (row.profiles?.display_name ?? "Someone");
  return {
    id: row.id,
    senderId: isYou ? "you" : row.user_id,
    senderName,
    text: row.content,
    timestamp: new Date(row.sent_at),
  };
}

const MOCK_PHOTOS: Record<string, Photo[]> = {
  "evt-1": [
    {
      id: "p1",
      url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80",
      caption: "Volunteers lined up and ready to go!",
      uploadedBy: "Maya G.",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "p2",
      url: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=600&q=80",
      caption: "Flyers distributed on Malcolm X Blvd",
      uploadedBy: "James L.",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "p3",
      url: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80",
      caption: "The whole crew after a great morning 🙌",
      uploadedBy: "You",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 90),
    },
    {
      id: "p4",
      url: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80",
      caption: "Community members picking up info packs",
      uploadedBy: "Maya G.",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60),
    },
  ],
  "evt-3": [
    {
      id: "p1",
      url: "https://images.unsplash.com/photo-1593113630400-ea4288922559?w=600&q=80",
      caption: "Starting the walk on Delancey",
      uploadedBy: "Sofia R.",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
    },
    {
      id: "p2",
      url: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=600&q=80",
      caption: "Posting flyers in apartment lobbies",
      uploadedBy: "You",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 9),
    },
  ],
};

const MOCK_MEMBERS: Record<string, Member[]> = {
  "evt-1": [
    { id: "maya", name: "Maya G.", role: "organizer", online: true },
    { id: "james", name: "James L.", role: "volunteer", online: true },
    { id: "you", name: "You", role: "volunteer", online: true },
    { id: "priya", name: "Priya S.", role: "volunteer", online: false },
    { id: "david", name: "David K.", role: "volunteer", online: false },
  ],
  "evt-2": [
    { id: "james", name: "James L.", role: "organizer", online: true },
    { id: "you", name: "You", role: "volunteer", online: true },
    { id: "elena", name: "Elena M.", role: "volunteer", online: false },
  ],
  "evt-3": [
    { id: "sofia", name: "Sofia R.", role: "organizer", online: true },
    { id: "you", name: "You", role: "volunteer", online: true },
    { id: "david", name: "David K.", role: "volunteer", online: true },
    { id: "ana", name: "Ana L.", role: "volunteer", online: false },
  ],
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function getInitials(title: string): string {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarColor(id: string): string {
  const index = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function memberInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatEventDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();

  const datePart = start.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const startTime = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (sameDay) {
    return `${datePart} \u2022 ${startTime} - ${endTime}`;
  }

  const endDateTime = end.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} \u2022 ${startTime} - ${endDateTime}`;
}

function formatPhotoDate(date: Date): string {
  return (
    date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " at " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

// ─── MembersSidebar ───────────────────────────────────────────────────────────

function MembersSidebar({
  eventId,
  onlineUserIds = [],
}: {
  eventId: string;
  onlineUserIds?: string[];
}) {
  const { events } = useEvents();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});

  const event = events.find((e) => e.id === eventId) ?? null;

  // Fetch display names for other attendees
  useEffect(() => {
    if (!event?.attendees.length || !currentUserId) {
      setDisplayNames({});
      return;
    }
    const others = event.attendees.filter((id) => id !== currentUserId);
    if (others.length === 0) {
      setDisplayNames({});
      return;
    }
    let cancelled = false;
    setDisplayNames({});
    Promise.all(others.map((userId) => getUserProfile(userId)))
      .then((profiles) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        others.forEach((userId, i) => {
          const p = profiles[i];
          next[userId] = p?.display_name ?? "Someone";
        });
        setDisplayNames(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [event?.id, event?.attendees?.join(","), currentUserId]);

  let members: Member[] =
    event && event.attendees.length > 0
      ? event.attendees.map((attendeeId) => ({
          id: attendeeId === currentUserId ? "you" : attendeeId,
          name:
            attendeeId === currentUserId
              ? (user?.name ?? "You")
              : (displayNames[attendeeId] ?? "…"),
          role:
            attendeeId === event.created_by_user_id ? "organizer" : "volunteer",
          online:
            attendeeId === currentUserId ||
            onlineUserIds.includes(attendeeId),
        }))
      : (MOCK_MEMBERS[eventId] ?? []);

  const online = members.filter((m) => m.online);
  const offline = members.filter((m) => !m.online);

  return (
    <aside className="w-52 shrink-0 border-l border-gray-100 bg-gray-50 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Members
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {/* Online */}
        {online.length > 0 && (
          <div className="mb-1">
            <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Online — {online.length}
            </p>
            {online.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        )}

        {/* Offline */}
        {offline.length > 0 && (
          <div className="mt-3">
            <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Offline — {offline.length}
            </p>
            {offline.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        )}

        {members.length === 0 && (
          <p className="px-4 text-[12px] text-gray-400">No members yet.</p>
        )}
      </div>
    </aside>
  );
}

function MemberRow({ member }: { member: Member }) {
  const isYou = member.id === "you";
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-1.5 hover:bg-gray-100 transition-colors ${!member.online ? "opacity-50" : ""}`}
    >
      <div className="relative shrink-0">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
          ${isYou ? "bg-yellow-300 text-yellow-900" : "bg-gray-200 text-gray-600"}`}
        >
          {memberInitials(member.name)}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-50
          ${member.online ? "bg-emerald-400" : "bg-gray-300"}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[12px] font-medium truncate leading-tight ${member.online ? "text-gray-800" : "text-gray-400"}`}
        >
          {member.name}
          {isYou && (
            <span className="text-gray-400 font-normal text-[11px]">
              {" "}
              (you)
            </span>
          )}
        </p>
        {member.role === "organizer" && (
          <p className="text-[10px] text-yellow-600 font-medium leading-none mt-0.5">
            Organizer
          </p>
        )}
      </div>
    </div>
  );
}

// ─── WorkspaceItem ────────────────────────────────────────────────────────────

function WorkspaceItem({
  event,
  isActive,
  unreadCount,
  lastMessage,
  onClick,
}: {
  event: FlyeringEvent;
  isActive: boolean;
  unreadCount: number;
  lastMessage: Message | undefined;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100
        ${isActive ? "bg-white border border-gray-200 shadow-sm" : "hover:bg-white/60 border border-transparent"}`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(event.id)}`}
      >
        {getInitials(event.title)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-800 truncate leading-tight">
          {event.title}
        </p>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">
          {lastMessage ? lastMessage.text : event.address}
        </p>
      </div>
      {unreadCount > 0 && (
        <span className="shrink-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full px-2 py-0.5">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

// ─── EventDetailsBanner ───────────────────────────────────────────────────────

function EventDetailsBanner({ event }: { event: FlyeringEvent }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="border-b border-gray-100 bg-yellow-50 shrink-0">
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-2.5 text-left hover:bg-yellow-100/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="w-3.5 h-3.5 text-yellow-600 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm-.5 2v4l3 1.5.5-.87-2.5-1.25V5H7.5z" />
          </svg>
          <span className="text-[12px] font-medium text-yellow-800 truncate">
            {formatEventDateRange(event.start_time, event.end_time)} ·{" "}
            {event.address}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 ml-3 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {!collapsed && (
        <div className="px-5 pb-3 grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              Organizer
            </p>
            <p className="text-[12px] text-gray-700">{event.organizer_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              Spots remaining
            </p>
            <p className="text-[12px] text-gray-700">
              {event.spotsRemaining} open
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              About
            </p>
            <p className="text-[12px] text-gray-600 leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

const GROUP_WINDOW_MS = 60_000;

function MessageBubble({
  msg,
  isGroupedWithPrevious,
  isGroupedWithNext,
}: {
  msg: Message;
  isGroupedWithPrevious: boolean;
  isGroupedWithNext: boolean;
}) {
  const isMe = msg.senderId === "you";
  const initial = msg.senderName.charAt(0).toUpperCase() || "?";
  const avatarEl = (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 bg-gray-200 text-gray-600">
      {initial}
    </div>
  );
  const yellowAvatarEl = (
    <div className="w-7 h-7 rounded-full bg-yellow-300 flex items-center justify-center text-[10px] font-bold text-yellow-900 shrink-0">
      {initial}
    </div>
  );
  const avatarSpacer = <div className="w-7 h-7 shrink-0" aria-hidden="true" />;
  const bubbleRadiusClasses = isMe
    ? `rounded-2xl rounded-br-sm ${isGroupedWithPrevious ? "rounded-tr-sm" : ""}`
    : `rounded-2xl rounded-bl-sm ${isGroupedWithPrevious ? "rounded-tl-sm" : ""}`;

  return (
    <div
      className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""} ${isGroupedWithPrevious ? "mt-[2px]" : "mt-4"}`}
    >
      {!isMe &&
        (isGroupedWithNext ? avatarSpacer : avatarEl)}
      <div
        className={`max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
      >
        {!isGroupedWithPrevious && (
          <span
            className={`text-[11px] text-gray-400 font-medium mb-1 ${isMe ? "mr-1" : "ml-1"}`}
          >
            {msg.senderName}
          </span>
        )}
        <div
          className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${bubbleRadiusClasses}
          ${isMe ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-800 shadow-sm"}`}
        >
          {msg.text}
        </div>
        {!isGroupedWithNext && (
          <span className="text-[10px] text-gray-400 mt-1 mx-1 font-mono">
            {formatMessageTime(msg.timestamp)}
          </span>
        )}
      </div>
      {isMe && (isGroupedWithNext ? avatarSpacer : yellowAvatarEl)}
    </div>
  );
}

// ─── PhotoGrid ────────────────────────────────────────────────────────────────

function PhotoGrid({
  eventId,
  photos,
  onAddPhotos,
}: {
  eventId: string;
  photos: Photo[];
  onAddPhotos: (eventId: string, newPhotos: Photo[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    (files: FileList) => {
      const validFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!validFiles.length) return;
      const newPhotos: Photo[] = validFiles.map((file) => ({
        id: `uploaded-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        caption: file.name.replace(/\.[^.]+$/, ""),
        uploadedBy: "You",
        uploadedAt: new Date(),
      }));
      onAddPhotos(eventId, newPhotos);
    },
    [eventId, onAddPhotos],
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mx-5 mt-4 mb-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-6 gap-2 transition-colors cursor-pointer
          ${isDragging ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-gray-50 hover:border-yellow-300 hover:bg-yellow-50/50"}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-yellow-700"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-[13px] font-medium text-gray-700">
          Add photos from the event
        </p>
        <p className="text-[11px] text-gray-400">
          Drag & drop or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 pt-4 pb-10 text-center px-10">
          <p className="text-[13px] text-gray-400">
            No photos yet — be the first to share one!
          </p>
        </div>
      ) : (
        <div className="px-5 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setLightbox(photo)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2.5">
                  <p className="text-white text-[11px] font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200 line-clamp-2">
                    {photo.caption}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.caption}
              className="w-full max-h-[60vh] object-cover"
            />
            <div className="px-5 py-4">
              <p className="text-[14px] font-medium text-gray-900 mb-1">
                {lightbox.caption}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-gray-400">
                  Uploaded by{" "}
                  <span className="text-gray-600 font-medium">
                    {lightbox.uploadedBy}
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 font-mono">
                  {formatPhotoDate(lightbox.uploadedAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { events, loading } = useEvents();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [membersSidebarOpen, setMembersSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [presenceByRoom, setPresenceByRoom] = useState<Record<string, string[]>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [photos, setPhotos] = useState<Record<string, Photo[]>>(MOCK_PHOTOS);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [unread, setUnread] = useState<Record<string, number>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeEvent = events.find((e) => e.id === activeEventId) ?? null;
  const activeMessages = activeEventId ? (messages[activeEventId] ?? []) : [];
  const sortedMessages = useMemo(
    () =>
      [...activeMessages].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      ),
    [activeMessages],
  );
  const activePhotos = activeEventId ? (photos[activeEventId] ?? []) : [];
  const onlineUserIds = activeEventId ? (presenceByRoom[activeEventId] ?? []) : [];
  const activeMembers: Member[] =
    activeEvent && activeEvent.attendees.length > 0
      ? activeEvent.attendees.map((attendeeId) => ({
          id: attendeeId === currentUserId ? "you" : attendeeId,
          name: attendeeId === currentUserId ? (user?.name ?? "You") : "…",
          role:
            attendeeId === activeEvent.created_by_user_id
              ? "organizer"
              : "volunteer",
          online:
            attendeeId === currentUserId ||
            onlineUserIds.includes(attendeeId),
        }))
      : [];
  const onlineCount = activeMembers.filter((m) => m.online).length;

  // Access control: only show chat if user has joined this event
  const isAllowedToChat =
    !!activeEvent &&
    !!currentUserId &&
    activeEvent.attendees.includes(currentUserId);

  // Only include chat groups the current user has joined and that haven't ended
  const now = new Date();
  const joinedChatGroups = currentUserId
    ? events.filter(
        (e) =>
          e.attendees.includes(currentUserId) &&
          new Date(e.end_time ?? e.start_time) >= now,
      )
    : [];

  const filteredEvents = joinedChatGroups.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.address.toLowerCase().includes(search.toLowerCase()),
  );

  // Fetch messages and presence for the active room (event_id = room_id)
  const fetchMessages = useCallback(
    async (roomId: string) => {
      setMessagesLoading(true);
      try {
        const [{ messages: raw }, presenceRes] = await Promise.all([
          getChatMessages(roomId),
          getChatPresence(roomId).catch(() => ({ user_ids: [] as string[] })),
        ]);
        const list = raw.map((row) =>
          mapApiMessageToMessage(row, currentUserId, user?.name),
        );
        setMessages((prev) => ({ ...prev, [roomId]: list }));
        setPresenceByRoom((prev) => ({ ...prev, [roomId]: presenceRes.user_ids }));
        if (currentUserId) {
          postChatPresence(roomId).catch(() => {});
        }
      } catch {
        setMessages((prev) => ({ ...prev, [roomId]: [] }));
      } finally {
        setMessagesLoading(false);
      }
    },
    [currentUserId, user?.name],
  );

  useEffect(() => {
    if (!activeEventId) return;
    fetchMessages(activeEventId);
  }, [activeEventId, fetchMessages]);

  // Poll for new messages while chat tab is active
  useEffect(() => {
    if (!activeEventId || activeTab !== "chat" || !isAllowedToChat) return;
    const t = setInterval(() => {
      fetchMessages(activeEventId);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [activeEventId, activeTab, isAllowedToChat, fetchMessages]);

  // If the active event is no longer in the joined list, clear the selection
  useEffect(() => {
    if (!activeEventId) return;
    const stillJoined = joinedChatGroups.some((e) => e.id === activeEventId);
    if (!stillJoined) {
      setActiveEventId(null);
    }
  }, [activeEventId, joinedChatGroups]);

  useEffect(() => {
    if (activeTab === "chat")
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, activeTab]);

  useEffect(() => {
    setActiveTab("chat");
    setMembersSidebarOpen(false);
  }, [activeEventId]);

  function handleSelect(id: string) {
    setActiveEventId(id);
    setUnread((prev) => ({ ...prev, [id]: 0 }));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleSend() {
    if (!input.trim() || !activeEventId || !currentUserId || !isAllowedToChat)
      return;
    const roomId = activeEventId;
    const text = input.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: "you",
      senderName: user?.name ?? "You",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] ?? []), optimisticMsg],
    }));
    setInput("");
    try {
      const server = await sendChatMessage(roomId, text);
      const mapped = mapApiMessageToMessage(server, currentUserId, user?.name);
      setMessages((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] ?? []).map((m) =>
          m.id === tempId ? mapped : m,
        ),
      }));
    } catch {
      setMessages((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] ?? []).filter((m) => m.id !== tempId),
      }));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const handleAddPhotos = useCallback((eventId: string, newPhotos: Photo[]) => {
    setPhotos((prev) => ({
      ...prev,
      [eventId]: [...(prev[eventId] ?? []), ...newPhotos],
    }));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-yellow-50 overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-yellow-200 bg-yellow-400 px-5 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-300 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lemontree-logo.svg"
              alt="Lemontree logo"
              className="h-7 w-7 object-contain"
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
            Event Messages
          </h1>
        </div>
        <Link
          href="/hub"
          className="rounded-full bg-primary-500 hover:bg-primary-600 transition-colors px-4 py-2 text-[12px] font-semibold text-white shadow-md"
        >
          ← Back to Explorer
        </Link>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — workspace list */}
        <aside className="w-70 shrink-0 bg-yellow-50 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 shrink-0">
            <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-3">
              Your Workspaces
            </p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-gray-300"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 scrollbar-hide">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-gray-100 animate-pulse mx-1 mb-1"
                />
              ))
            ) : filteredEvents.length === 0 ? (
              <p className="text-[13px] text-gray-400 px-3 pt-4">
                No workspaces found.
              </p>
            ) : (
              filteredEvents.map((event) => (
                <WorkspaceItem
                  key={event.id}
                  event={event}
                  isActive={activeEventId === event.id}
                  unreadCount={unread[event.id] ?? 0}
                  lastMessage={messages[event.id]?.at(-1)}
                  onClick={() => handleSelect(event.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Center — chat panel */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          {activeEvent ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 h-13 border-b border-gray-100 shrink-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold shrink-0 ${avatarColor(activeEvent.id)}`}
                >
                  {getInitials(activeEvent.title)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate leading-tight">
                    {activeEvent.title}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {activeEvent.city}
                  </p>
                </div>
                {/* Members toggle button */}
                <button
                  onClick={() => setMembersSidebarOpen((p) => !p)}
                  className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg transition-colors shrink-0
                    ${membersSidebarOpen ? "bg-yellow-100 text-yellow-800" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {onlineCount > 0
                    ? `${onlineCount} online`
                    : `${activeMembers.length} members`}
                  {/* People icon */}
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H2zm11-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm2 5.5c0-.83-.42-1.57-1.07-2.02A5.98 5.98 0 0 1 16 13c0 .55-.45 1-1 1h-1.5a3.5 3.5 0 0 0 .5-1.5z" />
                  </svg>
                </button>
              </div>

              {/* Pinned event details banner */}
              <EventDetailsBanner event={activeEvent} />

              {/* Tab bar */}
              <div className="flex border-b border-gray-100 shrink-0 px-5">
                {(["chat", "photos"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-2.5 mr-6 text-[13px] font-medium transition-colors
                      ${activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {tab === "chat" ? (
                      "Chat"
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Photos
                        {activePhotos.length > 0 && (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                            {activePhotos.length}
                          </span>
                        )}
                      </span>
                    )}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === "chat" ? (
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
                    {!isAllowedToChat ? (
                      <div className="flex flex-col items-center justify-center gap-3 text-center pt-12 pb-6 px-4">
                        <p className="text-[15px] text-gray-700 leading-relaxed">
                          🍋 You must join this flyering event to view and send
                          messages.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 my-2">
                          <hr className="flex-1 border-gray-100" />
                          <span className="text-[11px] text-gray-400">
                            Today
                          </span>
                          <hr className="flex-1 border-gray-100" />
                        </div>
                        {messagesLoading && activeMessages.length === 0 ? (
                          <p className="text-center text-[13px] text-gray-400 pt-8">
                            Loading messages…
                          </p>
                        ) : activeMessages.length === 0 ? (
                          <p className="text-center text-[13px] text-gray-400 pt-8">
                            No messages yet. Say hello!
                          </p>
                        ) : (
                          sortedMessages.map((msg, index) => {
                            const prev = sortedMessages[index - 1];
                            const next = sortedMessages[index + 1];
                            const isGroupedWithPrevious = !!(
                              prev &&
                              msg.senderId === prev.senderId &&
                              msg.timestamp.getTime() - prev.timestamp.getTime() <= GROUP_WINDOW_MS
                            );
                            const isGroupedWithNext = !!(
                              next &&
                              msg.senderId === next.senderId &&
                              next.timestamp.getTime() - msg.timestamp.getTime() <= GROUP_WINDOW_MS
                            );
                            return (
                              <MessageBubble
                                key={msg.id}
                                msg={msg}
                                isGroupedWithPrevious={isGroupedWithPrevious}
                                isGroupedWithNext={isGroupedWithNext}
                              />
                            );
                          })
                        )}
                      </>
                    )}
                    <div ref={bottomRef} />
                  </div>
                  <div className="flex items-end gap-2.5 px-4 py-3 border-t border-gray-100 shrink-0">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${activeEvent.title.split(" ").slice(0, 2).join(" ")}…`}
                      rows={1}
                      disabled={!isAllowedToChat}
                      className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 bg-gray-50 outline-none focus:border-gray-300 leading-relaxed max-h-28 overflow-y-auto scrollbar-hide disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || !isAllowedToChat}
                      className="w-9 h-9 rounded-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="#1a1a1a" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <PhotoGrid
                  eventId={activeEvent.id}
                  photos={activePhotos}
                  onAddPhotos={handleAddPhotos}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-10">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-2xl mb-1">
                💬
              </div>
              <p className="text-[15px] font-medium text-gray-800">
                No workspace selected
              </p>
              <p className="text-[13px] text-gray-400 max-w-55 leading-relaxed">
                Pick a workspace on the left to start chatting with your team.
              </p>
            </div>
          )}
        </main>

        {/* Right sidebar — members (collapsible) */}
        {activeEvent && membersSidebarOpen && (
          <MembersSidebar
            eventId={activeEvent.id}
            onlineUserIds={onlineUserIds}
          />
        )}
      </div>
    </div>
  );
}
