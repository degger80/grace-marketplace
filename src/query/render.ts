import type {
  FileMarkupRecord,
  ModuleHealthRecord,
  ModuleMatch,
  ModuleRecord,
  ModuleVerificationRecord,
  VerificationMatch,
} from "./types";
import { getModuleDepends, getModuleName, getModulePath, getModuleType, getModuleVerificationIds } from "./core";

function formatList(label: string, items: string[]) {
  if (items.length === 0) {
    return [`${label}: none`];
  }

  return [label, ...items.map((item) => `- ${item}`)];
}

function formatFieldMap(fields: Record<string, string>) {
  const entries = Object.entries(fields);
  if (entries.length === 0) {
    return ["- none"];
  }

  return entries.map(([key, value]) => `- ${key}: ${value}`);
}

function formatVerificationDetails(entry: ModuleVerificationRecord) {
  const lines = [
    `Verification ${entry.id}`,
    `- Module: ${entry.moduleId ?? "unknown"}`,
    `- Priority: ${entry.priority ?? "n/a"}`,
  ];

  lines.push(...formatList("Test Files", entry.testFiles));
  lines.push(...formatList("Module Checks", entry.moduleChecks));

  if (entry.scenarios.length > 0) {
    lines.push("Scenarios");
    for (const scenario of entry.scenarios) {
      const prefix = scenario.kind ? `${scenario.tag} (${scenario.kind})` : scenario.tag;
      lines.push(`- ${prefix}: ${scenario.text}`);
    }
  }

  lines.push(...formatList("Required Log Markers", entry.requiredLogMarkers));
  lines.push(...formatList("Required Trace Assertions", entry.requiredTraceAssertions));

  if (entry.waveFollowUp) {
    lines.push(`- Wave Follow-Up: ${entry.waveFollowUp}`);
  }
  if (entry.phaseFollowUp) {
    lines.push(`- Phase Follow-Up: ${entry.phaseFollowUp}`);
  }

  return lines;
}

function formatModuleHealthIssues(label: string, issues: ModuleHealthRecord["blockers"]) {
  if (issues.length === 0) {
    return [label, "- none"];
  }

  return [label, ...issues.map((issue) => `- ${issue.code}: ${issue.message} Fix: ${issue.remediation}`)];
}

function renderTable(rows: string[][], headers: string[]) {
  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)));
  const formatRow = (row: string[]) => row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  const separator = widths.map((width) => "-".repeat(width)).join("  ");
  return [formatRow(headers), separator, ...rows.map((row) => formatRow(row))].join("\n");
}

export function formatModuleFindTable(matches: ModuleMatch[]) {
  if (matches.length === 0) {
    return "No modules found.";
  }

  const rows = matches.map(({ module }) => [
    module.id,
    getModuleName(module),
    getModuleType(module) ?? "-",
    getModulePath(module) ?? "-",
    getModuleVerificationIds(module).join(", ") || "-",
  ]);

  return renderTable(rows, ["ID", "NAME", "TYPE", "PATH", "VERIFICATION"]);
}

export function formatVerificationFindTable(matches: VerificationMatch[]) {
  if (matches.length === 0) {
    return "No verification entries found.";
  }

  const rows = matches.map(({ verification, module }) => [
    verification.id,
    verification.moduleId ?? "-",
    module ? getModuleName(module) : "-",
    verification.priority ?? "-",
    String(verification.testFiles.length),
    String(verification.scenarios.length),
  ]);

  return renderTable(rows, ["ID", "MODULE", "MODULE_NAME", "PRIORITY", "TESTS", "SCENARIOS"]);
}

export function formatModuleHealthTable(records: ModuleHealthRecord[]) {
  if (records.length === 0) {
    return "No module health records available.";
  }

  const rows = records.map((record) => [
    record.moduleId,
    record.state,
    record.summary.hasImplementationFiles ? String(record.implementationFiles.length) : "0",
    record.summary.hasVerification ? String(record.verificationIds.length) : "0",
    record.summary.hasVerificationTests ? String(record.verificationTestFiles.length) : "0",
    record.summary.autonomyReady ? "yes" : "no",
  ]);

  return renderTable(rows, ["ID", "STATE", "IMPL", "VERIFY", "TESTS", "AUTO_READY"]);
}

export function formatVerificationText(match: VerificationMatch) {
  const lines = [
    "GRACE Verification",
    "==================",
    `ID: ${match.verification.id}`,
    `Module: ${match.verification.moduleId ?? "unknown"}`,
    `Module Name: ${match.module ? getModuleName(match.module) : "unknown"}`,
    `Priority: ${match.verification.priority ?? "n/a"}`,
  ];

  if (match.module) {
    lines.push(`Module Path: ${getModulePath(match.module) ?? "n/a"}`);
  }

  lines.push(...formatVerificationDetails(match.verification));
  return lines.join("\n");
}

export function formatModuleHealthText(record: ModuleHealthRecord) {
  const lines = [
    "GRACE Module Health",
    "===================",
    `ID: ${record.moduleId}`,
    `Name: ${record.name}`,
    `Type: ${record.type ?? "unknown"}`,
    `Path: ${record.path ?? "n/a"}`,
    `State: ${record.state}`,
    `Verification IDs: ${record.verificationIds.join(", ") || "none"}`,
    `Implementation Files: ${record.implementationFiles.join(", ") || "none"}`,
    `Governed Test Files: ${record.governedTestFiles.join(", ") || "none"}`,
    `Verification Test Files: ${record.verificationTestFiles.join(", ") || "none"}`,
    "",
    "Summary",
    `- Plan Record: ${record.summary.hasPlan ? "yes" : "no"}`,
    `- Graph Record: ${record.summary.hasGraph ? "yes" : "no"}`,
    `- Implementation Files: ${record.summary.hasImplementationFiles ? "yes" : "no"}`,
    `- Verification Entry: ${record.summary.hasVerification ? "yes" : "no"}`,
    `- Verification Tests: ${record.summary.hasVerificationTests ? "yes" : "no"}`,
    `- Pending Steps: ${record.summary.pendingSteps}`,
    `- Completed Steps: ${record.summary.completedSteps}`,
    `- Autonomy Ready: ${record.summary.autonomyReady ? "yes" : "no"}`,
    "",
  ];

  lines.push(...formatModuleHealthIssues("Blockers", record.blockers));
  lines.push("", ...formatModuleHealthIssues("Warnings", record.warnings), "", "Suggested Next Action", `- ${record.nextAction}`);

  return lines.join("\n");
}

export function formatModuleText(moduleRecord: ModuleRecord, options: { withVerification: boolean; health?: ModuleHealthRecord | null }) {
  const lines = [
    "GRACE Module",
    "============",
    `ID: ${moduleRecord.id}`,
    `Name: ${getModuleName(moduleRecord)}`,
    `Type: ${getModuleType(moduleRecord) ?? "unknown"}`,
    `Graph Path: ${moduleRecord.graph?.path ?? "n/a"}`,
    `Verification: ${getModuleVerificationIds(moduleRecord).join(", ") || "none"}`,
    `Dependencies: ${getModuleDepends(moduleRecord).join(", ") || "none"}`,
  ];

  if (moduleRecord.plan) {
    lines.push("", "Plan Contract");
    lines.push(`- Purpose: ${moduleRecord.plan.contract.purpose ?? "n/a"}`);
    lines.push(...formatList("Inputs", moduleRecord.plan.contract.inputs.map((input) => input.text)));
    lines.push(...formatList("Outputs", moduleRecord.plan.contract.outputs.map((output) => output.text)));
    lines.push(...formatList("Errors", moduleRecord.plan.contract.errors));

    lines.push("", "Public Interface (Plan)");
    lines.push(
      ...(moduleRecord.plan.interfaceItems.length > 0
        ? moduleRecord.plan.interfaceItems.map((item) => `- ${item.tag}${item.purpose ? `: ${item.purpose}` : ""}`)
        : ["- none"]),
    );
  }

  if (moduleRecord.graph) {
    lines.push("", "Knowledge Graph");
    lines.push(`- Purpose: ${moduleRecord.graph.purpose ?? "n/a"}`);
    lines.push(`- Status: ${moduleRecord.graph.status ?? "n/a"}`);
    lines.push(
      ...(moduleRecord.graph.annotations.length > 0
        ? moduleRecord.graph.annotations.map((item) => `- ${item.tag}${item.purpose ? `: ${item.purpose}` : ""}`)
        : ["- Annotations: none"]),
    );
  }

  lines.push("", "Linked Files");
  lines.push(...(moduleRecord.localFiles.length > 0 ? moduleRecord.localFiles.map((file) => `- ${file.path}`) : ["- none"]));

  lines.push("", "Plan Steps");
  lines.push(
    ...(moduleRecord.steps.length > 0
      ? moduleRecord.steps.map(
          (step) =>
            `- ${step.phaseTag}${step.phaseName ? ` (${step.phaseName})` : ""} / ${step.stepTag}${step.stepStatus ? ` [${step.stepStatus}]` : ""}: ${step.text}`,
        )
      : ["- none"]),
  );

  if (options.withVerification) {
    lines.push("", "Verification");
    if (moduleRecord.verifications.length === 0) {
      lines.push("- none");
    } else {
      for (const entry of moduleRecord.verifications) {
        lines.push(...formatVerificationDetails(entry), "");
      }
      if (lines[lines.length - 1] === "") {
        lines.pop();
      }
    }
  }

  if (options.health) {
    lines.push("", "Health");
    lines.push(`- State: ${options.health.state}`);
    lines.push(`- Implementation Files: ${options.health.implementationFiles.join(", ") || "none"}`);
    lines.push(`- Verification Test Files: ${options.health.verificationTestFiles.join(", ") || "none"}`);
    lines.push(`- Blockers: ${options.health.blockers.length}`);
    lines.push(`- Warnings: ${options.health.warnings.length}`);
    if (options.health.blockers.length > 0) {
      lines.push(...options.health.blockers.map((issue) => `- Blocker ${issue.code}: ${issue.message}`));
    }
    if (options.health.warnings.length > 0) {
      lines.push(...options.health.warnings.map((issue) => `- Warning ${issue.code}: ${issue.message}`));
    }
    lines.push(`- Next Action: ${options.health.nextAction}`);
  }

  return lines.join("\n");
}

export function formatFileText(
  fileRecord: FileMarkupRecord,
  options: { includeContracts: boolean; includeBlocks: boolean },
) {
  const lines = [
    "GRACE File",
    "==========",
    `Path: ${fileRecord.path}`,
    `Linked Modules: ${fileRecord.linkedModuleIds.join(", ") || "none"}`,
    `Contracts: ${fileRecord.contracts.length}`,
    `Blocks: ${fileRecord.blocks.length}`,
    "",
    "MODULE_CONTRACT",
    ...formatFieldMap(fileRecord.moduleContract?.fields ?? {}),
    "",
    "MODULE_MAP",
    ...(fileRecord.moduleMap.length > 0 ? fileRecord.moduleMap.map((item) => `- ${item.label}`) : ["- none"]),
    "",
    "CHANGE_SUMMARY",
    ...formatFieldMap(fileRecord.changeSummary?.fields ?? {}),
  ];

  if (options.includeContracts) {
    lines.push("", "Contracts");
    if (fileRecord.contracts.length === 0) {
      lines.push("- none");
    } else {
      for (const contract of fileRecord.contracts) {
        lines.push(`Contract ${contract.name} (lines ${contract.startLine}-${contract.endLine})`);
        lines.push(...formatFieldMap(contract.fields));
      }
    }
  }

  if (options.includeBlocks) {
    lines.push("", "Blocks");
    lines.push(
      ...(fileRecord.blocks.length > 0
        ? fileRecord.blocks.map((block) => `- ${block.name} (lines ${block.startLine}-${block.endLine})`)
        : ["- none"]),
    );
  }

  return lines.join("\n");
}
