Edit files with hash-verified line refs. Read a file first (LINE:HASH|content), then edit using those refs.

Rules:
- Copy LINE:HASH exactly from read/grep output; never guess hashes
- Prefer anchored edits (`set_line`, `replace_lines`, `insert_after`)
- Use `replace` only when anchors are unavailable
- `new_text`/`text` is plain replacement content (no `LINE:HASH`, no diff `+` markers)
- If hash mismatch shows `>>>`, retry with those updated refs
- If you already edited a file in this turn, re-read before the next edit

Variants:
- `{ set_line: { anchor, new_text } }`
- `{ replace_lines: { start_anchor, end_anchor, new_text } }`
- `{ insert_after: { anchor, text } }`
- `{ replace: { old_text, new_text, all? } }`

`new_text: ""` deletes content for `set_line`/`replace_lines`.
All operations are validated against the pre-edit file state and applied bottom-up atomically.