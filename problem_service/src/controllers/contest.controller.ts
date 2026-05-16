import { Request, Response } from "express";
import { ContestService } from "../services/contest.service";

export class ContestController {
  private contestService: ContestService;

  constructor(contestService: ContestService) {
    this.contestService = contestService;
  }

  createContest = async (req: Request, res: Response) => {
    const contest = await this.contestService.createContest(req.body);

    res.status(201).json({
      success: true,
      message: "Contest created successfully",
      data: contest,
    });
  };

  getContest = async (req: Request, res: Response) => {
    const contest = await this.contestService.getContest(req.params.id);

    res.status(200).json({
      success: true,
      message: "Contest fetched successfully",
      data: contest,
    });
  };

  getAllContests = async (req: Request, res: Response) => {
    const contests = await this.contestService.getAllContests();

    res.status(200).json({
      success: true,
      message: "Contests fetched successfully",
      data: contests,
    });
  };

  getUpcomingContests = async (req: Request, res: Response) => {
    const contests = await this.contestService.getUpcomingContests();

    res.status(200).json({
      success: true,
      message: "Upcoming contests fetched successfully",
      data: contests,
    });
  };

  getContestLeaderboard = async (req: Request, res: Response) => {
    const leaderboard = await this.contestService.getContestLeaderboard(
      req.params.id,
    );

    res.status(200).json({
      success: true,
      message: "Contest leaderboard fetched successfully",
      data: leaderboard,
    });
  };

  deleteContest = async (req: Request, res: Response) => {
    await this.contestService.deleteContest(req.params.id);

    res.status(200).json({
      success: true,
      message: "Contest deleted successfully",
    });
  };
}

