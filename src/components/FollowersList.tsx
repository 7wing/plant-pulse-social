import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFollow, useUnfollow, useIsFollowing, useFollowerList, useFollowingList, ProfileSummary } from "@/queries/follows";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

interface FollowersListProps {
  userId: string;
  initialTab?: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowersList({ userId, initialTab = "followers", open, onOpenChange }: FollowersListProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data: followers = [], isLoading: followersLoading } = useFollowerList(userId);
  const { data: following = [], isLoading: followingLoading } = useFollowingList(userId);

  const follow = useFollow();
  const unfollow = useUnfollow();

  const list = activeTab === "followers" ? followers : following;
  const isLoading = activeTab === "followers" ? followersLoading : followingLoading;

  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const searchLower = search.toLowerCase();
    return list.filter(
      (item) =>
        item.username.toLowerCase().includes(searchLower) ||
        (item.display_name?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [list, search]);

  const handleFollowClick = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      await unfollow.mutateAsync(targetUserId);
    } else {
      await follow.mutateAsync(targetUserId);
    }
  };

  if (!open) return null;

  const listContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="w-8" />

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab("followers")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "followers"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "following"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            Following
          </button>
        </div>

        <div className="w-8" />
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {search ? "No results found" : activeTab === "followers" ? "No followers yet" : "Not following anyone"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredList.map((item) => (
              <UserListItem
                key={item.id}
                user={item}
                isCurrentUser={item.id === currentUser?.id}
                onFollowClick={() => handleFollowClick(item.id, false)}
                onUnfollowClick={() => handleFollowClick(item.id, true)}
                isFollowing={false}
                onViewProfile={() => {
                  if (item.id !== currentUser?.id) {
                    onOpenChange(false);
                    navigate(`/profile/${item.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80dvh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Followers</SheetTitle>
          </SheetHeader>
          {listContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-center">
            <DialogTitle>Followers</DialogTitle>
          </div>
        </DialogHeader>
        {listContent}
      </DialogContent>
    </Dialog>
  );
}

interface UserListItemProps {
  user: ProfileSummary;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollowClick: () => void;
  onUnfollowClick: () => void;
  onViewProfile: () => void;
}

function UserListItem({ user, isCurrentUser, onFollowClick, onViewProfile }: UserListItemProps) {
  const { data: isFollowing } = useIsFollowing(user.id);
  const follow = useFollow();
  const unfollow = useUnfollow();

  const handleClick = () => {
    if (!isCurrentUser) {
      onViewProfile();
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing) {
      await unfollow.mutateAsync(user.id);
    } else {
      await follow.mutateAsync(user.id);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer ${
        isCurrentUser ? "cursor-default" : ""
      }`}
      onClick={handleClick}
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.avatar_url || AVATAR} />
        <AvatarFallback>
          {(user.display_name || user.username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {user.display_name || user.username}
        </p>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
      </div>

      {!isCurrentUser && (
        <Button
          size="sm"
          variant={isFollowing ? "outline" : "default"}
          onClick={handleFollowToggle}
          disabled={follow.isPending || unfollow.isPending}
          className={isFollowing ? "" : "gradient-leaf text-primary-foreground"}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}