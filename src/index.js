#!/usr/bin/env node

import { ExitPromptError } from "@inquirer/core";
import { select, input } from "@inquirer/prompts";
import { executeChain } from "./chain.js";
import { getChainsDir, loadConfig, saveConfig, getConfigFilePath } from "./config.js";
import { listChains, loadChain, saveChain } from "./storage.js";
import {
  mainMenu,
  selectChain,
  getChainMetadata,
  getPromptStep,
  askAddAnother,
  askRunNow,
} from "./ui.js";
import {
  printHeader,
  printError,
  printSuccess,
  printInfo,
} from "./utils.js";

// Load .env file (Node 20.12+ built-in)
try {
  process.loadEnvFile();
} catch {
  // .env file may not exist — that's fine, key check happens in gemini.js
}

async function handleRunSavedChain() {
  const chains = await listChains();
  const filePath = await selectChain(chains);
  if (!filePath) return;

  try {
    const chainDef = await loadChain(filePath);
    printInfo(`\nRunning "${chainDef.name}"...\n`);
    await executeChain(chainDef);
  } catch (err) {
    printError(`Failed to load chain: ${err.message}`);
  }
}

async function handleCreateChain() {
  const metadata = await getChainMetadata();
  const prompts = [];

  // Collect prompts
  let adding = true;
  let index = 0;
  while (adding) {
    const prompt = await getPromptStep(index);
    if (!prompt) {
      if (prompts.length === 0) {
        printError("At least one prompt is required.");
        continue;
      }
      break;
    }
    prompts.push(prompt);
    index++;

    adding = await askAddAnother();
  }

  const chainDef = {
    ...metadata,
    prompts,
  };

  // Save
  let savedFilePath;
  try {
    savedFilePath = await saveChain(chainDef);
    printSuccess(`\nChain saved to ${savedFilePath}`);
  } catch (err) {
    printError(`Failed to save chain: ${err.message}`);
    return;
  }

  // Optionally run
  const shouldRun = await askRunNow();
  if (shouldRun) {
    await executeChain({ ...chainDef, _filePath: savedFilePath });
  }
}

async function handleAdHocChain() {
  printInfo("\nCreate a quick chain (not saved):\n");

  const model = (
    await (await import("@inquirer/prompts")).input({
      message: "Model:",
      default: "gemini-2.0-flash",
    })
  ).trim();

  const prompts = [];
  let adding = true;
  let index = 0;

  while (adding) {
    const prompt = await getPromptStep(index);
    if (!prompt) {
      if (prompts.length === 0) {
        printError("At least one prompt is required.");
        continue;
      }
      break;
    }
    prompts.push(prompt);
    index++;

    if (index >= 1) {
      adding = await askAddAnother();
    }
  }

  const chainDef = {
    name: "Ad-hoc Chain",
    model,
    prompts,
  };

  await executeChain(chainDef);
}

async function handleOptions() {
  const action = await select({
    message: "Options:",
    choices: [
      { name: "Change chains folder", value: "change" },
      { name: "View current settings", value: "view" },
      { name: "Back to main menu", value: "back" },
    ],
  });

  switch (action) {
    case "change": {
      const currentDir = await getChainsDir();
      printInfo(`\nCurrent chains folder: ${currentDir}\n`);

      const newPath = await input({
        message: "New chains folder path (relative to cwd or absolute):",
      });

      if (!newPath.trim()) {
        printInfo("No changes made.\n");
        return;
      }

      const config = await loadConfig();
      config.chainsDir = newPath.trim();
      await saveConfig(config);

      const resolvedDir = await getChainsDir();
      printSuccess(`\nChains folder updated to: ${resolvedDir}`);
      printInfo(`Config saved to: ${getConfigFilePath()}\n`);
      break;
    }
    case "view": {
      const chainsDir = await getChainsDir();
      const configPath = getConfigFilePath();
      printInfo(`\nChains folder: ${chainsDir}`);
      printInfo(`Config file:   ${configPath}\n`);
      break;
    }
    case "back":
      return;
  }
}

async function main() {
  printHeader();
  printInfo(`Chains folder: ${await getChainsDir()}\n`);

  while (true) {
    try {
      const action = await mainMenu();

      switch (action) {
        case "run":
          await handleRunSavedChain();
          break;
        case "create":
          await handleCreateChain();
          break;
        case "adhoc":
          await handleAdHocChain();
          break;
        case "options":
          await handleOptions();
          break;
        case "exit":
          printInfo("Goodbye!\n");
          process.exit(0);
      }
    } catch (err) {
      if (err instanceof ExitPromptError) {
        printInfo("\nGoodbye!\n");
        process.exit(0);
      }
      printError(err.message || String(err));
    }
  }
}

main();
