import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { GraceLintConfig, LintIssue } from "./types";

const CONFIG_FILE_NAME = ".grace-lint.json";
const VALID_PROFILES = new Set(["auto", "current", "legacy"]);

export function loadGraceLintConfig(projectRoot: string) {
  const configPath = path.join(projectRoot, CONFIG_FILE_NAME);
  if (!existsSync(configPath)) {
    return { config: null as GraceLintConfig | null, issues: [] as LintIssue[] };
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8")) as GraceLintConfig;
    const issues: LintIssue[] = [];

    if (parsed.profile && !VALID_PROFILES.has(parsed.profile)) {
      issues.push({
        severity: "error",
        code: "config.invalid-profile",
        file: CONFIG_FILE_NAME,
        message: `Unsupported profile \`${parsed.profile}\` in ${CONFIG_FILE_NAME}. Use \`auto\`, \`current\`, or \`legacy\`.`,
      });
    }

    if (parsed.ignoredDirs && !Array.isArray(parsed.ignoredDirs)) {
      issues.push({
        severity: "error",
        code: "config.invalid-ignored-dirs",
        file: CONFIG_FILE_NAME,
        message: `\`ignoredDirs\` in ${CONFIG_FILE_NAME} must be an array of directory names.`,
      });
    }

    return { config: parsed, issues };
  } catch (error) {
    return {
      config: null,
      issues: [
        {
          severity: "error",
          code: "config.invalid-json",
          file: CONFIG_FILE_NAME,
          message: `Failed to parse ${CONFIG_FILE_NAME}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
