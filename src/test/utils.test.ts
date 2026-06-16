import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names with tailwind", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class", !isActive && "inactive-class");
    expect(result).toBe("base-class active-class");
  });

  it("handles clsx array syntax", () => {
    const classes = ["class-one", "class-two"];
    const result = cn(classes);
    expect(result).toBe("class-one class-two");
  });

  it("handles object syntax for conditional classes", () => {
    const condition = true;
    const result = cn({
      "conditional-true": condition,
      "conditional-false": !condition,
    });
    expect(result).toBe("conditional-true");
  });

  it("handles mixed input types", () => {
    const result = cn(
      "base",
      ["array1", "array2"],
      { conditional: true }
    );
    expect(result).toBe("base array1 array2 conditional");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("deduplicates tailwind classes", () => {
    const result = cn("text-red-500", "text-red-500");
    expect(result).toBe("text-red-500");
  });

  it("handles undefined and null values", () => {
    const result = cn("base-class", undefined, null, "another-class");
    expect(result).toBe("base-class another-class");
  });

  it("preserves important modifier order", () => {
    // When merging conflicting tailwind classes, twMerge handles the order
    const result = cn("px-2 px-4");
    expect(result).toBe("px-4");
  });
});