import { ArrowLeft, Bell, Loader2, Sprout, Heart, MessageCircle, User, Trophy, XCircle, Award, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, type NotificationWithActor } from "@/queries/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Json } from "@/lib/database.types";

type NotificationMetadata = {
  plant_id?: string;
  follower_id?: string;
  post_id?: string;
  comment_text?: string;
  proposal_title?: string;
  badge_name?: string;
  event_title?: string;
};

const iconMap: Record<string, React.ReactNode> = {
  care_reminder: <Sprout size={20} className="text-primary" />,
  like: <Heart size={20} className="text-destructive" />,
  comment: <MessageCircle size={20} className="text-primary" />,
  follow: <User size={20} className="text-primary" />,
  proposal_approved: <Trophy size={20} className="text-plant-warning" />,
  proposal_rejected: <XCircle size={20} className="text-destructive" />,
  challenge_reminder: <Calendar size={20} className="text-primary" />,
  event_reminder: <Calendar size={20} className="text-primary" />,
  badge: <Award size={20} className="text-primary" />,
};

function getNotificationIcon(type: string): React.ReactNode {
  return iconMap[type?.toLowerCase()] || <Bell size={20} className="text-muted-foreground" />;
}

function getNotificationLink(
  type: string,
  notification: NotificationWithActor
): string {
  const metadata = notification.metadata as NotificationMetadata | null;

  switch (type) {
    case "care_reminder":
      return metadata?.plant_id ? `/plant/${metadata.plant_id}` : "/";
    case "like":
    case "comment":
    case "proposal_approved":
    case "proposal_rejected":
    case "challenge_reminder":
    case "event_reminder":
      return "/community";
    case "follow":
      return metadata?.follower_id ? `/profile/${metadata.follower_id}` : "/profile";
    case "badge":
      return "/profile";
    default:
      return "/";
  }
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isYesterday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NotificationItemProps {
  notification: NotificationWithActor;
  onTap: (notification: NotificationWithActor) => void;
  isLoading: boolean;
}

function NotificationItem({ notification, onTap, isLoading }: NotificationItemProps) {
  const isUnread = !notification.read;

  return (
    <button
      onClick={() => onTap(notification)}
      disabled={isLoading}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
        isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/60"
      )}
    >
      {/* Icon */}
      <span className="shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", isUnread ? "font-semibold" : "font-normal")}>
          {notification.title || "Notification"}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatTime(notification.created_at!)}
        </p>
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
      )}
    </button>
  );
}

interface NotificationGroupProps {
  title: string;
  notifications: NotificationWithActor[];
  onNotificationTap: (notification: NotificationWithActor) => void;
  markReadLoading: boolean;
}

function NotificationGroup({ title, notifications, onNotificationTap, markReadLoading }: NotificationGroupProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1 mb-2">
        {title}
      </h3>
      <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {notifications.map((notification, index) => (
          <div key={notification.id}>
            <NotificationItem
              notification={notification}
              onTap={onNotificationTap}
              isLoading={markReadLoading}
            />
            {index < notifications.length - 1 && (
              <div className="h-px bg-border/50 mx-3" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Group notifications
  const todayNotifications = notifications.filter((n) =>
    isToday(n.created_at!)
  );
  const yesterdayNotifications = notifications.filter((n) =>
    isYesterday(n.created_at!)
  );
  const earlierNotifications = notifications.filter(
    (n) => !isToday(n.created_at!) && !isYesterday(n.created_at!)
  );

  const handleNotificationTap = async (notification: NotificationWithActor) => {
    // Mark as read if unread
    if (!notification.read) {
      await markRead.mutateAsync(notification.id);
    }
    // Navigate to the appropriate page
    const link = getNotificationLink(notification.type, notification);
    navigate(link);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  if (isLoading) {
    return (
      <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="px-4 space-y-4 mt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-4 w-24 mt-6" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-4 w-16 mt-6" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasNotifications = notifications.length > 0;

  return (
    <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center md:hidden"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              Notifications
            </h1>
          </div>
          {hasNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="text-xs font-medium"
            >
              {markAllRead.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Mark all as read"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!hasNotifications ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Bell size={48} className="text-muted-foreground" />
          <p className="text-base font-semibold mt-4 text-center">
            Nothing here yet
          </p>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Likes, comments, and reminders will show up here.
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-6 mt-4">
          <NotificationGroup
            title="Today"
            notifications={todayNotifications}
            onNotificationTap={handleNotificationTap}
            markReadLoading={markRead.isPending}
          />
          <NotificationGroup
            title="Yesterday"
            notifications={yesterdayNotifications}
            onNotificationTap={handleNotificationTap}
            markReadLoading={markRead.isPending}
          />
          <NotificationGroup
            title="Earlier"
            notifications={earlierNotifications}
            onNotificationTap={handleNotificationTap}
            markReadLoading={markRead.isPending}
          />
        </div>
      )}
    </div>
  );
}