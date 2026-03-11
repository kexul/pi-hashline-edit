import { describe, it, expect } from "bun:test";
import {
  applyHashlineEdits,
  computeLineHash,
  resolveEditAnchors,
  type Anchor,
  type HashlineEdit,
  type HashlineToolEdit,
} from "./src/hashline";

function makeTag(lineNum: number, text: string): Anchor {
  return { line: lineNum, hash: computeLineHash(lineNum, text) };
}

describe("resolveEditAnchors", () => {
  it("resolves replace with pos + end", () => {
    const edits: HashlineToolEdit[] = [
      { op: "replace", pos: "1#ZZ", end: "3#PP", lines: ["a", "b"] },
    ];
    const resolved = resolveEditAnchors(edits);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].op).toBe("replace");
    expect(resolved[0]).toHaveProperty("pos");
    expect(resolved[0]).toHaveProperty("end");
  });

  it("resolves replace with pos only (single-line)", () => {
    const edits: HashlineToolEdit[] = [
      { op: "replace", pos: "5#MQ", lines: ["new"] },
    ];
    const resolved = resolveEditAnchors(edits);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].op).toBe("replace");
    const r = resolved[0] as {
      op: "replace";
      pos: Anchor;
      end?: Anchor;
      lines: string[];
    };
    expect(r.pos.line).toBe(5);
    expect(r.end).toBeUndefined();
  });

  it("resolves replace with end only (falls back)", () => {
    const edits: HashlineToolEdit[] = [
      { op: "replace", end: "5#MQ", lines: ["new"] },
    ];
    const resolved = resolveEditAnchors(edits);
    expect(resolved).toHaveLength(1);
    const r = resolved[0] as { op: "replace"; pos: Anchor; lines: string[] };
    expect(r.pos.line).toBe(5);
  });

  it("throws on replace with no anchors", () => {
    const edits: HashlineToolEdit[] = [{ op: "replace", lines: ["new"] }];
    expect(() => resolveEditAnchors(edits)).toThrow(/at least one anchor/);
  });

  it("throws on malformed pos for append (not silently degraded to EOF)", () => {
    const edits: HashlineToolEdit[] = [
      { op: "append", pos: "garbage", lines: ["new"] },
    ];
    expect(() => resolveEditAnchors(edits)).toThrow(/Invalid line reference/);
  });

  it("throws on malformed pos for prepend (not silently degraded to BOF)", () => {
    const edits: HashlineToolEdit[] = [
      { op: "prepend", pos: "garbage", lines: ["new"] },
    ];
    expect(() => resolveEditAnchors(edits)).toThrow(/Invalid line reference/);
  });

  it("throws on malformed pos for replace", () => {
    const edits: HashlineToolEdit[] = [
      { op: "replace", pos: "not-valid", lines: ["x"] },
    ];
    expect(() => resolveEditAnchors(edits)).toThrow(/Invalid line reference/);
  });

  it("throws on malformed end for replace with valid pos", () => {
    const edits: HashlineToolEdit[] = [
      { op: "replace", pos: "5#MQ", end: "garbage", lines: ["x"] },
    ];
    expect(() => resolveEditAnchors(edits)).toThrow(/Invalid line reference/);
  });

  it("resolves append with pos", () => {
    const edits: HashlineToolEdit[] = [
      { op: "append", pos: "5#MQ", lines: ["new"] },
    ];
    const resolved = resolveEditAnchors(edits);
    expect(resolved[0].op).toBe("append");
    expect(resolved[0].pos?.line).toBe(5);
  });

  it("resolves append without pos (EOF)", () => {
    const edits: HashlineToolEdit[] = [{ op: "append", lines: ["new"] }];
    const resolved = resolveEditAnchors(edits);
    expect(resolved[0].op).toBe("append");
    expect(resolved[0].pos).toBeUndefined();
  });

  it("resolves prepend with pos", () => {
    const edits: HashlineToolEdit[] = [
      { op: "prepend", pos: "5#MQ", lines: ["new"] },
    ];
    const resolved = resolveEditAnchors(edits);
    expect(resolved[0].op).toBe("prepend");
  });

  it("resolves prepend without pos (BOF)", () => {
    const edits: HashlineToolEdit[] = [{ op: "prepend", lines: ["new"] }];
    const resolved = resolveEditAnchors(edits);
    expect(resolved[0].op).toBe("prepend");
    expect(resolved[0].pos).toBeUndefined();
  });

  it("parses string lines input", () => {
    const edits: HashlineToolEdit[] = [
      { op: "replace", pos: "1#ZZ", lines: "hello\nworld\n" },
    ];
    const resolved = resolveEditAnchors(edits);
    expect(resolved[0].lines).toEqual(["hello", "world"]);
  });

  it("parses null lines as empty array", () => {
    const edits: HashlineToolEdit[] = [
      { op: "replace", pos: "1#ZZ", lines: null },
    ];
    const resolved = resolveEditAnchors(edits);
    expect(resolved[0].lines).toEqual([]);
  });

  it("throws on unknown op", () => {
    const edits: HashlineToolEdit[] = [
      { op: "something_weird", pos: "1#ZZ", lines: ["x"] },
    ];
    expect(() => resolveEditAnchors(edits)).toThrow(
      'Unknown edit op "something_weird"',
    );
  });

  it("rejects missing op", () => {
    const edits: HashlineToolEdit[] = [{ pos: "1#ZZ", lines: ["x"] } as any];
    expect(() => resolveEditAnchors(edits)).toThrow(/Unknown edit op/);
  });
});

describe("applyHashlineEdits — basic operations", () => {
  it("returns content unchanged for empty edits", () => {
    const result = applyHashlineEdits("hello\nworld", []);
    expect(result.content).toBe("hello\nworld");
    expect(result.firstChangedLine).toBeUndefined();
  });

  it("replaces a single line", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: makeTag(2, "bbb"), lines: ["BBB"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nBBB\nccc");
    expect(result.firstChangedLine).toBe(2);
  });

  it("replaces a single line with multiple lines", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: makeTag(2, "bbb"), lines: ["BBB", "B2"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nBBB\nB2\nccc");
  });

  it("deletes a single line (empty lines array)", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: makeTag(2, "bbb"), lines: [] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nccc");
  });

  it("replaces a range of lines", () => {
    const content = "aaa\nbbb\nccc\nddd";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(2, "bbb"),
        end: makeTag(3, "ccc"),
        lines: ["BBB", "CCC"],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nBBB\nCCC\nddd");
  });

  it("deletes a range of lines", () => {
    const content = "aaa\nbbb\nccc\nddd";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(2, "bbb"),
        end: makeTag(3, "ccc"),
        lines: [],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nddd");
  });

  it("appends after a line", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "append", pos: makeTag(2, "bbb"), lines: ["inserted"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nbbb\ninserted\nccc");
    expect(result.firstChangedLine).toBe(3);
  });

  it("appends to EOF (no pos)", () => {
    const content = "aaa\nbbb";
    const edits: HashlineEdit[] = [{ op: "append", lines: ["ccc"] }];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nbbb\nccc");
  });

  it("appends to empty file", () => {
    const content = "";
    const edits: HashlineEdit[] = [{ op: "append", lines: ["first"] }];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("first");
  });

  it("prepends before a line", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "prepend", pos: makeTag(2, "bbb"), lines: ["inserted"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\ninserted\nbbb\nccc");
    expect(result.firstChangedLine).toBe(2);
  });

  it("prepends to BOF (no pos)", () => {
    const content = "aaa\nbbb";
    const edits: HashlineEdit[] = [{ op: "prepend", lines: ["zzz"] }];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("zzz\naaa\nbbb");
    expect(result.firstChangedLine).toBe(1);
  });

  it("prepends to empty file", () => {
    const content = "";
    const edits: HashlineEdit[] = [{ op: "prepend", lines: ["first"] }];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("first");
  });
});

describe("applyHashlineEdits — multi-edit ordering", () => {
  it("applies multiple edits bottom-up correctly", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: makeTag(1, "aaa"), lines: ["AAA"] },
      { op: "replace", pos: makeTag(3, "ccc"), lines: ["CCC"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("AAA\nbbb\nCCC");
  });

  it("handles append + replace on same file", () => {
    const content = "aaa\nbbb";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: makeTag(1, "aaa"), lines: ["AAA"] },
      { op: "append", pos: makeTag(2, "bbb"), lines: ["ccc"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("AAA\nbbb\nccc");
  });

  it("deduplicates identical edits", () => {
    const content = "aaa\nbbb\nccc";
    const pos = makeTag(2, "bbb");
    const edits: HashlineEdit[] = [
      { op: "replace", pos: { ...pos }, lines: ["BBB"] },
      { op: "replace", pos: { ...pos }, lines: ["BBB"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("aaa\nBBB\nccc");
  });
});

describe("applyHashlineEdits — noop detection", () => {
  it("detects single-line noop", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: makeTag(2, "bbb"), lines: ["bbb"] },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.noopEdits).toHaveLength(1);
    expect(result.noopEdits![0].editIndex).toBe(0);
  });

  it("detects range noop", () => {
    const content = "aaa\nbbb\nccc\nddd";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(2, "bbb"),
        end: makeTag(3, "ccc"),
        lines: ["bbb", "ccc"],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.noopEdits).toHaveLength(1);
  });

  it("throws on empty append lines payload", () => {
    const content = "aaa\nbbb";
    const edits: HashlineEdit[] = [
      { op: "append", pos: makeTag(2, "bbb"), lines: [] },
    ];
    expect(() => applyHashlineEdits(content, edits)).toThrow(/empty lines payload/);
  });

  it("throws on empty prepend lines payload", () => {
    const content = "aaa\nbbb";
    const edits: HashlineEdit[] = [
      { op: "prepend", pos: makeTag(1, "aaa"), lines: [] },
    ];
    expect(() => applyHashlineEdits(content, edits)).toThrow(/empty lines payload/);
  });
});

describe("applyHashlineEdits — error handling", () => {
  it("throws on hash mismatch", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: { line: 2, hash: "XX" }, lines: ["BBB"] },
    ];
    expect(() => applyHashlineEdits(content, edits)).toThrow(/changed since last read/);
  });

  it("throws on out-of-range line", () => {
    const content = "aaa\nbbb";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: { line: 99, hash: "ZZ" }, lines: ["x"] },
    ];
    expect(() => applyHashlineEdits(content, edits)).toThrow(/does not exist/);
  });

  it("throws on range start > end", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(3, "ccc"),
        end: makeTag(1, "aaa"),
        lines: ["x"],
      },
    ];
    expect(() => applyHashlineEdits(content, edits)).toThrow(/must be <= end line/);
  });

  it("reports multiple mismatches at once", () => {
    const content = "aaa\nbbb\nccc";
    const edits: HashlineEdit[] = [
      { op: "replace", pos: { line: 1, hash: "XX" }, lines: ["A"] },
      { op: "replace", pos: { line: 3, hash: "YY" }, lines: ["C"] },
    ];
    expect(() => applyHashlineEdits(content, edits)).toThrow(/2 lines have changed/);
  });

  it("mismatch message does not mention relocation", () => {
    expect(() =>
      applyHashlineEdits("aaa", [
        {
          op: "replace",
          pos: { line: 1, hash: "ZZ" },
          lines: ["bbb"],
        } as any,
      ]),
    ).toThrow(/Use the updated LINE#HASH references/);
  });
});

// Only explicit input cleanup plus this boundary-duplicate correction remain as
// default assist heuristics; hidden intent-recovery behavior is intentionally excluded.
describe("applyHashlineEdits — heuristics", () => {
  it("auto-corrects trailing duplicate on range replace", () => {
    const content = "if (ok) {\n  run();\n}\nafter();";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(1, "if (ok) {"),
        end: makeTag(2, "  run();"),
        lines: ["if (ok) {", "  runSafe();", "}"],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("if (ok) {\n  runSafe();\n}\nafter();");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toContain("Auto-corrected range replace");
  });

  it("does NOT auto-correct when end already includes boundary", () => {
    const content =
      "function outer() {\n  function inner() {\n    run();\n  }\n}";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(1, "function outer() {"),
        end: makeTag(4, "  }"),
        lines: [
          "function outer() {",
          "  function inner() {",
          "    runSafe();",
          "  }",
        ],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe(
      "function outer() {\n  function inner() {\n    runSafe();\n  }\n}",
    );
    expect(result.warnings).toBeUndefined();
  });

  it("does NOT auto-correct when trailing line trims to empty", () => {
    const content = "alpha\nbeta\n\ngamma";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(1, "alpha"),
        end: makeTag(2, "beta"),
        lines: ["ALPHA", ""],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("ALPHA\n\n\ngamma");
    expect(result.warnings).toBeUndefined();
  });

  it("auto-corrects leading duplicate on range replace", () => {
    const content = "before();\nif (ok) {\n  run();\n}\nafter();";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(2, "if (ok) {"),
        end: makeTag(3, "  run();"),
        lines: ["before();", "if (ok) {", "  runSafe();"],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe(
      "before();\nif (ok) {\n  runSafe();\n}\nafter();",
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toContain("removed leading replacement line");
  });

  it("does NOT auto-correct leading duplicate for short non-brace lines", () => {
    const content = "x\nalpha\nbeta";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(2, "alpha"),
        end: makeTag(3, "beta"),
        lines: ["x", "ALPHA", "BETA"],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("x\nx\nALPHA\nBETA");
    expect(result.warnings).toBeUndefined();
  });

  it("auto-corrects leading duplicate for brace closers", () => {
    const content = "}\nfunction foo() {\n  bar();\n}";
    const edits: HashlineEdit[] = [
      {
        op: "replace",
        pos: makeTag(2, "function foo() {"),
        end: makeTag(3, "  bar();"),
        lines: ["}", "function foo() {", "  baz();"],
      },
    ];
    const result = applyHashlineEdits(content, edits);
    expect(result.content).toBe("}\nfunction foo() {\n  baz();\n}");
    expect(result.warnings).toHaveLength(1);
  });
});

describe("integration: resolveEditAnchors → applyHashlineEdits", () => {
  it("full pipeline: tool-schema edit → resolve → apply", () => {
    const content = "aaa\nbbb\nccc";
    const tag2 = `2#${computeLineHash(2, "bbb")}`;
    const toolEdits: HashlineToolEdit[] = [
      { op: "replace", pos: tag2, lines: ["BBB"] },
    ];
    const resolved = resolveEditAnchors(toolEdits);
    const result = applyHashlineEdits(content, resolved);
    expect(result.content).toBe("aaa\nBBB\nccc");
  });

  it("full pipeline: string lines get parsed correctly", () => {
    const content = "aaa\nbbb\nccc";
    const tag2 = `2#${computeLineHash(2, "bbb")}`;
    const toolEdits: HashlineToolEdit[] = [{ op: "replace", pos: tag2, lines: "BBB" }];
    const resolved = resolveEditAnchors(toolEdits);
    const result = applyHashlineEdits(content, resolved);
    expect(result.content).toBe("aaa\nBBB\nccc");
  });

  it("full pipeline: null lines → delete", () => {
    const content = "aaa\nbbb\nccc";
    const tag2 = `2#${computeLineHash(2, "bbb")}`;
    const toolEdits: HashlineToolEdit[] = [{ op: "replace", pos: tag2, lines: null }];
    const resolved = resolveEditAnchors(toolEdits);
    const result = applyHashlineEdits(content, resolved);
    expect(result.content).toBe("aaa\nccc");
  });

  it("full pipeline: prepend to BOF", () => {
    const content = "aaa\nbbb";
    const toolEdits: HashlineToolEdit[] = [{ op: "prepend", lines: ["header"] }];
    const resolved = resolveEditAnchors(toolEdits);
    const result = applyHashlineEdits(content, resolved);
    expect(result.content).toBe("header\naaa\nbbb");
  });

  it("full pipeline: append to EOF", () => {
    const content = "aaa\nbbb";
    const toolEdits: HashlineToolEdit[] = [{ op: "append", lines: ["footer"] }];
    const resolved = resolveEditAnchors(toolEdits);
    const result = applyHashlineEdits(content, resolved);
    expect(result.content).toBe("aaa\nbbb\nfooter");
  });

  it("full pipeline: hashline-prefixed string lines get stripped", () => {
    const content = "aaa\nbbb\nccc";
    const tag2 = `2#${computeLineHash(2, "bbb")}`;
    const hash = computeLineHash(2, "BBB");
    const toolEdits: HashlineToolEdit[] = [
      { op: "replace", pos: tag2, lines: `2#${hash}:BBB` },
    ];
    const resolved = resolveEditAnchors(toolEdits);
    const result = applyHashlineEdits(content, resolved);
    expect(result.content).toBe("aaa\nBBB\nccc");
  });
});
