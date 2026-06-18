import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Plus,
  Loader2,
  Sun,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import {
  usePlantLibraryEntry,
  useSavedGuides,
  useSaveGuide,
  useUnsaveGuide,
} from "@/queries/plantLibrary";
import { useAddPlant } from "@/queries/plants";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=600&fit=crop";

interface CareGuideSheetProps {
  entryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CareGuideSheet({
  entryId,
  open,
  onOpenChange,
}: CareGuideSheetProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Add plant form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [waterDays, setWaterDays] = useState("7");
  const [fertilizeEnabled, setFertilizeEnabled] = useState(false);
  const [fertilizeDays, setFertilizeDays] = useState("30");

  // Reset form state when entryId changes or sheet opens
  useEffect(() => {
    if (open) {
      setShowAddForm(false);
      setNickname("");
      setLocation("");
      setWaterEnabled(true);
      setWaterDays("7");
      setFertilizeEnabled(false);
      setFertilizeDays("30");
    }
  }, [open, entryId]);

  // Fetch plant library entry
  const { data: entry, isLoading } = usePlantLibraryEntry(entryId);

  // Fetch saved guides to check if this one is saved
  const { data: savedGuides = [] } = useSavedGuides();
  const isSaved = savedGuides.some((sg) => sg.plant_library_id === entryId);

  // Mutations
  const saveGuide = useSaveGuide();
  const unsaveGuide = useUnsaveGuide();
  const addPlant = useAddPlant();

  // Pre-fill nickname when entry loads
  useEffect(() => {
    if (entry && !nickname) {
      setNickname(entry.common_name || entry.species_name || "");
    }
  }, [entry, nickname]);

  // Handle save/unsave toggle
  const handleToggleSave = async () => {
    if (!entryId) return;

    try {
      if (isSaved) {
        await unsaveGuide.mutateAsync(entryId);
        toast.success("Guide unsaved");
      } else {
        await saveGuide.mutateAsync(entryId);
        toast.success("Guide saved");
      }
    } catch (err) {
      toast.error("Failed to update saved guide");
    }
  };

  // Handle open add form
  const handleOpenAddForm = () => {
    if (entry) {
      setNickname(entry.common_name || entry.species_name || "");
    }
    setShowAddForm(true);
  };

  // Handle submit new plant
  const handleSubmitPlant = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    try {
      await addPlant.mutateAsync({
        nickname: nickname.trim(),
        species: entry?.species_name || null,
        scientific_name: entry?.species_name || null,
        image_url: entry?.image_url || null,
        water_frequency_days: waterEnabled ? parseInt(waterDays, 10) : null,
        light_requirement: entry?.light || null,
      });

      toast.success("Plant added to your collection!");
      setShowAddForm(false);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["plants"] });
    } catch (err) {
      toast.error("Failed to add plant");
    }
  };

  // Care info row component
  const CareInfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof Sun;
    label: string;
    value: string | null;
  }) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">
          {value || "Care info not available yet"}
        </p>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`${
          isMobile ? "rounded-t-3xl max-h-[85dvh]" : "sm:max-w-md md:max-w-lg"
        } p-0 overflow-y-auto [&>button.absolute]:hidden`}
      >
        {isLoading ? (
          <div className="flex flex-col h-full">
            <Skeleton className="w-full h-56" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ) : entry ? (
          <div className="flex flex-col h-full">
            {/* Add form view */}
            {showAddForm ? (
              <>
                {/* Header with back button */}
                <SheetHeader className="px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      aria-label="Back"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <SheetTitle className="text-base">
                      Add to your collection
                    </SheetTitle>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Plant preview */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <img
                      src={entry.image_url || DEFAULT_IMAGE}
                      alt={entry.species_name || "Plant"}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {entry.species_name}
                      </p>
                      {entry.common_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.common_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nickname */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      placeholder="e.g. My Monstera"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (optional)</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Living room"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {/* Care schedule */}
                  <div className="space-y-3 pt-2">
                    <Label>Care schedule</Label>

                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={waterEnabled}
                          onCheckedChange={(checked) =>
                            setWaterEnabled(!!checked)
                          }
                        />
                        <span className="text-sm">Water</span>
                      </label>
                      {waterEnabled && (
                        <div className="flex items-center gap-2 pl-7">
                          <span className="text-sm text-muted-foreground">
                            Every
                          </span>
                          <Input
                            type="number"
                            min={1}
                            value={waterDays}
                            onChange={(e) => setWaterDays(e.target.value)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            days
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={fertilizeEnabled}
                          onCheckedChange={(checked) =>
                            setFertilizeEnabled(!!checked)
                          }
                        />
                        <span className="text-sm">Fertilize</span>
                      </label>
                      {fertilizeEnabled && (
                        <div className="flex items-center gap-2 pl-7">
                          <span className="text-sm text-muted-foreground">
                            Every
                          </span>
                          <Input
                            type="number"
                            min={1}
                            value={fertilizeDays}
                            onChange={(e) => setFertilizeDays(e.target.value)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            days
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gradient-leaf text-primary-foreground"
                    onClick={handleSubmitPlant}
                    disabled={addPlant.isPending}
                  >
                    {addPlant.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Main content view */}
                <SheetHeader className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onOpenChange(false)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                        aria-label="Close"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <SheetTitle className="text-base">Care Guide</SheetTitle>
                    </div>
                    <button
                      onClick={handleToggleSave}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      aria-label={isSaved ? "Unsave" : "Save"}
                    >
                      {isSaved ? (
                        <BookmarkCheck
                          size={16}
                          className="text-plant-lime"
                        />
                      ) : (
                        <Bookmark size={16} />
                      )}
                    </button>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                  {/* Hero image */}
                  <div className="relative h-56 bg-muted">
                    <img
                      src={entry.image_url || DEFAULT_IMAGE}
                      alt={entry.common_name || entry.species_name || "Plant"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-foreground/10" />
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    {/* Species info */}
                    <div>
                      <h1 className="text-xl font-bold">
                        {entry.species_name || "Unknown species"}
                      </h1>
                      {entry.common_name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.common_name}
                        </p>
                      )}
                    </div>

                    {/* Care info rows */}
                    <div className="space-y-3">
                      <CareInfoRow icon={Sun} label="Light" value={entry.light} />
                      <CareInfoRow
                        icon={Droplets}
                        label="Water"
                        value={entry.water}
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">
                            ⭐
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            Difficulty
                          </p>
                          <p className="text-sm font-medium capitalize">
                            {entry.difficulty || "Not available"}
                          </p>
                        </div>
                      </div>
                      <CareInfoRow
                        icon={AlertTriangle}
                        label="Toxicity"
                        value={entry.toxicity}
                      />
                    </div>

                    {/* Description */}
                    {entry.description && (
                      <div className="pt-2">
                        <h2 className="text-sm font-semibold mb-2">
                          Description
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    )}

                    {/* Add to collection button */}
                    <Button
                      onClick={handleOpenAddForm}
                      className="w-full gradient-leaf text-primary-foreground"
                      size="lg"
                    >
                      <Plus size={18} className="mr-2" />
                      Add to my collection
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}