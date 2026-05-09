import mongoose, { Document } from "mongoose";

export enum SubmissionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum SubmissionLanguage {
  CPP = "cpp",
  PYTHON = "python",
  JS = "js",
}

export interface ISubmissionData {
  testCaseId: string;
  status: string;
  errorMessage?: string;
  actualOutput?: string;
  expectedOutput?: string;
  executionTime?: number;
}

export interface ISubmission extends Document {
  userId: string;
  code: string;
  problemId: string;
  language: SubmissionLanguage;
  createdAt: Date;
  updatedAt: Date;
  status: SubmissionStatus;
  submissionData: ISubmissionData;
  contestId?: string;
  // we can add user id later for multi user support
}

const submissionSchema = new mongoose.Schema<ISubmission>(
  {
    userId: { type: String, required: [true, "User Id is required"] },
    problemId: { type: String, required: [true, "Problem ID is required"] },
    code: { type: String, required: [true, "Code is required"] },
    language: {
      type: String,
      enum: Object.values(SubmissionLanguage),
      required: [true, "Language is required"],
    },
    status: {
      type: String,
      enum: Object.values(SubmissionStatus),
      default: SubmissionStatus.PENDING,
    },
    submissionData: {
      type: Object,
      required: true,
      default: {},
    },
    contestId: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, record) => {
        delete (record as any).__v;
        record.id = record._id;
        delete (record as any)._id;

        return record;
      },
    },
  },
);

submissionSchema.index({ problemId: 1, status: 1, createdAt: -1 });

export const Submission = mongoose.model<ISubmission>(
  "Submission",
  submissionSchema,
);
