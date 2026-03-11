import { describe, expect, it } from "bun:test";
import { assertEditRequest, registerEditTool } from "../../src/edit";

describe("assertEditRequest", () => {
  it("rejects unknown or unsupported root fields", () => {
    expect(() =>
      assertEditRequest({ path: "a.ts", legacy_field: [] } as any),
    ).toThrow(/unknown or unsupported fields/i);
  });

  it("accepts hidden complete legacy replace fields when edits is absent", () => {
    expect(() =>
      assertEditRequest({
        path: "a.ts",
        oldText: "before",
        newText: "after",
      } as any),
    ).not.toThrow();
  });

  it("rejects half-specified legacy replace payloads", () => {
    expect(() =>
      assertEditRequest({ path: "a.ts", oldText: "before" } as any),
    ).toThrow(/legacy|both/i);
  });

  it("rejects mixed-case legacy replace payloads", () => {
    expect(() =>
      assertEditRequest({
        path: "a.ts",
        oldText: "before",
        new_text: "after",
      } as any),
    ).toThrow(/legacy|both/i);
  });
});

describe("registerEditTool", () => {
  it("publishes the compatibility-aware edit schema", () => {
    let registered: { parameters?: any } | undefined;
    const pi = {
      registerTool(tool: { parameters?: any }) {
        registered = tool;
      },
    } as any;

    registerEditTool(pi);

    expect(registered?.parameters).toBeDefined();
    expect(registered!.parameters.type).toBe("object");
    expect(Object.keys(registered!.parameters.properties)).toEqual([
      "path",
      "edits",
      "oldText",
      "newText",
      "old_text",
      "new_text",
    ]);
    expect(registered!.parameters.required).toEqual(["path"]);
    expect(registered!.parameters.properties.edits).toBeDefined();
    expect(registered!.parameters.properties.oldText?.type).toBe("string");
    expect(registered!.parameters.properties.newText?.type).toBe("string");
    expect(registered!.parameters.properties.old_text?.type).toBe("string");
    expect(registered!.parameters.properties.new_text?.type).toBe("string");
  });
});
