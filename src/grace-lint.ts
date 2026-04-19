#!/usr/bin/env bun

import { defineCommand, type CommandDef, runMain } from "citty";

import { formatTextReport, isValidTextFormat, lintGraceProject } from "./lint/core";
import type { LintOptions, LintResult } from "./lint/types";

export type {
  GraceLintConfig,
  LanguageAdapter,
  LanguageAnalysis,
  LintIssue,
  LintOptions,
  LintProfile,
  LintResult,
  LintSeverity,
  MapMode,
  ModuleRole,
} from "./lint/types";

export { formatTextReport, lintGraceProject } from "./lint/core";

function writeResult(format: string, result: LintResult) {
  if (format === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${formatTextReport(result)}\n`);
}

function resolveProfile(value: unknown) {
  const profile = String(value ?? "standard");
  if (profile !== "standard" && profile !== "autonomous") {
    throw new Error(`Unsupported profile \`${profile}\`. Use \`standard\` or \`autonomous\`.`);
  }

  return profile;
}

export const lintCommand = defineCommand({
  meta: {
    name: "lint",
    description: "Lint GRACE artifacts, XML tag conventions, semantic markup, role-aware module maps, and optional autonomy readiness.",
  },
  args: {
    path: {
      type: "string",
      alias: "p",
      description: "Project root to lint",
      default: ".",
    },
    format: {
      type: "string",
      alias: "f",
      description: "Output format: text or json",
      default: "text",
    },
    profile: {
      type: "string",
      description: "Lint profile: standard or autonomous",
      default: "standard",
    },
    allowMissingDocs: {
      type: "boolean",
      description: "Allow repositories that do not yet have full GRACE docs",
      default: false,
    },
  },
  async run(context) {
    const format = String(context.args.format ?? "text");
    const profile = resolveProfile(context.args.profile);
    if (!isValidTextFormat(format)) {
      throw new Error(`Unsupported format \`${format}\`. Use \`text\` or \`json\`.`);
    }

    const result = lintGraceProject(String(context.args.path ?? "."), {
      allowMissingDocs: Boolean(context.args.allowMissingDocs),
      profile,
    });

    writeResult(format, result);
    process.exitCode = result.issues.some((issue) => issue.severity === "error") ? 1 : 0;
  },
});

if (import.meta.main) {
  await runMain(lintCommand as CommandDef);
}
