import { Settings, Edit2, Video, Plus, MapPin, Award, Leaf, MessageCircle, Play, Moon, Sun as SunIcon, Monitor, Loader2, LogOut, MoreHorizontal, ImagePlus, Eye, EyeOff, Mail, Lock, Sprout, Trophy, Gem, Hand, Trash2 } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile, useUpdateProfile } from "@/queries/profile";
import { useFeedPosts, useSavedPosts, useLikedPosts } from "@/queries/posts";
import { useFollow, useUnfollow, useIsFollowing, useFollowerCount, useFollowingCount } from "@/queries/follows";
import { useBlockUser } from "@/queries/blocks";
import { useProfilePlants } from "@/queries/plants";
import { useSavedGuides } from "@/queries/plantLibrary";
import { useLiveStreams } from "@/queries/liveStreams";

import { useUpload } from "@/hooks/useUpload";
import { FollowersList } from "@/components/FollowersList";
import { ReportUserSheet } from "@/components/ReportUserSheet";
import PostCard from "@/components/PostCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

const INTEREST_OPTIONS = [
  "Succulents", "Cacti", "Indoor", "Tropicals", "Propagation", "Rare plants", "Herbs", "Bonsai"
];

const editSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  bio: z.string().max(300).optional(),
  location: z.string().max(50).optional(),
  hide_location: z.boolean().optional(),
  interests: z.array(z.string()).max(5).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  current_password: z.string().optional().or(z.literal("")),
  new_password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  confirm_password: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.new_password && data.new_password !== data.confirm_password) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirm_password"],
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
  const [savedSubTab, setSavedSubTab] = useState<"posts" | "plants" | "guides">("posts");
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [followersListOpen, setFollowersListOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const updateProfile = useUpdateProfile();
  const blockUser = useBlockUser();
  const { user: currentUser } = useAuth();
  const follow = useFollow();
  const unfollow = useUnfollow();
  const { data: isFollowing } = useIsFollowing(profile?.id);
  const { uploadFile, uploading } = useUpload();

  // Parse interests from profile metadata
  const profileInterests = useMemo(() => {
    const meta = profile?.metadata as Record<string, unknown> | null;
    if (!meta) return [];
    const interests = meta.interests;
    if (Array.isArray(interests)) return interests as string[];
    return [];
  }, [profile]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: {
      display_name: profile?.display_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      hide_location: false,
      interests: profileInterests,
      email: currentUser?.email || "",
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const watchedInterests = watch("interests") || [];

  const onEditSubmit = async (data: EditForm) => {
    // Update profile fields
    await updateProfile.mutateAsync({
      display_name: data.display_name,
      username: data.username,
      bio: data.bio || null,
      location: data.location || null,
      metadata: {
        interests: data.interests || [],
        hide_location: data.hide_location || false,
      },
    });

    // Update email if changed
    if (data.email && data.email !== currentUser?.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: data.email });
      if (emailError) {
        toast.error(emailError.message || "Failed to update email");
        return;
      }
      toast.success("Email updated. Please check your inbox to confirm the new email.");
    }

    // Update password if provided
    if (data.new_password && data.current_password) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: data.new_password });
      if (passwordError) {
        toast.error(passwordError.message || "Failed to update password");
        return;
      }
      toast.success("Password updated successfully");
    }

    setEditOpen(false);
  };

  const handleDeleteAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Not authenticated");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to delete account" }));
        toast.error(err.error || "Failed to delete account");
        return;
      }
      await supabase.auth.signOut();
      navigate("/login");
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file, { bucket: "avatars" });
      setValue("avatar_url", url);
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const handleBlock = () => {
    if (!profile) return;
    if (confirm(`Block @${profile.username}? They won't be able to see your profile or posts.`)) {
      blockUser.mutate(profile.id, {
        onSuccess: () => {
          toast.success(`Blocked @${profile.username}`);
          setBlockMenuOpen(false);
          navigate("/");
        },
      });
    }
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
  // Posts tab
  const { data: postsData, isLoading: postsLoading } = useFeedPosts(false);
  const profilePosts = useMemo(() => {
    if (!postsData) return [];
    const allPosts = postsData.pages.flat();
    return profile ? allPosts.filter((p) => p.author_id === profile.id) : allPosts;
  }, [postsData, profile]);
  const postsCount = profilePosts.length;

  const { data: savedPosts = [], isLoading: savedLoading } = useSavedPosts();
  const { data: savedGuides = [], isLoading: guidesLoading } = useSavedGuides();

  // Collection tab for other profiles
  const { data: profilePlants = [], isLoading: plantsLoading } = useProfilePlants(profile?.id);

  const editFormContent = (
    <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 py-4">
      {/* Avatar upload */}
      <div className="space-y-2">
        <Label>Avatar</Label>
        <div className="flex items-center gap-3">
          <img
            src={profile?.avatar_url || AVATAR}
            alt="Avatar preview"
            className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
          />
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors text-sm font-medium">
            <ImagePlus size={16} />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
          {uploading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input id="display_name" {...register("display_name")} placeholder="Your display name" />
        {errors.display_name && (
          <p className="text-xs text-destructive">{errors.display_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          {...register("username")}
          placeholder="your_username"
        />
        {errors.username && (
          <p className="text-xs text-destructive">{errors.username.message}</p>
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

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" {...register("email")} placeholder="your@email.com" className="pl-9" />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input id="location" {...register("location")} placeholder="City, Country" className="pl-9" />
        </div>
        {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
      </div>

      {/* Hide location checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hide_location"
          {...register("hide_location")}
          className="rounded border-input w-4 h-4"
        />
        <Label htmlFor="hide_location" className="text-sm font-normal cursor-pointer">
          Hide location on profile
        </Label>
      </div>

      {/* Interests pill selector */}
      <div className="space-y-2">
        <Label>Interests <span className="text-muted-foreground">(max 5)</span></Label>
        <Controller
          name="interests"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = field.value?.includes(interest) ?? false;
                const disabled = !selected && (field.value?.length ?? 0) >= 5;
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        field.onChange(field.value.filter((i) => i !== interest));
                      } else if ((field.value?.length ?? 0) < 5) {
                        field.onChange([...(field.value || []), interest]);
                      }
                    }}
                    disabled={disabled && !selected}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selected
                        ? "gradient-leaf text-primary-foreground"
                        : disabled
                        ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Password change section */}
      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Lock size={16} />
          Change Password
        </p>
        <p className="text-xs text-muted-foreground">
          Leave blank to keep your current password.
        </p>
        <div className="space-y-2">
          <Label htmlFor="current_password">Current Password</Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showCurrentPassword ? "text" : "password"}
              {...register("current_password")}
              placeholder="Current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <div className="relative">
            <Input
              id="new_password"
              type={showNewPassword ? "text" : "password"}
              {...register("new_password")}
              placeholder="New password (min 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.new_password && (
            <p className="text-xs text-destructive">{errors.new_password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <Input
            id="confirm_password"
            type="password"
            {...register("confirm_password")}
            placeholder="Confirm new password"
          />
          {errors.confirm_password && (
            <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>
      </div>

      {/* Delete Account section */}
      <div className="space-y-3 pt-4 border-t border-destructive/20">
        <p className="text-sm font-semibold flex items-center gap-2 text-destructive">
          <Trash2 size={16} />
          Danger Zone
        </p>
        <p className="text-xs text-muted-foreground">
          Once you delete your account, there is no going back. All your data, posts, and plants will be permanently removed.
        </p>
        <button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setEditOpen(false)}
          disabled={isSubmitting || updateProfile.isPending}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="gradient-leaf text-primary-foreground hover:opacity-90 flex-1"
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
      </div>
    </form>
  );

  return (
    <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
      {/* Followers List Modal */}
      <FollowersList
        userId={profile?.id || ""}
        open={followersListOpen}
        onOpenChange={setFollowersListOpen}
      />

      {/* Report Sheet */}
      <ReportUserSheet
        userId={profile?.id || ""}
        userName={displayName}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between px-4 pt-4">
          <h1 className="text-lg font-bold">Profile</h1>
          <div className="flex gap-2">
            {/* Report/Block menu for other profiles */}
            {!isOwnProfile && profile?.id && (
              <Popover open={blockMenuOpen} onOpenChange={setBlockMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="w-9 h-9 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-2">
                  <button
                    onClick={() => {
                      setBlockMenuOpen(false);
                      setReportOpen(true);
                    }}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-destructive"
                  >
                    Report User
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={blockUser.isPending}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-destructive"
                  >
                    {blockUser.isPending ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : null}
                    Block User
                  </button>
                </PopoverContent>
              </Popover>
            )}

            {isOwnProfile && (
              <button
                onClick={() => {
                  reset({
                    display_name: profile?.display_name || "",
                    username: profile?.username || "",
                    bio: profile?.bio || "",
                    location: profile?.location || "",
                    hide_location: false,
                    interests: profileInterests,
                  });
                  setEditOpen(true);
                }}
                className="w-9 h-9 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                aria-label="Edit Profile"
              >
                <Edit2 size={18} />
              </button>
            )}

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

        {/* Profile info - Desktop: horizontal layout */}
        {profileLoading ? (
          <div className="flex flex-col items-center gap-4 pt-4 pb-6 px-4">
            <Skeleton className="w-24 h-24 rounded-full mx-auto" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full max-w-[250px]" />
              <div className="flex gap-6 mt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center space-y-1">
                    <Skeleton className="h-5 w-8" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-4 pb-6 px-4">
            {/* Avatar */}
            <div className="relative mx-auto shrink-0">
              <img src={avatar} alt={displayName} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/30" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 gradient-leaf rounded-full flex items-center justify-center border-2 border-background">
                <Leaf size={14} className="text-primary-foreground" />
              </div>
            </div>

            {/* Info + Stats */}
            <div className="flex flex-col items-center md:items-center">
              <h2 className="text-lg font-bold mt-0 md:mt-2">{displayName}</h2>
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
              {profileInterests.length > 0 && (
                <p className="text-xs text-center mt-1 text-muted-foreground flex items-center gap-1">
                  <Sprout size={14} className="inline text-primary" /> {profileInterests.join(", ")}
                </p>
              )}

              {/* Stats row */}
              <div className="flex gap-6 mt-4">
                {[
                  { value: formatCount(postsCount), label: "Posts" },
                  { value: formatCount(plantsCount), label: "Plants" },
                  { value: formatCount(followersCount), label: "Followers", onClick: () => setFollowersListOpen(true) },
                  { value: formatCount(followingCount), label: "Following", onClick: () => setFollowersListOpen(true) },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`text-center ${s.onClick ? "cursor-pointer hover:opacity-80" : ""}`}
                    onClick={s.onClick}
                  >
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile tabs */}
      <div className="px-4">
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
          {isOwnProfile ? (
            <>
              {[
                { id: "posts", label: "Posts", icon: MessageCircle },
                { id: "saved", label: "Saved", icon: Leaf },
                { id: "badges", label: "Badges", icon: Award },
              ].map(({ id, label, icon: Icon }) => (
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
            </>
          ) : (
            <>
              {[
                { id: "posts", label: "Posts", icon: MessageCircle },
                { id: "collection", label: "Collection", icon: Leaf },
                { id: "badges", label: "Badges", icon: Award },
              ].map(({ id, label, icon: Icon }) => (
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
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "posts" && (
        <div className="px-4 space-y-3">
          {postsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden">
                <Skeleton className="w-full h-64" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex items-center gap-2 pt-1">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))
          ) : profilePosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No posts yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {profilePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && isOwnProfile && (
        <div className="px-4 space-y-3">
          {/* Saved tab with Posts/Care Guides toggle */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "posts", label: "Posts" },
              { id: "plants", label: "Plants" },
              { id: "guides", label: "Care Guides" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSavedSubTab(id as "posts" | "plants" | "guides")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  savedSubTab === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {savedSubTab === "posts" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {savedLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden">
                    <Skeleton className="w-full h-64" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))
              ) : savedPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No saved posts yet.
                </div>
              ) : (
                savedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}

          {savedSubTab === "plants" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {guidesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <div className="p-2.5 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : savedGuides.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                  No saved plants yet.
                </div>
              ) : (
                savedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-card rounded-2xl shadow-card overflow-hidden cursor-pointer hover:shadow-elevated transition-all hover:scale-[1.02]"
                    onClick={() => guide.plant_library && navigate(`/care-guide/${guide.plant_library.id}`)}
                  >
                    <div className="relative aspect-square">
                      {guide.plant_library?.image_url ? (
                        <img
                          src={guide.plant_library.image_url}
                          alt={guide.plant_library.common_name || guide.plant_library.species_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Leaf size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-bold truncate">
                        {guide.plant_library?.common_name || guide.plant_library?.species_name || "Unknown Plant"}
                      </p>
                      {guide.plant_library?.species_name && guide.plant_library?.common_name && (
                        <p className="text-xs text-muted-foreground truncate italic">
                          {guide.plant_library.species_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {savedSubTab === "guides" && (
            <div className="space-y-2">
              {guidesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-4 flex gap-3">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : savedGuides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No saved care guides yet.
                </div>
              ) : (
                savedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-card rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => guide.plant_library && navigate(`/care-guide/${guide.plant_library.id}`)}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      {guide.plant_library?.image_url ? (
                        <img
                          src={guide.plant_library.image_url}
                          alt={guide.plant_library.common_name || guide.plant_library.species_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Leaf size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {guide.plant_library?.common_name || guide.plant_library?.species_name || "Unknown Plant"}
                      </p>
                      {guide.plant_library?.species_name && (
                        <p className="text-xs text-muted-foreground italic">
                          {guide.plant_library.species_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "collection" && !isOwnProfile && (
        <div className="px-4 space-y-2">
          {plantsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 flex gap-3">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : profilePlants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No plants in collection yet.
            </div>
          ) : (
            profilePlants.map((plant) => (
              <div
                key={plant.id}
                className="bg-card rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/plant/${plant.id}`)}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                  {plant.image_url ? (
                    <img src={plant.image_url} alt={plant.nickname || "Plant"} className="w-full h-full object-cover" />
                  ) : (
                    <Leaf size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {plant.nickname || plant.species_name || "My Plant"}
                  </p>
                  {plant.species_name && (
                    <p className="text-xs text-muted-foreground italic">{plant.species_name}</p>
                  )}
                  {plant.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />
                      {plant.location}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "badges" && (
        <div className="px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: "Master Propagator", icon: Sprout, desc: "Share 50+ propagation posts" },
              { name: "Plant Parent 100", icon: Trophy, desc: "Reach 100 followers" },
              { name: "Rare Collector", icon: Gem, desc: "Add 10 rare plants" },
              { name: "Helpful Hand", icon: Hand, desc: "Help 25 other plant parents" },
            ].map((badge) => (
              <div key={badge.name} className="bg-card rounded-xl p-4 flex flex-col items-center text-center gap-2 shadow-card border border-border">
                <badge.icon size={32} className="text-primary" />
                <p className="text-sm font-semibold">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Dialog / Sheet */}
      {isMobile ? (
        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>
                Update your profile information. Click save when you&apos;re done.
              </SheetDescription>
            </SheetHeader>
            {editFormContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            {editFormContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data, posts, and plants will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}