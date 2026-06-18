import { useState, useMemo } from "react";
import { usePlants } from "@/queries/plants";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/queries/profile";
import { useCareTasks, useCompleteCareTask, getTodayTasks, getUpcomingTasks, getCompletedTasks, getOverdueTasks } from "@/queries/careTasks";
import type { CareTaskWithPlant } from "@/queries/careTasks";
import CareTaskList from "@/components/CareTaskList";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Sprout, PartyPopper, Sparkles, Calendar, CheckCircle2 } from "lucide-react";


export default function CareDashboard() {
  const { data: plants = [], isLoading: plantsLoading } = usePlants();
  const { data: allTasks = [], isLoading: tasksLoading } = useCareTasks();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const completeTask = useCompleteCareTask();

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = profile?.display_name || profile?.username || "Plant Parent";

  // Pre-build task lookup map to eliminate O(plants × tasks) filtering
  const tasksByPlantId = useMemo(() => {
    const map = new Map<string, CareTaskWithPlant[]>();
    for (const task of allTasks) {
      const list = map.get(task.plant_id) ?? [];
      list.push(task);
      map.set(task.plant_id, list);
    }
    return map;
  }, [allTasks]);

  // Memoize derived task lists
  const todayTasks = useMemo(() => getTodayTasks(allTasks), [allTasks]);
  const upcomingTasks = useMemo(() => getUpcomingTasks(allTasks), [allTasks]);
  const overdueTasks = useMemo(() => getOverdueTasks(allTasks), [allTasks]);
  const totalCompleted = useMemo(() => getCompletedTasks(allTasks).length, [allTasks]);
  const allCompletedTasks = useMemo(() => getCompletedTasks(allTasks), [allTasks]);

  // Memoize stats using the pre-built map
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { totalPlants, healthyPlants, needCarePlants } = useMemo(() => {
    const total = plants.length;

    let healthy = 0;
    let needCare = 0;

    for (const plant of plants) {
      const plantTasks = tasksByPlantId.get(plant.id) ?? [];

      const hasOverdue = plantTasks.some((t) => {
        if (t.completed_at) return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < todayStart;
      });

      const hasDueToday = plantTasks.some((t) => {
        if (t.completed_at) return false;
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        const todayEnd = new Date(todayStart);
        todayEnd.setHours(23, 59, 59, 999);
        return due >= todayStart && due <= todayEnd;
      });

      if (!hasOverdue) healthy++;
      if (hasDueToday || hasOverdue) needCare++;
    }

    return { totalPlants: total, healthyPlants: healthy, needCarePlants: needCare };
  }, [plants, tasksByPlantId, todayStart]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      await completeTask.mutateAsync(taskId);
    } catch (error) {
      console.error("Failed to complete task:", error);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const isLoading = plantsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="pb-4">
        <div className="px-4 space-y-4 mt-2">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasAnyTasks = todayTasks.length > 0 || upcomingTasks.length > 0 || totalCompleted > 0 || overdueTasks.length > 0;

  return (
    <div className="pb-4">
      {/* Greeting + stats */}
      <div className="px-4 pt-2 pb-3">
        <p className="text-xs text-muted-foreground">{greeting} <Leaf size={14} className="inline text-plant-live" /></p>
        <p className="text-sm font-bold">{displayName}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {totalPlants} plants · {healthyPlants} healthy · {needCarePlants} need care
        </p>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border mb-4" />

      {/* Care Tasks sections */}
      <div className="px-4 space-y-6">
        {!hasAnyTasks ? (
          <div className="text-center py-12">
            <Sprout size={48} className="text-muted-foreground mx-auto" />
            <p className="text-base font-semibold mt-4">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No care tasks right now.</p>

          </div>
        ) : (
          <>
            {/* Overdue tasks */}
            {overdueTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-destructive uppercase tracking-wide px-1 mb-2">
                  Overdue
                </h3>
                <CareTaskList
                  tasks={overdueTasks}
                  onComplete={handleCompleteTask}
                  completingTaskId={completingTaskId}
                  emptyMessage="No overdue tasks"
                  emptyIcon={<PartyPopper size={24} className="text-muted-foreground" />}
                />
              </div>
            )}

            {/* Today tasks */}
            {todayTasks.length > 0 && (
              <div>
                <CareTaskList
                  title="Today"
                  tasks={todayTasks}
                  onComplete={handleCompleteTask}
                  completingTaskId={completingTaskId}
                  emptyMessage="No tasks due today"
                  emptyIcon={<Sparkles size={24} className="text-muted-foreground" />}
                />
              </div>
            )}

            {/* Upcoming tasks */}
            {upcomingTasks.length > 0 && (
              <div>
                <CareTaskList
                  title="Upcoming"
                  tasks={upcomingTasks}
                  onComplete={handleCompleteTask}
                  completingTaskId={completingTaskId}
                  emptyMessage="No upcoming tasks"
                  emptyIcon={<Calendar size={24} className="text-muted-foreground" />}
                />
              </div>
            )}

            {/* Completed tasks */}
            {totalCompleted > 0 && (
              <div>
                {showCompleted ? (
                  <CareTaskList
                    title="Completed"
                    tasks={allCompletedTasks}
                    onComplete={handleCompleteTask}
                    completingTaskId={completingTaskId}
                    emptyMessage="No completed tasks"
                    emptyIcon={<CheckCircle2 size={24} className="text-muted-foreground" />}
                  />
                ) : (
                  <CareTaskList
                    title="Completed"
                    tasks={allCompletedTasks.slice(0, 2)}
                    onComplete={handleCompleteTask}
                    completingTaskId={completingTaskId}
                    emptyMessage="No completed tasks"
                    emptyIcon={<CheckCircle2 size={24} className="text-muted-foreground" />}
                  />
                )}
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-xs text-primary font-medium hover:underline mt-2 px-1"
                >
                  {showCompleted ? "Hide completed" : `Show all ${totalCompleted} completed`}
                </button>
              </div>
            )}


          </>
        )}
      </div>


    </div>
  );
}
