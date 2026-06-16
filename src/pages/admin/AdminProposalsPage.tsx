import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, MoreHorizontal, Check, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useProposals, type ProposalWithSubmitter } from "@/queries/proposals";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function formatProposedOptions(options: unknown): string {
  if (!options) return "-";
  if (Array.isArray(options)) {
    return options.join(" / ");
  }
  return String(options);
}

function getTypeBadgeVariant(type: string): "default" | "secondary" {
  return type === "challenge" ? "default" : "secondary";
}

function formatScheduledAt(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string | null | undefined, username: string): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

// Pending Proposals Section
function PendingProposalsSection({
  proposals,
  onApprove,
  onReject,
}: {
  proposals: ProposalWithSubmitter[];
  onApprove: (id: string, scheduledAt: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pending Proposals</h2>
      {proposals.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
          No pending proposals
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Proposed Options</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <PendingTableRow
                  key={proposal.id}
                  proposal={proposal}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PendingTableRow({
  proposal,
  onApprove,
  onReject,
}: {
  proposal: ProposalWithSubmitter;
  onApprove: (id: string, scheduledAt: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleScheduleSelect = (option: string) => {
    setSelectedOption(option);
    onApprove(proposal.id, option);
    setScheduleOpen(false);
  };

  const handleRejectConfirm = () => {
    onReject(proposal.id, rejectNote);
    setRejectOpen(false);
    setRejectNote("");
  };

  const proposedOptions = Array.isArray(proposal.proposed_options)
    ? proposal.proposed_options
    : [];

  return (
    <>
      <TableRow>
        <TableCell>
          <Badge variant={getTypeBadgeVariant(proposal.type)}>
            {proposal.type}
          </Badge>
        </TableCell>
        <TableCell className="font-medium">{proposal.title}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={proposal.submitter?.avatar_url ?? undefined} />
              <AvatarFallback>
                {getInitials(
                  proposal.submitter?.display_name,
                  proposal.submitter?.username ?? "U"
                )}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {proposal.submitter?.username ?? "Unknown"}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatProposedOptions(proposal.proposed_options)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Calendar size={14} />
                  Schedule
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  <p className="text-sm font-medium px-2">Select a date</p>
                  {proposedOptions.length > 0 ? (
                    proposedOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleScheduleSelect(String(option))}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                      >
                        {String(option)}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground px-2">
                      No options available
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setRejectOpen(true)}
            >
              <X size={14} />
              Reject
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-note">Reason (optional)</Label>
            <Textarea
              id="reject-note"
              placeholder="Add a note for the submitter..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
            >
              Reject Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Scheduled Proposals Section
function ScheduledProposalsSection({
  proposals,
  onEdit,
  onCancel,
}: {
  proposals: ProposalWithSubmitter[];
  onEdit: (id: string, scheduledAt: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Scheduled Proposals</h2>
      {proposals.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
          No scheduled proposals
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <ScheduledTableRow
                  key={proposal.id}
                  proposal={proposal}
                  onEdit={onEdit}
                  onCancel={onCancel}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ScheduledTableRow({
  proposal,
  onEdit,
  onCancel,
}: {
  proposal: ProposalWithSubmitter;
  onEdit: (id: string, scheduledAt: string) => void;
  onCancel: (id: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(proposal.scheduled_at ?? "");

  const handleEditConfirm = () => {
    if (selectedOption) {
      onEdit(proposal.id, selectedOption);
    }
    setEditOpen(false);
  };

  const handleCancel = () => {
    onCancel(proposal.id);
  };

  const proposedOptions = Array.isArray(proposal.proposed_options)
    ? proposal.proposed_options
    : [];

  return (
    <>
      <TableRow>
        <TableCell>
          <Badge variant={getTypeBadgeVariant(proposal.type)}>
            {proposal.type}
          </Badge>
        </TableCell>
        <TableCell className="font-medium">{proposal.title}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={proposal.submitter?.avatar_url ?? undefined} />
              <AvatarFallback>
                {getInitials(
                  proposal.submitter?.display_name,
                  proposal.submitter?.username ?? "U"
                )}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {proposal.submitter?.username ?? "Unknown"}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatScheduledAt(proposal.scheduled_at)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Popover open={editOpen} onOpenChange={setEditOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-2">
                  <p className="text-sm font-medium px-2">Change date</p>
                  {proposedOptions.length > 0 ? (
                    proposedOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedOption(String(option));
                          onEdit(proposal.id, String(option));
                          setEditOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors ${
                          proposal.scheduled_at === String(option)
                            ? "bg-muted font-medium"
                            : ""
                        }`}
                      >
                        {String(option)}
                      </button>
                    ))
                  ) : (
                    <div className="px-2 space-y-2">
                      <input
                        type="datetime-local"
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="w-full text-sm border rounded-md px-2 py-1"
                      />
                      <Button size="sm" onClick={handleEditConfirm} className="w-full">
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}

// Loading skeleton
function ProposalsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function AdminProposalsPage() {
  const queryClient = useQueryClient();
  const { data: proposals, isLoading } = useProposals();

  const pendingProposals = proposals?.filter(
    (p) => p.status === "pending"
  ) ?? [];
  const scheduledProposals = proposals?.filter(
    (p) => p.status === "approved" || p.status === "scheduled"
  ) ?? [];

  const handleApprove = async (id: string, scheduledAt: string) => {
    await supabase
      .from("proposals")
      .update({
        status: "approved",
        scheduled_at: scheduledAt,
      })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["proposals"] });
  };

  const handleReject = async (id: string, note: string) => {
    await supabase
      .from("proposals")
      .update({
        status: "rejected",
        moderator_note: note || null,
      })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["proposals"] });
  };

  const handleEdit = async (id: string, scheduledAt: string) => {
    await supabase
      .from("proposals")
      .update({
        status: "approved",
        scheduled_at: scheduledAt,
      })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["proposals"] });
  };

  const handleCancel = async (id: string) => {
    await supabase
      .from("proposals")
      .update({
        status: "pending",
        scheduled_at: null,
      })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["proposals"] });
  };

  return (
    <AdminLayout title="Proposals">
      <div className="p-6">
        {isLoading ? (
          <ProposalsSkeleton />
        ) : (
          <div className="space-y-8">
            <PendingProposalsSection
              proposals={pendingProposals}
              onApprove={handleApprove}
              onReject={handleReject}
            />
            <ScheduledProposalsSection
              proposals={scheduledProposals}
              onEdit={handleEdit}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}