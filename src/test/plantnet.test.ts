import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { identifyPlant } from "@/lib/plantnet";

vi.mock("browser-image-compression", () => ({
  default: vi.fn((file: File) => Promise.resolve(file)),
}));

describe("identifyPlant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws on non-OK response", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve("API Error"),
      } as Response)
    );
    await expect(identifyPlant(new File(["test"], "test.jpg"))).rejects.toThrow("API Error");
  });
});