import { randomUUID } from "crypto";
import { mkdir, rename, writeFile } from "fs/promises";
import { dirname, join } from "path";

export async function writeFileAtomically(
  path: string,
  content: string,
): Promise<void> {
  const dir = dirname(path);
  const tempPath = join(dir, `.tmp-${randomUUID()}`);

  await mkdir(dir, { recursive: true });
  await writeFile(tempPath, content, "utf-8");
  await rename(tempPath, path);
}
