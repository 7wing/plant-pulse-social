import { ArrowLeft } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCareTaskHistory } from "@/queries/careTasks";
import { formatRelativeTime } from "@/queries/careTasks";

interface CareHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: string;
  plantName?: string;
}

interface CareLogEntry {
  id: string;
  care_type: string;
  logged_at: string | null;
  notes: string | null;
  image_url: string | null;
  scheduled_due: string | null;
  care_tasks: {
    task_name: string;
    task_type: string;
  } | null;
}

// Group entries by month/year
function groupByMonthYear(entries: CareLogEntry[]) {
  const groups: Record<string, CareLogEntry[]> = {};
  
  for (const entry of entries) {
    const date = entry.logged_at ? new Date(entry.logged_at) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
  }
  
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      label: formatMonthYear(key),
      items,
    }));
}

function formatMonthYear(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getTaskDisplayName(entry: CareLogEntry): string {
  if (entry.care_tasks?.task_name) {
    return entry.care_tasks.task_name;
  }
  
  // Capitalize care_type for display
  if (entry.care_type === "note") {
    return "Note";
  }
  
  return entry.care_type.charAt(0).toUpperCase() + entry.care_type.slice(1);
}

function getTaskIcon(careType: string): string {
  switch (careType.toLowerCase()) {
    case "water":
      return "💧";
    case "fertilize":
      return "🧪";
    case "repot":
      return "🪴";
    case "prune":
      return "✂️";
    case "note":
      return "📝";
    default:
      return "✓";
  }
}

export default function CareHistorySheet({ open, onOpenChange, plantId, plantName }: CareHistorySheetProps) {
  const { data: careLogs = [], isLoading } = useCareTaskHistory(plantId);
  
  const groupedLogs = groupByMonthYear(careLogs as unknown as CareLogEntry[]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <ArrowLeft size={16} />
              </button>
              <SheetTitle>Care History</SheetTitle>
            </div>
            {plantName && (
              <span className="text-sm text-muted-foreground">{plantName}</span>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : careLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No care history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Completed care tasks will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {groupedLogs.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.items.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-card border"
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                          {getTaskIcon(entry.care_type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {getTaskDisplayName(entry)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {entry.logged_at ? formatRelativeTime(entry.logged_at) : ""}
                            </span>
                          </div>
                          
                          {/* Notes */}
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {entry.notes}
                            </p>
                          )}
                          
                          {/* Image */}
                          {entry.image_url && (
                            <div className="mt-2">
                              <img
                                src={entry.image_url}
                                alt="Care note"
                                className="w-24 h-24 rounded-lg object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}