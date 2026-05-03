import express from "express";
import healthRouter from "./health.router";
import evaluationRouter from "./evaluation.router";

const v1Router = express.Router();

v1Router.use("/health", healthRouter);

v1Router.use("/evaluate", evaluationRouter);

export default v1Router;
