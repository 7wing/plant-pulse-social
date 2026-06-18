import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type CareTask = Database["public"]["Tables"]["care_tasks"]["Row"];
export type CareTaskInsert = Database["public"]["Tables"]["care_tasks"]["Insert"];
export type CareTaskUpdate = Database["public"]["Tables"]["care_tasks"]["Update"];

interface CareTaskWithPlant extends CareTask {
  plants: {
    id: string;
    nickname: string;
    image_url: string | null;
  } | null;
}

// Get today's date at midnight (start of day)
function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Get end of today
function getEndOfToday(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

// Get date N days from now at midnight
function getDaysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

// Format due date to readable string
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No date";

  const due = new Date(dueDate);
  const today = getStartOfToday();
  const todayEnd = getEndOfToday();
  const tomorrow = getDaysFromNow(1);
  const yesterday = getDaysFromNow(-1);

  // Due today
  if (due <= todayEnd && due >= today) {
    return "today";
  }

  // Due tomorrow
  if (due >= tomorrow && due < getDaysFromNow(2)) {
    return "tomorrow";
  }

  // Due in the past (yesterday or earlier)
  if (due < today) {
    const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "yesterday";
    return `${diffDays} days ago`;
  }

  // Due in the future
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return `in ${diffDays} days`;
}

// Format relative time (for care history)
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return date.toLocaleDateString();
}

// Get tasks due today (due_date <= end of today, completed_at IS NULL)
export function getTodayTasks(tasks: CareTaskWithPlant[]): CareTaskWithPlant[] {
  const todayStart = getStartOfToday();
  const todayEnd = getEndOfToday();

  return tasks.filter((task) => {
    if (task.completed_at) return false;
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    return due >= todayStart && due <= todayEnd;
  });
}

// Get upcoming tasks (today < due_date <= today+7, completed_at IS NULL)
export function getUpcomingTasks(tasks: CareTaskWithPlant[]): CareTaskWithPlant[] {
  const tomorrow = getDaysFromNow(1);
  const sevenDaysFromNow = getDaysFromNow(7);

  return tasks.filter((task) => {
    if (task.completed_at) return false;
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    return due >= tomorrow && due <= sevenDaysFromNow;
  }).sort((a, b) => {
    return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
  });
}

// Get overdue tasks (due_date < today, completed_at IS NULL)
export function getOverdueTasks(tasks: CareTaskWithPlant[]): CareTaskWithPlant[] {
  const todayStart = getStartOfToday();

  return tasks.filter((task) => {
    if (task.completed_at) return false;
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    return due < todayStart;
  });
}

// Get completed tasks (completed_at NOT NULL, ordered by completed_at desc)
export function getCompletedTasks(tasks: CareTaskWithPlant[]): CareTaskWithPlant[] {
  return tasks
    .filter((task) => task.completed_at !== null)
    .sort((a, b) => {
      return new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime();
    });
}

export function useCareTasks(plantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["careTasks", user?.id, plantId],
    queryFn: async () => {
      let query = supabase
        .from("care_tasks")
        .select("*, plants(nickname, image_url)")
        .eq("user_id", user!.id)
        .order("due_date", { ascending: true });

      if (plantId) {
        query = query.eq("plant_id", plantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CareTaskWithPlant[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCareTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: CareTaskInsert) => {
      const { data, error } = await supabase
        .from("care_tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careTasks"] });
    },
  });
}

export function useUpdateCareTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CareTaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("care_tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careTasks"] });
    },
  });
}

export function useDeleteCareTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("care_tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careTasks"] });
    },
  });
}

export function useCompleteCareTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      // 1. Fetch the task to get its details
      const { data: task, error: fetchError } = await supabase
        .from("care_tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (fetchError) throw fetchError;
      if (!task) throw new Error("Task not found");

      // 2. Update the task: set completed_at = now()
      const { error: updateError } = await supabase
        .from("care_tasks")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", taskId);

      if (updateError) throw updateError;

      // 3. Insert into care_logs
      const { error: logError } = await supabase
        .from("care_logs")
        .insert({
          task_id: taskId,
          plant_id: task.plant_id,
          user_id: user!.id,
          care_type: task.task_type,
          scheduled_due: task.due_date,
          logged_at: new Date().toISOString(),
        });

      if (logError) throw logError;

      // TODO: If is_recurring is true, create the next occurrence:
      // due_date = now() + repeat_interval (days/weeks/months/years based on repeat_unit)
      // This should ideally be handled by a database trigger for consistency.
    },
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["careTasks"] });
      // Invalidate care score and history queries
      queryClient.invalidateQueries({ queryKey: ["careTaskHistory"] });
      queryClient.invalidateQueries({ queryKey: ["careScore"] });
    },
  });
}

interface CareLogWithTask {
  id: string;
  task_id: string | null;
  plant_id: string | null;
  user_id: string | null;
  care_type: string;
  scheduled_due: string | null;
  logged_at: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string | null;
  care_tasks: {
    task_name: string;
    task_type: string;
  } | null;
}

export function useCareTaskHistory(plantId?: string, limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["careTaskHistory", user?.id, plantId, limit],
    queryFn: async () => {
      let query = supabase
        .from("care_logs")
        .select("*, care_tasks(task_name, task_type)")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false });

      if (plantId) {
        query = query.eq("plant_id", plantId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CareLogWithTask[];
    },
    enabled: !!user?.id,
  });
}

export function useCareTaskHistoryLast30Days(plantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["careTaskHistory", user?.id, plantId, "last30days"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from("care_logs")
        .select("*, care_tasks(task_name, task_type)")
        .eq("user_id", user!.id)
        .gte("logged_at", thirtyDaysAgo.toISOString())
        .order("logged_at", { ascending: false });

      if (plantId) {
        query = query.eq("plant_id", plantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CareLogWithTask[];
    },
    enabled: !!user?.id,
  });
}

interface CareScoreData {
  score: number;
  onTimeCount: number;
  totalCount: number;
  hasScheduledTasks: boolean;
}

// Calculate care score based on on-time completion of recurring care tasks
export function usePlantCareScore(plantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["careScore", user?.id, plantId],
    queryFn: async (): Promise<CareScoreData> => {
      if (!user?.id || !plantId) {
        return { score: 100, onTimeCount: 0, totalCount: 0, hasScheduledTasks: false };
      }

      // Get all care tasks for this plant (recurring ones)
      const { data: careTasks, error: tasksError } = await supabase
        .from("care_tasks")
        .select("*")
        .eq("plant_id", plantId)
        .eq("user_id", user.id)
        .eq("is_recurring", true);

      if (tasksError) throw tasksError;

      // Get all care logs for this plant in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: careLogs, error: logsError } = await supabase
        .from("care_logs")
        .select("*")
        .eq("plant_id", plantId)
        .eq("user_id", user.id)
        .gte("logged_at", thirtyDaysAgo.toISOString());

      if (logsError) throw logsError;

      // Calculate scheduled tasks (each recurring task has a schedule,
      // so we estimate based on the repeat interval)
      const scheduledTaskCount = careTasks.reduce((count, task) => {
        if (!task.due_date || !task.repeat_interval) return count;

        // Calculate how many times this task should have been done in 30 days
        let daysPerOccurrence = 0;
        switch (task.repeat_unit) {
          case "days":
            daysPerOccurrence = task.repeat_interval;
            break;
          case "weeks":
            daysPerOccurrence = task.repeat_interval * 7;
            break;
          case "months":
            daysPerOccurrence = task.repeat_interval * 30;
            break;
          default:
            daysPerOccurrence = task.repeat_interval;
        }

        if (daysPerOccurrence > 0) {
          count += Math.ceil(30 / daysPerOccurrence);
        }
        return count;
      }, 0);

      // Check on-time completions
      // A completion is on-time if it was done within 1 day of the scheduled due date
      let onTimeCount = 0;

      for (const log of careLogs) {
        if (!log.scheduled_due || !log.logged_at) continue;

        const scheduledDate = new Date(log.scheduled_due);
        const loggedDate = new Date(log.logged_at);

        // Calculate the difference in days
        const diffMs = Math.abs(loggedDate.getTime() - scheduledDate.getTime());
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // On-time if completed within 1 day of scheduled date
        if (diffDays <= 1) {
          onTimeCount++;
        }
      }

      // If no scheduled tasks, default to 100%
      if (scheduledTaskCount === 0) {
        return {
          score: 100,
          onTimeCount: careLogs.length,
          totalCount: careLogs.length,
          hasScheduledTasks: false
        };
      }

      const score = Math.round((onTimeCount / scheduledTaskCount) * 100);
      return { 
        score: Math.min(100, Math.max(0, score)), 
        onTimeCount, 
        totalCount: scheduledTaskCount,
        hasScheduledTasks: true 
      };
    },
    enabled: !!user?.id && !!plantId,
  });
}

export function useClearCareHistory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plantId: string) => {
      const { error } = await supabase
        .from("care_logs")
        .delete()
        .eq("plant_id", plantId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careTaskHistory"] });
      queryClient.invalidateQueries({ queryKey: ["careScore"] });
    },
  });
}