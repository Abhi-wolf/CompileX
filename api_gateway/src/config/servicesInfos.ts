export const KNOWN_SERVICES = {
  SUBMISSION_SERVICE: {
    name: "submissions",
    serviceName: "submission-service",
  },
  AUTH_SERVICE: {
    name: "auth",
    serviceName: "auth-service",
  },
  PROBLEM_SERVICE: {
    name: "problems",
    serviceName: "problem-service",
  },
};


export const publicAPIs = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refreshToken",
];
