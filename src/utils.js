import ora from "ora";
import chalk from "chalk";

export function createSpinner(text) {
  return ora({ text, color: "cyan" });
}

export function printHeader() {
  console.log(chalk.bold.cyan("\n  Prompt Chaining Tool v1.0.0\n"));
}

export function printStepHeader(index, total, promptText) {
  const preview =
    promptText.length > 70 ? promptText.slice(0, 70) + "…" : promptText;
  console.log(
    chalk.bold(`\n  [${index + 1}/${total}] Executing: `) +
      chalk.dim(`"${preview}"`)
  );
}

export function printResponse(text) {
  console.log(chalk.green("\n  ── Response ──────────────────────────────\n"));
  // Indent each line for readability
  const indented = text
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
  console.log(indented);
  console.log(chalk.green("\n  ──────────────────────────────────────────\n"));
}

export function printError(message) {
  console.error(chalk.red(`\n  Error: ${message}\n`));
}

export function printWarning(message) {
  console.warn(chalk.yellow(`  Warning: ${message}`));
}

export function printSuccess(message) {
  console.log(chalk.green(`  ${message}`));
}

export function printInfo(message) {
  console.log(chalk.dim(`  ${message}`));
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
