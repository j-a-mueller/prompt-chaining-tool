import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { printError, printWarning } from "./utils.js";
import { getChainsDir } from "./config.js";

/**
 * Ensures the given chains directory exists, creating it if needed.
 */
async function ensureChainsDir(chainsDir) {
  try {
    await mkdir(chainsDir, { recursive: true });
  } catch {
    // Already exists
  }
}

/**
 * Lists all chain JSON files in the chains directory.
 * Returns an array of { name, description, filePath }.
 */
export async function listChains() {
  const chainsDir = await getChainsDir();
  await ensureChainsDir(chainsDir);

  const entries = await readdir(chainsDir);
  const chains = [];

  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const filePath = join(chainsDir, entry);
    try {
      const raw = await readFile(filePath, "utf-8");
      const chain = JSON.parse(raw);
      chains.push({
        name: chain.name || entry,
        description: chain.description || "",
        fileName: entry,
        filePath,
      });
    } catch {
      printWarning(`Could not parse ${entry} — skipping.`);
    }
  }

  return chains;
}

/**
 * Loads a chain definition from a JSON file.
 * Attaches `_filePath` so the executor can resolve relative context folders.
 */
export async function loadChain(filePath) {
  const raw = await readFile(filePath, "utf-8");
  const chain = JSON.parse(raw);
  chain._filePath = filePath;
  return chain;
}

/**
 * Saves a chain definition to a JSON file in the chains directory.
 * Returns the file path.
 */
export async function saveChain(chain) {
  const chainsDir = await getChainsDir();
  await ensureChainsDir(chainsDir);

  // Generate a filename from the chain name
  const safeName = chain.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const fileName = `${safeName}.json`;
  const filePath = join(chainsDir, fileName);

  // Don't save internal properties
  const { _filePath, ...cleanChain } = chain;
  await writeFile(filePath, JSON.stringify(cleanChain, null, 2) + "\n", "utf-8");

  return filePath;
}
