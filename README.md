![pi-hashline-edit banner](assets/banner.jpeg)

# pi-hashline-edit

A [pi coding agent](https://github.com/mariozechner/pi-coding-agent) extension that overrides the built-in `read`, `grep`, and `edit` tools with content-anchored line references (`LINE:HASH|content`).

Inspired by [oh-my-pi](https://github.com/can1357/oh-my-pi)'s hashline mode. Hashline anchors let the LLM target exact lines by content hash rather than fragile line numbers, reducing edit drift and incorrect replacements.

---

## How It Works

### 1. Read
The `read` tool outputs each line with a unique identifier: `LINE:HASH|content`.
- **LINE**: The current line number.
- **HASH**: A short content-based hash (xxHash32).

```text
10:d2|function hello() {
11:e5|  console.log("world");
12:f8|}
```

### 2. Grep
The `grep` tool also emits hashline references (`path:LINE:HASH|content`), allowing for a seamless Search → Edit workflow.

### 3. Edit
The `edit` tool uses these anchors to perform surgical modifications.

```json
{
  "path": "src/main.ts",
  "edits": [
    {
      "set_line": {
        "anchor": "11:e5",
        "new_text": "  console.log('hashline');"
      }
    }
  ]
}
```

#### Edit Variants
| Variant | Purpose |
|---|---|
| `set_line` | Replace a single anchored line. |
| `replace_lines` | Replace a range of lines between `start_anchor` and `end_anchor`. |
| `insert_after` | Insert new content immediately after an anchor. |
| `replace` | Fallback for fuzzy substring replacement (no hashes needed). |

---

## Key Features & Heuristics

This extension isn't just a simple hash matcher. It includes advanced heuristics ported from `oh-my-pi` to make editing robust:

- **Smart Relocation**: If a line's number changes but its hash is unique, the tool automatically relocates the edit to the new position.
- **Merge Detection**: Correctly handles cases where the model merges multiple lines (e.g., continuation lines) into one.
- **Echo Stripping**: Automatically removes "echoes" of the anchor lines if the model accidentally includes them in the replacement text.
- **Wrapped Line Restoration**: Detects when a model unintentionally wraps a long line and restores it to its original single-line form.
- **Indentation Recovery**: Preserves original indentation if the replacement content matches but whitespace differs.
- **Conflict Diagnostics**: If hashes don't match (e.g., the file was modified externally), the tool rejects the edit and provides a "diff-like" error showing exactly what changed and the new `LINE:HASH` references.

---

## Installation

```bash
# From local path
pi install /path/to/pi-hashline-edit

# From npm
pi install npm:pi-hashline-edit
```

## Technical Details

- **Hashing**: Uses `xxhashjs` for deterministic 32-bit hashes.
- **Normalization**: Normalizes confusable Unicode hyphens and whitespace during comparison to avoid brittle matches.
- **Safety**: Atomic application — all edits in a single call are validated against the file state before any writes occur.

## Credits

Special thanks to [can1357](https://github.com/can1357) for the original [oh-my-pi](https://github.com/can1357/oh-my-pi) implementation and the hashline concept.

## License

[MIT](LICENSE)
