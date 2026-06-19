import { describe, it, expect } from "vitest";
import { getToxicityDisplay } from "@/lib/plantLibraryUtils";
import type { PlantLibraryEntry } from "@/queries/plantLibrary";

function makeEntry(overrides: Partial<PlantLibraryEntry> = {}): PlantLibraryEntry {
  return {
    id: "test-id",
    species_name: "Test Plant",
    common_name: null,
    image_url: null,
    light: null,
    water: null,
    difficulty: null,
    description: null,
    toxicity_to_pets: null,
    toxicity_to_humans: null,
    symptoms: null,
    safe_placement: null,
    source: null,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getToxicityDisplay", () => {
  it("returns null when both toxicity fields are null", () => {
    const entry = makeEntry();
    expect(getToxicityDisplay(entry)).toBeNull();
  });

  it("returns 'Toxic to pets: dogs' when only pets toxicity is set", () => {
    const entry = makeEntry({ toxicity_to_pets: "dogs" });
    expect(getToxicityDisplay(entry)).toBe("Toxic to pets: dogs");
  });

  it("returns 'Toxic to humans' when only humans toxicity is true", () => {
    const entry = makeEntry({ toxicity_to_humans: true });
    expect(getToxicityDisplay(entry)).toBe("Toxic to humans");
  });

  it("returns joined string when both are set", () => {
    const entry = makeEntry({ toxicity_to_pets: "cats", toxicity_to_humans: true });
    expect(getToxicityDisplay(entry)).toBe("Toxic to pets: cats; Toxic to humans");
  });

  it("returns 'Non-toxic' when pets is empty string and humans is false", () => {
    const entry = makeEntry({ toxicity_to_pets: "", toxicity_to_humans: false });
    expect(getToxicityDisplay(entry)).toBe("Non-toxic");
  });

  it("returns 'Non-toxic' when pets is empty string and humans is null", () => {
    const entry = makeEntry({ toxicity_to_pets: "", toxicity_to_humans: null });
    expect(getToxicityDisplay(entry)).toBe("Non-toxic");
  });

  it("ignores whitespace-only pets string and treats as empty", () => {
    const entry = makeEntry({ toxicity_to_pets: "   ", toxicity_to_humans: false });
    expect(getToxicityDisplay(entry)).toBe("Non-toxic");
  });

  it("returns null when both fields are null explicitly", () => {
    const entry = makeEntry({ toxicity_to_pets: null, toxicity_to_humans: null });
    expect(getToxicityDisplay(entry)).toBeNull();
  });
});
