# Prompt Chaining Tool

Interactive CLI for chaining prompts with Google Gemini. Build multi-step AI workflows where each prompt builds on the previous response.

## Setup

Requires **Node.js 20.12+**.

```bash
npm install
```

Create a `.env` file with your Gemini API key:

```
GEMINI_API_KEY=your-key-here
```

## Usage

```bash
node src/index.js
```

Or link globally:

```bash
npm link
prompt-chain
```

### Main Menu

- **Run a saved chain** — pick from `chains/*.json` and execute
- **Create a new chain** — build a chain interactively and save it
- **Run a quick ad-hoc chain** — enter prompts on the fly without saving

### Chain Format

Chains are JSON files in `chains/`:

```json
{
  "name": "My Chain",
  "description": "What it does",
  "model": "gemini-2.0-flash",
  "prompts": [
    {
      "id": "prompt_1",
      "text": "Analyze this {{language}} code for bugs.",
      "contextFolder": "prompt_1_context"
    },
    {
      "id": "prompt_2",
      "text": "Suggest improvements based on your analysis.",
      "contextFolder": null,
      "output": "output/improvements.md"
    }
  ]
}
```

### Variables

Use `{{variableName}}` in prompt text. The CLI will ask for values before execution.

### Context Folders

Set `contextFolder` on a prompt to attach files. The path is relative to the chain JSON file. Supported:

- **Text files** (`.txt`, `.md`, `.js`, `.py`, `.json`, etc.) — read as UTF-8
- **Binary files** (`.pdf`, `.png`, `.jpg`, `.gif`, `.webp`) — sent as inline data
- Files over 10MB are skipped with a warning

### Output Files

Set `output` on a prompt to save its response to a file. The path is relative to the chain JSON file. Parent directories are created automatically. If `output` is omitted or `null`, the response is only printed to the terminal.

```json
{
  "id": "prompt_2",
  "text": "Suggest improvements based on your analysis.",
  "contextFolder": null,
  "output": "output/improvements.md"
}
```

### Editor Configuration

When creating or running an ad-hoc chain, prompts are entered using your system's default terminal editor. Set the `$EDITOR` environment variable to use your preferred editor.

For **VS Code**:

```bash
export EDITOR='code --wait'
```

For **vim** or **nano**:

```bash
export EDITOR='vim'
export EDITOR='nano'
```

Add the export line to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.) to make it permanent. The `--wait` flag is required for VS Code so the CLI knows when you've finished editing.
