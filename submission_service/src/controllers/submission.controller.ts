import { Request, Response } from "express";
import logger from "../config/logger.config";
import { SubmissionService } from "../services/submission.service";
import { AuthRequest } from "../types/request.type";

export class SubmissionController {
  private submissionService: SubmissionService;

  constructor(submissionService: SubmissionService) {
    this.submissionService = submissionService;
  }

  createContestSubmission = async (req: AuthRequest, res: Response) => {
    logger.info("Creating new contest submission", {
      problemId: req.body.problemId,
      language: req.body.language,
    });

    const userId = req.user?.userId as string;

    const submission = await this.submissionService.createContestSubmission(
      req.body,
      userId,
    );

    logger.info("Contest submission created successfully", {
      submissionId: submission.id,
    });

    res.status(201).json({
      success: true,
      message: "Contest submission created successfully",
      data: submission,
    });
  };

  createSubmission = async (req: AuthRequest, res: Response) => {
    logger.info("Creating new submission", {
      problemId: req.body.problemId,
      language: req.body.language,
    });

    const userId = req.user?.userId as string;

    const submission = await this.submissionService.createSubmission(
      req.body,
      userId,
    );

    logger.info("Submission created successfully", {
      submissionId: submission.id,
    });

    res.status(201).json({
      success: true,
      message: "Submission created successfully",
      data: submission,
    });
  };

  createRun = async (req: AuthRequest, res: Response) => {
    logger.info("Creating new run", {
      problemId: req.body.problemId,
      language: req.body.language,
    });

    const userId = req.user?.userId as string;

    const runData = await this.submissionService.createRun(req.body, userId);

    res.status(201).json({
      success: true,
      message: "Run created successfully",
      data: runData,
    });
  };

  getSubmissionById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    logger.info("Fetching submission by ID", {
      submissionId: id,
      userId: userId,
    });

    const submission = await this.submissionService.getSubmissionById(id);

    logger.info("Submission fetched successfully", { submissionId: id });

    res.status(200).json({
      success: true,
      message: "Submission fetched successfully",
      data: submission,
    });
  };

  getSubmissionsByProblemId = async (req: AuthRequest, res: Response) => {
    const { problemId } = req.params;
    const userId = req.user?.userId as string;
    logger.info("Fetching submissions by problem ID", { problemId, userId });

    const limit = parseInt(req.query.limit as string) || 5;
    const page = parseInt(req.query.page as string) || 1;

    const submissionResult =
      await this.submissionService.getSubmissionsByProblemId(
        problemId,
        userId,
        limit,
        page,
      );

    logger.info("Submissions fetched successfully", {
      problemId,
      count: submissionResult.total,
      page: submissionResult.page,
    });

    res.status(200).json({
      success: true,
      message: "Submissions fetched successfully",
      data: submissionResult,
    });
  };

  deleteSubmissionById = async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info("Deleting submission", { submissionId: id });

    await this.submissionService.deleteSubmissionById(id);

    logger.info("Submission deleted successfully", { submissionId: id });

    res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
    });
  };

  updateSubmissionStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, submissionData } = req.body;

    logger.info("Updating submission status", {
      submissionId: id,
      status,
    });

    const submission = await this.submissionService.updateSubmissionStatus(
      id,
      status,
      submissionData,
    );

    logger.info("Submission status updated successfully", {
      submissionId: id,
      status,
    });

    res.status(200).json({
      success: true,
      message: "Submission status updated successfully",
      data: submission,
    });
  };

  getRunCodeStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info("Getting run code status", { runId: id });

    const result = await this.submissionService.getRunCodeStatus(id);

    logger.info("Run code status fetched successfully", { runId: id });

    res.status(200).json({
      success: true,
      message: "Run code status fetched successfully",
      data: result,
    });
  };

  getContestLeaderboard = async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info("Getting contest leaderboard", { contestId: id });

    const result = await this.submissionService.getContestLeaderboard(id);

    logger.info("Contest leaderboard fetched successfully", { contestId: id });

    res.status(200).json({
      success: true,
      message: "Contest leaderboard fetched successfully",
      data: result,
    });
  };
}
