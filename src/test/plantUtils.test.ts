import { describe, it, expect } from "vitest";
import { formatNextWater, isWaterToday, healthColor, healthBg } from "@/lib/plantUtils";

describe("plantUtils", () => {
  describe("formatNextWater", () => {
    it("returns 'Not set' for null", () => {
      expect(formatNextWater(null)).toBe("Not set");
    });

    it("returns 'Today' for today", () => {
      const today = new Date().toISOString();
      expect(formatNextWater(today)).toBe("Today");
    });

    it("returns 'Tomorrow' for tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(formatNextWater(tomorrow.toISOString())).toBe("Tomorrow");
    });

    it("returns 'Overdue' for past date", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatNextWater(yesterday.toISOString())).toBe("Overdue");
    });

    it("returns 'In N days' for future date", () => {
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
      expect(formatNextWater(fiveDaysFromNow.toISOString())).toBe("In 5 days");
    });
  });

  describe("isWaterToday", () => {
    it("returns true for today", () => {
      const today = new Date().toISOString();
      expect(isWaterToday(today)).toBe(true);
    });

    it("returns false for tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isWaterToday(tomorrow.toISOString())).toBe(false);
    });

    it("returns false for null", () => {
      expect(isWaterToday(null)).toBe(false);
    });

    it("returns false for past date", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isWaterToday(yesterday.toISOString())).toBe(false);
    });
  });

  describe("healthColor", () => {
    it("returns success for >70", () => {
      expect(healthColor(100)).toBe("text-plant-success");
      expect(healthColor(71)).toBe("text-plant-success");
    });

    it("returns warning for 40-70", () => {
      expect(healthColor(70)).toBe("text-plant-warning");
      expect(healthColor(55)).toBe("text-plant-warning");
      expect(healthColor(41)).toBe("text-plant-warning");
    });

    it("returns danger for <40", () => {
      expect(healthColor(40)).toBe("text-plant-live");
      expect(healthColor(0)).toBe("text-plant-live");
      expect(healthColor(25)).toBe("text-plant-live");
    });
  });

  describe("healthBg", () => {
    it("returns success bg for >70", () => {
      expect(healthBg(100)).toBe("bg-plant-success");
      expect(healthBg(71)).toBe("bg-plant-success");
    });

    it("returns warning bg for 40-70", () => {
      expect(healthBg(70)).toBe("bg-plant-warning");
      expect(healthBg(55)).toBe("bg-plant-warning");
      expect(healthBg(41)).toBe("bg-plant-warning");
    });

    it("returns danger bg for <40", () => {
      expect(healthBg(40)).toBe("bg-plant-live");
      expect(healthBg(0)).toBe("bg-plant-live");
      expect(healthBg(25)).toBe("bg-plant-live");
    });
  });
});