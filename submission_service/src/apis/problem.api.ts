import axios, { AxiosResponse } from "axios";
import { serverConfig } from "../config";
import { InternalServerError } from "../utils/errors/app.error";
import logger from "../config/logger.config";
import { getCorrelationId } from "../utils/helpers/request.helpers";
import { CircuitBreaker } from "../utils/circuit-breaker";
import { ICachedProblem, IProblemDetails } from "../types/problem.types";

interface IProblemResponse {
  data: IProblemDetails;
  message: string;
  success: boolean;
}

const problemServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  halfOpenMaxAttempts: 3,
  cooldownMs: 60000,
});

export async function getProblemById(
  problemId: string,
): Promise<ICachedProblem | null> {
  return problemServiceCircuitBreaker.execute(async () => {
    const correlationId = getCorrelationId();
    logger.info("Fetching problem by ID", { problemId });

    const response: AxiosResponse<IProblemResponse> = await axios.get(
      `${serverConfig.PROBLEM_SERVICE_URL}/problems/${problemId}`,
      {
        headers: {
          "x-correlation-id": correlationId,
        },
        timeout: 10000, // 10 seconds
      },
    );

    if (!response.data.success) {
      throw new InternalServerError(
        `Failed to fetch problem with id ${problemId}`,
      );
    }

    const problem: ICachedProblem = {
      id: response.data.data.id,
      title: response.data.data.title,
      testcases: response.data.data.testcases,
    };

    return problem;
  });
}
