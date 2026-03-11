import { describe, it, expect } from "bun:test";
import { formatHashlineReadPreview } from "../../src/read";

describe("formatHashlineReadPreview", () => {
  it("refuses to emit a truncated hashline for an oversized first line", () => {
    const longLine = "x".repeat(70_000);
    const result = formatHashlineReadPreview(longLine, { offset: 1 });

    expect(result.text).toContain("Hashline output requires full lines");
  });

  it("formats ordinary lines as full hashlines", () => {
    const result = formatHashlineReadPreview("alpha\nbeta", { offset: 1 });

    expect(result.text).toContain("1#");
    expect(result.text).toContain(":alpha");
  });

  it("keeps continuation hints for partial previews", () => {
    const result = formatHashlineReadPreview("alpha\nbeta", {
      offset: 1,
      limit: 1,
    });

    expect(result.text).toContain("Use offset=2 to continue");
  });
});
