import { describe, it, expect } from "vitest";
import { toTrackSquare } from "./board.js";

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