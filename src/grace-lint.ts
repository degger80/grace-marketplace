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

export const lintCommand = defineCommand({
  meta: {
    name: "lint",
    description: "Lint GRACE artifacts, XML tag conventions, semantic markup, and role-aware module maps.",
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
    allowMissingDocs: {
      type: "boolean",
      description: "Allow repositories that do not yet have full GRACE docs",
      default: false,
    },
  },
  async run(context) {
    const format = String(context.args.format ?? "text");
    if (!isValidTextFormat(format)) {
      throw new Error(`Unsupported format \`${format}\`. Use \`text\` or \`json\`.`);
    }

    const result = lintGraceProject(String(context.args.path ?? "."), {
      allowMissingDocs: Boolean(context.args.allowMissingDocs),
    });

    writeResult(format, result);
    process.exitCode = result.issues.some((issue) => issue.severity === "error") ? 1 : 0;
  },
});

if (import.meta.main) {
  await runMain(lintCommand as CommandDef);
}
