import express from "express";
import { EvaluationFactory } from "../../factory/evaluation.factory";

const evaluationRouter = express.Router();

const evaluationController = EvaluationFactory.getEvaluationController();

evaluationRouter.get("/status/:id", evaluationController.getRunCodeStatus);

export default evaluationRouter;