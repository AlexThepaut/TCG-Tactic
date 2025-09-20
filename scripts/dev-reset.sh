#!/bin/bash

# TCG Tactique - Development Environment Reset Script
# This script resets the development environment to a clean state

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

confirm_action() {
    echo -e "${YELLOW}⚠️  WARNING: This will reset your development environment!${NC}"
    echo "This action will:"
    echo "  • Stop all running containers"
    echo "  • Remove all containers and networks"
    echo "  • Delete all Docker volumes (database data will be lost)"
    echo "  • Clean up Docker images"
    echo "  • Reset log files"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Reset cancelled"
        exit 0
    fi
}

stop_services() {
    log_info "Stopping all services..."

    docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

    log_success "Services stopped"
}

cleanup_containers() {
    log_info "Cleaning up containers and networks..."

    # Remove all containers with tcg prefix
    docker ps -aq --filter name=tcg | xargs -r docker rm -f 2>/dev/null || true

    # Remove networks
    docker network ls --filter name=tcg --format "{{.Name}}" | xargs -r docker network rm 2>/dev/null || true

    log_success "Containers and networks cleaned"
}

cleanup_volumes() {
    log_info "Cleaning up Docker volumes..."

    # Remove volumes with tcg prefix
    docker volume ls --filter name=tcg --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true

    log_success "Volumes cleaned"
}

cleanup_images() {
    log_info "Cleaning up Docker images..."

    # Remove images with tcg prefix
    docker images --filter reference="*tcg*" --format "{{.Repository}}:{{.Tag}}" | xargs -r docker rmi -f 2>/dev/null || true

    # Remove dangling images
    docker image prune -f &> /dev/null || true

    # Remove unused images
    docker image prune -a -f &> /dev/null || true

    log_success "Images cleaned"
}

cleanup_logs() {
    log_info "Cleaning up log files..."

    # Clean backend logs
    if [ -d "$PROJECT_ROOT/backend/logs" ]; then
        find "$PROJECT_ROOT/backend/logs" -type f -name "*.log" -delete 2>/dev/null || true
        log_success "Backend logs cleaned"
    fi

    # Clean any Docker logs
    docker system prune -f &> /dev/null || true

    log_success "Logs cleaned"
}

reset_node_modules() {
    log_info "Cleaning node_modules..."

    # Remove node_modules from backend
    if [ -d "$PROJECT_ROOT/backend/node_modules" ]; then
        rm -rf "$PROJECT_ROOT/backend/node_modules"
        log_success "Backend node_modules removed"
    fi

    # Remove node_modules from frontend
    if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        rm -rf "$PROJECT_ROOT/frontend/node_modules"
        log_success "Frontend node_modules removed"
    fi

    # Remove package-lock.json files
    find "$PROJECT_ROOT" -name "package-lock.json" -not -path "*/node_modules/*" -delete 2>/dev/null || true

    log_success "Node modules cleaned"
}

reset_build_artifacts() {
    log_info "Cleaning build artifacts..."

    # Remove backend dist
    if [ -d "$PROJECT_ROOT/backend/dist" ]; then
        rm -rf "$PROJECT_ROOT/backend/dist"
        log_success "Backend dist removed"
    fi

    # Remove frontend dist
    if [ -d "$PROJECT_ROOT/frontend/dist" ]; then
        rm -rf "$PROJECT_ROOT/frontend/dist"
        log_success "Frontend dist removed"
    fi

    # Remove coverage reports
    find "$PROJECT_ROOT" -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true

    log_success "Build artifacts cleaned"
}

show_disk_space() {
    log_info "Checking disk space recovered..."

    if command -v docker &> /dev/null; then
        echo "Docker system usage:"
        docker system df
    fi
}

# Main execution
main() {
    echo "🧹 Resetting TCG Tactique Development Environment"
    echo "================================================"

    confirm_action

    stop_services
    cleanup_containers
    cleanup_volumes
    cleanup_images
    cleanup_logs
    reset_node_modules
    reset_build_artifacts
    show_disk_space

    echo ""
    echo "✅ Environment reset completed!"
    echo ""
    echo "To set up the environment again, run:"
    echo "  ./scripts/dev-setup.sh"
    echo ""
}

# Handle script interruption
trap 'log_error "Reset interrupted"; exit 1' INT TERM

# Run main function
main "$@"