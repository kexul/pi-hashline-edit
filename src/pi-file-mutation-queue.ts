import { withFileMutationQueue as withLocalFileMutationQueue } from "./file-mutation-queue";

type SharedQueue = <T>(filePath: string, fn: () => Promise<T>) => Promise<T>;
type QueueOverrideHost = typeof globalThis & {
  __PI_HASHLINE_SHARED_FILE_MUTATION_QUEUE__?: SharedQueue;
};

async function getSharedQueue(): Promise<SharedQueue | null> {
  const override = (globalThis as QueueOverrideHost)
    .__PI_HASHLINE_SHARED_FILE_MUTATION_QUEUE__;
  if (typeof override === "function") {
    return override;
  }

  const module = (await import("@mariozechner/pi-coding-agent")) as {
    withFileMutationQueue?: SharedQueue;
  };
  const queue = module.withFileMutationQueue;
  return typeof queue === "function" ? queue : null;
}

export async function withPiFileMutationQueue<T>(
  filePath: string,
  fn: () => Promise<T>,
): Promise<T> {
  const sharedQueue = await getSharedQueue();
  if (sharedQueue) {
    return await sharedQueue(filePath, fn);
  }
  return await withLocalFileMutationQueue(filePath, fn);
}
