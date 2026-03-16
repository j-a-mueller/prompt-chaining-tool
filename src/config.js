import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const CONFIG_FILENAME = ".prompt-chaining-tool.json";

/**
 * Returns the config file path in the current working directory.
 */
export function getConfigFilePath() {
  return join(process.cwd(), CONFIG_FILENAME);
}

/**
 * Reads the config file from cwd. Returns parsed object, or {} if missing/malformed.
 */
export async function loadConfig() {
  try {
    const raw = await readFile(getConfigFilePath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Writes config object as JSON to the config file in cwd.
 */
export async function saveConfig(config) {
  await writeFile(
    getConfigFilePath(),
    JSON.stringify(config, null, 2) + "\n",
    "utf-8"
  );
}

/**
 * Returns the resolved absolute path to the chains directory.
 * If config.chainsDir exists, resolves it relative to cwd.
 * Otherwise returns the default ../chains relative to the project install.
 */
export async function getChainsDir() {
  const config = await loadConfig();
  if (config.chainsDir) {
    return resolve(process.cwd(), config.chainsDir);
  }
  return resolve(new URL("../chains", import.meta.url).pathname);
}
