import { Settings, Edit2, Video, Plus, MapPin, Award, Leaf, MessageCircle, Users, Play, Moon, Sun as SunIcon, Monitor, Loader2, LogOut } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/queries/profile";
import { useFeedPosts, useSavedPosts, useLikedPosts } from "@/queries/posts";
import { useFollow, useUnfollow, useIsFollowing, useFollowerCount, useFollowingCount, useFollows } from "@/queries/follows";
import { useLiveStreams } from "@/queries/liveStreams";
import { useCreateConversation } from "@/queries/conversations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

const profileTabs = [
  { id: "posts", label: "Posts", icon: MessageCircle },
  { id: "connections", label: "Friends", icon: Users },
  { id: "lives", label: "Lives", icon: Play },
];

const defaultBadges = [
  { name: "Master Propagator", emoji: "🌱" },
  { name: "Plant Parent 100", emoji: "🏆" },
  { name: "Live Streamer", emoji: "📹" },
  { name: "Rare Collector", emoji: "💎" },
  { name: "Helpful Hand", emoji: "🤝" },
];

const editSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(50),
  bio: z.string().max(300).optional(),
  location: z.string().max(50).optional(),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type EditForm = z.infer<typeof editSchema>;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isOwnProfile = !id;

  const [activeTab, setActiveTab] = useState("posts");
  const [postsSubTab, setPostsSubTab] = useState("created");
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const updateProfile = useUpdateProfile();
  const { user: currentUser } = useAuth();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const createConversation = useCreateConversation();
  const { data: isFollowing } = useIsFollowing(profile?.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: {
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      avatar_url: profile?.avatar_url || "",
    },
  });

  const onEditSubmit = async (data: EditForm) => {
    await updateProfile.mutateAsync({
      display_name: data.display_name,
      bio: data.bio || null,
      location: data.location || null,
      avatar_url: data.avatar_url || null,
    });
    setEditOpen(false);
  };

  const displayName = profile?.display_name || profile?.username || "Plant Lover";
  const handle = profile?.username ? `@${profile.username}` : "";
  const bio = profile?.bio || "";
  const location = profile?.location || "";
  const avatar = profile?.avatar_url || AVATAR;
  const plantsCount = profile?.plants_count ?? 0;
  const { data: followersCount = 0 } = useFollowerCount(profile?.id);
  const { data: followingCount = 0 } = useFollowingCount(profile?.id);

  // Posts tab — real data from useFeedPosts, filtered to profile owner
  const { data: postsData, isLoading: postsLoading } = useFeedPosts(false);
  const profilePosts = useMemo(() => {
    if (!postsData) return [];
    const allPosts = postsData.pages.flat();
    return profile ? allPosts.filter((p) => p.author_id === profile.id) : allPosts;
  }, [postsData, profile]);

  const { data: savedPosts = [], isLoading: savedLoading } = useSavedPosts();
  const { data: likedPosts = [], isLoading: likedLoading } = useLikedPosts();

  // Connections tab — real data from useFollows
  const { data: followingIds = new Set<string>() } = useFollows();
  const followingIdsArr = useMemo(() => Array.from(followingIds), [followingIds]);

  // Lives tab — real data from useLiveStreams
  const { data: liveStreams = [], isLoading: streamsLoading } = useLiveStreams();

  return (
    <div className="pb-20 md:pb-4 min-h-screen">
      {/* Header */}
      <div className="relative gradient-hero">
        <div className="flex items-center justify-between px-4 pt-4">
          <h1 className="text-lg font-bold">Profile</h1>
          <div className="flex gap-2">
            {isOwnProfile && (
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <button
                  className="w-9 h-9 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                  aria-label="Settings"
                >
                  <Settings size={18} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-4">
                <p className="text-xs font-bold text-muted-foreground mb-2">Appearance</p>
                <div className="flex gap-1 bg-muted rounded-xl p-1">
                  {([
                    { value: "light" as const, icon: SunIcon, label: "Light" },
                    { value: "dark" as const, icon: Moon, label: "Dark" },
                    { value: "system" as const, icon: Monitor, label: "Auto" },
                  ]).map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        theme === value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/login");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="flex flex-col items-center pt-4 pb-6 px-4">
          {profileLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-full max-w-[250px]" />
              <div className="flex gap-6 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center space-y-1">
                    <Skeleton className="h-5 w-8" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <img src={avatar} alt={displayName} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/30" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 gradient-leaf rounded-full flex items-center justify-center border-2 border-background">
                  <Leaf size={14} className="text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-lg font-bold mt-3">{displayName}</h2>
              {handle && <p className="text-sm text-muted-foreground">{handle}</p>}
              {location && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{location}</span>
                </div>
              )}
              {bio && (
                <p className="text-sm text-center mt-2 text-muted-foreground max-w-[250px] md:max-w-md">
                  {bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                {[
                  { value: formatCount(plantsCount), label: "Plants" },
                  { value: formatCount(followersCount), label: "Followers" },
                  { value: formatCount(followingCount), label: "Following" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4 w-full max-w-[300px] md:max-w-none">
                {/* Follow/Unfollow + Message — only shown when viewing another user's profile */}
                {profile?.id && profile?.id !== currentUser?.id && (
                  <>
                    <button
                      onClick={() =>
                        isFollowing
                          ? unfollow.mutate(profile!.id)
                          : follow.mutate(profile!.id)
                      }
                      disabled={follow.isPending || unfollow.isPending}
                      className={`group flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isFollowing
                          ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "gradient-leaf text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {(follow.isPending || unfollow.isPending) && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      {isFollowing ? (
                        <span className="group-hover:hidden">Following</span>
                      ) : (
                        <span>Follow</span>
                      )}
                      {isFollowing && (
                        <span className="hidden group-hover:inline">Unfollow</span>
                      )}
                    </button>
                    <button
                      onClick={async () => {
                        const convId = await createConversation.mutateAsync(profile!.id);
                        navigate(`/chat/${convId}`);
                      }}
                      disabled={createConversation.isPending}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {createConversation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <MessageCircle size={16} />
                      )}
                      Message
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      reset({
                        display_name: profile?.display_name || "",
                        bio: profile?.bio || "",
                        location: profile?.location || "",
                        avatar_url: profile?.avatar_url || "",
                      });
                      setEditOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    <Edit2 size={14} />
                    Edit Profile
                  </button>
                )}
                {isOwnProfile && (
                  <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold">
                    <Video size={14} />
                    Go Live
                  </button>
                )}
                {isOwnProfile && (
                  <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center" aria-label="Add plant">
                    <Plus size={18} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Award size={14} className="text-primary" />
          <span className="text-xs font-bold">Badges Earned</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {defaultBadges.map((b) => (
            <div key={b.name} className="flex items-center gap-1.5 bg-card rounded-full px-3 py-1.5 shadow-card min-w-fit border border-border">
              <span className="text-sm">{b.emoji}</span>
              <span className="text-xs font-medium whitespace-nowrap">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Profile tabs */}
      <div className="px-4">
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
          {profileTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === id ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "posts" && (
        <div className="px-4 space-y-3">
          {/* Posts sub-tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "created", label: isOwnProfile ? "Created by You" : "Posts" },
              ...(isOwnProfile ? [{ id: "saved", label: "Saved" }, { id: "liked", label: "Liked" }] : []),
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPostsSubTab(id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  postsSubTab === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {postsSubTab === "created" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {postsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))
              ) : profilePosts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                  No posts yet. Share your first plant update!
                </div>
              ) : (
                profilePosts.map((post) => (
                  <div key={post.id} className="aspect-square rounded-lg overflow-hidden relative">
                    <img
                      src={post.image_url || AVATAR}
                      alt={post.content || "Post"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-foreground/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <MessageCircle size={10} className="text-primary-foreground" />
                      <span className="text-[10px] text-primary-foreground font-medium">
                        {post.comments_count ?? 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {postsSubTab === "saved" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {savedLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))
              ) : savedPosts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                  No saved posts yet. Bookmark posts you love!
                </div>
              ) : (
                savedPosts.map((post) => (
                  <div key={post.id} className="aspect-square rounded-lg overflow-hidden relative">
                    <img
                      src={post.image_url || AVATAR}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-foreground/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <MessageCircle size={10} className="text-primary-foreground" />
                      <span className="text-[10px] text-primary-foreground font-medium">
                        {post.comments_count ?? 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {postsSubTab === "liked" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {likedLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))
              ) : likedPosts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                  No liked posts yet. Heart posts you enjoy!
                </div>
              ) : (
                likedPosts.map((post) => (
                  <div key={post.id} className="aspect-square rounded-lg overflow-hidden relative">
                    <img
                      src={post.image_url || AVATAR}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-foreground/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <MessageCircle size={10} className="text-primary-foreground" />
                      <span className="text-[10px] text-primary-foreground font-medium">
                        {post.comments_count ?? 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "connections" && (
        <FollowingList followingIds={followingIdsArr} />
      )}

      {activeTab === "lives" && (
        <div className="px-4 space-y-3">
          {streamsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden flex">
                <Skeleton className="w-28 h-20" />
                <div className="flex-1 p-2.5 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : liveStreams.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No live streams right now.
            </div>
          ) : (
            liveStreams.map((stream) => (
              <div key={stream.id} className="bg-card rounded-2xl shadow-card overflow-hidden flex">
                <div className="relative w-28 h-20">
                  <img
                    src={stream.thumbnail_url || AVATAR}
                    alt={stream.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <Play size={20} className="text-primary-foreground" fill="white" />
                  </div>
                </div>
                <div className="flex-1 p-2.5 flex flex-col justify-center">
                  <p className="text-sm font-bold truncate">{stream.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(stream.viewer_count ?? 0)} watching
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input id="display_name" {...register("display_name")} placeholder="Your display name" />
              {errors.display_name && (
                <p className="text-xs text-destructive">{errors.display_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Tell us about your plant journey..."
                rows={3}
              />
              {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} placeholder="City, Country" />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input id="avatar_url" {...register("avatar_url")} placeholder="https://..." />
              {errors.avatar_url && <p className="text-xs text-destructive">{errors.avatar_url.message}</p>}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isSubmitting || updateProfile.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gradient-leaf text-primary-foreground hover:opacity-90"
                disabled={isSubmitting || updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component to fetch and display followed user profiles
function FollowingList({ followingIds }: { followingIds: string[] }) {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["followedProfiles", followingIds],
    queryFn: async () => {
      if (followingIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", followingIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: followingIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!profileData || profileData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm px-4">
        Not following anyone yet. Discover plant lovers to follow!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4">
      {profileData.map((user) => (
        <div key={user.id} className="flex flex-col items-center gap-1.5">
          <img
            src={user.avatar_url || AVATAR}
            alt={user.display_name || user.username || "User"}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20"
          />
          <span className="text-xs font-medium truncate max-w-[56px]">
            {user.display_name || user.username}
          </span>
        </div>
      ))}
    </div>
  );
}