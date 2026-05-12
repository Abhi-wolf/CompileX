# CompileX

A scalable microservices-based backend system for running and evaluating code submissions, similar to LeetCode. Built with Node.js, TypeScript, and Docker.

## 🏗️ Architecture

This system consists of five main microservices:

| Service                | Port | Description                                                | Database         |
| ---------------------- | ---- | ---------------------------------------------------------- | ---------------- |
| **API Gateway**        | 3000 | Entry point for all client requests, service discovery, routing | None (stateless) |
| **Registry Service**   | 3001 | Service discovery and registration hub for all microservices | None (in-memory) |
| **Auth Service**       | 3002 | Handles user authentication, authorization, and user data  | PostgreSQL       |
| **Problem Service**    | 3010 | Manages coding problems, test cases, and problem metadata  | MongoDB          |
| **Submission Service** | 3020 | Handles code submissions, user data, and submission status | MongoDB          |
| **Evaluation Service** | 3030 | Executes code in isolated containers and evaluates results | None (stateless) |

### 🔧 Supporting Infrastructure

- **MongoDB**: Primary database for problem and submission data
- **PostgreSQL**: Relational database for authentication data
- **Redis**: Message queue and caching layer (BullMQ)
- **Docker-in-Docker**: Isolated code execution environment
- **Winston**: Structured logging with daily rotation

### 🔐 Security & Networking

- **Network Isolation**: Services communicate via isolated Docker networks (backend, execution, mongo_db_network, postgres_db_network, redis_network)
- **HMAC Authentication**: Request signing between API Gateway ↔ Services and Service ↔ Registry
- **Service Registration**: All services register with Registry Service for dynamic discovery
- **Minimal Port Exposure**: Only API Gateway (port 3000) is exposed externally; all other services are internal-only

## 🚀 Features

- **API Gateway**: Single entry point with service discovery and local caching
- **Service Registry**: Dynamic service registration and discovery with HMAC authentication
- **Multi-language Support**: Execute code in JavaScript, C++, and Python
- **Isolated Execution**: Secure code execution using Docker containers
- **Asynchronous Processing**: Queue-based job processing with BullMQ
- **Comprehensive Logging**: Structured logging with correlation IDs
- **Health Checks**: Service health monitoring and dependency management
- **Scalable Architecture**: Designed for horizontal scaling with multiple service instances
- **Network Security**: Isolated Docker networks with minimal port exposure
- **HMAC Security**: Cryptographic request signing between services

## 💻 Supported Languages

| Language       | Timeout    | Docker Image | Description                        |
| -------------- | ---------- | ------------ | ---------------------------------- |
| **JavaScript** | 10 seconds | Node.js      | JavaScript/Node.js code execution  |
| **C++**        | 10 seconds | GCC          | C++ code compilation and execution |
| **Python**     | 40 seconds | Python 3     | Python code execution              |

## 📋 Prerequisites

- Docker & Docker Compose

## 🛠️ Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/Abhi-wolf/CompileX
   cd CompileX
   ```

2. **Start all services**

   ```bash
   # Production build
   docker-compose up -d

   # Development with hot reload
   docker-compose -f compose.dev.yaml up -d
   ```

3. **Verify services are running**
   ```bash
   curl http://localhost:3000/api/v1/health  # API Gateway
   curl http://localhost:3000/api/v1/problem/health  # Problem Service (via Gateway)
   curl http://localhost:3000/api/v1/submission/health  # Submission Service (via Gateway)
   curl http://localhost:3000/api/v1/auth/health  # Auth Service (via Gateway)
   ```

## 🔌 API Endpoints

All client requests should go through the **API Gateway** at `http://localhost:3000`. The gateway handles routing to the appropriate service.

### API Gateway (Port 3000)

- `GET /api/v1/health` - Gateway health check
- `GET /api/v1/problem/*` - Routes to Problem Service
- `GET /api/v1/submission/*` - Routes to Submission Service
- `POST /api/v1/submission/*` - Routes to Submission Service
- `GET /api/v1/auth/*` - Routes to Auth Service
- `POST /api/v1/auth/*` - Routes to Auth Service

### Problem Service (via Gateway)

- `GET /api/v1/problem/problems/search` - List all problems and search by query
- `GET /api/v1/problem/problems/:id` - Get problem by ID
- `POST /api/v1/problem/problems` - Create new problem
- `PUT /api/v1/problem/problems/:id` - Update problem
- `DELETE /api/v1/problem/problems/:id` - Delete problem
- `GET /api/v1/problem/health` - Health check

### Submission Service (via Gateway)

- `POST /api/v1/submission/submissions` - Create new submission
- `GET /api/v1/submission/submissions/:id` - Get submission details
- `GET /api/v1/submission/health` - Health check

### Auth Service (via Gateway)

- `POST /api/v1/auth/auth/register` - Register a new user
- `POST /api/v1/auth/auth/login` - Login user
- `GET /api/v1/auth/auth/:id` - Get user details
- `PUT /api/v1/auth/auth/refreshToken` - Refresh access token
- `PATCH /api/v1/auth/auth/:id` - Update user details
- `GET /api/v1/auth/auth/health` - Health check

## ⚙️ Configuration

Environment variables can be set in `.env` files or Docker Compose:

### HMAC Authentication

Services use HMAC-SHA256 signatures for secure inter-service communication:

| Variable | Description |
|----------|-------------|
| `API_GATEWAY_HMAC_SHARED_SECRET` | Secret for API Gateway to sign requests to services |

### Service Registration

Each service registers with the Registry Service on startup:

- **Auth Service**: Registers with service name `auth-service`
- **Problem Service**: Registers with service name `problem-service`
- **Submission Service**: Registers with service name `submission-service`
- **Evaluation Service**: Registers with service name `evaluation-service`
- **API Gateway**: Maintains local cache of registered services

### Network Configuration

Production (`docker-compose.yaml`) uses isolated networks:

- **backend**: Shared network for API Gateway and all services
- **execution**: Isolated network for Docker-in-Docker and Evaluation Service
- **mongo_db_network**: Isolated network for MongoDB and Problem/Submission services
- **postgres_db_network**: Isolated network for PostgreSQL and Auth service
- **redis_network**: Isolated network for Redis and dependent services

### Language Configuration

Language-specific settings are configured in `evaluation_service/src/config/language.config.ts`:

- **JavaScript**: 20 second execution timeout
- **C++**: 10 second execution timeout
- **Python**: 40 second execution timeout

## 🔍 Monitoring & Logging

- **Winston Logger**: Structured logging with daily rotation
- **Correlation IDs**: Request tracking across services
- **Health Checks**: `/api/v1/health` endpoints
- **Morgan Middleware**: HTTP request logging
- **Queue Monitoring**: BullMQ job status and metrics

### Logs

```bash
# View service logs
docker-compose logs api-gateway
docker-compose logs registry-service
docker-compose logs problem-service
docker-compose logs submission-service
docker-compose logs evaluation-service
docker-compose logs auth-service

# View all logs
docker-compose logs -f
```

## 🏭 Scaling & Multiple Instances

### Development Mode (compose.dev.yaml)

Supports running multiple instances of services:

```bash
# Run multiple evaluation service instances
docker-compose -f compose.dev.yaml up -d --scale evaluation-service=3
```

Submission Service is configured with `deploy.replicas: 2` by default in development.

### Production Mode (docker-compose.yaml)

Uses Docker Swarm-compatible `deploy.replicas` for horizontal scaling:

```bash
# Deploy with Docker Swarm
docker stack deploy -c docker-compose.yaml CompileX
```
