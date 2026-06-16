import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProposal } from "@/queries/proposals";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const proposalSchema = z.object({
  type: z.enum(["challenge", "event"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  location: z.string().optional(),
  is_virtual: z.boolean().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface DateOption {
  id: string;
  date: string;
  time: string;
}

interface ProposeChallengeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProposeChallengeSheet({ open, onOpenChange }: ProposeChallengeSheetProps) {
  const [dateOptions, setDateOptions] = useState<DateOption[]>([
    { id: "1", date: "", time: "" },
    { id: "2", date: "", time: "" },
  ]);

  const createProposal = useCreateProposal();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      type: "challenge",
      is_virtual: false,
    },
  });

  const type = watch("type");
  const isEvent = type === "event";

  const addDateOption = () => {
    if (dateOptions.length < 3) {
      setDateOptions([
        ...dateOptions,
        { id: Date.now().toString(), date: "", time: "" },
      ]);
    }
  };

  const removeDateOption = (id: string) => {
    if (dateOptions.length > 2) {
      setDateOptions(dateOptions.filter((opt) => opt.id !== id));
    }
  };

  const updateDateOption = (id: string, field: "date" | "time", value: string) => {
    setDateOptions(
      dateOptions.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    );
  };

  const onSubmit = async (data: ProposalFormData) => {
    // Validate at least 2 date options are filled
    const filledOptions = dateOptions.filter((opt) => opt.date && opt.time);
    if (filledOptions.length < 2) {
      toast.error("Please provide at least 2 date/time options");
      return;
    }

    // Format date options as JSON
    const proposedOptions = filledOptions.map((opt) => ({
      date: opt.date,
      time: opt.time,
    }));

    try {
      await createProposal.mutateAsync({
        type: data.type,
        title: data.title,
        description: data.description,
        proposed_options: proposedOptions as unknown as import("@/lib/database.types").Json,
        location: data.type === "event" ? data.location : null,
        is_virtual: data.type === "event" ? data.is_virtual : false,
      });

      toast.success("Proposal submitted! Moderators will review it soon.");
      reset();
      setDateOptions([
        { id: "1", date: "", time: "" },
        { id: "2", date: "", time: "" },
      ]);
      onOpenChange(false);
    } catch {
      toast.error("Failed to submit proposal. Please try again.");
    }
  };

  const handleClose = () => {
    reset();
    setDateOptions([
      { id: "1", date: "", time: "" },
      { id: "2", date: "", time: "" },
    ]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Propose a Challenge or Event</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              defaultValue="challenge"
              onValueChange={(value) => setValue("type", value as "challenge" | "event")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="challenge">Challenge</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              {...register("title")}
              placeholder={isEvent ? "e.g., Plant Swap Meetup" : "e.g., Weekend Watering Challenge"}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              {...register("description")}
              placeholder={isEvent 
                ? "Describe the event and what participants can expect..." 
                : "Describe the challenge and what participants should do..."}
              className="min-h-[100px]"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Date Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Proposed time options (pick 2-3)</label>
              {dateOptions.length < 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addDateOption}
                  className="h-7 text-xs"
                >
                  <Plus size={14} className="mr-1" />
                  Add option
                </Button>
              )}
            </div>
            
            {dateOptions.map((opt, index) => (
              <div key={opt.id} className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground w-6">Option {index + 1}:</span>
                <Input
                  type="date"
                  value={opt.date}
                  onChange={(e) => updateDateOption(opt.id, "date", e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={opt.time}
                  onChange={(e) => updateDateOption(opt.id, "time", e.target.value)}
                  className="w-28"
                />
                {dateOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeDateOption(opt.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Location (Event only) */}
          {isEvent && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  {...register("location")}
                  placeholder="e.g., Central Park, New York"
                />
              </div>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("is_virtual")}
                  className="rounded border-input"
                />
                This is a virtual event
              </label>
            </div>
          )}

          {/* Error */}
          {createProposal.isError && (
            <p className="text-sm text-destructive">
              Failed to submit proposal. Please try again.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createProposal.isPending}
              className="flex-1"
            >
              {(isSubmitting || createProposal.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Submit Proposal
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}