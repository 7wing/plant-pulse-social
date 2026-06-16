import { useState } from "react";
import { ArrowLeft, Camera, Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAddCareLog } from "@/queries/careLogs";
import { useUpload } from "@/hooks/useUpload";

interface PlantNotesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: string;
  onSuccess?: () => void;
}

export default function PlantNotesSheet({ open, onOpenChange, plantId, onSuccess }: PlantNotesSheetProps) {
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const addCareLog = useAddCareLog();
  const { uploadFile, uploading } = useUpload();
  
  const isLoading = addCareLog.isPending || uploading;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!notes.trim() && !imageFile) return;
    
    try {
      let imageUrl: string | undefined;
      
      if (imageFile) {
        imageUrl = (await uploadFile(imageFile, { bucket: "plant-images" })).url;
      }

      await addCareLog.mutateAsync({
        plant_id: plantId,
        care_type: "note",
        notes: notes.trim() || undefined,
        image_url: imageUrl,
      });

      // Reset form
      setNotes("");
      setImageFile(null);
      setImagePreview(null);
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleClose = () => {
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <ArrowLeft size={16} />
              </button>
              <SheetTitle>Add Note</SheetTitle>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || (!notes.trim() && !imageFile)}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Save
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your plant..."
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Note preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/80 transition-colors"
                >
                  <X size={16} className="text-primary-foreground" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-muted-foreground">
                <Camera size={24} />
                <div className="text-center">
                  <p className="text-sm font-medium">Add photo</p>
                  <p className="text-xs">Optional</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Error message */}
          {addCareLog.isError && (
            <p className="text-sm text-destructive">Failed to save note. Please try again.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}