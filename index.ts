/**
 * Hashline Edit Extension for pi-coding-agent
 *
 * Overrides built-in `read`, `grep`, and `edit` tools with hashline workflow:
 * - `read` outputs lines as `LINE:HASH|content`
 * - `grep` outputs matched lines with `LINE:HASH` anchors
 * - `edit` accepts hash-verified anchors (`set_line`, `replace_lines`, `insert_after`, `replace`)
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerEditTool } from "./src/edit";
import { registerGrepTool } from "./src/grep";
import { registerReadTool } from "./src/read";

export default function (pi: ExtensionAPI): void {
	registerReadTool(pi);
	registerGrepTool(pi);
	registerEditTool(pi);

	pi.on("session_start", async (_event, ctx) => {
		const debugValue = process.env.PI_HASHLINE_DEBUG;
		const debugNotify = debugValue === "1" || debugValue === "true";
		if (debugNotify) {
			ctx.ui.notify("Hashline Edit mode active", "info");
		}
	});
}
