#!/bin/bash

# TCG Tactique - Docker Setup Validation Script
# This script validates the Docker configuration without starting services

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

check_docker_files() {
    log_info "Checking Docker configuration files..."

    local files=(
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "backend/Dockerfile.dev"
        "backend/Dockerfile.prod"
        "frontend/Dockerfile.dev"
        "frontend/Dockerfile.prod"
    )

    local missing_files=0
    for file in "${files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            log_success "$file exists"
        else
            log_error "$file is missing"
            ((missing_files++))
        fi
    done

    return $missing_files
}

check_environment_files() {
    log_info "Checking environment configuration files..."

    local files=(
        ".env.example"
        ".env.production.example"
        "backend/.env.example"
        "frontend/.env.example"
    )

    local missing_files=0
    for file in "${files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            log_success "$file exists"
        else
            log_error "$file is missing"
            ((missing_files++))
        fi
    done

    return $missing_files
}

check_scripts() {
    log_info "Checking development scripts..."

    local scripts=(
        "scripts/dev-setup.sh"
        "scripts/dev-reset.sh"
        "scripts/health-check.sh"
        "scripts/logs.sh"
        "scripts/test-environment.sh"
    )

    local missing_scripts=0
    for script in "${scripts[@]}"; do
        if [ -f "$PROJECT_ROOT/$script" ]; then
            if [ -x "$PROJECT_ROOT/$script" ]; then
                log_success "$script exists and is executable"
            else
                log_warning "$script exists but is not executable"
                chmod +x "$PROJECT_ROOT/$script"
                log_success "Made $script executable"
            fi
        else
            log_error "$script is missing"
            ((missing_scripts++))
        fi
    done

    return $missing_scripts
}

validate_docker_compose() {
    log_info "Validating docker-compose.yml syntax..."

    if command -v docker-compose &> /dev/null; then
        if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config > /dev/null 2>&1; then
            log_success "docker-compose.yml syntax is valid"
        else
            log_error "docker-compose.yml has syntax errors"
            return 1
        fi
    elif docker compose version &> /dev/null; then
        if docker compose -f "$PROJECT_ROOT/docker-compose.yml" config > /dev/null 2>&1; then
            log_success "docker-compose.yml syntax is valid"
        else
            log_error "docker-compose.yml has syntax errors"
            return 1
        fi
    else
        log_warning "Docker Compose not available for validation"
        return 1
    fi

    return 0
}

validate_dockerfiles() {
    log_info "Validating Dockerfile syntax..."

    local dockerfiles=(
        "backend/Dockerfile.dev"
        "backend/Dockerfile.prod"
        "frontend/Dockerfile.dev"
        "frontend/Dockerfile.prod"
    )

    local errors=0
    for dockerfile in "${dockerfiles[@]}"; do
        if docker build -f "$PROJECT_ROOT/$dockerfile" --no-cache --dry-run "$PROJECT_ROOT/$(dirname $dockerfile)" > /dev/null 2>&1; then
            log_success "$dockerfile syntax is valid"
        else
            # docker build --dry-run is not always available, so just check basic syntax
            if grep -q "FROM\|RUN\|COPY" "$PROJECT_ROOT/$dockerfile"; then
                log_success "$dockerfile appears to have valid syntax"
            else
                log_error "$dockerfile appears to have syntax issues"
                ((errors++))
            fi
        fi
    done

    return $errors
}

check_package_files() {
    log_info "Checking package.json files..."

    # Check backend
    if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
        log_success "Backend package.json exists"

        # Check if package.json is valid JSON
        if node -e "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/backend/package.json', 'utf8'))" 2>/dev/null; then
            log_success "Backend package.json is valid JSON"
        else
            log_error "Backend package.json is invalid JSON"
            return 1
        fi
    else
        log_error "Backend package.json is missing"
        return 1
    fi

    # Check frontend
    if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
        log_success "Frontend package.json exists"

        # Check if package.json is valid JSON
        if node -e "JSON.parse(require('fs').readFileSync('$PROJECT_ROOT/frontend/package.json', 'utf8'))" 2>/dev/null; then
            log_success "Frontend package.json is valid JSON"
        else
            log_error "Frontend package.json is invalid JSON"
            return 1
        fi
    else
        log_error "Frontend package.json is missing"
        return 1
    fi

    return 0
}

check_port_availability() {
    log_info "Checking port availability..."

    local ports=(3000 5001 5432 6379)
    local occupied_ports=()

    for port in "${ports[@]}"; do
        if lsof -i :$port > /dev/null 2>&1; then
            occupied_ports+=($port)
            log_warning "Port $port is already in use"
        else
            log_success "Port $port is available"
        fi
    done

    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warning "Some ports are occupied. You may need to stop other services."
        echo "Occupied ports: ${occupied_ports[*]}"
        return 1
    fi

    return 0
}

check_docker_requirements() {
    log_info "Checking Docker system requirements..."

    # Check Docker daemon
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker daemon is not running"
        return 1
    else
        log_success "Docker daemon is running"
    fi

    # Check available disk space (need at least 2GB for images)
    local available_space=$(df . | awk 'NR==2 {print $4}')
    local space_gb=$((available_space / 1024 / 1024))

    if [ $space_gb -lt 2 ]; then
        log_warning "Low disk space: ${space_gb}GB available (recommended: 2GB+)"
    else
        log_success "Sufficient disk space: ${space_gb}GB available"
    fi

    # Check Docker memory limit
    local memory_limit=$(docker system info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
    if [ "$memory_limit" -gt 0 ]; then
        local memory_gb=$((memory_limit / 1024 / 1024 / 1024))
        if [ $memory_gb -lt 4 ]; then
            log_warning "Docker memory limit: ${memory_gb}GB (recommended: 4GB+)"
        else
            log_success "Docker memory limit: ${memory_gb}GB"
        fi
    fi

    return 0
}

show_validation_summary() {
    echo ""
    echo "🔍 Docker Setup Validation Summary"
    echo "=================================="

    local total_checks=7
    local passed_checks=0

    echo "Results:"

    # Run all validation checks
    if check_docker_files; then ((passed_checks++)); fi
    echo ""
    if check_environment_files; then ((passed_checks++)); fi
    echo ""
    if check_scripts; then ((passed_checks++)); fi
    echo ""
    if validate_docker_compose; then ((passed_checks++)); fi
    echo ""
    if validate_dockerfiles; then ((passed_checks++)); fi
    echo ""
    if check_package_files; then ((passed_checks++)); fi
    echo ""
    if check_docker_requirements; then ((passed_checks++)); fi

    echo ""
    echo "Overall: $passed_checks/$total_checks checks passed"

    if [ $passed_checks -eq $total_checks ]; then
        echo -e "${GREEN}🎉 All validations passed! Docker setup is ready.${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Run: ./scripts/dev-setup.sh"
        echo "  2. Or manually: docker-compose up -d"
        return 0
    elif [ $passed_checks -gt $((total_checks / 2)) ]; then
        echo -e "${YELLOW}⚠️  Most validations passed. Minor issues detected.${NC}"
        echo ""
        echo "You can proceed with setup, but monitor for issues:"
        echo "  ./scripts/dev-setup.sh"
        return 1
    else
        echo -e "${RED}❌ Multiple validation failures. Please fix issues before proceeding.${NC}"
        return 1
    fi
}

check_network_conflicts() {
    log_info "Checking for Docker network conflicts..."

    if docker network ls | grep -q "tcg-network"; then
        log_warning "TCG network already exists (this may be from a previous setup)"
    else
        log_success "No network conflicts detected"
    fi

    return 0
}

# Main execution
main() {
    echo "🔍 TCG Tactique - Docker Setup Validation"
    echo "=========================================="

    # Change to project root
    cd "$PROJECT_ROOT"

    # Run validation summary
    show_validation_summary

    echo ""
    check_port_availability
    echo ""
    check_network_conflicts

    echo ""
    echo "For detailed setup instructions, see: DOCKER-GUIDE.md"
}

# Run main function
main "$@"