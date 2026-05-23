<p align="center">
  <img src="https://img.shields.io/badge/SentinelOps-v1.0.0-7c3aed?style=for-the-badge&labelColor=0a0a1a" alt="version" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="python" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="node" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="react" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="docker" />
  <img src="https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="k8s" />
  <img src="https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" alt="terraform" />
  <img src="https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=for-the-badge&logo=jenkins&logoColor=white" alt="jenkins" />
</p>

# 🛡️ SentinelOps

**Production-grade MLOps platform serving a Sentiment Analysis model as a REST API.**

Fully containerized, orchestrated with Kubernetes, provisioned via Terraform, automated through Jenkins CI/CD, and observed via Prometheus + Grafana — all secured with DevSecOps practices.

> 📚 **Course:** INT377 — Cloud Computing and DevOps Essentials | Session 2025-26

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Services](#-services)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Infrastructure](#-infrastructure-terraform)
- [Monitoring](#-monitoring)
- [Security](#-security)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                        │
│              Push triggers Jenkins CI/CD Pipeline                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Jenkins   │
                    │  CI/CD      │
                    │  Pipeline   │
                    └──┬──┬──┬──┬─┘
                       │  │  │  │
              Test ────┘  │  │  └──── Deploy
              Build ──────┘  └─────── Trivy Scan
                           │
                    ┌──────▼──────┐
                    │ Docker Hub  │
                    │   / ECR     │
                    └──────┬──────┘
                           │
          ┌────────────────▼────────────────┐
          │     Kubernetes Cluster (EKS)     │
          │                                  │
          │  ┌───────────┐  ┌────────────┐  │
          │  │ Nginx     │──│ Frontend   │  │
          │  │ Gateway   │  │ (React)    │  │
          │  └─────┬─────┘  └────────────┘  │
          │        │                         │
          │   ┌────▼─────┐  ┌────────────┐  │
          │   │ ML       │  │ Auth       │  │
          │   │ Service  │  │ Service    │  │
          │   │ (FastAPI)│  │ (Express)  │  │
          │   └──────────┘  └─────┬──────┘  │
          │                       │         │
          │                ┌──────▼──────┐  │
          │                │  MongoDB    │  │
          │                │ (StatefulSet)│  │
          │                └─────────────┘  │
          │                                  │
          │  ┌────────────┐  ┌───────────┐  │
          │  │ Prometheus │──│  Grafana  │  │
          │  │ (Metrics)  │  │(Dashboard)│  │
          │  └────────────┘  └───────────┘  │
          └──────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer              | Technology                          | Purpose                          |
|--------------------|-------------------------------------|----------------------------------|
| **ML Model**       | DistilBERT (HuggingFace)            | Sentiment Analysis inference     |
| **ML API**         | FastAPI + Uvicorn                   | REST API for predictions         |
| **Auth API**       | Express.js + JWT                    | Authentication & authorization   |
| **Frontend**       | React 18 + Vite                     | Dark-mode sentiment analysis UI  |
| **API Gateway**    | Nginx                               | Reverse proxy + rate limiting    |
| **Database**       | MongoDB 7                           | User data store                  |
| **Container**      | Docker (multi-stage)                | Service containerization         |
| **Orchestration**  | Kubernetes (EKS)                    | Container orchestration          |
| **IaC**            | Terraform                           | AWS infrastructure provisioning  |
| **CI/CD**          | Jenkins (Declarative Pipeline)      | Build, test, scan, deploy        |
| **Monitoring**     | Prometheus + Grafana                | Metrics collection + dashboards  |
| **Security**       | Trivy + Helmet + bcrypt             | CVE scanning, headers, hashing   |

---

## 📁 Project Structure

```
sentinelops/
├── ml-service/                 # 🧠 FastAPI ML Inference API
│   ├── app/
│   │   ├── main.py             #   Lifespan management, FastAPI app
│   │   ├── model.py            #   Singleton DistilBERT model loader
│   │   ├── metrics.py          #   Prometheus instrumentation
│   │   ├── schemas.py          #   Pydantic request/response models
│   │   └── routes/
│   │       ├── predict.py      #   /predict and /predict/batch endpoints
│   │       └── health.py       #   /health and /health/ready probes
│   ├── tests/                  #   pytest unit tests
│   ├── Dockerfile              #   Multi-stage Python 3.11 slim
│   └── requirements.txt
│
├── auth-service/               # 🔐 Express JWT Authentication
│   ├── src/
│   │   ├── index.js            #   Express app with Prometheus metrics
│   │   ├── models/User.js      #   Mongoose model (bcrypt, lockout)
│   │   ├── routes/
│   │   │   ├── auth.js         #   Register, login, refresh, logout
│   │   │   └── user.js         #   Profile (/me), admin user listing
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js #  JWT verify + RBAC authorize()
│   │   │   └── rateLimiter.js   #  express-rate-limit (5 req/15min auth)
│   │   └── utils/
│   │       ├── jwt.js          #   Sign/verify access + refresh tokens
│   │       └── logger.js       #   Winston structured logging
│   ├── tests/                  #   Jest + mongodb-memory-server
│   └── Dockerfile              #   Multi-stage Node 20 Alpine
│
├── api-gateway/                # 🌐 Nginx Reverse Proxy
│   ├── nginx.conf              #   Rate limiting, security headers, routing
│   └── Dockerfile
│
├── frontend/                   # 💎 React 18 + Vite UI
│   ├── src/
│   │   ├── App.jsx             #   Main layout: navbar, grid, modal, toasts
│   │   ├── index.css           #   CSS design system (50+ variables)
│   │   ├── api/client.js       #   Axios with JWT refresh interceptors
│   │   └── components/         #   PredictForm, ResultCard, HistoryPanel,
│   │                           #   MetricsBadge, LoginModal, Toast
│   └── Dockerfile              #   Multi-stage build → Nginx serve
│
├── kubernetes/                 # ☸️ K8s Manifests
│   ├── namespaces/             #   sentinelops namespace
│   ├── ml-service/             #   Deployment, Service, HPA, ConfigMap
│   ├── auth-service/           #   Deployment, Service, ConfigMap
│   ├── api-gateway/            #   Deployment, Service, Ingress
│   ├── frontend/               #   Deployment, Service
│   ├── mongodb/                #   StatefulSet + headless Service
│   ├── secrets/                #   Secrets template (not committed)
│   └── monitoring/
│       ├── prometheus/         #   Deployment, Service, ConfigMap (alerts)
│       └── grafana/            #   Deployment, Service, ConfigMaps,
│                               #   dashboards/ml-service.json (12 panels)
│
├── infrastructure/             # 🏗️ Terraform IaC
│   ├── main.tf                 #   Root module (VPC, EC2, EKS, S3)
│   ├── variables.tf            #   Input variables with defaults
│   ├── outputs.tf              #   VPC ID, Jenkins IP, EKS endpoint
│   └── modules/
│       ├── vpc/                #   VPC, subnets, NAT, route tables
│       ├── ec2/                #   Jenkins server (Ubuntu + user-data)
│       ├── eks/                #   K8s cluster + managed node group
│       └── s3/                 #   Model bucket + tfstate bucket + DynamoDB
│
├── jenkins/                    # 🔄 CI/CD Pipelines
│   ├── Jenkinsfile             #   8-stage pipeline (main branch)
│   ├── Jenkinsfile.pr          #   PR pipeline (test + scan only)
│   └── scripts/
│       ├── test.sh             #   pytest + jest runner
│       ├── build.sh            #   Multi-image Docker build
│       ├── scan.sh             #   Trivy security scan
│       └── deploy.sh           #   K8s rollout deployment
│
├── security/                   # 🔒 DevSecOps
│   ├── trivy-config.yaml       #   Trivy scanner configuration
│   ├── iam/                    #   AWS IAM policies (Jenkins, EKS nodes)
│   └── compliance/checklist.md #   Security compliance checklist (81%)
│
├── docker-compose.yml          # 🐳 Full local dev stack (7 services)
├── docker-compose.test.yml     # 🧪 CI test stack
├── Makefile                    # ⚡ Developer shortcuts
├── .env.example                # 📝 Environment variables template
├── .gitignore                  # 🚫 Comprehensive ignore rules
└── README.md                   # 📖 This file
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose v2
- Git
- (Optional) Node.js 20+, Python 3.11+ for local development

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/sentinelops.git
cd sentinelops
cp .env.example .env
# Edit .env with your secrets
```

### 2. Start Full Stack

```bash
# Build and start all services
docker-compose up -d --build

# Or use Make
make up
```

### 3. Access Services

| Service       | URL                       | Credentials          |
|---------------|---------------------------|----------------------|
| **Frontend**  | http://localhost          | Register an account  |
| **ML API**    | http://localhost:8000     | —                    |
| **Auth API**  | http://localhost:3001     | —                    |
| **Prometheus**| http://localhost:9090     | —                    |
| **Grafana**   | http://localhost:3000     | admin / sentinelops  |

### 4. Test a Prediction

```bash
curl -X POST http://localhost/api/predict \
  -H 'Content-Type: application/json' \
  -d '{"text": "This platform is absolutely amazing!"}'
```

Response:
```json
{
  "text": "This platform is absolutely amazing!",
  "label": "POSITIVE",
  "score": 0.9998,
  "model_version": "distilbert-base-uncased-finetuned-sst-2-english",
  "inference_time_ms": 12.45
}
```

---

## 📦 Services

### ML Service (FastAPI)

- **Model:** `distilbert-base-uncased-finetuned-sst-2-english` (67M params)
- **Features:** Singleton model loading, batch prediction, Prometheus metrics
- **Metrics:** `prediction_requests_total`, `prediction_latency_seconds`, `prediction_errors_total`, `active_predictions`, `prediction_label_total`, `model_load_time_seconds`

### Auth Service (Express)

- **Features:** JWT auth (access + refresh tokens), token rotation, account lockout
- **Security:** bcrypt (12 rounds), RBAC (user/admin), rate limiting (5 req/15min)
- **Metrics:** `auth_requests_total`, `auth_request_duration_seconds`

### API Gateway (Nginx)

- **Features:** Reverse proxy, rate limiting, security headers, gzip, WebSocket
- **Rate Limits:** 10 req/s API, 2 req/s auth endpoints
- **Error Responses:** JSON format for 429, 502, 503, 504

---

## 🔄 CI/CD Pipeline

```
Checkout → Unit Tests (parallel) → Build Images → Trivy Scan → Push → Deploy → Smoke Test → Notify
                                                      │
                                               Fail on CRITICAL
                                               Report HIGH
```

| Stage         | Tool    | Details                                        |
|---------------|---------|------------------------------------------------|
| Unit Tests    | pytest  | ML service tests (parallel)                    |
| Unit Tests    | Jest    | Auth service tests (parallel, mongodb-memory)  |
| Build         | Docker  | Multi-stage, Git SHA tags + latest              |
| Security      | Trivy   | Fail on CRITICAL CVEs, archive JSON reports     |
| Push          | Docker  | Push to Docker Hub / ECR                        |
| Deploy        | kubectl | Rolling update, wait for rollout                |
| Smoke Test    | curl    | Health checks + prediction test                 |

---

## 🏗️ Infrastructure (Terraform)

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
# Edit with your AWS credentials and preferences

terraform init
terraform plan
terraform apply
```

| Module | Resources                                               |
|--------|---------------------------------------------------------|
| VPC    | VPC, 2 public + 2 private subnets, NAT, IGW            |
| EC2    | Jenkins server (t3.medium, Ubuntu 22.04)                |
| EKS    | K8s 1.29 cluster, managed node group (2-3 nodes)       |
| S3     | Model weights bucket, tfstate bucket + DynamoDB lock    |

---

## 📊 Monitoring

### Grafana Dashboard — 12 Panels

| Panel                  | Type        | Query                                                |
|------------------------|-------------|------------------------------------------------------|
| Request Rate           | Time series | `rate(prediction_requests_total[5m])`                |
| Latency P50/P95/P99    | Time series | `histogram_quantile(0.95, ...)`                      |
| Error Rate             | Time series | `rate(prediction_errors_total[5m])`                  |
| Active Predictions     | Stat        | `sum(active_predictions)`                            |
| Total Predictions      | Stat        | `sum(prediction_requests_total)`                     |
| Model Load Time        | Stat        | `model_load_time_seconds`                            |
| Avg Latency Gauge      | Gauge       | `rate(latency_sum[5m]) / rate(latency_count[5m])`    |
| Error Rate %           | Gauge       | `errors / requests` (percentage)                     |
| Uptime                 | Stat        | `up{job="ml-service"}`                               |
| Sentiment Distribution | Pie/Donut   | `prediction_label_total by (label)`                  |
| Label Rate             | Stacked     | `rate(prediction_label_total[5m]) by (label)`        |
| Latency Heatmap        | Heatmap     | `prediction_latency_seconds_bucket`                  |

### Alert Rules

| Alert               | Condition              | Severity |
|----------------------|------------------------|----------|
| HighPredictionLatency| P95 > 500ms for 2min   | Warning  |
| HighErrorRate        | > 5% error rate for 2m | Critical |
| ServiceDown          | Target unreachable 1m  | Critical |
| HighMemoryUsage      | > 1.5GB for 5min       | Warning  |

---

## 🔒 Security

### DevSecOps Compliance: 81%

| Category                | Score |
|-------------------------|-------|
| Container Security      | 89%   |
| Secrets Management      | 86%   |
| Network Security        | 88%   |
| Authentication          | 88%   |
| Infrastructure Security | 71%   |
| CI/CD Security          | 75%   |
| Monitoring              | 75%   |
| Kubernetes Security     | 75%   |

See full checklist: [`security/compliance/checklist.md`](security/compliance/checklist.md)

---

## 📖 API Reference

### Prediction

```
POST /api/predict
Body: { "text": "string" }
Response: { "text", "label", "score", "model_version", "inference_time_ms" }

POST /api/predict/batch
Body: { "texts": ["string", ...] }
Response: { "results": [...], "total_inference_time_ms" }
```

### Authentication

```
POST /api/auth/register   — Create account
POST /api/auth/login      — Sign in (returns JWT tokens)
POST /api/auth/refresh    — Rotate tokens
POST /api/auth/logout     — Invalidate refresh token

GET  /api/users/me        — Current user profile (auth required)
GET  /api/users           — List users (admin only)
```

### Health & Metrics

```
GET /api/health/ml        — ML service health
GET /api/health/auth      — Auth service health
GET /metrics/ml           — ML Prometheus metrics
GET /metrics/auth         — Auth Prometheus metrics
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Use the PR template at [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).

---

## 📄 License

This project is developed for academic purposes as part of **INT377 — Cloud Computing and DevOps Essentials** at Lovely Professional University, Session 2025-26.

---

<p align="center">
  Built with ❤️ by <strong>SentinelOps Team</strong>
</p>
