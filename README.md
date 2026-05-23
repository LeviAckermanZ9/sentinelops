<p align="center">
  <img src="docs/diagrams/architecture.png" alt="SentinelOps" width="600" />
</p>

<h1 align="center">SentinelOps</h1>

<p align="center">
  <strong>Production-Grade MLOps Platform for Sentiment Analysis</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11-blue?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/node.js-20_LTS-green?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-teal?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Docker-24+-blue?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-1.29+-blue?logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Terraform-1.7+-purple?logo=terraform&logoColor=white" alt="Terraform" />
  <img src="https://img.shields.io/badge/Jenkins-2.440+-red?logo=jenkins&logoColor=white" alt="Jenkins" />
  <img src="https://img.shields.io/badge/Prometheus-latest-orange?logo=prometheus&logoColor=white" alt="Prometheus" />
  <img src="https://img.shields.io/badge/Grafana-latest-orange?logo=grafana&logoColor=white" alt="Grafana" />
</p>

---

## Overview

**SentinelOps** is a full-stack MLOps platform that serves a real **Sentiment Analysis** model (DistilBERT) as a production REST API. It is fully containerized with Docker, orchestrated with Kubernetes, provisioned via Terraform, automated through Jenkins CI/CD, monitored with Prometheus + Grafana, and secured with DevSecOps practices.

> **Course:** INT377 — Cloud Computing and DevOps Essentials | Session 2025-26

### Live Demo Flow

```
Developer pushes code → Jenkins detects push → Runs tests → Builds Docker image
→ Trivy security scan → Push to registry → Kubernetes rolling deploy
→ Prometheus scrapes metrics → Grafana dashboards update in real-time
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub Repo                          │
│              (monorepo, feature-branch workflow)             │
└────────────────────────┬────────────────────────────────────┘
                         │ webhook
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Jenkins Server                          │
│  Test → Build → Security Scan → Push → Deploy → Smoke Test  │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
     Docker Hub / ECR           Kubernetes Cluster
     (image registry)          ┌───────────────────┐
                               │  ML Service        │
                               │  Auth Service      │
                               │  API Gateway       │
                               │  Frontend          │
                               │  MongoDB           │
                               │  Prometheus        │
                               │  Grafana           │
                               └───────────────────┘
                                        │
                                   AWS Cloud
                               (Terraform managed)
```

---

## Services

| Service | Tech Stack | Port | Description |
|---------|-----------|------|-------------|
| **ml-service** | Python 3.11, FastAPI | 8000 | Sentiment analysis inference (DistilBERT) |
| **auth-service** | Node.js 20, Express | 3001 | JWT authentication & user management |
| **api-gateway** | Nginx 1.25 | 80/443 | Reverse proxy, rate limiting, TLS |
| **frontend** | React 18, Vite | 5173 | Web UI for testing the API |
| **mongodb** | MongoDB 7 | 27017 | User data persistence |
| **prometheus** | Prometheus | 9090 | Metrics collection & alerting |
| **grafana** | Grafana | 3000 | Monitoring dashboards |

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)
- [Git](https://git-scm.com/)

### 1. Clone & Configure

```bash
git clone https://github.com/<your-username>/sentinelops.git
cd sentinelops
cp .env.example .env
# Edit .env with your values (especially JWT_SECRET)
```

### 2. Start Everything

```bash
make dev
# or: docker-compose up -d
```

### 3. Verify

```bash
# Health check
curl http://localhost:8000/health

# Run a prediction
curl -X POST http://localhost/api/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "This product is absolutely amazing!"}'

# Response:
# {"text": "This product is absolutely amazing!", "label": "POSITIVE", "score": 0.9998, ...}
```

### 4. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| ML API (direct) | http://localhost:8000 |
| Auth API (direct) | http://localhost:3001 |
| API Gateway | http://localhost:80 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin/sentinelops-grafana) |

---

## Development

### Individual Service Development

```bash
# ML Service
cd ml-service
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Auth Service
cd auth-service
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Available Make Commands

```bash
make help        # Show all available commands
make dev         # Start all services
make build       # Build all Docker images
make test        # Run all tests
make lint        # Lint all services
make clean       # Stop services, remove volumes
make scan        # Trivy security scan
make deploy      # Deploy to Kubernetes
make status      # Show container status
```

---

## Project Structure

```
sentinelops/
├── ml-service/           # Sentiment analysis API (FastAPI)
├── auth-service/         # JWT auth service (Express)
├── api-gateway/          # Nginx reverse proxy
├── frontend/             # React web UI (Vite)
├── infrastructure/       # Terraform IaC (AWS)
├── kubernetes/           # K8s manifests
├── jenkins/              # CI/CD pipelines
├── security/             # DevSecOps configs
├── docs/                 # Documentation
├── docker-compose.yml    # Local dev environment
├── Makefile              # Dev shortcuts
└── README.md             # You are here
```

---

## Environment Variables

| Variable | Service | Description | Default |
|----------|---------|-------------|---------|
| `MODEL_NAME` | ml-service | HuggingFace model identifier | `distilbert-base-uncased-finetuned-sst-2-english` |
| `MODEL_CACHE_DIR` | ml-service | Local model cache directory | `/app/models` |
| `LOG_LEVEL` | ml-service | Logging level | `INFO` |
| `JWT_SECRET` | auth-service | Access token signing secret | — (required) |
| `JWT_REFRESH_SECRET` | auth-service | Refresh token signing secret | — (required) |
| `MONGO_URI` | auth-service | MongoDB connection string | `mongodb://mongo:27017/sentinelops` |
| `AUTH_SERVICE_PORT` | auth-service | Auth service listen port | `3001` |

See [.env.example](.env.example) for the complete list.

---

## CI/CD Pipeline

The Jenkins pipeline executes 8 stages on every push to `main`:

```
┌──────────┐   ┌────────────┐   ┌──────────────┐   ┌───────────────┐
│ Checkout  ├──→│ Unit Tests ├──→│ Build Images ├──→│ Security Scan │
└──────────┘   └────────────┘   └──────────────┘   └───────┬───────┘
                                                           │
┌──────────┐   ┌────────────┐   ┌──────────────┐   ┌──────▼────────┐
│  Notify  │←──┤ Smoke Test │←──┤ Deploy to K8s│←──┤  Push Images  │
└──────────┘   └────────────┘   └──────────────┘   └───────────────┘
```

See [docs/ci-cd-flow.md](docs/ci-cd-flow.md) for details.

---

## Monitoring

- **Prometheus** scrapes metrics from ML and Auth services every 15 seconds
- **Grafana** provides pre-built dashboards for:
  - Request rate & latency (P50/P95/P99)
  - Error rates & prediction distribution
  - Pod health & resource utilization
- **Alerting** rules trigger on high latency (>500ms P95) and error rate (>5%)

See [docs/monitoring.md](docs/monitoring.md) for the full guide.

---

## Security

- **Trivy** scans all container images for vulnerabilities in the CI/CD pipeline
- **IAM policies** follow least-privilege principle
- **Kubernetes RBAC** restricts service account permissions
- **JWT authentication** with token rotation
- **Rate limiting** at both gateway and service level
- **Helmet.js** security headers on the auth service

See [security/compliance/checklist.md](security/compliance/checklist.md) for the full DevSecOps checklist.

---

## Syllabus Coverage

| Syllabus Unit | Covered By |
|---|---|
| Unit 1 — Git + DevOps Intro | GitHub monorepo, branching, Jenkinsfile pipeline |
| Unit 2 — Docker + Kubernetes | All Dockerfiles, docker-compose, full K8s manifests |
| Unit 3 — IaC + Cloud Services | Terraform modules (VPC, EC2, EKS, S3) |
| Unit 4 — CI/CD Jenkins | 8-stage declarative pipeline |
| Unit 5 — Monitoring + Security | Prometheus, Grafana, Trivy, IAM, DevSecOps |
| Unit 6 — Advanced Topics | Cloud cost analysis, performance tuning, scalability |

---

## Documentation

- [Architecture Guide](docs/architecture.md)
- [Setup Guide](docs/setup.md)
- [CI/CD Flow](docs/ci-cd-flow.md)
- [Monitoring Guide](docs/monitoring.md)
- [Cloud Cost Estimate](docs/cloud-cost-estimate.md)
- [DevSecOps Checklist](security/compliance/checklist.md)

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and add tests
3. Run `make test` and `make lint`
4. Submit a PR using the [PR template](.github/PULL_REQUEST_TEMPLATE.md)

---

## License

This project is developed for academic purposes as part of the INT377 course curriculum.

---

<p align="center">
  Built with ❤️ for INT377 — Cloud Computing and DevOps Essentials
</p>
