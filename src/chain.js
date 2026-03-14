import { input } from "@inquirer/prompts";
import { createClient } from "./gemini.js";
import { loadContextParts } from "./context.js";
import {
  createSpinner,
  printStepHeader,
  printResponse,
  printError,
  printWarning,
  printInfo,
  sleep,
} from "./utils.js";
import { dirname, join } from "node:path";

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

/**
 * Scans all prompts for {{variable}} placeholders, asks the user for values,
 * and returns a new chain definition with substituted text.
 */
export async function resolveVariables(chainDef) {
  // Collect all unique variable names across all prompts
  const variableNames = new Set();
  for (const prompt of chainDef.prompts) {
    for (const match of prompt.text.matchAll(VARIABLE_REGEX)) {
      variableNames.add(match[1]);
    }
  }

  if (variableNames.size === 0) return chainDef;

  console.log("\n  This chain has variables that need values:\n");

  const values = {};
  for (const name of variableNames) {
    values[name] = await input({ message: `${name}:` });
  }

  // Deep-clone prompts with substituted text
  const resolvedPrompts = chainDef.prompts.map((prompt) => ({
    ...prompt,
    text: prompt.text.replace(VARIABLE_REGEX, (_, varName) => values[varName]),
  }));

  return { ...chainDef, prompts: resolvedPrompts };
}

/**
 * Executes a chain definition: creates a Gemini chat session and sends
 * each prompt in sequence, carrying context via chat history.
 */
export async function executeChain(chainDef) {
  const resolved = await resolveVariables(chainDef);
  const model = resolved.model || "gemini-2.0-flash";
  const prompts = resolved.prompts;
  const chainDir = resolved._filePath ? dirname(resolved._filePath) : null;

  const client = createClient();
  const chat = client.chats.create({ model });

  printInfo(`Using model: ${model}\n`);

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    printStepHeader(i, prompts.length, prompt.text);

    // Build message parts
    const parts = [];

    // Load context if a folder is specified
    if (prompt.contextFolder && chainDir) {
      const contextPath = join(chainDir, prompt.contextFolder);
      const contextParts = await loadContextParts(contextPath);
      parts.push(...contextParts);
    } else if (prompt.contextFolder && !chainDir) {
      printWarning(
        "Context folder specified but chain has no file path — skipping context."
      );
    }

    // Add the prompt text
    parts.push({ text: prompt.text });

    // Send message with retry on 429
    const spinner = createSpinner("Waiting for response...");
    spinner.start();

    let response;
    try {
      response = await sendWithRetry(chat, parts);
    } catch (err) {
      spinner.fail(`Prompt ${i + 1} failed`);
      printError(err.message || String(err));
      const shouldContinue = prompts.length > i + 1;
      if (shouldContinue) {
        printWarning("Skipping remaining prompts due to error.");
      }
      return;
    }

    spinner.succeed(`Prompt ${i + 1} completed`);

    const responseText = response.text ?? "(empty response)";
    printResponse(responseText);
  }

  printInfo("Chain completed.\n");
}

async function sendWithRetry(chat, parts, retried = false) {
  try {
    return await chat.sendMessage({ message: parts });
  } catch (err) {
    // Retry once on 429 rate limit
    if (!retried && err.status === 429) {
      printWarning("Rate limited — waiting 5 seconds before retrying...");
      await sleep(5000);
      return sendWithRetry(chat, parts, true);
    }
    throw err;
  }
}
