import { Request, Response } from "express";
import { EvaluationService } from "../services/evaluation.service";
import { NotFoundError } from "../utils/errors/app.error";

export class EvaluationController {
  constructor(private evaluationService: EvaluationService) {}

  getRunCodeStatus = async (req: Request, res: Response) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.write(`data: ${JSON.stringify({ status: "pending" })}\n\n`);

    const id = req.params.id;

    const intervalId = setInterval(async () => {
      try {
        const result = await this.evaluationService.getRunCodeStatus(id);

        res.write(`data: ${JSON.stringify(result)}\n\n`);

        // If result signals completion, stop polling
        if (result.status === "completed" || result.status === "failed") {
          clearInterval(intervalId);
          res.end();
        }
      } catch (error) {
        console.log("Error in getRunCodeStatus controller: ", error);
        if (error instanceof NotFoundError) {
          res.write(
            `data: ${JSON.stringify({ error: "Result not found" })}\n\n`,
          );
        } else {
          // Unexpected error — notify client and stop
          res.write(
            `data: ${JSON.stringify({ error: "Internal server error" })}\n\n`,
          );
        }

        clearInterval(intervalId);
        res.end();
      }
    }, 5000);

    // Clean up on client disconnection
    req.on("close", () => {
      clearInterval(intervalId);
    });
  };
}
