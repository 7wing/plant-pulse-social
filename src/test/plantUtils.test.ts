import { describe, it, expect } from "vitest";
import { formatNextWater, isWaterToday, healthColor, healthBg } from "@/lib/plantUtils";

describe("plantUtils", () => {
  it("formatNextWater returns correct strings", () => {
    expect(formatNextWater(null)).toBe("Not set");
    // You can add more assertions using Date manipulations:
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const today = new Date().toISOString();
    expect(formatNextWater(yesterday)).toBe("Overdue");
    expect(formatNextWater(today)).toBe("Today");
    expect(formatNextWater(tomorrow)).toBe("Tomorrow");
  });

  it("healthColor picks correct class", () => {
    expect(healthColor(100)).toContain("success");
    expect(healthColor(50)).toContain("warning");
    expect(healthColor(10)).toContain("live"); // live in this project == danger color
  });

  it("healthBg picks correct class", () => {
    expect(healthBg(100)).toContain("success");
    expect(healthBg(50)).toContain("warning");
    expect(healthBg(10)).toContain("live");
  });

  it("isWaterToday returns true only for today's date", () => {
    const today = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    expect(isWaterToday(today)).toBe(true);
    expect(isWaterToday(tomorrow)).toBe(false);
    expect(isWaterToday(null)).toBe(false);
  });
});