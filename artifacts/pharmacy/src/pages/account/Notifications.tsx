import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, MessageSquare, FileText, Package, Sparkles, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { normalizePatientDocumentLink } from "@/lib/consultationDocumentFocus";
import { toast } from "sonner";

const PARENTS = [{ label: "Your account", href: "/account" }];

type Notification = {
  id: string;
  category: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const CAT_ICON: Record<string, React.ReactNode> = {
  message: <MessageSquare className="w-4 h-4 text-blue-600" />,
  consultation: <FileText className="w-4 h-4 text-emerald-600" />,
  order: <Package className="w-4 h-4 text-amber-600" />,
  system: <Sparkles className="w-4 h-4 text-purple-600" />,
};

export default function Notifications() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ notifications: Notification[]; unreadCount: number }>(
        `/api/notifications?limit=100${filter === "unread" ? "&unreadOnly=true" : ""}`,
        { auth: "patient" },
      );
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
      return;
    }
    load();
  }, [load, navigate]);

  async function handleMarkAllRead() {
    try {
      await apiFetch("/api/notifications/read-all", { method: "POST", auth: "patient" });
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Couldn't mark all as read.");
    }
  }

  async function open(n: Notification) {
    if (!n.read) {
      try {
        await apiFetch(`/api/notifications/${n.id}/read`, { method: "POST", auth: "patient" });
        setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        setUnread(u => Math.max(0, u - 1));
      } catch { /* ignore */ }
    }
    const href = normalizePatientDocumentLink(n.link) ?? n.link;
    if (href) navigate(href);
  }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="Notifications"
      intro={`Your in-app updates from EveryDayMeds. ${unread > 0 ? `${unread} unread.` : "You're all caught up."}`}
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="inline-flex rounded-full bg-white border border-border/40 p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === "all" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-notif-all"
          >All</button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
              filter === "unread" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-notif-unread"
          >
            Unread
            {unread > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                filter === "unread" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
              }`}>{unread}</span>
            )}
          </button>
        </div>
        {unread > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" className="rounded-full ml-auto" data-testid="button-mark-all-read">
            <CheckCheck className="w-4 h-4 mr-1.5" /> Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0,1,2].map(i => <div key={i} className="h-20 bg-white border border-border/40 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/40 p-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-secondary">No notifications {filter === "unread" ? "unread" : "yet"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            We'll let you know when your prescriber replies or your order ships.
          </p>
          <Button asChild className="rounded-full mt-4 bg-primary hover:bg-primary/90">
            <Link href="/account">Back to account</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(n => (
            <li
              key={n.id}
              onClick={() => open(n)}
              className={`bg-white rounded-2xl border p-4 md:p-5 cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm flex gap-3 ${
                n.read ? "border-border/40" : "border-primary/30 bg-primary/[0.02]"
              }`}
              data-testid={`notification-${n.id}`}
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {CAT_ICON[n.category] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-secondary">{n.title}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" aria-label="Unread" />}
            </li>
          ))}
        </ul>
      )}
    </AccountSubPage>
  );
}
