import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Loader2, Trash2, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { useUpdatePlant, useDeletePlant } from "@/queries/plants";
import { useCareTasks, useCreateCareTask, useUpdateCareTask, useDeleteCareTask } from "@/queries/careTasks";
import { useUpload } from "@/hooks/useUpload";
import type { Plant } from "@/queries/plants";

interface EditPlantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: Plant | null;
}

interface CareTaskRow {
  id: string; // temporary id for new tasks
  task_type: string;
  task_name: string;
  repeat_interval: number | null;
  repeat_unit: string | null;
  enabled: boolean;
  isNew?: boolean;
}

const CARE_TASK_PRESETS = [
  { task_type: "water", task_name: "Water", defaultInterval: 7, defaultUnit: "days" },
  { task_type: "fertilize", task_name: "Fertilize", defaultInterval: 30, defaultUnit: "days" },
  { task_type: "repot", task_name: "Repot", defaultInterval: 6, defaultUnit: "months" },
];

export default function EditPlantSheet({ open, onOpenChange, plant }: EditPlantSheetProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const updatePlant = useUpdatePlant();
  const deletePlant = useDeletePlant();
  const createCareTask = useCreateCareTask();
  const updateCareTask = useUpdateCareTask();
  const deleteCareTask = useDeleteCareTask();
  const { uploadFile, uploading } = useUpload();
  
  const { data: existingTasks = [] } = useCareTasks(plant?.id);

  const [nickname, setNickname] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  
  const [careTasks, setCareTasks] = useState<CareTaskRow[]>([]);
  const [customTaskName, setCustomTaskName] = useState("");
  const [customTaskInterval, setCustomTaskInterval] = useState("");
  const [customTaskUnit, setCustomTaskUnit] = useState("days");
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when plant changes
  useEffect(() => {
    if (plant) {
      setNickname(plant.nickname || "");
      setSpecies(plant.scientific_name || plant.species || "");
      setLocation(plant.location || "");
      setImageUrl(plant.image_url || null);
      setImagePreview(null);
      setNewImageFile(null);
      
      // Initialize care tasks from existing tasks
      const taskRows: CareTaskRow[] = CARE_TASK_PRESETS.map((preset) => {
        const existing = existingTasks.find((t) => t.task_type === preset.task_type);
        return {
          id: existing?.id || preset.task_type,
          task_type: preset.task_type,
          task_name: preset.task_name,
          repeat_interval: existing?.repeat_interval ?? preset.defaultInterval,
          repeat_unit: existing?.repeat_unit ?? preset.defaultUnit,
          enabled: !!existing,
        };
      });
      setCareTasks(taskRows);
    }
  }, [plant, existingTasks]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!plant) return;
    
    setIsSaving(true);
    try {
      let finalImageUrl = imageUrl;
      
      // Upload new image if selected
      if (newImageFile) {
        const result = await uploadFile(newImageFile, { bucket: "plant-images" });
        finalImageUrl = result.url;
      }

      // Update plant
      await updatePlant.mutateAsync({
        id: plant.id,
        nickname: nickname || plant.nickname,
        scientific_name: species || undefined,
        location: location || undefined,
        image_url: finalImageUrl || undefined,
      });

      // Handle care tasks
      for (const task of careTasks) {
        if (task.enabled) {
          // Calculate next due date based on interval
          const dueDate = new Date();
          if (task.repeat_unit === "days") {
            dueDate.setDate(dueDate.getDate() + (task.repeat_interval || 7));
          } else if (task.repeat_unit === "weeks") {
            dueDate.setDate(dueDate.getDate() + (task.repeat_interval || 1) * 7);
          } else if (task.repeat_unit === "months") {
            dueDate.setMonth(dueDate.getMonth() + (task.repeat_interval || 1));
          }

          if (task.isNew) {
            // Create new task
            await createCareTask.mutateAsync({
              plant_id: plant.id,
              user_id: plant.owner_id || undefined,
              task_type: task.task_type,
              task_name: task.task_name,
              due_date: dueDate.toISOString(),
              repeat_interval: task.repeat_interval,
              repeat_unit: task.repeat_unit,
              is_recurring: true,
            });
          } else {
            // Update existing task
            await updateCareTask.mutateAsync({
              id: task.id,
              due_date: dueDate.toISOString(),
              repeat_interval: task.repeat_interval,
              repeat_unit: task.repeat_unit,
            });
          }
        } else {
          // If task was disabled and exists, delete it
          const existing = existingTasks.find((t) => t.task_type === task.task_type);
          if (existing) {
            await deleteCareTask.mutateAsync(existing.id);
          }
        }
      }

      onOpenChange(false);
      // Optionally refresh the page or refetch data
    } catch (error) {
      console.error("Error saving plant:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!plant) return;
    try {
      await deletePlant.mutateAsync(plant.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
      navigate("/my-plants");
    } catch (error) {
      console.error("Error deleting plant:", error);
    }
  };

  const handleAddCustomTask = () => {
    if (!customTaskName.trim() || !customTaskInterval) return;
    
    const newTask: CareTaskRow = {
      id: `custom-${Date.now()}`,
      task_type: customTaskName.toLowerCase().replace(/\s+/g, "_"),
      task_name: customTaskName,
      repeat_interval: parseInt(customTaskInterval, 10),
      repeat_unit: customTaskUnit,
      enabled: true,
      isNew: true,
    };
    
    setCareTasks([...careTasks, newTask]);
    setCustomTaskName("");
    setCustomTaskInterval("");
  };

  const handleToggleTask = (taskType: string, enabled: boolean) => {
    setCareTasks(
      careTasks.map((t) =>
        t.task_type === taskType ? { ...t, enabled } : t
      )
    );
  };

  const handleUpdateInterval = (taskType: string, interval: number | null, unit: string | null) => {
    setCareTasks(
      careTasks.map((t) =>
        t.task_type === taskType ? { ...t, repeat_interval: interval, repeat_unit: unit } : t
      )
    );
  };

  const handleRemoveTask = (taskType: string) => {
    setCareTasks(careTasks.filter((t) => t.task_type !== taskType));
  };

  if (!plant) return null;

  const modalContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold">Edit Plant</h2>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Save
        </Button>
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted">
            {imagePreview || imageUrl ? (
              <img
                src={imagePreview || imageUrl || ""}
                alt={nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Camera size={24} />
              </div>
            )}
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleImageChange}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80">
              <Camera size={16} />
              Change photo
            </span>
          </label>
        </div>
      </div>

      {/* Nickname */}
      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Plant nickname"
        />
      </div>

      {/* Species */}
      <div className="space-y-2">
        <Label htmlFor="species">Species</Label>
        <Input
          id="species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="Scientific or common name"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Living room, Bedroom"
        />
      </div>

      {/* Care Schedule */}
      <div className="space-y-4">
        <Label>Care Schedule</Label>
        <div className="space-y-3">
          {careTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Checkbox
                checked={task.enabled}
                onCheckedChange={(checked) => handleToggleTask(task.task_type, checked as boolean)}
              />
              <span className="flex-1 text-sm font-medium">{task.task_name}</span>
              {task.enabled && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">every</span>
                  <Input
                    type="number"
                    min="1"
                    value={task.repeat_interval || ""}
                    onChange={(e) => handleUpdateInterval(task.task_type, parseInt(e.target.value, 10) || null, task.repeat_unit)}
                    className="w-16 h-8 text-center"
                  />
                  <select
                    value={task.repeat_unit || "days"}
                    onChange={(e) => handleUpdateInterval(task.task_type, task.repeat_interval, e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                  </select>
                  {!CARE_TASK_PRESETS.some((p) => p.task_type === task.task_type) && (
                    <button
                      onClick={() => handleRemoveTask(task.task_type)}
                      className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add custom task */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Plus size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add custom task</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Task name"
                value={customTaskName}
                onChange={(e) => setCustomTaskName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min="1"
                placeholder="Interval"
                value={customTaskInterval}
                onChange={(e) => setCustomTaskInterval(e.target.value)}
                className="w-20"
              />
              <select
                value={customTaskUnit}
                onChange={(e) => setCustomTaskUnit(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="days">days</option>
                <option value="weeks">weeks</option>
                <option value="months">months</option>
              </select>
              <Button onClick={handleAddCustomTask} variant="outline" size="sm" disabled={!customTaskName.trim() || !customTaskInterval}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete button */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 size={16} />
          Delete plant
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto pb-8">
            {modalContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            {modalContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {nickname || "this plant"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plant and all associated care history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}