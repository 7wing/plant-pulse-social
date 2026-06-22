import { User, Lock, Bell, LogOut, Trash2, MapPin, ImagePlus, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/queries/profile";
import { useUpload } from "@/hooks/useUpload";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

type SettingsSection = "account" | "privacy" | "notifications" | "account-actions";

const AVATAR_FALLBACK = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Editable form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showLocation, setShowLocation] = useState(true);
  const [careReminders, setCareReminders] = useState(true);
  const [socialNotifications, setSocialNotifications] = useState(true);
  const [challengeNotifications, setChallengeNotifications] = useState(true);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { uploadFile, uploading } = useUpload();

  // Populate form when profile loads
  useMemo(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      const meta = profile.metadata as Record<string, unknown> | null;
      // interests removed from settings per spec — managed in Edit Profile only
      setShowLocation(!((meta?.hide_location as boolean) ?? false));
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file, { bucket: "avatars" });
      setAvatarUrl(url);
      await updateProfile.mutateAsync({ avatar_url: url });
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const handleToggle = async (field: "show_location" | "care_reminders" | "social_notifications" | "challenge_notifications", value: boolean) => {
    switch (field) {
      case "show_location":
        setShowLocation(value);
        await updateProfile.mutateAsync({
          metadata: { ...(profile?.metadata as Record<string, unknown> || {}), hide_location: !value },
        });
        break;
      case "care_reminders":
        setCareReminders(value);
        // Persist to metadata or a dedicated setting — persist alongside profile metadata
        await updateProfile.mutateAsync({
          metadata: { ...(profile?.metadata as Record<string, unknown> || {}), care_reminders: value },
        });
        break;
      case "social_notifications":
        setSocialNotifications(value);
        await updateProfile.mutateAsync({
          metadata: { ...(profile?.metadata as Record<string, unknown> || {}), social_notifications: value },
        });
        break;
      case "challenge_notifications":
        setChallengeNotifications(value);
        await updateProfile.mutateAsync({
          metadata: { ...(profile?.metadata as Record<string, unknown> || {}), challenge_notifications: value },
        });
        break;
    }
    toast.success("Setting saved");
  };

  const handleSaveAccount = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        username,
        bio: bio || null,
        location: location || null,
        avatar_url: avatarUrl || null,
        metadata: {
          ...(profile?.metadata as Record<string, unknown> || {}),
          hide_location: !showLocation,
        },
      });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.auth.admin.deleteUser(profile!.id);
    if (error) {
      toast.error("Failed to delete account");
      return;
    }
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Account deleted");
  };

  const navItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account-actions", label: "Account actions", icon: LogOut },
  ];

  return (
    <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
      <div className="px-4 pt-4 mb-4">
        <h1 className="text-lg font-bold">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row md:gap-6 md:px-4">
        {/* Sidebar nav — desktop only */}
        <nav className="hidden md:flex flex-col w-48 shrink-0 gap-1 sticky top-24 self-start">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile section tabs */}
          <div className="flex gap-1 px-4 md:hidden mb-4 overflow-x-auto scrollbar-hide">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSection === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Account section */}
          {(activeSection === "account") && (
            <div className="px-4 md:px-0 space-y-6">
              <section className="bg-card rounded-2xl p-4 shadow-card border border-border space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <User size={16} className="text-primary" /> Account
                </h2>

                {profileLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <>
                    {/* Avatar */}
                    <div className="space-y-2">
                      <Label>Avatar</Label>
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarUrl || AVATAR_FALLBACK}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
                        />
                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors text-sm font-medium">
                          {uploading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <ImagePlus size={16} />
                          )}
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your_username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about your plant journey..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>

                    <Button
                      onClick={handleSaveAccount}
                      disabled={updateProfile.isPending}
                      className="w-full gradient-leaf text-primary-foreground hover:opacity-90"
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
                  </>
                )}
              </section>
            </div>
          )}

          {/* Privacy section */}
          {activeSection === "privacy" && (
            <div className="px-4 md:px-0 space-y-4">
              <section className="bg-card rounded-2xl p-4 shadow-card border border-border space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Lock size={16} className="text-primary" /> Privacy
                </h2>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Show location on profile</p>
                    <p className="text-xs text-muted-foreground">Display your location on your public profile</p>
                  </div>
                  <Switch
                    checked={showLocation}
                    onCheckedChange={(val) => handleToggle("show_location", val)}
                  />
                </div>
              </section>
            </div>
          )}

          {/* Notifications section */}
          {activeSection === "notifications" && (
            <div className="px-4 md:px-0 space-y-4">
              <section className="bg-card rounded-2xl p-4 shadow-card border border-border space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Bell size={16} className="text-primary" /> Notifications
                </h2>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Care reminders</p>
                    <p className="text-xs text-muted-foreground">Get notified when it's time to water or fertilize</p>
                  </div>
                  <Switch
                    checked={careReminders}
                    onCheckedChange={(val) => handleToggle("care_reminders", val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Social</p>
                    <p className="text-xs text-muted-foreground">Follows, likes, comments, and mentions</p>
                  </div>
                  <Switch
                    checked={socialNotifications}
                    onCheckedChange={(val) => handleToggle("social_notifications", val)}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Challenges</p>
                    <p className="text-xs text-muted-foreground">Updates on community challenges and leaderboards</p>
                  </div>
                  <Switch
                    checked={challengeNotifications}
                    onCheckedChange={(val) => handleToggle("challenge_notifications", val)}
                  />
                </div>
              </section>
            </div>
          )}

          {/* Account actions section */}
          {activeSection === "account-actions" && (
            <div className="px-4 md:px-0 space-y-4">
              <section className="bg-card rounded-2xl p-4 shadow-card border border-border space-y-4">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <LogOut size={16} className="text-primary" /> Account Actions
                </h2>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>

                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Dialog */}
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