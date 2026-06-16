import { useState } from "react";
import { usePlants } from "@/queries/plants";
import { useCreateCareTask } from "@/queries/careTasks";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddCareTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TASK_PRESETS = [
  { name: "Water", type: "water" },
  { name: "Fertilize", type: "fertilize" },
  { name: "Repot", type: "repot" },
  { name: "Prune", type: "prune" },
  { name: "Custom", type: "custom" },
];

export default function AddCareTaskSheet({ open, onOpenChange }: AddCareTaskSheetProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: plants = [], isLoading: plantsLoading } = usePlants();
  const createTask = useCreateCareTask();

  // Form state
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskType, setTaskType] = useState("water");
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState("7");
  const [repeatUnit, setRepeatUnit] = useState("days");

  const resetForm = () => {
    setSelectedPlantIds([]);
    setSelectAll(false);
    setTaskName("");
    setTaskType("water");
    const today = new Date();
    setDueDate(today.toISOString().split("T")[0]);
    setIsRecurring(false);
    setRepeatInterval("7");
    setRepeatUnit("days");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPlantIds(plants.map((p) => p.id));
    } else {
      setSelectedPlantIds([]);
    }
  };

  const handlePlantToggle = (plantId: string) => {
    setSelectedPlantIds((prev) => {
      if (prev.includes(plantId)) {
        return prev.filter((id) => id !== plantId);
      }
      return [...prev, plantId];
    });
  };

  const handlePresetClick = (preset: typeof TASK_PRESETS[0]) => {
    setTaskType(preset.type === "custom" ? "water" : preset.type);
    if (preset.name !== "Custom") {
      setTaskName(preset.name);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const plantIdsToUse = selectAll ? plants.map((p) => p.id) : selectedPlantIds;
    if (plantIdsToUse.length === 0) return;

    const finalTaskName = taskName.trim() || TASK_PRESETS.find((p) => p.type === taskType)?.name || "Care task";

    try {
      // Create a task for each selected plant
      const tasks = plantIdsToUse.map((plantId) => ({
        user_id: user.id,
        plant_id: plantId,
        task_name: finalTaskName,
        task_type: taskType,
        due_date: dueDate || new Date().toISOString().split("T")[0],
        is_recurring: isRecurring,
        repeat_interval: isRecurring ? parseInt(repeatInterval, 10) || null : null,
        repeat_unit: isRecurring ? repeatUnit : null,
      }));

      // Insert all tasks
      for (const task of tasks) {
        await createTask.mutateAsync(task);
      }

      handleClose(false);
    } catch (error) {
      console.error("Failed to create care tasks:", error);
    }
  };

  const isLoading = createTask.isPending || plantsLoading;

  const content = (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>Add Care Task</SheetTitle>
        <SheetDescription>Create a new care task for your plants</SheetDescription>
      </SheetHeader>

      {/* Plant selection */}
      <div className="space-y-3">
        <Label>For which plant(s)?</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {/* All plants option */}
          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">All plants</span>
          </label>

          {/* Individual plants */}
          {plants.map((plant) => (
            <label
              key={plant.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer",
                selectAll && "opacity-50"
              )}
            >
              <Checkbox
                checked={selectedPlantIds.includes(plant.id)}
                onCheckedChange={() => handlePlantToggle(plant.id)}
                disabled={selectAll}
              />
              <span className="text-sm">{plant.nickname}</span>
            </label>
          ))}

          {plants.length === 0 && !plantsLoading && (
            <p className="text-sm text-muted-foreground py-2">
              No plants yet. Add plants from your collection first.
            </p>
          )}
        </div>
      </div>

      {/* Task presets */}
      <div className="space-y-3">
        <Label>Task type</Label>
        <div className="flex flex-wrap gap-2">
          {TASK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                taskName === preset.name || (preset.name === "Custom" && !TASK_PRESETS.slice(0, 4).some(p => taskName === p.name))
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Task name (for custom) */}
      <div className="space-y-2">
        <Label htmlFor="taskName">Task name</Label>
        <Input
          id="taskName"
          placeholder="e.g. Water, Fertilize, Check soil"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
      </div>

      {/* Due date */}
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due date</Label>
        <div className="relative">
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="pl-10"
          />
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Repeat toggle */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(!!checked)}
          />
          <span className="text-sm font-medium">Repeat</span>
        </label>

        {isRecurring && (
          <div className="flex items-center gap-2 pl-7">
            <span className="text-sm text-muted-foreground">Repeat every</span>
            <Input
              type="number"
              min={1}
              value={repeatInterval}
              onChange={(e) => setRepeatInterval(e.target.value)}
              className="w-20"
            />
            <select
              value={repeatUnit}
              onChange={(e) => setRepeatUnit(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
            </select>
          </div>
        )}
      </div>

      {/* Error message */}
      {createTask.isError && (
        <p className="text-sm text-destructive">Failed to create task. Please try again.</p>
      )}

      {/* Submit button */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => handleClose(false)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className={cn("flex-1 gradient-leaf text-primary-foreground", isLoading && "opacity-50")}
          onClick={handleSubmit}
          disabled={isLoading || (selectedPlantIds.length === 0 && !selectAll)}
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {content}
      </DialogContent>
    </Dialog>
  );
}