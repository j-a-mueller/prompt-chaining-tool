import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { printWarning } from "./utils.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".py",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".xml",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".swift",
  ".kt",
  ".r",
  ".m",
  ".env",
  ".log",
]);

const CODE_EXTENSIONS = new Set([
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".py",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".xml",
  ".yaml",
  ".yml",
  ".toml",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".swift",
  ".kt",
  ".r",
  ".m",
]);

const BINARY_EXTENSIONS = new Map([
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
]);

/**
 * Reads files from a context folder (flat, non-recursive) and returns
 * content parts suitable for Gemini's sendMessage API.
 */
export async function loadContextParts(folderPath) {
  let entries;
  try {
    entries = await readdir(folderPath);
  } catch {
    printWarning(`Context folder not found: ${folderPath} — skipping context.`);
    return [];
  }

  // Sort for deterministic ordering
  entries.sort();

  const parts = [];

  for (const entry of entries) {
    const filePath = join(folderPath, entry);

    // Skip directories (flat read only)
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) continue;

    // Check file size
    if (fileStat.size > MAX_FILE_SIZE) {
      printWarning(`Skipping ${entry} — exceeds 10MB size limit.`);
      continue;
    }

    const ext = extname(entry).toLowerCase();

    if (TEXT_EXTENSIONS.has(ext)) {
      const content = await readFile(filePath, "utf-8");
      if (CODE_EXTENSIONS.has(ext)) {
        const lang = ext.slice(1); // remove leading dot
        parts.push({ text: `--- File: ${entry} ---\n\`\`\`${lang}\n${content}\n\`\`\`` });
      } else {
        parts.push({ text: `--- File: ${entry} ---\n${content}` });
      }
    } else if (BINARY_EXTENSIONS.has(ext)) {
      const buffer = await readFile(filePath);
      const base64 = buffer.toString("base64");
      parts.push({
        inlineData: {
          mimeType: BINARY_EXTENSIONS.get(ext),
          data: base64,
        },
      });
    } else {
      printWarning(`Skipping ${entry} — unsupported file extension "${ext}".`);
    }
  }

  return parts;
}
