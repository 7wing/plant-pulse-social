import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateReport } from "@/queries/reports";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

interface ReportUserSheetProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportUserSheet({ userId, userName, open, onOpenChange }: ReportUserSheetProps) {
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const createReport = useCreateReport();

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    try {
      await createReport.mutateAsync({
        target_id: userId,
        target_type: "user",
        reason,
        // @ts-expect-error - moderator_note can be optional
        moderator_note: note || null,
      });

      toast.success("Report submitted. Thank you for helping keep our community safe.");
      handleClose();
    } catch (error) {
      toast.error("Failed to submit report. Please try again.");
    }
  };

  const handleClose = () => {
    setReason("");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" size={20} />
            <SheetTitle>Report {userName}</SheetTitle>
          </div>
          <SheetDescription>
            Help us understand what's wrong. Your report is anonymous.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Reason selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center gap-2">
                  <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                  <Label htmlFor={`reason-${r.value}`} className="text-sm font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Optional note */}
          <div className="space-y-2">
            <Label htmlFor="report-note" className="text-sm font-medium">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide more context..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit button */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!reason || createReport.isPending}
            >
              {createReport.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}