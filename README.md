![pi-hashline-edit banner](assets/banner.jpeg)

# pi-hashline-edit

A [pi coding agent](https://github.com/mariozechner/pi-coding-agent) extension that overrides the built-in `read` and `edit` tools with strict `LINE#HASH:content` references.

Inspired by [oh-my-pi](https://github.com/can1357/oh-my-pi), but narrowed to fit pi's minimal and reliability-first philosophy: a small surface, explicit integrity checks, and no fallback modes that hide stale context.

---

## What it overrides

- `read`
- `edit`

This extension intentionally avoids any separate search override workflow.

---

## How it works

### Read
`read` returns text files as full tagged lines:

```text
10#VR:function hello() {
11#KT:  console.log("world");
12#BH:}
```

- `LINE` is the current 1-indexed line number.
- `HASH` is a 2-character content hash from the custom alphabet `ZPMQVRWSNKTXJBYH`.

If the first selected line is too large to fit safely within the read budget, `read` returns an advisory instead of a partial tagged line. That prevents unusable or misleading anchors.

### Edit
`edit` accepts only this payload shape:

```json
{
  "path": "src/main.ts",
  "edits": [
    {
      "op": "replace",
      "pos": "11#KT",
      "lines": ["  console.log('hashline');"]
    }
  ]
}
```

Supported operations:

| Op | Purpose |
|---|---|
| `replace` | Replace one line (`pos`) or an inclusive range (`pos` + `end`). `lines: null` or `[]` deletes the line(s). |
| `append` | Insert after `pos`. Omit `pos` for end of file. |
| `prepend` | Insert before `pos`. Omit `pos` for beginning of file. |

---

## Strictness guarantees

- **Stale anchors fail**: mismatches do not relocate. Re-read and use the updated `LINE#HASH` references from the error snippet.
- **No substring fallback**: edits must use hash anchors instead of legacy free-text replacement modes.
- **No destructive file ops**: there is no delete or move surface.
- **Atomic application**: all edits validate against the same pre-edit snapshot and apply bottom-up.
- **Limited assist behavior**: the core strips copied display prefixes and keeps one explicit boundary-duplicate correction for safe range edits.
- **Whitespace-aware hashing**: internal spaces remain significant; trailing spaces are ignored.

---

## Installation

```bash
pi install /path/to/pi-hashline-edit
```

## Development

Install dependencies with Bun:

```bash
bun install
```

## Testing

```bash
bun test
```

## Technical notes

- **Hashing**: uses `xxhashjs` for deterministic 32-bit hashes, mapped to a custom 2-character alphabet.
- **Symbol-line seeding**: lines with no alphanumeric content mix in their line number to reduce collisions on structural markers.
- **Read safety**: tagged previews are emitted only for complete lines.
- **Edit integrity**: malformed or stale anchors fail loudly instead of being guessed or repaired implicitly.

## Credits

Special thanks to [can1357](https://github.com/can1357) for the original [oh-my-pi](https://github.com/can1357/oh-my-pi) implementation and the hashline concept.

## License

[MIT](LICENSE)
