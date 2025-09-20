#!/bin/bash

# TCG Tactique - Health Check Script
# This script validates the health of all services

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
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# Service endpoints
BACKEND_URL="http://localhost:5001"
FRONTEND_URL="http://localhost:3000"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_container_status() {
    local container_name=$1
    local status

    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name"; then
        status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | awk '{print $2}')
        if [[ $status == "Up" ]]; then
            log_success "$container_name container is running"
            return 0
        else
            log_warning "$container_name container status: $status"
            return 1
        fi
    else
        log_error "$container_name container is not running"
        return 1
    fi
}

check_container_health() {
    local container_name=$1
    local health_status

    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-healthcheck")

    case $health_status in
        "healthy")
            log_success "$container_name is healthy"
            return 0
            ;;
        "unhealthy")
            log_error "$container_name is unhealthy"
            return 1
            ;;
        "starting")
            log_warning "$container_name health check is starting"
            return 1
            ;;
        "no-healthcheck")
            log_warning "$container_name has no health check configured"
            return 0
            ;;
        *)
            log_error "$container_name health status unknown: $health_status"
            return 1
            ;;
    esac
}

check_service_endpoint() {
    local service_name=$1
    local url=$2
    local timeout=${3:-10}

    log_info "Checking $service_name endpoint: $url"

    if curl -f -s --max-time "$timeout" "$url" > /dev/null; then
        log_success "$service_name endpoint is responding"
        return 0
    else
        log_error "$service_name endpoint is not responding"
        return 1
    fi
}

check_postgres() {
    log_info "Checking PostgreSQL connection..."

    if command -v psql > /dev/null; then
        if PGPASSWORD=tcg_password psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U tcg_user -d tcg_tactique -c "SELECT 1;" > /dev/null 2>&1; then
            log_success "PostgreSQL connection successful"
            return 0
        else
            log_error "PostgreSQL connection failed"
            return 1
        fi
    else
        # Fallback to container check
        if docker exec tcg-postgres-dev pg_isready -U tcg_user -d tcg_tactique > /dev/null 2>&1; then
            log_success "PostgreSQL is ready (via container)"
            return 0
        else
            log_error "PostgreSQL is not ready"
            return 1
        fi
    fi
}

check_redis() {
    log_info "Checking Redis connection..."

    if command -v redis-cli > /dev/null; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
            log_success "Redis connection successful"
            return 0
        else
            log_error "Redis connection failed"
            return 1
        fi
    else
        # Fallback to container check
        if docker exec tcg-redis-dev redis-cli ping > /dev/null 2>&1; then
            log_success "Redis is responding (via container)"
            return 0
        else
            log_error "Redis is not responding"
            return 1
        fi
    fi
}

check_backend_api() {
    log_info "Checking backend API endpoints..."

    local endpoints=(
        "/health"
        "/health/status"
    )

    local success_count=0
    for endpoint in "${endpoints[@]}"; do
        if check_service_endpoint "Backend API" "$BACKEND_URL$endpoint" 5; then
            ((success_count++))
        fi
    done

    if [ $success_count -gt 0 ]; then
        log_success "Backend API is partially or fully responding ($success_count/${#endpoints[@]})"
        return 0
    else
        log_error "Backend API is not responding"
        return 1
    fi
}

check_frontend() {
    log_info "Checking frontend application..."

    if check_service_endpoint "Frontend" "$FRONTEND_URL" 10; then
        return 0
    else
        return 1
    fi
}

check_logs_for_errors() {
    log_info "Checking recent logs for critical errors..."

    local error_count=0

    # Check backend logs
    if docker logs tcg-backend-dev --tail 50 2>&1 | grep -i "error\|exception\|failed" | grep -v "test\|debug" > /dev/null; then
        log_warning "Backend logs contain recent errors"
        ((error_count++))
    fi

    # Check frontend logs
    if docker logs tcg-frontend-dev --tail 50 2>&1 | grep -i "error\|exception\|failed" | grep -v "test\|debug" > /dev/null; then
        log_warning "Frontend logs contain recent errors"
        ((error_count++))
    fi

    if [ $error_count -eq 0 ]; then
        log_success "No critical errors in recent logs"
    else
        log_warning "Found errors in logs - check with ./scripts/logs.sh"
    fi
}

check_resources() {
    log_info "Checking system resources..."

    # Check Docker system usage
    echo "Docker system usage:"
    docker system df

    # Check container resource usage
    echo ""
    echo "Container resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

show_summary() {
    echo ""
    echo "🏥 Health Check Summary"
    echo "======================"

    local containers=("tcg-postgres-dev" "tcg-redis-dev" "tcg-backend-dev" "tcg-frontend-dev")
    local healthy_count=0

    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "$container"; then
            echo -e "  ${GREEN}✓${NC} $container"
            ((healthy_count++))
        else
            echo -e "  ${RED}✗${NC} $container"
        fi
    done

    echo ""
    echo "Status: $healthy_count/${#containers[@]} services running"

    if [ $healthy_count -eq ${#containers[@]} ]; then
        echo -e "${GREEN}🎉 All services are healthy!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some services need attention${NC}"
    fi

    echo ""
    echo "Service URLs:"
    echo "  Frontend:  $FRONTEND_URL"
    echo "  Backend:   $BACKEND_URL"
    echo "  API Docs:  $BACKEND_URL/api-docs"
}

# Main execution
main() {
    echo "🏥 TCG Tactique - Health Check"
    echo "=============================="

    local overall_health=0

    # Check container status
    log_info "Checking container status..."
    check_container_status "tcg-postgres-dev" || ((overall_health++))
    check_container_status "tcg-redis-dev" || ((overall_health++))
    check_container_status "tcg-backend-dev" || ((overall_health++))
    check_container_status "tcg-frontend-dev" || ((overall_health++))

    echo ""

    # Check container health
    log_info "Checking container health..."
    check_container_health "tcg-postgres-dev" || true
    check_container_health "tcg-redis-dev" || true
    check_container_health "tcg-backend-dev" || true
    check_container_health "tcg-frontend-dev" || true

    echo ""

    # Check service connections
    log_info "Checking service connections..."
    check_postgres || ((overall_health++))
    check_redis || ((overall_health++))

    echo ""

    # Check application endpoints
    log_info "Checking application endpoints..."
    check_backend_api || ((overall_health++))
    check_frontend || ((overall_health++))

    echo ""

    # Check logs and resources
    check_logs_for_errors
    echo ""
    check_resources

    # Show summary
    show_summary

    # Exit with appropriate code
    if [ $overall_health -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"