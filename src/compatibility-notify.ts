import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export function registerCompatibilityNotifications(pi: ExtensionAPI): void {
  let compatibilityCount = 0;

  pi.on("turn_start", async () => {
    compatibilityCount = 0;
  });

  pi.on("tool_result", async (event) => {
    if (event.toolName !== "edit" || event.isError) {
      return;
    }

    const details = event.details as
      | {
          compatibility?: {
            used?: boolean;
          };
        }
      | undefined;

    if (details?.compatibility?.used) {
      compatibilityCount += 1;
    }
  });

  pi.on("turn_end", async (_event, ctx) => {
    if (!ctx.hasUI || compatibilityCount === 0) {
      compatibilityCount = 0;
      return;
    }

    ctx.ui.notify(
      `Edit compatibility mode used for ${compatibilityCount} edit(s)`,
      "warning",
    );
    compatibilityCount = 0;
  });
}
