import { Scan } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PlantSuggestion } from "@/lib/plantnet";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: PlantSuggestion[] | null;
  loading: boolean;
}

export default function PlantScanSheet({ open, onOpenChange, results, loading }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
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
              <p className="text-sm">Identifying plant...</p>
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
                      <p className="font-bold text-foreground">{result.scientificName}</p>
                      {result.commonNames.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.commonNames.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 px-2 py-1 rounded-full bg-plant-lime/10 text-plant-lime text-xs font-bold">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => onOpenChange(false)}
                className="w-full py-3 rounded-xl bg-muted text-sm font-semibold text-foreground mt-2"
              >
                Scan Again
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