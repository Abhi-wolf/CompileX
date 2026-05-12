import {
  ISubmission,
  ISubmissionData,
  Submission,
  SubmissionStatus,
} from "../models/submission.model";

export interface ISubmissionRepository {
  create(
    submissionData: Partial<ISubmission>,
    userId: string,
  ): Promise<ISubmission>;
  findById(id: string): Promise<ISubmission | null>;
  updateStatus(
    id: string,
    status: SubmissionStatus,
    submissionData?: ISubmissionData[],
  ): Promise<ISubmission | null>;
  findByProblemId(
    problemId: string,
    userId: string,
    limit: number,
    page: number,
  ): Promise<{ submissions: ISubmission[]; total: number }>;
  deleteById(id: string): Promise<boolean>;
}

export class SubmissionRepository implements ISubmissionRepository {
  async create(
    submissionData: Partial<ISubmission>,
    userId: string,
  ): Promise<ISubmission> {
    const newSubmission = await Submission.create({
      ...submissionData,
      userId,
    });
    return newSubmission;
  }

  async findById(id: string): Promise<ISubmission | null> {
    const submission = await Submission.findById(id);
    return submission;
  }

  async updateStatus(
    id: string,
    status: SubmissionStatus,
    submissionData?: ISubmissionData[],
  ): Promise<ISubmission | null> {
    const submission = await Submission.findByIdAndUpdate(
      id,
      { status, submissionData },
      { new: true },
    );
    return submission;
  }

  async findByProblemId(
    problemId: string,
    userId: string,
    limit: number,
    page: number,
  ): Promise<{ submissions: ISubmission[]; total: number }> {
    const [submissions, total] = await Promise.all([
      Submission.find({ problemId, userId }).skip(page).limit(limit),
      Submission.countDocuments({ problemId, userId }),
    ]);

    return { submissions, total };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Submission.findByIdAndDelete(id);
    return result !== null;
  }
}
