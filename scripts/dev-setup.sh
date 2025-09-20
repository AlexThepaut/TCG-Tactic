#!/bin/bash

# TCG Tactique - Development Environment Setup Script
# This script sets up the complete development environment with one command

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi

    log_success "All requirements satisfied"
}

setup_environment() {
    log_info "Setting up environment variables..."

    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
            log_success "Created .env file from .env.example"
        else
            log_error ".env.example file not found!"
            exit 1
        fi
    else
        log_warning ".env file already exists, skipping creation"
    fi

    # Create backend .env if it doesn't exist
    if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
        if [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
            cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
            log_success "Created backend/.env file"
        fi
    fi

    # Create frontend .env if it doesn't exist
    if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
        if [ -f "$PROJECT_ROOT/frontend/.env.example" ]; then
            cp "$PROJECT_ROOT/frontend/.env.example" "$PROJECT_ROOT/frontend/.env"
            log_success "Created frontend/.env file"
        fi
    fi
}

cleanup_containers() {
    log_info "Cleaning up existing containers..."

    # Stop and remove existing containers
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

    # Remove dangling images
    docker image prune -f &> /dev/null || true

    log_success "Cleanup completed"
}

build_services() {
    log_info "Building Docker services..."

    # Build with no cache to ensure fresh images
    docker-compose -f "$COMPOSE_FILE" build --no-cache

    log_success "Services built successfully"
}

start_services() {
    log_info "Starting services..."

    # Start infrastructure services first
    log_info "Starting database and cache services..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis

    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "healthy"; then
            log_success "PostgreSQL is ready"
            break
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL failed to start within timeout"
        exit 1
    fi

    # Start application services
    log_info "Starting application services..."
    docker-compose -f "$COMPOSE_FILE" up -d backend frontend

    log_success "All services started"
}

check_health() {
    log_info "Performing health checks..."

    local services=("postgres" "redis" "backend" "frontend")
    local max_attempts=60
    local healthy_services=0

    for service in "${services[@]}"; do
        log_info "Checking $service health..."
        local attempt=0

        while [ $attempt -lt $max_attempts ]; do
            if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|Up"; then
                log_success "$service is healthy"
                ((healthy_services++))
                break
            fi

            echo -n "."
            sleep 2
            ((attempt++))
        done

        if [ $attempt -eq $max_attempts ]; then
            log_warning "$service health check timeout"
        fi
    done

    if [ $healthy_services -eq ${#services[@]} ]; then
        log_success "All services are healthy"
    else
        log_warning "Some services may not be fully ready"
    fi
}

show_info() {
    echo ""
    echo "🎉 TCG Tactique Development Environment Setup Complete!"
    echo ""
    echo "📱 Frontend:  http://localhost:3000"
    echo "🔧 Backend:   http://localhost:5001"
    echo "🗄️  Database: localhost:5432"
    echo "📦 Redis:     localhost:6379"
    echo ""
    echo "📊 Useful commands:"
    echo "  • View logs:     docker-compose logs -f"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart:       docker-compose restart"
    echo "  • Check status:  docker-compose ps"
    echo ""
    echo "🔧 Development scripts:"
    echo "  • Health check:  ./scripts/health-check.sh"
    echo "  • View logs:     ./scripts/logs.sh"
    echo "  • Reset env:     ./scripts/dev-reset.sh"
    echo "  • Test env:      ./scripts/test-environment.sh"
    echo ""
}

# Main execution
main() {
    echo "🚀 Setting up TCG Tactique Development Environment"
    echo "================================================="

    check_requirements
    setup_environment
    cleanup_containers
    build_services
    start_services
    check_health
    show_info

    log_success "Setup completed successfully!"
}

# Handle script interruption
trap 'log_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"