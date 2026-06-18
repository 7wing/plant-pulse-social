import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scan, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { PlantSuggestion } from "@/lib/plantnet";

interface PlantScanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: PlantSuggestion[] | null;
  loading: boolean;
  onViewGuide?: (speciesName: string) => void;
}

export default function PlantScanSheet({
  open,
  onOpenChange,
  results,
  loading,
  onViewGuide,
}: PlantScanSheetProps) {
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState<PlantSuggestion | null>(
    null
  );

  const handleViewGuide = (suggestion: PlantSuggestion) => {
    // Try to navigate to a matching care guide
    // For now, navigate to explore with the search term
    if (onViewGuide) {
      onViewGuide(suggestion.scientificName);
    } else {
      // Close the sheet and search in explore
      onOpenChange(false);
      // Navigate to explore with the search
      navigate(`/explore?q=${encodeURIComponent(suggestion.scientificName)}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Scan size={20} />
            Plant Identification
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Scanning plant...</p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl shadow-card p-4 border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-foreground">
                        {result.scientificName}
                      </p>
                      {result.commonNames.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.commonNames.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 px-2 py-1 rounded-full bg-plant-lime/10 text-plant-lime text-xs font-bold">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewGuide(result)}
                      className="flex-1"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      View care guide
                    </Button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => onOpenChange(false)}
                className="w-full py-3 rounded-xl bg-muted text-sm font-semibold text-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No results found. Try a clearer photo.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}