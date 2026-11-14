import { describe, it, expect } from "vitest";
import { toTrackSquare, seatColors } from "./board.js";

describe("toTrackSquare", () => {
  it("offsets by the color's start square", () => {
    expect(toTrackSquare("green", 0)).toBe(13);
  });

  it("wraps around the 52-square loop", () => {
    expect(toTrackSquare("blue", 20)).toBe(7);
  });

  it("returns null once a token is in the home column", () => {
    expect(toTrackSquare("red", 51)).toBeNull();
  });
});

describe("seatColors", () => {
  it("seats two players in opposite corners", () => {
    expect(seatColors(2)).toEqual(["red", "yellow"]);
  });

  it("rejects unsupported player counts", () => {
    expect(seatColors(1)).toBeNull();
    expect(seatColors(5)).toBeNull();
  });

  it("hands out a copy, not the shared layout", () => {
    seatColors(2)!.push("blue");
    expect(seatColors(2)).toEqual(["red", "yellow"]);
  });
});