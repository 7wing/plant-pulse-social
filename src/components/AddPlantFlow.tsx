import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, ScanLine, Leaf, Loader2, X, Plus, ChevronLeft, Droplets, TestTube, Flower } from "lucide-react";
import { identifyPlant, type PlantSuggestion } from "@/lib/plantnet";
import { useAddPlant } from "@/queries/plants";
import { useCreateCareTask } from "@/queries/careTasks";
import { useUpload } from "@/hooks/useUpload";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Step = "method" | "scan" | "confirm";

interface PrefillData {
  species?: string;
  scientificName?: string;
  imageUrl?: string;
}

interface AddPlantFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStep?: Step;
  prefillData?: PrefillData;
}

interface PresetTask {
  enabled: boolean;
  interval: number;
}

interface CustomTask {
  id: string;
  name: string;
  interval: number;
  unit: string;
}

const PLANT_FALLBACK = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop";

const PRESET_TASKS = {
  water: { label: "Water", icon: Droplets, defaultInterval: 7 },
  fertilize: { label: "Fertilize", icon: TestTube, defaultInterval: 30 },
  repot: { label: "Repot", icon: Flower, defaultInterval: 6 },
} as const;

const REPEAT_UNITS = ["days", "weeks", "months", "years"] as const;

export default function AddPlantFlow({
  open,
  onOpenChange,
  initialStep = "method",
  prefillData,
}: AddPlantFlowProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<PlantSuggestion[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(prefillData?.imageUrl || null);

  // Form state
  const [nickname, setNickname] = useState("");
  const [species, setSpecies] = useState(prefillData?.species || "");
  const [scientificName, setScientificName] = useState(prefillData?.scientificName || "");
  const [location, setLocation] = useState("");

  // Preset tasks
  const [presets, setPresets] = useState<Record<string, PresetTask>>({
    water: { enabled: true, interval: 7 },
    fertilize: { enabled: true, interval: 30 },
    repot: { enabled: false, interval: 6 },
  });

  // Custom tasks
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Mutations
  const addPlantMutation = useAddPlant();
  const createCareTaskMutation = useCreateCareTask();
  const { uploadFile, uploading } = useUpload();

  // Reset on open/close
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset all state
      setCurrentStep(initialStep);
      setScanning(false);
      setScanResults(null);
      setScanError(null);
      setSelectedImage(null);
      setImagePreview(prefillData?.imageUrl || null);
      setNickname("");
      setSpecies(prefillData?.species || "");
      setScientificName(prefillData?.scientificName || "");
      setLocation("");
      setPresets({
        water: { enabled: true, interval: 7 },
        fertilize: { enabled: true, interval: 30 },
        repot: { enabled: false, interval: 6 },
      });
      setCustomTasks([]);
      setSaving(false);
    }
    onOpenChange(isOpen);
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Handle scan
  const handleScan = async () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanError(null);
    setCurrentStep("scan");

    try {
      const results = await identifyPlant(file);
      setScanResults(results);
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      console.error("Scan error:", err);
      setScanError("Failed to identify plant. Please try again.");
      setScanResults(null);
    } finally {
      setScanning(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle scan result selection
  const handleAddFromScan = (suggestion: PlantSuggestion) => {
    setSpecies(suggestion.commonNames[0] || "");
    setScientificName(suggestion.scientificName);
    setCurrentStep("confirm");
  };

  // Handle manual entry
  const handleManualEntry = () => {
    setCurrentStep("confirm");
  };

  // Handle preset toggle
  const togglePreset = (key: string) => {
    setPresets((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  // Handle preset interval change
  const updatePresetInterval = (key: string, interval: number) => {
    setPresets((prev) => ({
      ...prev,
      [key]: { ...prev[key], interval },
    }));
  };

  // Add custom task
  const addCustomTask = () => {
    setCustomTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", interval: 7, unit: "days" },
    ]);
  };

  // Update custom task
  const updateCustomTask = (id: string, field: keyof CustomTask, value: string | number) => {
    setCustomTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, [field]: value } : task
      )
    );
  };

  // Remove custom task
  const removeCustomTask = (id: string) => {
    setCustomTasks((prev) => prev.filter((task) => task.id !== id));
  };

  // Calculate due date based on interval and unit
  const calculateDueDate = (interval: number, unit: string): string => {
    const dueDate = new Date();
    switch (unit) {
      case "days":
        dueDate.setDate(dueDate.getDate() + interval);
        break;
      case "weeks":
        dueDate.setDate(dueDate.getDate() + interval * 7);
        break;
      case "months":
        dueDate.setMonth(dueDate.getMonth() + interval);
        break;
      case "years":
        dueDate.setFullYear(dueDate.getFullYear() + interval);
        break;
    }
    return dueDate.toISOString();
  };

  // Get task type from task name
  const getTaskType = (taskName: string): string => {
    const lower = taskName.toLowerCase();
    if (lower.includes("water")) return "water";
    if (lower.includes("fertiliz") || lower.includes("feed")) return "fertilize";
    if (lower.includes("repot")) return "repot";
    if (lower.includes("prun") || lower.includes("trim")) return "prune";
    return "other";
  };

  // Save plant
  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname for your plant");
      return;
    }

    setSaving(true);

    try {
      // 1. Upload image if selected
      let imageUrl: string | undefined;
      if (selectedImage) {
        const result = await uploadFile(selectedImage, { bucket: "plant-images" });
        imageUrl = result.url;
      }

      // 2. Create plant
      const newPlant = await addPlantMutation.mutateAsync({
        nickname: nickname.trim(),
        species: species.trim() || undefined,
        scientific_name: scientificName.trim() || undefined,
        location: location.trim() || undefined,
        image_url: imageUrl,
      });

      // 3. Create care tasks for enabled presets
      const taskPromises: Promise<unknown>[] = [];

      for (const [key, preset] of Object.entries(presets)) {
        if (preset.enabled) {
          const taskName = PRESET_TASKS[key as keyof typeof PRESET_TASKS]?.label || key;
          const unit = key === "repot" ? "months" : "days";
          taskPromises.push(
            createCareTaskMutation.mutateAsync({
              plant_id: newPlant.id,
              task_name: taskName,
              task_type: getTaskType(taskName),
              repeat_interval: preset.interval,
              repeat_unit: unit,
              due_date: calculateDueDate(preset.interval, unit),
              is_recurring: true,
            })
          );
        }
      }

      // 4. Create custom tasks
      for (const task of customTasks) {
        if (task.name.trim()) {
          taskPromises.push(
            createCareTaskMutation.mutateAsync({
              plant_id: newPlant.id,
              task_name: task.name.trim(),
              task_type: getTaskType(task.name),
              repeat_interval: task.interval,
              repeat_unit: task.unit,
              due_date: calculateDueDate(task.interval, task.unit),
              is_recurring: true,
            })
          );
        }
      }

      await Promise.all(taskPromises);

      toast.success("Plant added!");
      handleOpenChange(false);
      navigate(`/plant/${newPlant.id}`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save plant. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Render method selection step
  const renderMethodStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        How would you like to add your plant?
      </p>
      <div className="space-y-3">
        <button
          onClick={handleScan}
          className="w-full p-6 rounded-2xl bg-gradient-to-br from-plant-lime/20 to-plant-lime/5 border-2 border-plant-lime/30 hover:border-plant-lime/50 transition-all flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-plant-lime/20 flex items-center justify-center">
            <ScanLine size={32} className="text-plant-lime" />
          </div>
          <span className="font-bold text-lg">Scan plant</span>
          <span className="text-xs text-muted-foreground">Take a photo to scan your plant</span>
        </button>

        <button
          onClick={handleManualEntry}
          className="w-full p-6 rounded-2xl bg-muted border-2 border-transparent hover:border-primary/30 transition-all flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <Leaf size={32} className="text-muted-foreground" />
          </div>
          <span className="font-bold text-lg">Enter Manually</span>
          <span className="text-xs text-muted-foreground">Add plant details yourself</span>
        </button>
      </div>
    </div>
  );

  // Render scan step
  const renderScanStep = () => (
    <div className="space-y-4">
      {scanning ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Scanning plant...</p>
        </div>
      ) : scanError ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <X size={32} className="text-destructive" />
            </div>
            <p className="text-sm text-destructive">{scanError}</p>
          </div>
          <div className="space-y-2">
            <Button className="w-full" onClick={handleScan}>
              <Camera size={16} className="mr-1" /> Try again
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : scanResults && scanResults.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Scan Results</h3>
            <span className="text-xs text-muted-foreground">
              {(scanResults[0].score * 100).toFixed(1)}% match
            </span>
          </div>

          {/* Best match card */}
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Scanned plant"
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4 space-y-2">
              <p className="font-bold text-lg">{scanResults[0].scientificName}</p>
              {scanResults[0].commonNames.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {scanResults[0].commonNames.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              className="w-full gradient-leaf text-primary-foreground"
              onClick={() => handleAddFromScan(scanResults[0])}
            >
              <Plus size={16} className="mr-1" /> Add to my collection
            </Button>
            <Button variant="outline" className="w-full" onClick={handleScan}>
              <Camera size={16} className="mr-1" /> Scan again
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera size={32} className="text-primary" />
          </div>
          <p className="text-sm">Take a photo to scan your plant</p>
          <Button onClick={handleScan}>
            <Camera size={16} className="mr-2" /> Take photo
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  // Render confirm step
  const renderConfirmStep = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {scanResults && scanResults.length > 0 ? (
          <button
            onClick={() => setCurrentStep("scan")}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
        ) : (
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <h3 className="font-bold text-lg">Confirm Plant Details</h3>
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label>Plant Photo</Label>
        {imagePreview ? (
          <div className="relative w-full h-40 rounded-xl overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:bg-muted transition-colors">
            <Camera size={24} className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">Tap to add a photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />
          </label>
        )}
      </div>

      {/* Nickname */}
      <div className="space-y-2">
        <Label htmlFor="nickname">
          Nickname <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nickname"
          placeholder="e.g. Monty the Monstera"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      {/* Species */}
      <div className="space-y-2">
        <Label htmlFor="species">Species</Label>
        <Input
          id="species"
          placeholder="e.g. Monstera"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        />
      </div>

      {/* Scientific Name */}
      <div className="space-y-2">
        <Label htmlFor="scientificName">Scientific Name</Label>
        <Input
          id="scientificName"
          placeholder="e.g. Monstera deliciosa"
          value={scientificName}
          onChange={(e) => setScientificName(e.target.value)}
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g. Living room window"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <Separator />

      {/* Care Schedule */}
      <div className="space-y-4">
        <h4 className="font-bold text-base">Care Schedule</h4>

        {/* Preset tasks */}
        <div className="space-y-3">
          {Object.entries(PRESET_TASKS).map(([key, task]) => {
            const Icon = task.icon;
            const preset = presets[key];
            const isMonths = key === "repot";

            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
              >
                <Checkbox
                  id={`preset-${key}`}
                  checked={preset.enabled}
                  onCheckedChange={() => togglePreset(key)}
                />
                <div className="flex-1 flex items-center gap-2">
                  <Icon size={16} className="text-primary" />
                  <Label htmlFor={`preset-${key}`} className="flex-1 cursor-pointer">
                    {task.label}
                  </Label>
                </div>
                {preset.enabled && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">every</span>
                    <Input
                      type="number"
                      min={1}
                      max={isMonths ? 24 : 90}
                      value={preset.interval}
                      onChange={(e) => updatePresetInterval(key, parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-center"
                    />
                    <Select
                      value={isMonths ? "months" : "days"}
                      onValueChange={(v) => {/* unit is fixed for presets */}}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isMonths ? (
                          <SelectItem value="months">months</SelectItem>
                        ) : (
                          REPEAT_UNITS.filter(u => u !== "years").map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom tasks */}
        {customTasks.length > 0 && (
          <div className="space-y-3">
            {customTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-3 rounded-xl bg-muted/50"
              >
                <Input
                  placeholder="Task name"
                  value={task.name}
                  onChange={(e) => updateCustomTask(task.id, "name", e.target.value)}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">every</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={task.interval}
                    onChange={(e) => updateCustomTask(task.id, "interval", parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center"
                  />
                </div>
                <Select
                  value={task.unit}
                  onValueChange={(v) => updateCustomTask(task.id, "unit", v)}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => removeCustomTask(task.id)}
                  className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add custom task button */}
        <button
          onClick={addCustomTask}
          className="w-full py-3 rounded-xl border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add custom task
        </button>
      </div>

      <Separator />

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving || uploading || !nickname.trim()}
        className="w-full gradient-leaf text-primary-foreground hover:opacity-90"
      >
        {saving || uploading ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Saving...
          </>
        ) : (
          "Save to collection"
        )}
      </Button>
    </div>
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {isMobile ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto pb-8">
            <SheetHeader className="mb-4">
              <SheetTitle>
                {currentStep === "method" && "Add Plant"}
                {currentStep === "scan" && "Scan Plant"}
                {currentStep === "confirm" && "Confirm Details"}
              </SheetTitle>
            </SheetHeader>

            {currentStep === "method" && renderMethodStep()}
            {currentStep === "scan" && renderScanStep()}
            {currentStep === "confirm" && renderConfirmStep()}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle>
                {currentStep === "method" && "Add Plant"}
                {currentStep === "scan" && "Scan Plant"}
                {currentStep === "confirm" && "Confirm Details"}
              </DialogTitle>
            </DialogHeader>

            {currentStep === "method" && renderMethodStep()}
            {currentStep === "scan" && renderScanStep()}
            {currentStep === "confirm" && renderConfirmStep()}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}