# CompileX

A scalable microservices-based backend system for running and evaluating code submissions, similar to LeetCode. Built with Node.js, TypeScript, and Docker.


### Microservices

| Service | Port (internal) | Description | Database | Consul |
| ------- | --------------- | ----------- | -------- | ------ |
| **API Gateway** | 3000 | Traefik-routed entry; JWT auth, rate limiting, service discovery, routing | None | Consumer only |
| **Auth Service** | 3002 | User authentication, authorization, and user data | PostgreSQL | Yes |
| **Problem Service** | 3010 | Coding problems, contests, test cases, archived leaderboards | MongoDB | Yes |
| **Submission Service** | 3020 | Submissions, run-code, contest submissions, live leaderboards | MongoDB | Yes |
| **Evaluation Service** | 3030 | Code execution in isolated containers (BullMQ worker) | None | No |
| **Background Worker** | — | Cron jobs: contest status transitions, leaderboard persistence | MongoDB (problem DB) | No |

### Supporting infrastructure

- **Traefik v3.7**: Reverse proxy and load balancer (public entry on port 80)
- **Consul**: 3-server cluster + client for service registration and health-based discovery
- **MongoDB**: Problem, submission, and contest data
- **PostgreSQL**: Authentication data
- **Redis**: BullMQ queues, rate limiting, contest leaderboard cache, run-code deduplication
- **Docker-in-Docker**: Isolated code execution environment
- **Winston**: Structured logging with daily rotation

### Access model

- **API (production & dev):** `http://compileX.docker.localhost` (Traefik → API Gateway)
- **Traefik dashboard (dev only):** `http://traefik.docker.localhost:8080`
- **Consul UI (production):** `http://localhost:8500`
- Direct port `3000` is not published in Docker Compose; all client traffic goes through Traefik.

### Networks

- **reverse-proxy**: Traefik and API Gateway
- **backend**: API Gateway and application services
- **execution**: Docker-in-Docker and Evaluation Service
- **mongo_db_network**: MongoDB, Problem/Submission/Background Worker
- **postgres_db_network**: PostgreSQL and Auth Service
- **redis_network**: Redis and dependent services

## Features

- **API Gateway**: Single entry point with Consul-based discovery, in-memory instance cache, and round-robin load balancing
- **Traefik reverse proxy**: Routes external traffic to gateway replicas with health checks
- **Consul service registry**: Auth, Problem, and Submission services register on startup with retry and periodic re-registration
- **Contests**: Create, list, upcoming, delete; start/end time validation (future times, max 3 hours, exactly 2 problems)
- **Contest submissions**: Async evaluation via BullMQ; Redis leaderboard updated on accepted solutions
- **Live leaderboard**: Redis sorted sets; clients poll `GET /api/submissions/contest/leaderboard/:id`
- **Archived leaderboard**: MongoDB persistence via background worker; `GET /api/contests/leaderboard/archived/:id`
- **Background worker**: Contest status cron (every 2 min); leaderboard sync to DB (every 5 min)
- **Rate limiting**: Redis token-bucket tiers (loose / moderate / strict) per route
- **Security**: Helmet, CORS (`FRONTEND_URL`), JWT authorization at gateway
- **Run-code deduplication**: HMAC-SHA256 cache key prevents duplicate runs for identical code
- **Queue backpressure**: Returns 503 when submission queue waiting jobs ≥ 400
- **Multi-language support**: JavaScript, C++, and Python
- **Isolated execution**: Secure code execution using Docker containers
- **Asynchronous processing**: Queue-based job processing with BullMQ
- **HMAC authentication**: Cryptographic request signing between API Gateway and services

## Supported Languages

| Language | Timeout | Docker Image | Description |
| -------- | ------- | ------------ | ----------- |
| **JavaScript** | 10 seconds | Node.js | JavaScript/Node.js code execution |
| **C++** | 10 seconds | GCC | C++ code compilation and execution |
| **Python** | 40 seconds | Python 3 | Python code execution |

Language-specific settings are in `evaluation_service/src/config/language.config.ts`.

## Prerequisites

- Docker & Docker Compose

## Quick Start

### Using Docker Compose (recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/Abhi-wolf/CompileX
   cd CompileX
   ```

2. **Start all services**

   ```bash
   # Production
   docker compose up -d

   # Development (hot reload + Traefik dashboard)
   docker compose -f compose.dev.yaml up -d
   ```

3. **Verify the gateway is healthy**

   ```bash
   curl http://compileX.docker.localhost/api/api-gateway/health
   ```

   If `compileX.docker.localhost` does not resolve, add to `/etc/hosts`:

   ```
   127.0.0.1 compileX.docker.localhost
   127.0.0.1 traefik.docker.localhost
   ```

   Proxied routes require a JWT `Authorization: Bearer <token>` header except public auth routes (`/api/auth/login`, `/api/auth/register`, `/api/auth/refreshToken`).

## API Endpoints

All client requests go through **Traefik** → **API Gateway**. Paths below are gateway-facing. The gateway rewrites `/api/{mount}/...` to `/api/v1/{mount}/...` on the target service.

Only routes registered in `api_gateway/src/config/servicesInfos.ts` are accepted; unknown paths return **404** from the rate-limit middleware.

Rate limit tiers: **loose** (120/min cap), **moderate** (30/min), **strict** (10/min).

### API Gateway

| Method | Path | Auth | Rate limit | Description |
| ------ | ---- | ---- | ---------- | ------------- |
| GET | `/api/api-gateway/health` | — | — | Gateway health (exempt from rate limiting) |

### Auth Service (`/api/auth` → `auth-service`)

| Method | Path | Auth | Rate limit | Description |
| ------ | ---- | ---- | ---------- | ------------- |
| POST | `/api/auth/login` | Public | strict | Login |
| POST | `/api/auth/register` | Public | strict | Register |
| PUT | `/api/auth/refreshToken` | Public | strict | Refresh token |
| GET | `/api/auth/me` | JWT | loose | Get user details |
| PATCH | `/api/auth/:id` | JWT | strict | Update user details |

### Problem Service (`/api/problems` → `problem-service`)

| Method | Path | Auth | Rate limit | Description |
| ------ | ---- | ---- | ---------- | ------------- |
| GET | `/api/problems/search` | JWT | loose | List/search problems |
| GET | `/api/problems/:id` | JWT | loose | Get problem details |
| POST | `/api/problems` | JWT | strict | Create problem (PROBLEM_SETTER) |
| PUT | `/api/problems/:id` | JWT | strict | Update problem (PROBLEM_SETTER) |
| DELETE | `/api/problems/:id` | JWT | strict | Delete problem (ADMIN) |

### Contests (`/api/contests` → `problem-service`)

Same backend as Problem Service; separate gateway mount.

| Method | Path | Auth | Rate limit | Description |
| ------ | ---- | ---- | ---------- | ------------- |
| GET | `/api/contests` | JWT | moderate | Get all contests |
| GET | `/api/contests/upcoming` | JWT | moderate | Get upcoming contests |
| GET | `/api/contests/leaderboard/archived/:id` | JWT | moderate | Archived contest leaderboard |
| POST | `/api/contests` | JWT | strict | Create contest |
| GET | `/api/contests/:id` | JWT | strict | Get contest details |
| DELETE | `/api/contests/:id` | JWT | strict | Delete upcoming contest |

### Submission Service (`/api/submissions` → `submission-service`)

| Method | Path | Auth | Rate limit | Description |
| ------ | ---- | ---- | ---------- | ------------- |
| POST | `/api/submissions/submit` | JWT | strict | Submit solution |
| POST | `/api/submissions/contest` | JWT | strict | Submit contest solution |
| POST | `/api/submissions/run` | JWT | moderate | Run code |
| GET | `/api/submissions/run/:id` | JWT | loose | Run code status |
| GET | `/api/submissions/problem/:id` | JWT | moderate | Get submissions for a problem |
| GET | `/api/submissions/:id` | JWT | moderate | Get submission by ID |
| GET | `/api/submissions/contest/leaderboard/:id` | JWT | loose | Live contest leaderboard |

## Configuration

Environment variables are set in Docker Compose (`docker-compose.yaml` for production, `compose.dev.yaml` for development).

### Shared secrets

| Variable | Used by | Description |
| -------- | ------- | ----------- |
| `API_GATEWAY_HMAC_SHARED_SECRET` | API Gateway, Auth, Problem, Submission | HMAC signing for gateway → service requests |
| `INTERNAL_HMAC_SHARED_SECRET` | Problem, Submission | Internal service-to-service calls (e.g. contest fetch) |
| `REDIS_URL` | API Gateway, Submission, Evaluation, Background Worker | `redis://redis:6379` |

### API Gateway (`api-gateway`)

| Variable | Production | Development |
| -------- | ------------ | ------------- |
| `PORT` | `3000` | `3000` |
| `NODE_ENV` | `production` | `development` |
| `SERVICE_NAME` | `api-gateway` | `api-gateway` |
| `FRONTEND_URL` | `http://localhost:5173` | `http://localhost:5173` |
| `REDIS_URL` | `redis://redis:6379` | `redis://redis:6379` |
| `API_GATEWAY_HMAC_SHARED_SECRET` | set in compose | set in compose |
| `JWT_ACCESS_SECRET` | not in compose (uses code default; must match auth-service) | same |

### Auth Service (`auth-service`)

| Variable | Production | Development |
| -------- | ------------ | ------------- |
| `PORT` | `3002` | `3002` |
| `NODE_ENV` | `production` | `development` |
| `SERVICE_NAME` | `auth-service` | `auth-service` |
| `DB_HOST` | `postgres` | `postgres` |
| `DB_PORT` | `5432` | `5432` |
| `DB_NAME` | `auth_db` | `auth_db` |
| `DB_USER` | `postgres` | `postgres` |
| `DB_PASSWORD` | `postgres` | `postgres` |
| `JWT_ACCESS_SECRET` | set in compose | set in compose |
| `JWT_REFRESH_SECRET` | set in compose | set in compose |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | `7d` |
| `API_GATEWAY_HMAC_SHARED_SECRET` | set in compose | set in compose |

### Problem Service (`problem-service`)

| Variable | Production | Development |
| -------- | ------------ | ------------- |
| `PORT` | `3010` | `3010` |
| `NODE_ENV` | `production` | `development` |
| `SERVICE_NAME` | `problem-service` | `problem-service` |
| `DB_URI` | `mongodb://mongo:27017/leetcode_problem_service` | same |
| `API_GATEWAY_HMAC_SHARED_SECRET` | set in compose | set in compose |
| `INTERNAL_HMAC_SHARED_SECRET` | set in compose | set in compose |

### Submission Service (`submission-service`)

| Variable | Production | Development |
| -------- | ------------ | ------------- |
| `PORT` | `3020` | `3020` |
| `NODE_ENV` | `production` | `development` |
| `SERVICE_NAME` | `submission-service` | `submission-service` |
| `DB_URI` | `mongodb://mongo:27017/leetcode_submission_service` | same |
| `PROBLEM_SERVICE_URL` | `http://problem-service:3010/api/v1` | same |
| `REDIS_URL` | `redis://redis:6379` | same |
| `SUBMISSION_QUEUE_NAME` | `submission_queue` | same |
| `EVALUATION_JOB_NAME` | `evaluate-submission` | same |
| `STATUS_UPDATE_QUEUE_NAME` | `status_update_queue` | same |
| `STATUS_UPDATE_JOB_NAME` | `update-submission-status` | same |
| `CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME` | `contest-submission-status-update-status` | same |
| `API_GATEWAY_HMAC_SHARED_SECRET` | set in compose | set in compose |
| `INTERNAL_HMAC_SHARED_SECRET` | set in compose | set in compose |

### Evaluation Service (`evaluation-service`)

| Variable | Value |
| -------- | ----- |
| `PORT` | `3030` |
| `PROBLEM_SERVICE_URL` | `http://problem-service:3010/api/v1` |
| `SUBMISSION_SERVICE_URL` | `http://submission-service:3020/api/v1` |
| `REDIS_URL` | `redis://redis:6379` |
| `DOCKER_HOST` | `tcp://dind:2375` |
| `SERVICE_NAME` | `evaluation-service` |
| `SUBMISSION_QUEUE_NAME` | `submission_queue` |
| `EVALUATION_JOB_NAME` | `evaluate-submission` |
| `STATUS_UPDATE_QUEUE_NAME` | `status_update_queue` |
| `STATUS_UPDATE_JOB_NAME` | `update-submission-status` |
| `CONTEST_SUBMISSION_STATUS_UPDATE_JOB_NAME` | `contest-submission-status-update-status` |

### Background Worker Service (`background-worker-service`)

| Variable | Production | Development |
| -------- | ------------ | ------------- |
| `NODE_ENV` | `production` | `development` |
| `SERVICE_NAME` | `background-worker-service` | same |
| `PROBLEM_DB_URI` | `mongodb://mongo:27017/leetcode_problem_service` | same |
| `REDIS_URL` | `redis://redis:6379` | same |

No HTTP port; runs scheduled jobs only.

### Service registration (Consul)

Services that register with Consul on startup:

- **auth-service** — 5 retries at 5s intervals; HTTP health check on `/api/v1/auth/health/consul`
- **problem-service** — same pattern on `/api/v1/problems/health/consul`
- **submission-service** — same pattern on `/api/v1/submissions/health/consul`

The API Gateway polls Consul every 30s for healthy (`passing`) instances and load-balances with round-robin.

## Security and networking

- **Traefik**: Single public entry on port 80; internal services are not directly exposed
- **JWT**: Gateway validates access tokens; public routes: login, register, refreshToken
- **HMAC**: Gateway signs proxied requests; Submission Service uses internal HMAC for contest metadata
- **Consul**: Only healthy instances are discovered by the gateway
- **Rate limiting**: Per-route tiers enforced before proxying; returns 429 when exceeded
- **Helmet & CORS**: Security headers and origin restricted to `FRONTEND_URL`
- **Network isolation**: Services communicate over isolated Docker networks

## Monitoring and logging

- **Winston Logger**: Structured logging with daily rotation
- **Correlation IDs**: Request tracking across services
- **Health checks**: Gateway at `/api/api-gateway/health`; services expose `/health` and `/health/consul`
- **Morgan Middleware**: HTTP request logging at gateway
- **Queue monitoring**: BullMQ job status via Redis

### Logs

```bash
# View service logs
docker compose logs api-gateway
docker compose logs auth-service
docker compose logs problem-service
docker compose logs submission-service
docker compose logs evaluation-service
docker compose logs background-worker-service
docker compose logs reverse-proxy
docker compose logs consul-client

# View all logs
docker compose logs -f
```

## Scaling and multiple instances

### Development (`compose.dev.yaml`)

Default replicas:

- **api-gateway**: 2
- **problem-service**: 2
- **submission-service**: 2

Traefik load-balances across gateway replicas with health checks.

```bash
# Scale evaluation workers (optional)
docker compose -f compose.dev.yaml up -d --scale evaluation-service=3
```


