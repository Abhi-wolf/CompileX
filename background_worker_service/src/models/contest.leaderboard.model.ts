import mongoose from "mongoose";

export interface IContestLeaderboardUser {
  userId: string;
  score: number;
  rank: number;
}

export interface IContestLeaderboard {
  contestId: string;
  leaderboard: IContestLeaderboardUser[];
}

const contestLeaderboardSchema = new mongoose.Schema<IContestLeaderboard>(
  {
    contestId: {
      type: String,
      required: true,
      unique: true,
    },
    leaderboard: [
      {
        userId: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        rank: {
          type: Number,
          required: true,
        },
      },
    ],
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

export const ContestLeaderboard = mongoose.model<IContestLeaderboard>(
  "ContestLeaderboard",
  contestLeaderboardSchema,
);
