Apply edits to a file using `LINE#HASH` anchors from `read` output.

<usage>
Submit one `edit` call per file. Include all operations for that file in a single call.

Use `read` first if you do not have current `LINE#HASH` references for the target file.
</usage>

<payload>
```
{ path, edits: [{ op, pos, end, lines }] }
```

- `path` — target file path.
- `edits` — array of edit operations.
</payload>

<operations>
Each entry has an `op` and a `lines` array of replacement content.

- `replace` — replace one line (`pos`) or an inclusive range (`pos` + `end`). `pos` is required.
- `append` — insert after `pos`. Omit `pos` to append at end of file.
- `prepend` — insert before `pos`. Omit `pos` to prepend at beginning of file.

`end` is only valid with `replace`.

Anchor format: `"LINE#HASH"` copied from `read` output (e.g. `"12#MQ"`).
</operations>

<examples>
- Replace one line: `{ op: "replace", pos: "12#MQ", lines: ["const x = 1;"] }`
- Replace a range: `{ op: "replace", pos: "12#MQ", end: "14#VR", lines: ["merged"] }`
- Delete a range: `{ op: "replace", pos: "12#MQ", end: "14#VR", lines: [] }`
- Append after a line: `{ op: "append", pos: "20#NK", lines: ["footer();"] }`
- Prepend at file start: `{ op: "prepend", lines: ["// header"] }`
</examples>

<constraints>
- Copy indentation exactly from `read` output.
- `lines` must be literal file content. Do not include `LINE#HASH:` prefixes.
- Extra keys inside edit entries are rejected.
- Submitting content identical to the current file is rejected.
</constraints>

<errors>
- **Stale anchor** (`>>>`): the file has changed. Use the `>>> LINE#HASH:content` lines from the error snippet to retry.
- **No-op** (`identical`): your replacement matches existing content. Re-read and supply different content.
</errors>
