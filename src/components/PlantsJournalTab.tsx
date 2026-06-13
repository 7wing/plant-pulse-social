import { Leaf, Loader2 } from "lucide-react";
import { usePlants } from "@/queries/plants";
import { useAllCareLogs } from "@/queries/careLogs";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlantsJournalTab() {
  const { data: plants = [] } = usePlants();
  const { data: careLogs = [], isLoading } = useAllCareLogs();

  const plantMap = new Map(plants.map((p) => [p.id, p]));

  const entries = careLogs
    .map((log) => {
      const plant = log.plant_id ? plantMap.get(log.plant_id) : undefined;
      return {
        id: log.id,
        date: log.logged_at,
        plantName: plant?.nickname || plant?.species || "Unknown plant",
        plantImage: plant?.image_url,
        careType: log.care_type,
        notes: log.notes,
      };
    })
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl shadow-card p-3 flex gap-3">
            <Skeleton className="w-16 h-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-3">
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <Leaf size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No journal entries yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Log care activities on your plants to see them here.</p>
        </div>
      ) : (
        entries.map((entry) => {
          const dateText = entry.date
            ? new Date(entry.date).toLocaleDateString("default", { month: "short", day: "numeric" })
            : "";
          return (
            <div key={entry.id} className="bg-card rounded-2xl shadow-card p-3 flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                {entry.plantImage ? (
                  <img src={entry.plantImage} alt={entry.plantName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Leaf size={24} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold truncate">{entry.plantName}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{dateText}</span>
                </div>
                <p className="text-xs font-medium text-primary mt-0.5 capitalize">{entry.careType}</p>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.notes}</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
