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

export const publicRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refreshToken",
];

export const looseRoutes = [
  { path: "/api/auth/me", method: "GET" }, // get user details

  { path: "/api/problems/search", method: "GET" }, // get all problems and search problems
  { path: "/api/problems/:id", method: "GET" }, // get problem details

  { path: "/api/submissions/run/:id", method: "GET" }, // run code status
  { path: "/api/submissions/contest/leaderboard/:id", method: "GET" }, // get contest live leaderboard
];

export const moderateRoutes = [
  { path: "/api/submissions/run", method: "POST" }, // run code route
  { path: "/api/submissions/problem/:id", method: "GET" }, // get submission details

  { path: "/api/contests", method: "GET" }, // get all contests details
  { path: "/api/contests/leaderboard/archived", method: "GET" }, // get contest archieved leaderboard
];

export const strictRoutes = [
  { path: "/api/auth/:id", method: "PATCH" }, // update user details
  { path: "/api/auth/login", method: "POST" }, // login user
  { path: "/api/auth/register", method: "POST" }, // register user

  { path: "/api/auth/refreshToken", method: "PUT" }, // refresh token
  { path: "/api/submissions/submit", method: "POST" }, // submit solution

  { path: "/api/contests", method: "POST" }, // create contest
  { path: "/api/contests/:id", method: "PUT" }, // update contest
  { path: "/api/contests/:id", method: "GET" }, // get contest details
  { path: "/api/contests/:id", method: "DELETE" }, // delete upcoming contest
  { path: "/api/submissions/contest", method: "POST" }, // submit contest solution
];
