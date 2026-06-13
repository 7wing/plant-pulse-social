import { Bell, Droplets, Loader2 } from "lucide-react";
import { usePlants } from "@/queries/plants";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/queries/profile";
import { useLogCareTask } from "@/queries/careLogs";
import { Skeleton } from "@/components/ui/skeleton";

const AVATAR_FALLBACK = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";
const FALLBACK_PLANT_IMAGE = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop";

function isWateredToday(lastWateredAt: string | null) {
  if (!lastWateredAt) return false;
  const last = new Date(lastWateredAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);
  return lastDay.getTime() === today.getTime();
}

function isWaterDueSoon(nextWaterAt: string | null) {
  if (!nextWaterAt) return { text: "Not scheduled", urgent: false };
  const next = new Date(nextWaterAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDay = new Date(next);
  nextDay.setHours(0, 0, 0, 0);
  const diffMs = nextDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { text: "Water today", urgent: true };
  if (diffDays === 1) return { text: "Water tomorrow", urgent: false };
  return { text: `Water in ${diffDays} days`, urgent: false };
}

export default function CareDashboard() {
  const { data: plants = [], isLoading } = usePlants();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = profile?.display_name || profile?.username || "Plant Parent";
  const avatarUrl = profile?.avatar_url || AVATAR_FALLBACK;

  const logCareTask = useLogCareTask();

  const careTasks = plants.map((plant) => {
    const taskInfo = isWaterDueSoon(plant.next_water_at);
    const isCompleted = isWateredToday(plant.last_watered_at);
    return {
      id: plant.id,
      name: plant.nickname,
      task: taskInfo.text,
      img: plant.image_url || FALLBACK_PLANT_IMAGE,
      urgent: taskInfo.urgent,
      completed: isCompleted,
      icon: Droplets,
      waterFrequencyDays: plant.water_frequency_days,
    };
  });

  const completedCount = careTasks.filter((t) => t.completed).length;
  const totalCount = careTasks.length;
  const urgentCount = careTasks.filter((t) => t.urgent).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" />
            <div>
              <p className="text-xs text-muted-foreground">{greeting} 🌿</p>
              <p className="text-sm font-bold">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative" aria-label="Notifications">
              <Bell size={20} className="text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-plant-live rounded-full border-2 border-background" />
            </button>
          </div>
        </div>
      </div>

      {/* Daily Progress Summary */}
      <div className="mx-4 mt-2 mb-4 bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold">Today&apos;s Care 💧</p>
            <p className="text-xs text-muted-foreground">{urgentCount} of {totalCount} plants need water</p>
          </div>
          <div className="w-12 h-12 rounded-full border-[3px] border-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{progressPercent}%</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-1">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Care Reminders List */}
      {isLoading ? (
        <div className="px-4 space-y-2.5 pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-9 h-9 rounded-full" />
            </div>
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No plants yet. Add your first plant to see care reminders!</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
          {careTasks.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 bg-card rounded-xl p-3 shadow-card transition-opacity ${r.completed ? "opacity-50" : ""}`}
              >
                <img src={r.img} alt={r.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${r.completed ? "line-through" : ""}`}>{r.name}</p>
                  <div className="flex items-center gap-1">
                    <Icon size={12} className={r.urgent ? "text-primary" : "text-muted-foreground"} />
                    <p className={`text-xs ${r.urgent ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {r.task}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    !r.completed &&
                    logCareTask.mutate({
                      plantId: r.id,
                      careType: "water",
                      waterFrequencyDays: r.waterFrequencyDays,
                    })
                  }
                  disabled={r.completed || logCareTask.isPending}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    r.completed ? "bg-primary/20" : "bg-primary/10 hover:bg-primary/20"
                  }`}
                  aria-label={r.completed ? `${r.task} completed` : `Mark ${r.task} as done`}
                >
                  {r.completed ? (
                    <span className="text-primary text-sm">✓</span>
                  ) : logCareTask.isPending ? (
                    <Loader2 size={16} className="text-primary animate-spin" />
                  ) : (
                    <Icon size={16} className="text-primary" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Tips */}
      <div className="mx-4 mb-4 gradient-leaf rounded-2xl p-4">
        <p className="text-sm font-bold text-primary-foreground mb-1">🌱 Daily Tip</p>
        <p className="text-xs text-primary-foreground/90">
          Overwatering is the #1 killer of houseplants. Always check the top inch of soil before watering — if it&apos;s still moist, wait another day!
        </p>
      </div>
    </div>
  );
}
