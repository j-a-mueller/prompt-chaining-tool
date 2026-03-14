import { select, input, editor, confirm } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * Shows the main menu and returns the user's choice.
 */
export async function mainMenu() {
  return select({
    message: "What would you like to do?",
    choices: [
      { name: "Run a saved chain", value: "run" },
      { name: "Create a new chain", value: "create" },
      { name: "Run a quick ad-hoc chain", value: "adhoc" },
      { name: "Exit", value: "exit" },
    ],
  });
}

/**
 * Prompts the user to select a chain from a list.
 */
export async function selectChain(chains) {
  if (chains.length === 0) {
    console.log(chalk.dim("\n  No saved chains found in chains/ directory.\n"));
    return null;
  }

  return select({
    message: "Select a chain to run:",
    choices: chains.map((c) => ({
      name: c.description ? `${c.name} — ${c.description}` : c.name,
      value: c.filePath,
    })),
  });
}

/**
 * Prompts the user to enter chain metadata (name, description, model).
 */
export async function getChainMetadata() {
  const name = await input({
    message: "Chain name:",
    validate: (v) => (v.trim() ? true : "Name is required"),
  });

  const description = await input({
    message: "Description (optional):",
  });

  const model = await input({
    message: "Model:",
    default: "gemini-2.0-flash",
  });

  return { name: name.trim(), description: description.trim(), model: model.trim() };
}

/**
 * Prompts the user to enter a single prompt step.
 * Returns { text, contextFolder } or null if the user is done adding prompts.
 */
export async function getPromptStep(index) {
  console.log(chalk.bold(`\n  --- Prompt ${index + 1} ---`));

  const text = await editor({
    message: `Enter prompt ${index + 1} text (opens editor):`,
    waitForUseInput: false,
  });

  if (!text.trim()) {
    return null;
  }

  const contextFolder = await input({
    message: "Context folder path (relative to chain file, or leave empty):",
  });

  const output = await input({
    message: "Output file path (relative to chain file, or leave empty):",
  });

  return {
    id: `prompt_${index + 1}`,
    text: text.trim(),
    contextFolder: contextFolder.trim() || null,
    output: output.trim() || null,
  };
}

/**
 * Asks the user if they want to add another prompt.
 */
export async function askAddAnother() {
  return confirm({
    message: "Add another prompt?",
    default: true,
  });
}

/**
 * Asks the user if they want to run the chain now.
 */
export async function askRunNow() {
  return confirm({
    message: "Run this chain now?",
    default: true,
  });
}
