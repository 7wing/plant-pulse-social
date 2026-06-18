import { Bell, Loader2, Sprout, Heart, MessageCircle, User, Trophy, XCircle, Calendar, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUnreadNotificationCount, useNotifications, useMarkNotificationRead, type NotificationWithActor } from "@/queries/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  care_reminder: <Sprout size={16} className="text-primary" />,
  like: <Heart size={16} className="text-destructive" />,
  comment: <MessageCircle size={16} className="text-primary" />,
  follow: <User size={16} className="text-primary" />,
  proposal_approved: <Trophy size={16} className="text-plant-warning" />,
  proposal_rejected: <XCircle size={16} className="text-destructive" />,
  challenge_reminder: <Calendar size={16} className="text-primary" />,
  event_reminder: <Calendar size={16} className="text-primary" />,
  badge: <Award size={16} className="text-primary" />,
};

function getNotificationIcon(type: string): React.ReactNode {
  return iconMap[type?.toLowerCase()] || <Bell size={16} className="text-muted-foreground" />;
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
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NotificationDropdownItemProps {
  notification: NotificationWithActor;
  onTap: (notification: NotificationWithActor) => void;
  isLoading: boolean;
}

function NotificationDropdownItem({ notification, onTap, isLoading }: NotificationDropdownItemProps) {
  const isUnread = !notification.read;

  return (
    <button
      onClick={() => onTap(notification)}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors",
        isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/60"
      )}
    >
      <span className="shrink-0">
        {getNotificationIcon(notification.type)}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", isUnread ? "font-semibold" : "font-normal")}>
          {notification.title || "Notification"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTime(notification.created_at!)}
        </p>
      </div>
      {isUnread && (
        <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
      )}
    </button>
  );
}

interface NotificationGroupDropdownProps {
  title: string;
  notifications: NotificationWithActor[];
  onNotificationTap: (notification: NotificationWithActor) => void;
  markReadLoading: boolean;
}

function NotificationGroupDropdown({ title, notifications, onNotificationTap, markReadLoading }: NotificationGroupDropdownProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
        {title}
      </h4>
      {notifications.map((notification) => (
        <NotificationDropdownItem
          key={notification.id}
          notification={notification}
          onTap={onNotificationTap}
          isLoading={markReadLoading}
        />
      ))}
    </div>
  );
}

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: unreadCount = 0, isLoading: countLoading } = useUnreadNotificationCount();
  const { data: notifications = [], isLoading: notificationsLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const handleBellClick = () => {
    navigate("/notifications");
  };

  const handleNotificationTap = async (notification: NotificationWithActor) => {
    if (!notification.read) {
      await markRead.mutateAsync(notification.id);
    }

    const metadata = notification.metadata as NotificationMetadata | null;
    let link = "/community";

    switch (notification.type) {
      case "care_reminder":
        link = metadata?.plant_id ? `/plant/${metadata.plant_id}` : "/";
        break;
      case "like":
      case "comment":
      case "proposal_approved":
      case "proposal_rejected":
      case "challenge_reminder":
      case "event_reminder":
        link = "/community";
        break;
      case "follow":
        link = metadata?.follower_id ? `/profile/${metadata.follower_id}` : "/profile";
        break;
      case "badge":
        link = "/profile";
        break;
    }

    navigate(link);
  };

  // Mobile: simple bell button that navigates
  if (isMobile) {
    return (
      <button
        onClick={handleBellClick}
        className={cn(
          "w-10 h-10 rounded-full bg-muted flex items-center justify-center relative",
          className
        )}
        aria-label="Notifications"
        data-testid="notification-bell"
      >
        <Bell size={20} className="text-foreground" />
        {!countLoading && unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
        )}
      </button>
    );
  }

  // Desktop: bell with dropdown
  const todayNotifications = notifications.filter((n) => isToday(n.created_at!)).slice(0, 3);
  const yesterdayNotifications = notifications.filter((n) => isYesterday(n.created_at!)).slice(0, 2);
  const earlierNotifications = notifications
    .filter((n) => !isToday(n.created_at!) && !isYesterday(n.created_at!))
    .slice(0, 2);
  const recentNotifications = [...todayNotifications, ...yesterdayNotifications, ...earlierNotifications].slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center relative hover:bg-muted transition-colors",
            className
          )}
          aria-label="Notifications"
          data-testid="notification-bell"
        >
          <Bell size={20} className="text-foreground" />
          {!countLoading && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3 max-h-[400px] overflow-y-auto">
        {notificationsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6">
            <Bell size={32} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <NotificationGroupDropdown
                title="Today"
                notifications={todayNotifications}
                onNotificationTap={handleNotificationTap}
                markReadLoading={markRead.isPending}
              />
              <NotificationGroupDropdown
                title="Yesterday"
                notifications={yesterdayNotifications}
                onNotificationTap={handleNotificationTap}
                markReadLoading={markRead.isPending}
              />
              <NotificationGroupDropdown
                title="Earlier"
                notifications={earlierNotifications}
                onNotificationTap={handleNotificationTap}
                markReadLoading={markRead.isPending}
              />
            </div>
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                className="w-full text-sm font-medium"
                onClick={() => navigate("/notifications")}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}