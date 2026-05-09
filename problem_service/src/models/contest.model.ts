import mongoose, { Document } from "mongoose";

export enum ContestStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  FINISHED = "finished",
}

export interface IContestProblem {
  problemId: mongoose.Types.ObjectId;
  points: number;
}

export interface IContest extends Document {
  name: string;
  startTime: Date;
  endTime: Date;
  problems: IContestProblem[];
  status: ContestStatus;
}

const contestProblemSchema = new mongoose.Schema<IContestProblem>(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: [true, "Problem ID is required"],
    },
    points: {
      type: Number,
      required: [true, "Points are required"],
      min: [0, "Points cannot be negative"],
    },
  },
  { _id: false },
);

const contestSchema = new mongoose.Schema<IContest>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    problems: {
      type: [contestProblemSchema],
      required: [true, "Problems are required"],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ContestStatus),
        message: "Invalid contest status",
      },
      default: ContestStatus.UPCOMING,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, record: any) => {
        delete record.__v;
        record.id = record._id;
        delete record._id;
        return record;
      },
    },
  },
);

export const Contest = mongoose.model<IContest>("Contest", contestSchema);
