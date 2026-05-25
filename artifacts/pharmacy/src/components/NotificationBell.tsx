import React, { useEffect, useRef, useState, useCallback } from "react";
import { Bell, CheckCheck, MessageSquare, FileText, Package, Sparkles, X, Upload } from "lucide-react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  recipientType: string;
  recipientKey: string;
  category: string;
  title: string;
  body: string;
  link: string | null;
  consultationId: string | null;
  orderId: string | null;
  read: boolean;
  createdAt: string;
};

const CAT_ICON: Record<string, React.ReactNode> = {
  message: <MessageSquare className="w-4 h-4 text-blue-600" />,
  consultation: <FileText className="w-4 h-4 text-emerald-600" />,
  document: <Upload className="w-4 h-4 text-amber-700" />,
  order: <Package className="w-4 h-4 text-amber-600" />,
  system: <Sparkles className="w-4 h-4 text-purple-600" />,
};

interface Props {
  audience?: "patient" | "pharmacist";
  variant?: "light" | "dark";
}

export default function NotificationBell({ audience = "patient", variant = "light" }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tokenKey = audience === "pharmacist" ? "pharmacist_token" : "patient_token";

  const checkAuth = useCallback(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
    setAuthed(!!t);
    return !!t;
  }, [tokenKey]);

  const loadNotifications = useCallback(async () => {
    if (!checkAuth()) {
      setUnread(0);
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ notifications: Notification[]; unreadCount: number }>(
        "/api/notifications?limit=20",
        { auth: audience }
      );
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [audience, checkAuth]);

  useEffect(() => {
    checkAuth();
    loadNotifications();
    pollRef.current = setInterval(loadNotifications, 30000);
    const onStorage = () => {
      checkAuth();
      loadNotifications();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadNotifications, checkAuth]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const root = wrapperRef.current;
      if (root && !root.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleMarkRead(n: Notification) {
    try {
      await apiFetch(`/api/notifications/${n.id}/read`, { method: "POST", auth: audience });
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - (n.read ? 0 : 1)));
    } catch { /* ignore */ }
  }

  async function handleMarkAllRead() {
    try {
      await apiFetch("/api/notifications/read-all", { method: "POST", auth: audience });
      setNotifications(prev => prev.map(x => ({ ...x, read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  }

  if (!authed) return null;

  const btnTone = variant === "dark"
    ? "text-white/90 hover:text-white"
    : "text-secondary/80 hover:text-secondary";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className={`relative w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-muted/40 transition-colors ${btnTone}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-[60]">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-[#0A7EA4]/5">
            <div>
              <p className="text-sm font-bold text-secondary">Notifications</p>
              <p className="text-[11px] text-muted-foreground">{unread} unread</p>
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-muted/30 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <Bell className="w-6 h-6 mx-auto opacity-40" />
                <p>No notifications yet</p>
              </div>
            )}
            {notifications.map((n) => {
              const inner = (
                <div className={`flex items-start gap-3 px-4 py-3 border-b border-border/40 hover:bg-muted/10 transition-colors ${n.read ? "" : "bg-primary/[0.03]"}`}>
                  <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                    {CAT_ICON[n.category] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-secondary truncate">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => { handleMarkRead(n); setOpen(false); }}>
                  <a className="block">{inner}</a>
                </Link>
              ) : (
                <button key={n.id} type="button" onClick={() => handleMarkRead(n)} className="block w-full text-left">
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
