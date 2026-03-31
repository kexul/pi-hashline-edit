import { describe, expect, it } from "bun:test";

describe("pi file mutation queue integration", () => {
  it("delegates to pi-coding-agent shared queue when the runtime exports it", async () => {
    const queueModulePath = new URL("../../src/pi-file-mutation-queue.ts", import.meta.url).href;
    const calls: string[] = [];

    try {
      (
        globalThis as typeof globalThis & {
          __PI_HASHLINE_SHARED_FILE_MUTATION_QUEUE__?: <T>(
            filePath: string,
            fn: () => Promise<T>,
          ) => Promise<T>;
        }
      ).__PI_HASHLINE_SHARED_FILE_MUTATION_QUEUE__ = async <T>(
        filePath: string,
        fn: () => Promise<T>,
      ): Promise<T> => {
        calls.push(filePath);
        return await fn();
      };

      const { withPiFileMutationQueue } = await import(
        `${queueModulePath}?mocked=${Date.now()}`
      );

      const result = await withPiFileMutationQueue("/tmp/example.txt", async () => "ok");

      expect(result).toBe("ok");
      expect(calls).toEqual(["/tmp/example.txt"]);
    } finally {
      delete (
        globalThis as typeof globalThis & {
          __PI_HASHLINE_SHARED_FILE_MUTATION_QUEUE__?: unknown;
        }
      ).__PI_HASHLINE_SHARED_FILE_MUTATION_QUEUE__;
    }
  });
});
