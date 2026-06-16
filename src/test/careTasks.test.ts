import { describe, it, expect } from "vitest";
import {
  getTaskTypeIcon,
  formatDueDate,
  getTodayTasks,
  getUpcomingTasks,
  getOverdueTasks,
  getCompletedTasks,
} from "@/queries/careTasks";
import type { CareTask } from "@/queries/careTasks";

// Create mock CareTaskWithPlant objects for testing
interface CareTaskWithPlant extends CareTask {
  plants: {
    id: string;
    nickname: string;
    image_url: string | null;
  } | null;
}

function getDateAtMidnight(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function getDateEndOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const createTask = (overrides: Partial<CareTaskWithPlant> = {}): CareTaskWithPlant => {
  const now = new Date().toISOString();
  return {
    id: "task-1",
    user_id: "user-1",
    plant_id: "plant-1",
    task_type: "water",
    task_name: "Water plant",
    due_date: new Date().toISOString(),
    completed_at: null,
    is_recurring: false,
    repeat_interval: null,
    repeat_unit: null,
    notes: null,
    created_at: now,
    updated_at: now,
    ...overrides,
    plants: {
      id: "plant-1",
      nickname: "Fern",
      image_url: null,
      ...(overrides.plants || {}),
    },
  };
};

describe("careTasks utils", () => {
  describe("getTaskTypeIcon", () => {
    it("returns correct icon for water", () => {
      expect(getTaskTypeIcon("water")).toBe("💧");
    });

    it("returns correct icon for fertilize", () => {
      expect(getTaskTypeIcon("fertilize")).toBe("🧪");
    });

    it("returns correct icon for repot", () => {
      expect(getTaskTypeIcon("repot")).toBe("🪴");
    });

    it("returns correct icon for prune", () => {
      expect(getTaskTypeIcon("prune")).toBe("✂️");
    });

    it("returns default for unknown", () => {
      expect(getTaskTypeIcon("unknown")).toBe("⭐");
    });

    it("handles case insensitivity", () => {
      expect(getTaskTypeIcon("WATER")).toBe("💧");
      expect(getTaskTypeIcon("Water")).toBe("💧");
    });
  });

  describe("formatDueDate", () => {
    it("returns 'No date' for null", () => {
      expect(formatDueDate(null)).toBe("No date");
    });

    it("returns 'today' for today", () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      expect(formatDueDate(today.toISOString())).toBe("today");
    });

    it("returns 'tomorrow' for tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      expect(formatDueDate(tomorrow.toISOString())).toBe("tomorrow");
    });

    it("returns 'yesterday' for yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);
      expect(formatDueDate(yesterday.toISOString())).toBe("yesterday");
    });

    it("returns 'in N days' for future date", () => {
      // Use a fixed reference to avoid edge cases around midnight
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);
      const result = formatDueDate(fiveDaysFromNow.toISOString());
      expect(result).toMatch(/^in \d+ days$/);
    });

    it("returns 'N days ago' for past date beyond yesterday", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(12, 0, 0, 0);
      expect(formatDueDate(threeDaysAgo.toISOString())).toBe("3 days ago");
    });
  });

  describe("getTodayTasks", () => {
    it("returns tasks due today only", () => {
      const today = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-today",
          due_date: getDateAtMidnight(today),
        }),
        createTask({
          id: "task-tomorrow",
          due_date: getDateAtMidnight(new Date(today.getTime() + 86400000)),
        }),
        createTask({
          id: "task-yesterday",
          due_date: getDateAtMidnight(new Date(today.getTime() - 86400000)),
        }),
      ];

      const result = getTodayTasks(tasks);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("task-today");
    });

    it("excludes completed tasks", () => {
      const today = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-completed",
          due_date: getDateAtMidnight(today),
          completed_at: new Date().toISOString(),
        }),
      ];

      const result = getTodayTasks(tasks);
      expect(result).toHaveLength(0);
    });

    it("excludes tasks without due_date", () => {
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-no-date",
          due_date: null,
        }),
      ];

      const result = getTodayTasks(tasks);
      expect(result).toHaveLength(0);
    });
  });

  describe("getUpcomingTasks", () => {
    it("returns tasks due in next 7 days", () => {
      const today = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-today",
          due_date: getDateAtMidnight(today),
        }),
        createTask({
          id: "task-tomorrow",
          due_date: getDateAtMidnight(new Date(today.getTime() + 86400000)),
        }),
        createTask({
          id: "task-in-5-days",
          due_date: getDateAtMidnight(new Date(today.getTime() + 5 * 86400000)),
        }),
        createTask({
          id: "task-in-8-days",
          due_date: getDateAtMidnight(new Date(today.getTime() + 8 * 86400000)),
        }),
        createTask({
          id: "task-yesterday",
          due_date: getDateAtMidnight(new Date(today.getTime() - 86400000)),
        }),
      ];

      const result = getUpcomingTasks(tasks);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(["task-tomorrow", "task-in-5-days"]);
    });

    it("sorts by due date ascending", () => {
      const today = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-day-5",
          due_date: getDateAtMidnight(new Date(today.getTime() + 5 * 86400000)),
        }),
        createTask({
          id: "task-day-2",
          due_date: getDateAtMidnight(new Date(today.getTime() + 2 * 86400000)),
        }),
        createTask({
          id: "task-day-3",
          due_date: getDateAtMidnight(new Date(today.getTime() + 3 * 86400000)),
        }),
      ];

      const result = getUpcomingTasks(tasks);
      expect(result[0].id).toBe("task-day-2");
      expect(result[1].id).toBe("task-day-3");
      expect(result[2].id).toBe("task-day-5");
    });

    it("excludes completed tasks", () => {
      const today = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-completed",
          due_date: getDateAtMidnight(new Date(today.getTime() + 3 * 86400000)),
          completed_at: new Date().toISOString(),
        }),
      ];

      const result = getUpcomingTasks(tasks);
      expect(result).toHaveLength(0);
    });
  });

  describe("getOverdueTasks", () => {
    it("returns tasks past due", () => {
      const today = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-yesterday",
          due_date: getDateAtMidnight(new Date(today.getTime() - 86400000)),
        }),
        createTask({
          id: "task-3-days-ago",
          due_date: getDateAtMidnight(new Date(today.getTime() - 3 * 86400000)),
        }),
        createTask({
          id: "task-tomorrow",
          due_date: getDateAtMidnight(new Date(today.getTime() + 86400000)),
        }),
        createTask({
          id: "task-today",
          due_date: getDateAtMidnight(today),
        }),
      ];

      const result = getOverdueTasks(tasks);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toContain("task-yesterday");
      expect(result.map((t) => t.id)).toContain("task-3-days-ago");
    });

    it("excludes completed tasks", () => {
      const today = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-completed",
          due_date: getDateAtMidnight(new Date(today.getTime() - 86400000)),
          completed_at: new Date().toISOString(),
        }),
      ];

      const result = getOverdueTasks(tasks);
      expect(result).toHaveLength(0);
    });

    it("excludes tasks without due_date", () => {
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-no-date",
          due_date: null,
        }),
      ];

      const result = getOverdueTasks(tasks);
      expect(result).toHaveLength(0);
    });
  });

  describe("getCompletedTasks", () => {
    it("returns completed tasks sorted by completion date", () => {
      const now = new Date();
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-old",
          completed_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
        }),
        createTask({
          id: "task-new",
          completed_at: now.toISOString(),
        }),
        createTask({
          id: "task-mid",
          completed_at: new Date(now.getTime() - 86400000).toISOString(),
        }),
        createTask({
          id: "task-incomplete",
          completed_at: null,
        }),
      ];

      const result = getCompletedTasks(tasks);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("task-new");
      expect(result[1].id).toBe("task-mid");
      expect(result[2].id).toBe("task-old");
    });

    it("returns empty array when no tasks are completed", () => {
      const tasks: CareTaskWithPlant[] = [
        createTask({
          id: "task-1",
          completed_at: null,
        }),
        createTask({
          id: "task-2",
          completed_at: null,
        }),
      ];

      const result = getCompletedTasks(tasks);
      expect(result).toHaveLength(0);
    });
  });
});