import express from "express";
import problemRouter from "./problem.router";
import healthRouter from "./health.router";
import contestRouter from "./contest.router";

const v1Router = express.Router();

v1Router.use("/problems/health", healthRouter);
v1Router.use("/problems", problemRouter);
v1Router.use("/contests", contestRouter);

export default v1Router;
