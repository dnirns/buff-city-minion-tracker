import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("trims whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("foo bar baz")).toBe("foo-bar-baz");
  });

  it("removes special characters", () => {
    expect(slugify("hello!@#$%^&*()world")).toBe("helloworld");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("foo---bar")).toBe("foo-bar");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("handles multiple spaces between words", () => {
    expect(slugify("foo   bar")).toBe("foo-bar");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("handles mixed special characters and spaces", () => {
    expect(slugify("  My Game! #1  ")).toBe("my-game-1");
  });

  it("preserves numbers", () => {
    expect(slugify("game 123")).toBe("game-123");
  });

  it("preserves existing hyphens", () => {
    expect(slugify("already-slugged")).toBe("already-slugged");
  });
});
