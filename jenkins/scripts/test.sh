#!/bin/bash
# ============================================================
# SentinelOps — Test Runner Script
# Runs all service tests
# ============================================================
set -e

echo "=========================================="
echo "  SentinelOps — Running All Tests"
echo "=========================================="

# ML Service Tests
echo ""
echo "🧪 [1/2] ML Service Tests (pytest)"
echo "------------------------------------------"
cd ml-service
python -m pytest tests/ -v --tb=short --junitxml=../test-results/ml-service.xml
cd ..

# Auth Service Tests
echo ""
echo "🧪 [2/2] Auth Service Tests (jest)"
echo "------------------------------------------"
cd auth-service
npm test -- --ci --reporters=default --reporters=jest-junit
cd ..

echo ""
echo "✅ All tests passed!"
