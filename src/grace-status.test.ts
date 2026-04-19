import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "bun:test";

import { collectProjectStatus } from "./grace-status";

function createProject() {
  const root = mkdtempSync(path.join(os.tmpdir(), "grace-status-"));
  mkdirSync(path.join(root, "docs"), { recursive: true });
  return root;
}

function writeProjectFile(root: string, relativePath: string, contents: string) {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeStatusProject(root: string, options: { includeRuntime?: boolean } = {}) {
  const includeRuntime = options.includeRuntime ?? true;

  writeProjectFile(root, "AGENTS.md", "# GRACE Project\n");
  writeProjectFile(
    root,
    "docs/requirements.xml",
    `<Requirements VERSION="0.1.0">
  <UseCases>
    <UC-001>Run the example path.</UC-001>
  </UseCases>
</Requirements>`,
  );
  writeProjectFile(
    root,
    "docs/technology.xml",
    `<TechnologyStack VERSION="0.2.0">
  <Runtime>bun 1.3.8</Runtime>
  <Language>typescript 6.x</Language>
</TechnologyStack>`,
  );
  writeProjectFile(
    root,
    "docs/knowledge-graph.xml",
    `<KnowledgeGraph>
  <Project NAME="Example" VERSION="0.1.0">
    <M-EXAMPLE NAME="ExampleDomain" TYPE="CORE_LOGIC">
      <purpose>Run the example flow.</purpose>
      <path>src/example.ts</path>
      <verification-ref>V-M-EXAMPLE</verification-ref>
    </M-EXAMPLE>
  </Project>
</KnowledgeGraph>`,
  );
  writeProjectFile(
    root,
    "docs/development-plan.xml",
    `<DevelopmentPlan VERSION="0.2.0">
  <Modules>
    <M-EXAMPLE NAME="ExampleDomain" TYPE="CORE_LOGIC">
      <contract>
        <purpose>Run the example flow.</purpose>
      </contract>
      <verification-ref>V-M-EXAMPLE</verification-ref>
    </M-EXAMPLE>
  </Modules>
  <ImplementationOrder>
    <Phase-1 name="Foundation" status="done">
      <step-1 module="M-EXAMPLE" status="done" verification="V-M-EXAMPLE">Implement example.</step-1>
    </Phase-1>
  </ImplementationOrder>
</DevelopmentPlan>`,
  );
  writeProjectFile(
    root,
    "docs/verification-plan.xml",
    `<VerificationPlan VERSION="0.2.0">
  <GlobalPolicy>
    <module-level-focus>Fast deterministic checks.</module-level-focus>
  </GlobalPolicy>
  <ModuleVerification>
    <V-M-EXAMPLE MODULE="M-EXAMPLE">
      <test-files>
        <file-1>src/example.test.ts</file-1>
      </test-files>
      <module-checks>
        <check-1>bun test src/example.test.ts</check-1>
      </module-checks>
      <scenarios>
        <scenario-1 kind="success">Happy path returns ok.</scenario-1>
      </scenarios>
      <required-log-markers>
        <marker-1>[ExampleDomain][run][BLOCK_EXECUTE_FLOW]</marker-1>
      </required-log-markers>
      <wave-follow-up>Run merged surface checks.</wave-follow-up>
      <phase-follow-up>Run the full suite.</phase-follow-up>
    </V-M-EXAMPLE>
  </ModuleVerification>
</VerificationPlan>`,
  );
  writeProjectFile(
    root,
    "docs/operational-packets.xml",
    `<OperationalPackets VERSION="0.1.0">
  <ExecutionPacketTemplate>
    <ExecutionPacket />
  </ExecutionPacketTemplate>
  <GraphDeltaTemplate>
    <GraphDelta />
  </GraphDeltaTemplate>
  <VerificationDeltaTemplate>
    <VerificationDelta />
  </VerificationDeltaTemplate>
  <FailurePacketTemplate>
    <FailurePacket />
  </FailurePacketTemplate>
</OperationalPackets>`,
  );

  if (includeRuntime) {
    writeProjectFile(
      root,
      "src/example.ts",
      `// START_MODULE_CONTRACT
//   PURPOSE: Run the example flow.
//   SCOPE: Execute the happy path.
//   DEPENDS: none
//   LINKS: M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   run - Execute the example flow.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.2.0 - Added example runtime module]
// END_CHANGE_SUMMARY
//
// START_CONTRACT: run
//   PURPOSE: Execute the example flow.
//   INPUTS: none
//   OUTPUTS: { string - status }
//   SIDE_EFFECTS: none
//   LINKS: M-EXAMPLE
// END_CONTRACT: run
export function run() {
  console.info("[ExampleDomain][run][BLOCK_EXECUTE_FLOW] run");
  // START_BLOCK_EXECUTE_FLOW
  return "ok";
  // END_BLOCK_EXECUTE_FLOW
}
`,
    );
  }

  writeProjectFile(
    root,
    "src/example.test.ts",
    `// START_MODULE_CONTRACT
//   PURPOSE: Verify the example runtime module.
//   SCOPE: Deterministic checks for the happy path.
//   DEPENDS: bun:test, M-EXAMPLE
//   LINKS: M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   run flow assertion - Assert the happy path marker and result.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.2.0 - Added runtime verification]
// END_CHANGE_SUMMARY
import { expect, test } from "bun:test";
import { run } from "./example";

test("run", () => {
  expect(run()).toBe("ok");
  expect("[ExampleDomain][run][BLOCK_EXECUTE_FLOW]").toContain("BLOCK_EXECUTE_FLOW");
});
`,
  );
}

describe("grace status", () => {
  it("reports a healthy autonomy-ready project", () => {
    const root = createProject();
    writeStatusProject(root);

    const result = collectProjectStatus(root);
    expect(result.metrics.sourceFiles).toBe(1);
    expect(result.metrics.testFiles).toBe(1);
    expect(result.autonomy.ready).toBe(true);
    expect(result.nextAction).toBe("Project is healthy.");
    expect(result.recentChanges).toHaveLength(2);
  });

  it("wires the status command through the CLI", () => {
    const root = createProject();
    writeStatusProject(root);
    const repoRoot = path.resolve(import.meta.dir, "..");

    const statusResult = Bun.spawnSync({
      cmd: [process.execPath, "run", "./src/grace.ts", "status", "--path", root],
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(statusResult.exitCode).toBe(0);
    const output = Buffer.from(statusResult.stdout).toString("utf8");
    expect(output).toContain("GRACE Status");
    expect(output).toContain("Autonomy gate: READY");
  });

  it("does not treat test-only linkage as implemented module coverage", () => {
    const root = createProject();
    writeStatusProject(root, { includeRuntime: false });

    const result = collectProjectStatus(root);
    expect(result.health.codebaseModules).toBe(0);
    expect(result.health.sharedModulesWithoutGovernedFiles).toEqual(["M-EXAMPLE"]);
  });
});
