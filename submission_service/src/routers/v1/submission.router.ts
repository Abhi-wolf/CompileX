import express from "express";
import { SubmissionFactory } from "../../factories/submission.factory";
import { validateRequestBody, validateQueryParams } from "../../validators";
import {
  createSubmissionSchema,
  runCodeSchema,
  // updateSubmissionStatusSchema,
  submissionQuerySchema,
} from "../../validators/submission.validator";
import { authorize } from "../../middlewares/authorization.middleware";
import { verifyHAMCSignature } from "../../middlewares/verifyHMACSignature";

const submissionRouter = express.Router();

// Get submission controller instance from factory
const submissionController = SubmissionFactory.getSubmissionController();

submissionRouter.use(verifyHAMCSignature);

// POST /submissions - Create a new submission
submissionRouter.post(
  "/",
  authorize,
  validateRequestBody(createSubmissionSchema),
  submissionController.createSubmission,
);

submissionRouter.post(
  "/run",
  authorize,
  validateRequestBody(runCodeSchema),
  submissionController.createRun,
);

submissionRouter.post(
  "/contest",
  authorize,
  validateRequestBody(createSubmissionSchema),
  submissionController.createContestSubmission,
);

submissionRouter.get(
  "/run/:id",
  authorize,
  submissionController.getRunCodeStatus,
);

// GET /submissions/problem/:problemId - Get all submissions for a problem
submissionRouter.get(
  "/problem/:problemId",
  authorize,
  validateQueryParams(submissionQuerySchema),
  submissionController.getSubmissionsByProblemId,
);

// GET /submissions/:id - Get submission by ID
submissionRouter.get("/:id", authorize, submissionController.getSubmissionById);

// DELETE /submissions/:id - Delete a submission
// submissionRouter.delete(
//   "/:id",
//   authorize,
//   submissionController.deleteSubmissionById,
// );

// PATCH /submissions/:id/status - Update submission status
// submissionRouter.patch(
//   "/:id/status",
//   authorize,
//   validateRequestBody(updateSubmissionStatusSchema),
//   submissionController.updateSubmissionStatus,
// );

export default submissionRouter;
