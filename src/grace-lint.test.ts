import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "bun:test";

import { lintGraceProject } from "./grace-lint";

function createProject() {
  const root = mkdtempSync(path.join(os.tmpdir(), "grace-lint-"));
  mkdirSync(path.join(root, "docs"), { recursive: true });
  return root;
}

function writeProjectFile(root: string, relativePath: string, contents: string) {
  const filePath = path.join(root, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeLegacyDocs(root: string) {
  writeProjectFile(
    root,
    "docs/knowledge-graph.xml",
    `<KnowledgeGraph>
  <Project NAME="Example" VERSION="0.1.0">
    <M-EXAMPLE NAME="Example" TYPE="CORE_LOGIC">
      <purpose>Run the example flow.</purpose>
      <path>src/example.ts</path>
      <depends>none</depends>
    </M-EXAMPLE>
  </Project>
</KnowledgeGraph>`,
  );

  writeProjectFile(
    root,
    "docs/development-plan.xml",
    `<DevelopmentPlan VERSION="0.1.0">
  <Modules>
    <M-EXAMPLE NAME="Example" TYPE="CORE_LOGIC" STATUS="planned">
      <contract>
        <purpose>Run the example flow.</purpose>
      </contract>
    </M-EXAMPLE>
  </Modules>
</DevelopmentPlan>`,
  );
}

function writeCurrentDocs(root: string) {
  writeProjectFile(
    root,
    "docs/knowledge-graph.xml",
    `<KnowledgeGraph>
  <Project NAME="Example" VERSION="0.1.0">
    <M-EXAMPLE NAME="Example" TYPE="CORE_LOGIC">
      <purpose>Run the example flow.</purpose>
      <path>src/example.ts</path>
      <depends>none</depends>
      <verification-ref>V-M-EXAMPLE</verification-ref>
      <annotations>
        <fn-run PURPOSE="Run the example flow" />
        <export-run PURPOSE="Public module entry point" />
      </annotations>
    </M-EXAMPLE>
  </Project>
</KnowledgeGraph>`,
  );

  writeProjectFile(
    root,
    "docs/development-plan.xml",
    `<DevelopmentPlan VERSION="0.1.0">
  <Modules>
    <M-EXAMPLE NAME="Example" TYPE="CORE_LOGIC" STATUS="planned">
      <contract>
        <purpose>Run the example flow.</purpose>
      </contract>
      <verification-ref>V-M-EXAMPLE</verification-ref>
    </M-EXAMPLE>
  </Modules>
  <ImplementationOrder>
    <Phase-1 name="Foundation" status="pending">
      <step-1 module="M-EXAMPLE" status="pending" verification="V-M-EXAMPLE">Implement example.</step-1>
    </Phase-1>
  </ImplementationOrder>
</DevelopmentPlan>`,
  );

  writeProjectFile(
    root,
    "docs/verification-plan.xml",
    `<VerificationPlan VERSION="0.1.0">
  <ModuleVerification>
    <V-M-EXAMPLE MODULE="M-EXAMPLE">
      <test-files>
        <file-1>src/example.test.ts</file-1>
      </test-files>
      <module-checks>
        <command-1>bun test src/example.test.ts</command-1>
      </module-checks>
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
}

describe("lintGraceProject", () => {
  it("passes a well-formed current-profile GRACE project", () => {
    const root = createProject();
    writeCurrentDocs(root);

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
//   LAST_CHANGE: [v0.1.0 - Added example module]
// END_CHANGE_SUMMARY
//
// START_CONTRACT: run
//   PURPOSE: Run the example flow.
//   INPUTS: { none }
//   OUTPUTS: { string - flow status }
//   SIDE_EFFECTS: none
//   LINKS: M-EXAMPLE
// END_CONTRACT: run
export function run() {
  // START_BLOCK_EXECUTE_FLOW
  return "ok";
  // END_BLOCK_EXECUTE_FLOW
}
`,
    );

    const result = lintGraceProject(root);
    expect(result.profile).toBe("current");
    expect(result.issues).toHaveLength(0);
  });

  it("reports generic XML tags and semantic markup problems", () => {
    const root = createProject();

    writeProjectFile(
      root,
      "docs/knowledge-graph.xml",
      `<KnowledgeGraph>
  <Project NAME="Broken" VERSION="0.1.0">
    <Module ID="M-EXAMPLE">
      <verification-ref>V-M-EXAMPLE</verification-ref>
    </Module>
  </Project>
</KnowledgeGraph>`,
    );

    writeProjectFile(
      root,
      "docs/development-plan.xml",
      `<DevelopmentPlan VERSION="0.1.0">
  <Modules>
    <M-EXAMPLE NAME="Example" TYPE="CORE_LOGIC">
      <verification-ref>V-M-MISSING</verification-ref>
    </M-EXAMPLE>
  </Modules>
  <ImplementationOrder>
    <Phase number="1">
      <step order="1" module="M-EXAMPLE" verification="V-M-MISSING">Broken step.</step>
    </Phase>
  </ImplementationOrder>
</DevelopmentPlan>`,
    );

    writeProjectFile(root, "docs/verification-plan.xml", `<VerificationPlan VERSION="0.1.0" />`);

    writeProjectFile(
      root,
      "src/example.ts",
      `// START_MODULE_CONTRACT
//   PURPOSE: Broken module.
// END_MODULE_CONTRACT
// START_MODULE_MAP
// END_MODULE_MAP
export function run() {
  // START_BLOCK_DUPLICATE
  return "ok";
  // END_BLOCK_OTHER
}
`,
    );

    const result = lintGraceProject(root);
    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toContain("xml.generic-module-tag");
    expect(codes).toContain("xml.generic-phase-tag");
    expect(codes).toContain("xml.generic-step-tag");
    expect(codes).toContain("markup.missing-change-summary");
    expect(codes).toContain("markup.empty-module-map");
    expect(codes).toContain("markup.mismatched-block-end");
    expect(codes).toContain("plan.missing-verification-entry");
  });

  it("allows partial repositories when requested", () => {
    const root = createProject();
    writeProjectFile(root, "src/plain.ts", `export const value = 1;\n`);

    const result = lintGraceProject(root, { allowMissingDocs: true });
    expect(result.issues).toHaveLength(0);
  });

  it("treats test files as local-symbol maps instead of export surfaces", () => {
    const root = createProject();
    writeCurrentDocs(root);

    writeProjectFile(
      root,
      "src/example.test.ts",
      `// START_MODULE_CONTRACT
//   PURPOSE: Verify example behavior with deterministic test helpers.
//   SCOPE: Test fixtures and assertions for the example runtime.
//   DEPENDS: bun:test, M-EXAMPLE
//   LINKS: M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   fixture state - In-memory state used across test cases.
//   createExampleContext - Builds a deterministic test context.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.1.0 - Added deterministic example tests]
// END_CHANGE_SUMMARY

import { describe, expect, it } from "bun:test";

const fixtureState = { count: 1 };

function createExampleContext() {
  return fixtureState;
}

describe("example", () => {
  it("uses the helper", () => {
    expect(createExampleContext().count).toBe(1);
  });
});
`,
    );

    const result = lintGraceProject(root);
    expect(result.issues.filter((issue) => issue.file === "src/example.test.ts")).toHaveLength(0);
  });

  it("treats barrel files as summary maps instead of exact export maps", () => {
    const root = createProject();
    writeCurrentDocs(root);

    writeProjectFile(
      root,
      "src/barrel.ts",
      `// START_MODULE_CONTRACT
//   PURPOSE: Barrel export for example runtime surfaces.
//   SCOPE: Re-export stable runtime symbols from child modules.
//   DEPENDS: ./example
//   LINKS: M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Re-exports all public runtime symbols from child modules.
//   example exports - Stable entry points for external consumers.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.1.0 - Added example barrel]
// END_CHANGE_SUMMARY

export * from "./child";
`,
    );

    writeProjectFile(root, "src/child.ts", `export const alpha = 1;\nexport const beta = 2;\n`);

    const result = lintGraceProject(root);
    expect(result.issues.filter((issue) => issue.file === "src/barrel.ts")).toHaveLength(0);
  });

  it("treats configure-style default-export files as config modules", () => {
    const root = createProject();
    writeCurrentDocs(root);

    writeProjectFile(
      root,
      "src/tool.config.ts",
      `// START_MODULE_CONTRACT
//   PURPOSE: Configure bundling options for the example application.
//   SCOPE: Default export of the build tool configuration.
//   DEPENDS: tool
//   LINKS: M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.1.0 - Added config file]
// END_CHANGE_SUMMARY

export default {
  mode: "production",
};
`,
    );

    const result = lintGraceProject(root);
    expect(result.issues.filter((issue) => issue.file === "src/tool.config.ts")).toHaveLength(0);
  });

  it("treats script-like files as local-symbol maps instead of export surfaces", () => {
    const root = createProject();
    writeCurrentDocs(root);

    writeProjectFile(
      root,
      "scripts/smoke-runner.mjs",
      `// START_MODULE_CONTRACT
//   PURPOSE: Execute a smoke runner script for the example workspace.
//   SCOPE: Bootstrap setup, run checks, and print a report.
//   DEPENDS: node:fs
//   LINKS: M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   main - Run the smoke workflow end to end.
//   runChecks - Execute deterministic smoke checks.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.1.0 - Added smoke runner]
// END_CHANGE_SUMMARY

function runChecks() {
  return true;
}

async function main() {
  return runChecks();
}

await main();
`,
    );

    const result = lintGraceProject(root);
    expect(result.issues.filter((issue) => issue.file === "scripts/smoke-runner.mjs")).toHaveLength(0);
  });

  it("supports explicit ROLE and MAP_MODE overrides", () => {
    const root = createProject();
    writeCurrentDocs(root);

    writeProjectFile(
      root,
      "src/manual-role.ts",
      `// START_MODULE_CONTRACT
//   PURPOSE: Manual role override example.
//   SCOPE: Demonstrate explicit local-symbol module map behavior.
//   DEPENDS: none
//   LINKS: M-EXAMPLE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   helper state - Internal helper state for assertions.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.1.0 - Added explicit role example]
// END_CHANGE_SUMMARY

const helperState = 1;

export const exportedValue = helperState;
`,
    );

    const result = lintGraceProject(root);
    expect(result.issues.filter((issue) => issue.file === "src/manual-role.ts")).toHaveLength(0);
  });

  it("recognizes Clojure-style semicolon markup comments", () => {
    const root = createProject();
    writeLegacyDocs(root);

    writeProjectFile(
      root,
      "src/example.clj",
      `; START_MODULE_CONTRACT
;   PURPOSE: Clojure example runtime.
;   SCOPE: Demonstrate semicolon-prefixed GRACE markup.
;   DEPENDS: none
;   LINKS: M-EXAMPLE
; END_MODULE_CONTRACT
;
; START_MODULE_MAP
;   run-example - Execute the example workflow.
; END_MODULE_MAP
;
; START_CHANGE_SUMMARY
;   LAST_CHANGE: [v0.1.0 - Added Clojure example]
; END_CHANGE_SUMMARY
`,
    );

    const result = lintGraceProject(root);
    expect(result.issues.filter((issue) => issue.file === "src/example.clj")).toHaveLength(0);
  });

  it("does not misclassify local export lists as barrel re-exports", () => {
    const root = createProject();
    writeCurrentDocs(root);

    writeProjectFile(
      root,
      "src/local-export-list.ts",
      `// START_MODULE_CONTRACT
//   PURPOSE: Expose a local export list from a runtime module.
//   SCOPE: Named local exports without barrel semantics.
//   DEPENDS: none
//   LINKS: M-EXAMPLE
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   run - Execute the local runtime entry point.
// END_MODULE_MAP
//
// START_CHANGE_SUMMARY
//   LAST_CHANGE: [v0.1.0 - Added local export list example]
// END_CHANGE_SUMMARY

const run = () => "ok";

export { run };
`,
    );

    const result = lintGraceProject(root);
    expect(result.issues.filter((issue) => issue.file === "src/local-export-list.ts")).toHaveLength(0);
  });

  it("auto-detects the legacy profile when verification artifacts are absent and no verification refs are used", () => {
    const root = createProject();
    writeLegacyDocs(root);

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
//   LAST_CHANGE: [v0.1.0 - Added example module]
// END_CHANGE_SUMMARY

export function run() {
  return "ok";
}
`,
    );

    const result = lintGraceProject(root);
    expect(result.profile).toBe("legacy");
    expect(result.issues).toHaveLength(0);
  });

  it("requires verification artifacts in current profile when verification refs are present", () => {
    const root = createProject();

    writeProjectFile(
      root,
      "docs/knowledge-graph.xml",
      `<KnowledgeGraph>
  <Project NAME="Example" VERSION="0.1.0">
    <M-EXAMPLE NAME="Example" TYPE="CORE_LOGIC">
      <verification-ref>V-M-EXAMPLE</verification-ref>
    </M-EXAMPLE>
  </Project>
</KnowledgeGraph>`,
    );
    writeProjectFile(
      root,
      "docs/development-plan.xml",
      `<DevelopmentPlan VERSION="0.1.0">
  <Modules>
    <M-EXAMPLE NAME="Example" TYPE="CORE_LOGIC">
      <verification-ref>V-M-EXAMPLE</verification-ref>
    </M-EXAMPLE>
  </Modules>
</DevelopmentPlan>`,
    );

    const result = lintGraceProject(root);
    expect(result.profile).toBe("current");
    expect(result.issues.map((issue) => issue.code)).toContain("docs.missing-required-artifact");
  });

  it("reports invalid profile selections without crashing", () => {
    const root = createProject();
    writeCurrentDocs(root);

    const result = lintGraceProject(root, { profile: "unsupported" as never });
    expect(result.issues.map((issue) => issue.code)).toContain("config.invalid-profile-selection");
  });

  it("falls back safely when .grace-lint.json contains an invalid profile", () => {
    const root = createProject();
    writeLegacyDocs(root);
    writeProjectFile(root, ".grace-lint.json", JSON.stringify({ profile: "broken" }, null, 2));

    const result = lintGraceProject(root);
    expect(result.profile).toBe("legacy");
    expect(result.issues.map((issue) => issue.code)).toContain("config.invalid-profile");
  });

  it("reports invalid profile selections through the CLI path", () => {
    const root = createProject();
    writeCurrentDocs(root);

    const run = spawnSync(
      "bun",
      ["run", "./src/grace.ts", "lint", "--path", root, "--profile", "broken", "--format", "json"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    const parsed = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(parsed.issues.map((issue: { code: string }) => issue.code)).toContain("config.invalid-profile-selection");
  });
});
