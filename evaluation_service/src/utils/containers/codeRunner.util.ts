import logger from "../../config/logger.config";
import { commands } from "./commands.util";
import { createNewDockerContainer } from "./createContainer.util";

export interface RunCodeOptions {
  code: string;
  language: "python" | "cpp" | "js"; // e.g., "python", "javascript", etc.
  timeout?: number; // in milliseconds
  imageName: string;
  input: string; // Optional input for the code
}

export async function runCode(options: RunCodeOptions) {
  const { code, language, timeout, imageName, input } = options;
  const startTime = Date.now();

  const container = await createNewDockerContainer({
    imageName: imageName,
    cmdExecutable: commands[language](code, input),
    memoryLimitMB: 256 * 1024 * 1024, // 256 MiB
  });

  if (!container) {
    throw new Error("Container not created");
  }

  let isTimeLimitExceeded = false;
  const timeLimitExceeded = setTimeout(() => {
    logger.info("Time limit exceeded. Stopping the container...");
    isTimeLimitExceeded = true;
    container.kill();
  }, timeout);

  // TODO  : add check when container not created
  logger.info(`Container created successfully with ID: ${container?.id}`);

  try {
    await container.start();

    const status = await container.wait();

    if (isTimeLimitExceeded) {
      return {
        status: "time_limit_exceeded",
        output: "Time limit exceeded",
      };
    }

    const logs = await container.logs({
      stdout: true,
      stderr: true,
    });

    const containerLogs = processLogs(logs);

    if (status?.StatusCode === 0) {
      logger.info("Code executed successfully.");
      return {
        status: "success",
        output: containerLogs,
        executionTime: (Date.now() - startTime) / 1000, // in seconds
      };
    } else {
      logger.info("Code execution failed.", { containerLogs });
      return {
        status: "failed",
        output: "",
        errorMessage: containerLogs,
        executionTime: (Date.now() - startTime) / 1000,
      };
    }
  } catch (error) {
    logger.error("Error running code:", error);
    return {
      status: "error",
      output: "",
      errorMessage: "Error running code",
      executionTime: (Date.now() - startTime) / 1000,
    };
  } finally {
    await container
      ?.remove({ force: true })
      .catch((e) => logger.error("Cleanup error:", e.message));
    clearTimeout(timeLimitExceeded);
    logger.info("Container removed successfully.");
  }
}

function processLogs(logs: Buffer | undefined) {
  return logs
    ?.toString("utf8")
    .replace(/\x00/g, "") // Remove null bytes
    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "") // Remove control characters except \n (0x0A)
    .trim();
}
