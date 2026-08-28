#!/usr/bin/env node
/**
 * SupportBot | Emerald Services
 * Git Security Setup Script
 *
 * Sets up Git pre-commit hooks and safeguards to prevent sensitive credentials
 * (Discord bot tokens, API keys, database credentials) from being accidentally committed.
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const GIT_DIR = path.join(ROOT_DIR, ".git");
const HOOKS_DIR = path.join(GIT_DIR, "hooks");
const PRE_COMMIT_HOOK = path.join(HOOKS_DIR, "pre-commit");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
};

console.log(`\n${colors.bold}${colors.green}SupportBot Git Security Setup${colors.reset}`);
console.log(`${colors.gray}────────────────────────────────────────────────────────${colors.reset}`);

if (!fs.existsSync(GIT_DIR)) {
  console.log(`${colors.yellow}[!] Warning: .git directory not found. Are you in a Git repository?${colors.reset}`);
  process.exit(0);
}

if (!fs.existsSync(HOOKS_DIR)) {
  fs.mkdirSync(HOOKS_DIR, { recursive: true });
}

// Pre-commit hook script
const hookContent = `#!/usr/bin/env node
/**
 * SupportBot Git Pre-Commit Security Hook
 * Scans staged configuration files for exposed secrets before committing.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const SENSITIVE_PATTERNS = [
  { name: "Discord Bot Token", regex: /N[A-Za-z0-9_-]{23,28}\\.[A-Za-z0-9_-]{6}\\.[A-Za-z0-9_-]{27,}/ },
  { name: "Groq API Key", regex: /gsk_[A-Za-z0-9]{40,}/ },
  { name: "OpenAI API Key", regex: /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/ },
  { name: "Anthropic API Key", regex: /sk-ant-[A-Za-z0-9_-]{32,}/ }
];

const CONFIG_FILES = [
  "Configs/supportbot.yml",
  "Configs/supportbot-ai.yml",
  "Configs/api.yml"
];

let hasViolations = false;

try {
  const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf8" })
    .split("\\n")
    .map((f) => f.trim())
    .filter(Boolean);

  for (const file of stagedFiles) {
    if (CONFIG_FILES.includes(file)) {
      const fullPath = path.join(ROOT, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");

        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.regex.test(content)) {
            console.error("\\x1b[31m\\x1b[1m[GIT SECURITY ALERT]\\x1b[0m Potential active " + pattern.name + " detected in " + file + "!");
            console.error("\\x1b[33mPlease replace secrets with placeholders before committing.\\x1b[0m\\n");
            hasViolations = true;
          }
        }
      }
    }
  }
} catch (err) {
  // If git command fails, do not block commit
}

if (hasViolations) {
  console.error("\\x1b[31mCommit aborted due to sensitive credentials detected in staged files.\\x1b[0m");
  process.exit(1);
}

process.exit(0);
`;

try {
  fs.writeFileSync(PRE_COMMIT_HOOK, hookContent, { mode: 0o755 });
  console.log(`${colors.green}✓${colors.reset} Pre-commit hook installed at ${colors.cyan}.git/hooks/pre-commit${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}✗ Failed to write pre-commit hook: ${err.message}${colors.reset}`);
}

console.log(`\n${colors.bold}Recommended local workflow for sensitive configs:${colors.reset}`);
console.log(`${colors.cyan}  git update-index --assume-unchanged Configs/supportbot.yml${colors.reset}`);
console.log(`${colors.cyan}  git update-index --assume-unchanged Configs/supportbot-ai.yml${colors.reset}`);
console.log(`${colors.cyan}  git update-index --assume-unchanged Configs/api.yml${colors.reset}`);
console.log(`\n${colors.green}Security setup completed successfully!${colors.reset}\n`);

