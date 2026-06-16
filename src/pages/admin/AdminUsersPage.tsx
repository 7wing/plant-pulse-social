import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Search, Shield, ShieldOff, Ban, ShieldBan, PlayCircle, Eye } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Profile, Violation } from "@/lib/database.types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";

type UserRole = "user" | "moderator" | "admin";
type UserStatus = "active" | "suspended" | "banned";

const roleColors: Record<UserRole, string> = {
  user: "bg-gray-100 text-gray-800",
  moderator: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
};

const statusColors: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-yellow-100 text-yellow-800",
  banned: "bg-red-100 text-red-800",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant="secondary" className={roleColors[role]}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="secondary" className={statusColors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    const parts = displayName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { isAdmin, role: currentUserRole } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState<"24h" | "7d" | "custom">("24h");
  const [customDuration, setCustomDuration] = useState(1);
  const [violationsSheetOpen, setViolationsSheetOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Fetch all profiles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch violations for selected user
  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ["user-violations", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const { data, error } = await supabase
        .from("violations")
        .select("*")
        .eq("user_id", selectedUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Violation[];
    },
    enabled: !!selectedUser?.id && violationsSheetOpen,
  });

  // Client-side search filter
  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    if (!searchQuery.trim()) return profiles;

    const query = searchQuery.toLowerCase();
    return profiles.filter(
      (profile) =>
        profile.username.toLowerCase().includes(query) ||
        (profile.display_name && profile.display_name.toLowerCase().includes(query))
    );
  }, [profiles, searchQuery]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({
      profileId,
      updates,
    }: {
      profileId: string;
      updates: Partial<Profile>;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
  });

  // Insert violation mutation
  const insertViolationMutation = useMutation({
    mutationFn: async (violation: {
      user_id: string;
      action: string;
      reason: string | null;
      created_by: string;
      duration_hours: number | null;
    }) => {
      const { error } = await supabase.from("violations").insert(violation);
      if (error) throw error;
    },
  });

  const handleMakeModerator = async (profile: Profile) => {
    if (!user) return;
    setLoadingAction(profile.id);
    try {
      await updateProfileMutation.mutateAsync({
        profileId: profile.id,
        updates: { role: "moderator" },
      });
      await insertViolationMutation.mutateAsync({
        user_id: profile.id,
        action: "role_change",
        reason: "Promoted to moderator",
        created_by: user.id,
        duration_hours: null,
      });
      toast({ title: "User promoted to moderator" });
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemoveModerator = async (profile: Profile) => {
    if (!user) return;
    setLoadingAction(profile.id);
    try {
      await updateProfileMutation.mutateAsync({
        profileId: profile.id,
        updates: { role: "user" },
      });
      await insertViolationMutation.mutateAsync({
        user_id: profile.id,
        action: "role_change",
        reason: "Removed moderator status",
        created_by: user.id,
        duration_hours: null,
      });
      toast({ title: "Moderator status removed" });
    } catch {
      toast({ title: "Failed to update user", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser || !user) return;
    setLoadingAction(selectedUser.id);

    let hours = 0;
    if (suspendDuration === "24h") hours = 24;
    else if (suspendDuration === "7d") hours = 168;
    else hours = customDuration * 24;

    const suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    try {
      await updateProfileMutation.mutateAsync({
        profileId: selectedUser.id,
        updates: { status: "suspended", suspended_until: suspendedUntil },
      });
      await insertViolationMutation.mutateAsync({
        user_id: selectedUser.id,
        action: "suspend",
        reason: `Suspended for ${suspendDuration === "custom" ? `${customDuration} days` : suspendDuration}`,
        created_by: user.id,
        duration_hours: hours,
      });
      toast({ title: "User suspended" });
      setSuspendDialogOpen(false);
      setSelectedUser(null);
    } catch {
      toast({ title: "Failed to suspend user", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUnsuspend = async (profile: Profile) => {
    if (!user) return;
    setLoadingAction(profile.id);
    try {
      await updateProfileMutation.mutateAsync({
        profileId: profile.id,
        updates: { status: "active", suspended_until: null },
      });
      await insertViolationMutation.mutateAsync({
        user_id: profile.id,
        action: "unsuspend",
        reason: "Suspension lifted",
        created_by: user.id,
        duration_hours: null,
      });
      toast({ title: "User unsuspended" });
    } catch {
      toast({ title: "Failed to unsuspend user", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBan = async (profile: Profile) => {
    if (!user || !isAdmin) return;
    setLoadingAction(profile.id);
    try {
      await updateProfileMutation.mutateAsync({
        profileId: profile.id,
        updates: { status: "banned" },
      });
      await insertViolationMutation.mutateAsync({
        user_id: profile.id,
        action: "ban",
        reason: "Banned by admin",
        created_by: user.id,
        duration_hours: null,
      });
      toast({ title: "User banned" });
    } catch {
      toast({ title: "Failed to ban user", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUnban = async (profile: Profile) => {
    if (!user) return;
    setLoadingAction(profile.id);
    try {
      await updateProfileMutation.mutateAsync({
        profileId: profile.id,
        updates: { status: "active", suspended_until: null },
      });
      await insertViolationMutation.mutateAsync({
        user_id: profile.id,
        action: "unban",
        reason: "Ban lifted",
        created_by: user.id,
        duration_hours: null,
      });
      toast({ title: "User unbanned" });
    } catch {
      toast({ title: "Failed to unban user", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewViolations = (profile: Profile) => {
    setSelectedUser(profile);
    setViolationsSheetOpen(true);
  };

  return (
    <AdminLayout title="Users">
      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Avatar</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profilesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {searchQuery ? "No users found matching your search" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => {
                  const role = (profile.role as UserRole) || "user";
                  const status = (profile.status as UserStatus) || "active";
                  const isLoading = loadingAction === profile.id;

                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                          <AvatarFallback>{getInitials(profile.display_name, profile.username)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{profile.username}</TableCell>
                      <TableCell>{profile.display_name || "-"}</TableCell>
                      <TableCell>
                        <RoleBadge role={role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && role === "user" && (
                              <DropdownMenuItem onClick={() => handleMakeModerator(profile)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Make Moderator
                              </DropdownMenuItem>
                            )}
                            {isAdmin && role === "moderator" && (
                              <DropdownMenuItem onClick={() => handleRemoveModerator(profile)}>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Remove Moderator
                              </DropdownMenuItem>
                            )}
                            {status === "active" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(profile);
                                  setSuspendDialogOpen(true);
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {status === "suspended" && (
                              <DropdownMenuItem onClick={() => handleUnsuspend(profile)}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Unsuspend
                              </DropdownMenuItem>
                            )}
                            {isAdmin && status !== "banned" && (
                              <DropdownMenuItem onClick={() => handleBan(profile)}>
                                <ShieldBan className="mr-2 h-4 w-4" />
                                Ban
                              </DropdownMenuItem>
                            )}
                            {status === "banned" && (
                              <DropdownMenuItem onClick={() => handleUnban(profile)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Unban
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewViolations(profile)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Violations
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Select the duration for which to suspend {selectedUser?.username}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={suspendDuration === "24h" ? "default" : "outline"}
                onClick={() => setSuspendDuration("24h")}
              >
                24 Hours
              </Button>
              <Button
                variant={suspendDuration === "7d" ? "default" : "outline"}
                onClick={() => setSuspendDuration("7d")}
              >
                7 Days
              </Button>
              <Button
                variant={suspendDuration === "custom" ? "default" : "outline"}
                onClick={() => setSuspendDuration("custom")}
              >
                Custom
              </Button>
            </div>
            {suspendDuration === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={loadingAction !== null}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Violations Sheet */}
      <Sheet open={violationsSheetOpen} onOpenChange={setViolationsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Violation History</SheetTitle>
            <SheetDescription>
              {selectedUser?.display_name || selectedUser?.username} -@{selectedUser?.username}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {violationsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : violations && violations.length > 0 ? (
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div key={violation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="capitalize">
                        {violation.action.replace("_", " ")}
                      </Badge>
                      {violation.duration_hours && (
                        <span className="text-xs text-muted-foreground">
                          {violation.duration_hours >= 24
                            ? `${Math.round(violation.duration_hours / 24)} days`
                            : `${violation.duration_hours} hours`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{violation.reason || "No reason provided"}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {violation.created_at
                        ? new Date(violation.created_at).toLocaleString()
                        : "Unknown date"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No violations found for this user.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}