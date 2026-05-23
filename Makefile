# ============================================================
# SentinelOps — Makefile
# Developer shortcuts for common operations
# ============================================================

.PHONY: help dev dev-build down clean build test test-ml test-auth lint push deploy logs status

# Default target
help: ## Show this help message
	@echo ""
	@echo "  SentinelOps — Development Commands"
	@echo "  ===================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ---------------------- Local Development ----------------------

dev: ## Start all services (docker-compose up)
	docker-compose up -d
	@echo "\n✅ SentinelOps is running!"
	@echo "   Frontend:    http://localhost:5173"
	@echo "   ML API:      http://localhost:8000"
	@echo "   Auth API:    http://localhost:3001"
	@echo "   Gateway:     http://localhost:80"
	@echo "   Prometheus:  http://localhost:9090"
	@echo "   Grafana:     http://localhost:3000"

dev-build: ## Rebuild and start all services
	docker-compose up -d --build

down: ## Stop all services
	docker-compose down

clean: ## Stop all services, remove volumes, prune images
	docker-compose down -v --remove-orphans
	docker image prune -f --filter "label=project=sentinelops"
	@echo "✅ Cleaned up all SentinelOps resources"

# ---------------------- Build ----------------------

build: ## Build all Docker images
	docker-compose build
	@echo "✅ All images built successfully"

build-ml: ## Build ML service image only
	docker build -t sentinelops/ml-service:latest ./ml-service

build-auth: ## Build Auth service image only
	docker build -t sentinelops/auth-service:latest ./auth-service

build-gateway: ## Build API Gateway image only
	docker build -t sentinelops/api-gateway:latest ./api-gateway

build-frontend: ## Build Frontend image only
	docker build -t sentinelops/frontend:latest ./frontend

# ---------------------- Testing ----------------------

test: test-ml test-auth ## Run all tests
	@echo "✅ All tests passed"

test-ml: ## Run ML service tests
	@echo "🧪 Running ML service tests..."
	cd ml-service && python -m pytest tests/ -v --tb=short

test-auth: ## Run Auth service tests
	@echo "🧪 Running Auth service tests..."
	cd auth-service && npm test

test-compose: ## Run tests via docker-compose
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down -v

# ---------------------- Linting ----------------------

lint: ## Lint all services
	@echo "🔍 Linting ML service..."
	cd ml-service && python -m flake8 app/ --max-line-length=120
	@echo "🔍 Linting Auth service..."
	cd auth-service && npx eslint src/
	@echo "✅ All linting passed"

# ---------------------- Docker Push ----------------------

IMAGE_TAG ?= latest
REGISTRY ?= docker.io/sentinelops

push: ## Push all images to registry (IMAGE_TAG=xxx REGISTRY=xxx)
	docker tag sentinelops/ml-service:latest $(REGISTRY)/ml-service:$(IMAGE_TAG)
	docker tag sentinelops/auth-service:latest $(REGISTRY)/auth-service:$(IMAGE_TAG)
	docker tag sentinelops/api-gateway:latest $(REGISTRY)/api-gateway:$(IMAGE_TAG)
	docker tag sentinelops/frontend:latest $(REGISTRY)/frontend:$(IMAGE_TAG)
	docker push $(REGISTRY)/ml-service:$(IMAGE_TAG)
	docker push $(REGISTRY)/auth-service:$(IMAGE_TAG)
	docker push $(REGISTRY)/api-gateway:$(IMAGE_TAG)
	docker push $(REGISTRY)/frontend:$(IMAGE_TAG)
	@echo "✅ All images pushed to $(REGISTRY) with tag $(IMAGE_TAG)"

# ---------------------- Kubernetes ----------------------

deploy: ## Deploy to Kubernetes (ensure kubectl context is set)
	kubectl apply -f kubernetes/namespaces/
	kubectl apply -f kubernetes/ml-service/
	kubectl apply -f kubernetes/auth-service/
	kubectl apply -f kubernetes/api-gateway/
	kubectl apply -f kubernetes/frontend/
	kubectl apply -f kubernetes/monitoring/prometheus/
	kubectl apply -f kubernetes/monitoring/grafana/
	@echo "✅ Deployed to Kubernetes"

k8s-status: ## Show Kubernetes pod status
	kubectl get pods -n sentinelops -o wide
	kubectl get svc -n sentinelops

# ---------------------- Monitoring ----------------------

logs: ## Tail logs from all services
	docker-compose logs -f --tail=50

logs-ml: ## Tail ML service logs
	docker-compose logs -f --tail=50 ml-service

logs-auth: ## Tail Auth service logs
	docker-compose logs -f --tail=50 auth-service

status: ## Show running containers and their health
	docker-compose ps

# ---------------------- Security ----------------------

scan: ## Run Trivy security scan on all images
	@echo "🔒 Scanning ML service..."
	trivy image sentinelops/ml-service:latest --severity HIGH,CRITICAL
	@echo "🔒 Scanning Auth service..."
	trivy image sentinelops/auth-service:latest --severity HIGH,CRITICAL
	@echo "🔒 Scanning API Gateway..."
	trivy image sentinelops/api-gateway:latest --severity HIGH,CRITICAL
	@echo "🔒 Scanning Frontend..."
	trivy image sentinelops/frontend:latest --severity HIGH,CRITICAL
	@echo "✅ Security scan complete"

# ---------------------- Infrastructure ----------------------

tf-init: ## Initialize Terraform
	cd infrastructure && terraform init

tf-plan: ## Run Terraform plan
	cd infrastructure && terraform plan -out=tfplan

tf-apply: ## Apply Terraform plan
	cd infrastructure && terraform apply tfplan

tf-destroy: ## Destroy Terraform infrastructure
	cd infrastructure && terraform destroy
