import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/admin/AdminLayout";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle, Ban, Clock, Bell } from "lucide-react";

interface ReportWithReporter {
  id: string;
  target_id: string;
  target_type: string;
  reason: string | null;
  status: string | null;
  reporter_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  moderator_note: string | null;
  created_at: string | null;
  reporter: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

interface TargetContent {
  caption?: string | null;
  text?: string | null;
  username?: string;
  author_id?: string | null;
}

type ActionType = "warn" | "suspend_24h" | "suspend_7d" | "ban";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: ActionType | null;
    reportId: string | null;
    targetId: string | null;
    targetType: string | null;
  }>({ open: false, action: null, reportId: null, targetId: null, targetType: null });
  const [moderatorNote, setModeratorNote] = useState("");

  // Fetch all reports
  const { data: allReports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, reporter:reporter_id(username, avatar_url, display_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ReportWithReporter[];
    },
  });

  // Fetch target content for preview
  const fetchTargetContent = async (targetId: string, targetType: string): Promise<TargetContent> => {
    if (targetType === "post") {
      const { data } = await supabase.from("posts").select("caption, author_id").eq("id", targetId).single();
      return data || { caption: "Content not found" };
    } else if (targetType === "comment") {
      const { data } = await supabase.from("comments").select("text, author_id").eq("id", targetId).single();
      return data || { text: "Content not found" };
    } else if (targetType === "user") {
      const { data } = await supabase.from("profiles").select("username").eq("id", targetId).single();
      return data || { username: "User not found" };
    }
    return {};
  };

  const { data: targetContents } = useQuery({
    queryKey: ["report-targets", allReports?.map((r) => ({ id: r.id, targetId: r.target_id, targetType: r.target_type }))],
    queryFn: async () => {
      if (!allReports) return {};
      const contents: Record<string, TargetContent> = {};
      for (const report of allReports) {
        contents[report.id] = await fetchTargetContent(report.target_id, report.target_type);
      }
      return contents;
    },
    enabled: !!allReports && allReports.length > 0,
  });

  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      moderatorNoteValue,
    }: {
      id: string;
      status: string;
      moderatorNoteValue?: string;
    }) => {
      const { data, error } = await supabase
        .from("reports")
        .update({
          status,
          resolved_by: user!.id,
          resolved_at: new Date().toISOString(),
          moderator_note: moderatorNoteValue,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  // Delete content mutation (posts/comments)
  const deleteContentMutation = useMutation({
    mutationFn: async ({ targetId, targetType }: { targetId: string; targetType: string }) => {
      if (targetType === "post") {
        const { error } = await supabase.from("posts").delete().eq("id", targetId);
        if (error) throw error;
      } else if (targetType === "comment") {
        const { error } = await supabase.from("comments").delete().eq("id", targetId);
        if (error) throw error;
      }
    },
  });

  // Insert violation mutation
  const insertViolationMutation = useMutation({
    mutationFn: async ({
      userId,
      action,
      reason,
      durationHours,
    }: {
      userId: string;
      action: string;
      reason: string;
      durationHours?: number;
    }) => {
      const { data, error } = await supabase
        .from("violations")
        .insert({
          user_id: userId,
          action,
          reason,
          created_by: user!.id,
          duration_hours: durationHours,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Update user status mutation (suspend/ban)
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      status,
      suspendedUntil,
    }: {
      userId: string;
      status: string;
      suspendedUntil?: string;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ status, suspended_until: suspendedUntil })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get content preview text
  const getContentPreview = (report: ReportWithReporter): string => {
    const content = targetContents?.[report.id];
    if (!content) return "Loading...";
    if (report.target_type === "post") return content.caption || "Untitled post";
    if (report.target_type === "comment") return content.text || "No comment text";
    if (report.target_type === "user") return content.username || "Unknown user";
    return "Unknown content";
  };

  // Get author/owner ID for actions
  const getTargetOwnerId = (report: ReportWithReporter): string | null => {
    const content = targetContents?.[report.id];
    if (!content) return null;
    return content.author_id || report.target_id; // For user reports, target_id IS the user id
  };

  // Handle dismiss
  const handleDismiss = async (report: ReportWithReporter) => {
    await resolveReportMutation.mutateAsync({
      id: report.id,
      status: "dismissed",
      moderatorNoteValue: "Dismissed by moderator",
    });
  };

  // Handle remove content
  const handleRemoveContent = async (report: ReportWithReporter) => {
    await deleteContentMutation.mutateAsync({
      targetId: report.target_id,
      targetType: report.target_type,
    });
    await resolveReportMutation.mutateAsync({
      id: report.id,
      status: "resolved",
      moderatorNoteValue: "Content removed by moderator",
    });
  };

  // Open confirm dialog for actions
  const openConfirmDialog = (
    action: ActionType,
    reportId: string,
    targetId: string,
    targetType: string
  ) => {
    setConfirmDialog({ open: true, action, reportId, targetId, targetType });
    setModeratorNote("");
  };

  // Handle confirm action
  const handleConfirmAction = async () => {
    if (!confirmDialog.reportId || !confirmDialog.action) return;

    const report = allReports?.find((r) => r.id === confirmDialog.reportId);
    if (!report) return;

    const targetOwnerId = getTargetOwnerId(report);
    if (!targetOwnerId) return;

    const action = confirmDialog.action;
    let durationHours: number | undefined;
    let newStatus: string;
    let moderatorNoteValue: string;

    switch (action) {
      case "warn":
        newStatus = "resolved";
        moderatorNoteValue = moderatorNote || "User warned";
        await insertViolationMutation.mutateAsync({
          userId: targetOwnerId,
          action: "warn",
          reason: report.reason || "No reason provided",
        });
        break;
      case "suspend_24h": {
        newStatus = "resolved";
        moderatorNoteValue = moderatorNote || "User suspended for 24 hours";
        durationHours = 24;
        const suspendedUntil24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await updateUserStatusMutation.mutateAsync({
          userId: targetOwnerId,
          status: "suspended",
          suspendedUntil: suspendedUntil24h,
        });
        await insertViolationMutation.mutateAsync({
          userId: targetOwnerId,
          action: "suspend",
          reason: report.reason || "No reason provided",
          durationHours,
        });
        break;
      }
      case "suspend_7d": {
        newStatus = "resolved";
        moderatorNoteValue = moderatorNote || "User suspended for 7 days";
        durationHours = 24 * 7;
        const suspendedUntil7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await updateUserStatusMutation.mutateAsync({
          userId: targetOwnerId,
          status: "suspended",
          suspendedUntil: suspendedUntil7d,
        });
        await insertViolationMutation.mutateAsync({
          userId: targetOwnerId,
          action: "suspend",
          reason: report.reason || "No reason provided",
          durationHours,
        });
        break;
      }
      case "ban":
        newStatus = "resolved";
        moderatorNoteValue = moderatorNote || "User banned";
        await updateUserStatusMutation.mutateAsync({
          userId: targetOwnerId,
          status: "banned",
        });
        await insertViolationMutation.mutateAsync({
          userId: targetOwnerId,
          action: "ban",
          reason: report.reason || "No reason provided",
        });
        break;
    }

    await resolveReportMutation.mutateAsync({
      id: confirmDialog.reportId,
      status: newStatus,
      moderatorNoteValue,
    });

    setConfirmDialog({ open: false, action: null, reportId: null, targetId: null, targetType: null });
  };

  // Filter reports by status
  const pendingReports = allReports?.filter((r) => r.status === "pending") || [];
  const resolvedReports = allReports?.filter((r) => r.status === "dismissed" || r.status === "resolved") || [];

  // Loading skeletons
  if (isLoading) {
    return (
      <AdminLayout title="Reports">
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="border rounded-lg">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 flex-1" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getDialogTitle = () => {
    switch (confirmDialog.action) {
      case "warn":
        return "Warn User";
      case "suspend_24h":
        return "Suspend User for 24 Hours";
      case "suspend_7d":
        return "Suspend User for 7 Days";
      case "ban":
        return "Ban User";
      default:
        return "Confirm Action";
    }
  };

  const getDialogDescription = () => {
    switch (confirmDialog.action) {
      case "warn":
        return "This will issue a warning to the user and mark the report as resolved.";
      case "suspend_24h":
        return "This will suspend the user for 24 hours and mark the report as resolved.";
      case "suspend_7d":
        return "This will suspend the user for 7 days and mark the report as resolved.";
      case "ban":
        return "This will permanently ban the user and mark the report as resolved.";
      default:
        return "Are you sure you want to proceed?";
    }
  };

  return (
    <AdminLayout title="Reports">
      <div className="p-6 space-y-8">
        {/* Pending Reports Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Pending Reports ({pendingReports.length})</h2>
          </div>

          {pendingReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
              <p className="text-muted-foreground">No pending reports</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge
                          variant={
                            report.target_type === "post"
                              ? "secondary"
                              : report.target_type === "comment"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {report.target_type.charAt(0).toUpperCase() + report.target_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span title={getContentPreview(report)}>{getContentPreview(report)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={report.reporter?.avatar_url || undefined} />
                            <AvatarFallback>
                              {report.reporter?.username?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{report.reporter?.username || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span title={report.reason || ""}>{report.reason || "No reason"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismiss(report)}
                            disabled={resolveReportMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                          {(report.target_type === "post" || report.target_type === "comment") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveContent(report)}
                              disabled={deleteContentMutation.isPending || resolveReportMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Remove content
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openConfirmDialog("warn", report.id, report.target_id, report.target_type)
                            }
                            disabled={resolveReportMutation.isPending}
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            Warn
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openConfirmDialog("suspend_24h", report.id, report.target_id, report.target_type)
                            }
                            disabled={resolveReportMutation.isPending}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            24h
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openConfirmDialog("suspend_7d", report.id, report.target_id, report.target_type)
                            }
                            disabled={resolveReportMutation.isPending}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            7d
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                openConfirmDialog("ban", report.id, report.target_id, report.target_type)
                              }
                              disabled={resolveReportMutation.isPending}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Ban
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Resolved Reports Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Resolved Reports ({resolvedReports.length})</h2>
          </div>

          {resolvedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No resolved reports</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resolved At</TableHead>
                    <TableHead>Moderator Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge
                          variant={
                            report.target_type === "post"
                              ? "secondary"
                              : report.target_type === "comment"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {report.target_type.charAt(0).toUpperCase() + report.target_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span title={getContentPreview(report)}>{getContentPreview(report)}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span title={report.reason || ""}>{report.reason || "No reason"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === "resolved" ? "default" : "secondary"}>
                          {report.status === "resolved" ? "Resolved" : "Dismissed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.resolved_at
                          ? new Date(report.resolved_at).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span title={report.moderator_note || ""}>
                          {report.moderator_note || "No note"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Confirm Action Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>{getDialogDescription()}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Moderator Note (optional)</label>
              <textarea
                className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                placeholder="Add a note about this action..."
                value={moderatorNote}
                onChange={(e) => setModeratorNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, action: null, reportId: null, targetId: null, targetType: null })}
              >
                Cancel
              </Button>
              <Button
                variant={confirmDialog.action === "ban" ? "destructive" : "default"}
                onClick={handleConfirmAction}
                disabled={
                  resolveReportMutation.isPending ||
                  insertViolationMutation.isPending ||
                  updateUserStatusMutation.isPending ||
                  deleteContentMutation.isPending
                }
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}