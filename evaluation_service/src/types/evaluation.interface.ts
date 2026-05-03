export interface TestCase {
  id: string;
  input: string;
  output: string;
}

export enum EvaluationStatus {
  SUCCESS = "AC",
  FAILED = "WA",
  TIME_LIMIT_EXCEEDED = "TLE",
  COMPILATION_ERROR = "CE",
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  diffculty: string;
  editorial?: string;
  testcases: TestCase[];
  createdAt: string;
  updatedAt: string;
}
export interface EvaluationJob {
  submissionId: string;
  code: string;
  language: "python" | "cpp";
  problem: Problem;
  correlationId: string;
}

export interface RunCodeJob {
  submissionId: string;
  code: string;
  language: "python" | "cpp";
  testcases: {
    input: string;
  }[];
  correlationId: string;
}

export interface EvaluationResult {
  status: string;
  output: string | undefined;
  errorMessage?: string;
  executionTime?: number; // in seconds
}

export interface ISubmissionData {
  testCaseId: string;
  status: EvaluationStatus;
  errorMessage?: string;
  actualOutput?: string;
  expectedOutput?: string;
  executionTime?: number; // in seconds
}
