import { describe, expect, it } from "vitest";
import { formatCount, parseCount, stepValue } from "./numbers";

describe("numbers", () => {
  it("shortens counts for the interface language", () => {
    expect(formatCount(5000, "en")).toBe("5K");
    expect(formatCount(1500, "en")).toBe("1.5K");
    expect(formatCount(5000, "ko")).toBe("5천");
    expect(formatCount(20000, "ko")).toBe("2만");
  });
  it("reads what people type", () => {
    expect(parseCount("1,000")).toBe(1000);
    expect(parseCount("5k")).toBe(5000);
    expect(parseCount("1.5K")).toBe(1500);
    expect(parseCount("2만")).toBe(20000);
    expect(parseCount("3천")).toBe(3000);
    expect(parseCount("abc")).toBeNull();
    expect(parseCount("0")).toBeNull();
  });
  it("steps through round numbers", () => {
    expect(stepValue(5000, 1)).toBe(10000);
    expect(stepValue(5000, -1)).toBe(2000);
    expect(stepValue(700, 1)).toBe(1000);
    expect(stepValue(700, -1)).toBe(500);
    expect(stepValue(5, -1)).toBe(5);
  });
});

