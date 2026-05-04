import {
  SubmissionLanguage,
  SubmissionStatus,
} from "../models/submission.model";

export interface RunCodeStatus {
  status: string;
  output?: string;
  error?: string;
  executionTime?: number;
}

interface IRunCodeTestcase {
  input: string;
}

export interface IRunCodeSubmission {
  submissionId: string;
  code: string;
  problemId: string;
  userId: string;
  language: SubmissionLanguage;
  testcases: IRunCodeTestcase[];
  status: SubmissionStatus;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface ISubmissionJob {
  submissionId: string;
  problemId: string;
  code: string;
  language: SubmissionLanguage;
  testcases: IRunCodeTestcase[];
}
