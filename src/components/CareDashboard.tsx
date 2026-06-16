import { useState } from "react";
import { usePlants } from "@/queries/plants";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/queries/profile";
import { useCareTasks, useCompleteCareTask, getTodayTasks, getUpcomingTasks, getCompletedTasks, getOverdueTasks } from "@/queries/careTasks";
import type { CareTaskWithPlant } from "@/queries/careTasks";
import CareTaskList from "@/components/CareTaskList";
import AddCareTaskSheet from "@/components/AddCareTaskSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CareDashboard() {
  const { data: plants = [], isLoading: plantsLoading } = usePlants();
  const { data: allTasks = [], isLoading: tasksLoading } = useCareTasks();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const completeTask = useCompleteCareTask();

  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = profile?.display_name || profile?.username || "Plant Parent";

  // Tasks
  const todayTasks = getTodayTasks(allTasks);
  const upcomingTasks = getUpcomingTasks(allTasks);
  const completedTasks = getCompletedTasks(allTasks).slice(0, 5);
  const overdueTasks = getOverdueTasks(allTasks);

  // Stats
  const totalPlants = plants.length;
  const healthyPlants = plants.filter((plant) => {
    const plantTasks = allTasks.filter((t) => t.plant_id === plant.id);
    const plantOverdue = plantTasks.some((t) => {
      if (t.completed_at) return false;
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date(new Date().setHours(0, 0, 0, 0));
    });
    return !plantOverdue;
  }).length;
  const needCarePlants = plants.filter((plant) => {
    const plantTasks = allTasks.filter((t) => t.plant_id === plant.id);
    return plantTasks.some((t) => {
      if (t.completed_at) return false;
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return due >= todayStart && due <= todayEnd;
    }) || overdueTasks.some((t) => t.plant_id === plant.id);
  }).length;

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

  const hasAnyTasks = todayTasks.length > 0 || upcomingTasks.length > 0 || completedTasks.length > 0 || overdueTasks.length > 0;

  return (
    <div className="pb-4">
      {/* Greeting + stats */}
      <div className="px-4 pt-2 pb-3">
        <p className="text-xs text-muted-foreground">{greeting} 🌿</p>
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
            <span className="text-4xl" role="img" aria-hidden="true">🌱</span>
            <p className="text-base font-semibold mt-4">All caught up! 🌿</p>
            <p className="text-sm text-muted-foreground mt-1">No care tasks right now.</p>
            <Button
              onClick={() => setAddTaskOpen(true)}
              className="mt-4 gradient-leaf text-primary-foreground"
            >
              <Plus size={16} className="mr-2" />
              Add care task
            </Button>
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
                  emptyIcon="🎉"
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
                  emptyIcon="✨"
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
                  emptyIcon="📅"
                />
              </div>
            )}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div>
                <CareTaskList
                  title="Completed"
                  tasks={completedTasks}
                  onComplete={handleCompleteTask}
                  completingTaskId={completingTaskId}
                  emptyMessage="No completed tasks"
                  emptyIcon="✅"
                />
              </div>
            )}

            {/* Add button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => setAddTaskOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus size={16} />
                Add care task
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Add Care Task Sheet */}
      <AddCareTaskSheet open={addTaskOpen} onOpenChange={setAddTaskOpen} />
    </div>
  );
}
