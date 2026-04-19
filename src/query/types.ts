export type ModulePlanParam = {
  name?: string;
  type?: string;
  text: string;
};

export type ModulePlanContract = {
  purpose?: string;
  inputs: ModulePlanParam[];
  outputs: ModulePlanParam[];
  errors: string[];
};

export type ModuleInterfaceItem = {
  tag: string;
  purpose?: string;
  text?: string;
};

export type ModulePlanRecord = {
  id: string;
  name?: string;
  type?: string;
  layer?: string;
  order?: string;
  depends: string[];
  contract: ModulePlanContract;
  interfaceItems: ModuleInterfaceItem[];
};

export type ModuleGraphRecord = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  purpose?: string;
  path?: string;
  depends: string[];
  annotations: ModuleInterfaceItem[];
};

export type VerificationScenario = {
  tag: string;
  kind?: string;
  text: string;
};

export type ModuleVerificationRecord = {
  id: string;
  moduleId?: string;
  priority?: string;
  testFiles: string[];
  moduleChecks: string[];
  scenarios: VerificationScenario[];
  requiredLogMarkers: string[];
  requiredTraceAssertions: string[];
  waveFollowUp?: string;
  phaseFollowUp?: string;
};

export type PlanStepRecord = {
  phaseTag: string;
  phaseName?: string;
  phaseStatus?: string;
  stepTag: string;
  stepStatus?: string;
  moduleId?: string;
  verificationId?: string;
  text: string;
};

export type FileFieldSection = {
  fields: Record<string, string>;
  startLine: number;
  endLine: number;
};

export type FileListItem = {
  label: string;
  line: number;
};

export type FileContractRecord = {
  name: string;
  fields: Record<string, string>;
  startLine: number;
  endLine: number;
};

export type FileBlockRecord = {
  name: string;
  startLine: number;
  endLine: number;
};

export type FileMarkupRecord = {
  path: string;
  moduleContract: FileFieldSection | null;
  moduleMap: FileListItem[];
  changeSummary: FileFieldSection | null;
  contracts: FileContractRecord[];
  blocks: FileBlockRecord[];
  linkedModuleIds: string[];
};

export type ModuleRecord = {
  id: string;
  name?: string;
  type?: string;
  plan: ModulePlanRecord | null;
  graph: ModuleGraphRecord | null;
  verifications: ModuleVerificationRecord[];
  localFiles: FileMarkupRecord[];
  steps: PlanStepRecord[];
};

export type GraceArtifactIndex = {
  root: string;
  modules: ModuleRecord[];
  verifications: ModuleVerificationRecord[];
  files: FileMarkupRecord[];
};

export type ModuleFindOptions = {
  query?: string;
  type?: string;
  dependsOn?: string;
};

export type ModuleMatch = {
  module: ModuleRecord;
  score: number;
  matchedBy: string[];
};

export type VerificationFindOptions = {
  query?: string;
  module?: string;
  priority?: string;
};

export type VerificationMatch = {
  verification: ModuleVerificationRecord;
  module: ModuleRecord | null;
  score: number;
  matchedBy: string[];
};

export type ModuleHealthIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  remediation: string;
};

export type ModuleHealthRecord = {
  moduleId: string;
  name: string;
  type?: string;
  path?: string;
  state: "ready" | "attention" | "blocked";
  verificationIds: string[];
  implementationFiles: string[];
  governedTestFiles: string[];
  verificationTestFiles: string[];
  blockers: ModuleHealthIssue[];
  warnings: ModuleHealthIssue[];
  summary: {
    hasPlan: boolean;
    hasGraph: boolean;
    hasImplementationFiles: boolean;
    hasVerification: boolean;
    hasVerificationTests: boolean;
    pendingSteps: number;
    completedSteps: number;
    autonomyReady: boolean;
  };
  nextAction: string;
};
