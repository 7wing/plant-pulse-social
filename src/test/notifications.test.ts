import { describe, it, expect } from "vitest";
import { urlBase64ToUint8Array } from "@/lib/notifications";

describe("urlBase64ToUint8Array", () => {
  it("converts a base64 string to Uint8Array", () => {
    const input = "AQID"; // [1,2,3]
    const result = urlBase64ToUint8Array(input);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("handles unpadded base64url", () => {
    const input = "AQI"; // no padding
    const result = urlBase64ToUint8Array(input);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});