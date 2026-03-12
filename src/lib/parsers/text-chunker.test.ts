import { describe, it, expect } from "vitest";
import { normalizeText, chunkText } from "./text-chunker";

describe("normalizeText", () => {
  it("converts smart quotes to straight quotes", () => {
    expect(normalizeText("\u201CHello\u201D")).toBe('"Hello"');
    expect(normalizeText("\u2018it\u2019s\u2019")).toBe("'it's'");
  });

  it("converts em dash to hyphen", () => {
    expect(normalizeText("word\u2014word")).toBe("word-word");
  });

  it("converts ellipsis to three dots", () => {
    expect(normalizeText("wait\u2026")).toBe("wait...");
  });

  it("strips control characters but keeps Unicode letters", () => {
    expect(normalizeText("hello\x00world")).toBe("helloworld");
    expect(normalizeText("hello\x0Bworld")).toBe("helloworld");
  });

  it("preserves newlines and standard ASCII", () => {
    expect(normalizeText("line1\nline2")).toBe("line1\nline2");
    expect(normalizeText("abc 123 !@#")).toBe("abc 123 !@#");
  });

  it("converts ligatures", () => {
    expect(normalizeText("\uFB01nd")).toBe("find");
    expect(normalizeText("\uFB02ow")).toBe("flow");
  });

  it("preserves Vietnamese characters", () => {
    expect(normalizeText("Xin chào thế giới")).toBe("Xin chào thế giới");
    expect(normalizeText("ăâđêôơư")).toBe("ăâđêôơư");
    expect(normalizeText("ả ễ ỡ ự ừ")).toBe("ả ễ ỡ ự ừ");
  });

  it("normalizes to NFC", () => {
    // o + combining horn (NFD) should become ơ (NFC)
    const nfd = "o\u031B";
    const result = normalizeText(nfd);
    expect(result).toBe("\u01A1"); // ơ in NFC
  });

  it("normalizes line endings", () => {
    expect(normalizeText("a\r\nb")).toBe("a\nb");
    expect(normalizeText("a\rb")).toBe("a\nb");
  });

  it("strips BOM", () => {
    expect(normalizeText("\uFEFFhello")).toBe("hello");
  });
});

describe("chunkText", () => {
  it("returns empty for empty text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("returns single chunk for short text", () => {
    const chunks = chunkText("Hello world.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("Hello world.");
    expect(chunks[0].wordCount).toBe(2);
  });

  it("splits long text into multiple chunks", () => {
    // Generate text with 600 words
    const words = Array(600).fill("word").join(" ");
    const chunks = chunkText(words, 250);
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be roughly 250 words
    for (const chunk of chunks) {
      expect(chunk.wordCount).toBeGreaterThanOrEqual(100);
      expect(chunk.wordCount).toBeLessThan(400);
    }
  });

  it("prefers sentence boundaries", () => {
    // Create text that has a sentence end near the target
    const sentence1 = Array(240).fill("word").join(" ") + ".";
    const sentence2 = " " + Array(240).fill("more").join(" ") + ".";
    const text = sentence1 + sentence2;
    const chunks = chunkText(text, 250);
    expect(chunks.length).toBe(2);
    expect(chunks[0].content.endsWith(".")).toBe(true);
  });

  it("sets characterCount correctly", () => {
    const chunks = chunkText("Hello world");
    expect(chunks[0].characterCount).toBe(11);
  });

  it("chunks Vietnamese text correctly", () => {
    const words = Array(300).fill("xin chào").join(" ");
    const chunks = chunkText(words, 250);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content).toContain("chào");
  });
});
