import express from "express";
import { ContestFactory } from "../../factories/contest.factory";
import {
  authorize,
  authorizeRole,
} from "../../middlewares/authorization.middleware";
import { UserRole } from "../../types/user.roles.interface";
import { validateRequestBody } from "../../validators";
import { createContestSchema } from "../../validators/contest.validator";
import { verifyInternalHAMCSignature } from "../../middlewares/verifyHMACSignature";

const contestRouter = express.Router();

const contestController = ContestFactory.getContestController();

contestRouter.get(
  "/internal-service-use/:id",
  verifyInternalHAMCSignature,
  contestController.getContest,
);

contestRouter.use(authorize);

contestRouter.post(
  "/",
  authorizeRole(UserRole.PROBLEM_SETTER, UserRole.ADMIN),
  validateRequestBody(createContestSchema),
  contestController.createContest,
);

contestRouter.get("/", contestController.getAllContests);
contestRouter.get("/upcoming", contestController.getUpcomingContests);
contestRouter.get(
  "/leaderboard/archived/:id",
  contestController.getContestLeaderboard,
);

contestRouter.get("/:id", contestController.getContest);
contestRouter.delete("/:id", contestController.deleteContest);

export default contestRouter;
