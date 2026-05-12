import axios, { AxiosError, AxiosResponse } from "axios";
import { serverConfig } from "../config";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
} from "../utils/errors/app.error";
import logger from "../config/logger.config";
import { getCorrelationId } from "../utils/helpers/request.helpers";
import { CircuitBreaker } from "../utils/circuit-breaker";
import { ICachedContest } from "../types/problem.types";
import { generateHMACSignature } from "../utils/generateHMACSignature";

interface IContestResponse {
  data: ICachedContest;
  message: string;
  success: boolean;
}

const problemServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  halfOpenMaxAttempts: 3,
  cooldownMs: 60000,
});

// TODO: can get problem service from consul
export async function getContestById(
  contestId: string,
): Promise<ICachedContest | null> {
  return problemServiceCircuitBreaker.execute(async () => {
    try {
      const correlationId = getCorrelationId();

      const path = `/api/v1/contests/internal-service-use/${contestId}`;
      const url = `${serverConfig.PROBLEM_SERVICE_URL}/contests/internal-service-use/${contestId}`;

      const timestamp = Date.now().toString();

      const payload = {
        method: "GET",
        path,
        timestamp,
        body: {},
      };

      const hmac = generateHMACSignature(
        JSON.stringify(payload),
        serverConfig.INTERNAL_HMAC_SHARED_SECRET,
      );

      const response: AxiosResponse<IContestResponse> = await axios.get(url, {
        headers: {
          "x-correlation-id": correlationId,
          "x-internal-hmac-signature": hmac,
          "x-internal-hmac-timestamp": timestamp,
        },
        timeout: 10000,
      });

      if (!response.data.success) {
        throw new InternalServerError(
          `Failed to fetch contest with id ${contestId}`,
        );
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error("Axios error while fetching contest", {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
        });
        const axiosError = error as AxiosError<any>;

        const status = axiosError.response?.status;

        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Problem service request failed";

        if (status === 400) {
          throw new BadRequestError(message);
        }

        // 401
        if (status === 401) {
          throw new InternalServerError(
            `Problem service authentication failed: ${message}`,
          );
        }

        // 404
        if (status === 404) {
          throw new NotFoundError(message);
        }

        // 503
        if (status === 503) {
          throw new ServiceUnavailableError("Problem service is unavailable");
        }

        // timeout
        if (axiosError.code === "ECONNABORTED") {
          throw new ServiceUnavailableError(
            "Problem service request timed out",
          );
        }

        // connection refused / dns
        if (
          axiosError.code === "ECONNREFUSED" ||
          axiosError.code === "EAI_AGAIN"
        ) {
          throw new ServiceUnavailableError(
            "Unable to connect to problem service",
          );
        }

        throw new InternalServerError(message);
      }

      logger.error("Unknown error", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
}
