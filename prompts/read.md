Read the contents of a file. Supports text files and images (jpg, png, gif, webp). Images are sent as attachments.

For text files, each line is displayed as LINE:HASH|content where LINE is the 1-indexed line number and HASH is a short content hash. Use these LINE:HASH references when editing with the edit tool.

Output is truncated to {{DEFAULT_MAX_LINES}} lines or {{DEFAULT_MAX_BYTES}} (whichever is hit first). Use offset/limit for large files.
