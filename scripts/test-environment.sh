#!/bin/bash

# TCG Tactique - Environment Test Script
# This script tests the complete environment functionality

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

# Test configuration
BACKEND_URL="http://localhost:5001"
FRONTEND_URL="http://localhost:3000"
TEST_TIMEOUT=30

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

test_database_connection() {
    log_info "Testing database connection and operations..."

    # Test basic connection
    if docker exec tcg-postgres-dev pg_isready -U tcg_user -d tcg_tactique > /dev/null 2>&1; then
        log_success "Database connection successful"
    else
        log_error "Database connection failed"
        return 1
    fi

    # Test query execution
    if docker exec tcg-postgres-dev psql -U tcg_user -d tcg_tactique -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Database queries working"
    else
        log_error "Database query execution failed"
        return 1
    fi

    # Test table existence (if migrations ran)
    local table_count=$(docker exec tcg-postgres-dev psql -U tcg_user -d tcg_tactique -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")

    if [ "$table_count" -gt 0 ]; then
        log_success "Database tables exist ($table_count tables)"
    else
        log_warning "No user tables found (migrations may not have run)"
    fi

    return 0
}

test_redis_connection() {
    log_info "Testing Redis connection and operations..."

    # Test basic connection
    if docker exec tcg-redis-dev redis-cli ping > /dev/null 2>&1; then
        log_success "Redis connection successful"
    else
        log_error "Redis connection failed"
        return 1
    fi

    # Test set/get operations
    local test_key="test:$(date +%s)"
    local test_value="test_value_$(date +%s)"

    if docker exec tcg-redis-dev redis-cli set "$test_key" "$test_value" > /dev/null 2>&1; then
        if docker exec tcg-redis-dev redis-cli get "$test_key" | grep -q "$test_value" 2>/dev/null; then
            log_success "Redis read/write operations working"
            # Clean up test key
            docker exec tcg-redis-dev redis-cli del "$test_key" > /dev/null 2>&1
        else
            log_error "Redis read operation failed"
            return 1
        fi
    else
        log_error "Redis write operation failed"
        return 1
    fi

    return 0
}

test_backend_endpoints() {
    log_info "Testing backend API endpoints..."

    local endpoints=(
        "/health:GET"
        "/health/status:GET"
    )

    local success_count=0
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint=$(echo "$endpoint_info" | cut -d: -f1)
        local method=$(echo "$endpoint_info" | cut -d: -f2)
        local url="$BACKEND_URL$endpoint"

        log_info "Testing $method $endpoint"

        if curl -f -s -X "$method" --max-time 10 "$url" > /dev/null 2>&1; then
            log_success "$method $endpoint - OK"
            ((success_count++))
        else
            log_error "$method $endpoint - FAILED"
        fi
    done

    if [ $success_count -eq ${#endpoints[@]} ]; then
        log_success "All backend endpoints working"
        return 0
    elif [ $success_count -gt 0 ]; then
        log_warning "Some backend endpoints working ($success_count/${#endpoints[@]})"
        return 1
    else
        log_error "No backend endpoints working"
        return 1
    fi
}

test_frontend_loading() {
    log_info "Testing frontend application loading..."

    # Test basic loading
    if curl -f -s --max-time 15 "$FRONTEND_URL" > /dev/null; then
        log_success "Frontend loads successfully"
    else
        log_error "Frontend failed to load"
        return 1
    fi

    # Test static assets
    local assets_response=$(curl -s --max-time 10 "$FRONTEND_URL" | grep -c "\(\.js\|\.css\)" || echo "0")
    if [ "$assets_response" -gt 0 ]; then
        log_success "Frontend assets are referenced ($assets_response assets)"
    else
        log_warning "No frontend assets found in HTML"
    fi

    return 0
}

test_hot_reload() {
    log_info "Testing hot reload functionality..."

    # Create a temporary test file in frontend
    local test_file="$PROJECT_ROOT/frontend/src/test-hot-reload.temp"
    local test_content="// Hot reload test file - $(date)"

    echo "$test_content" > "$test_file"

    # Wait for file system change detection
    sleep 3

    # Check if Vite detected the change (check logs)
    if docker logs tcg-frontend-dev --tail 20 2>&1 | grep -i "hmr\|hot\|reload\|update" > /dev/null; then
        log_success "Hot reload is working (change detected)"
    else
        log_warning "Hot reload detection unclear (check logs manually)"
    fi

    # Clean up test file
    rm -f "$test_file"

    return 0
}

test_networking() {
    log_info "Testing container networking..."

    # Test backend to database
    if docker exec tcg-backend-dev sh -c "nc -z postgres 5432" 2>/dev/null; then
        log_success "Backend can reach database"
    else
        log_error "Backend cannot reach database"
        return 1
    fi

    # Test backend to redis
    if docker exec tcg-backend-dev sh -c "nc -z redis 6379" 2>/dev/null; then
        log_success "Backend can reach Redis"
    else
        log_error "Backend cannot reach Redis"
        return 1
    fi

    # Test frontend to backend (via host)
    if docker exec tcg-frontend-dev sh -c "nc -z host.docker.internal 5001" 2>/dev/null; then
        log_success "Frontend can reach backend"
    else
        log_warning "Frontend to backend connection test failed (may be normal)"
    fi

    return 0
}

test_logging() {
    log_info "Testing logging functionality..."

    # Check if log files exist
    if [ -d "$PROJECT_ROOT/backend/logs" ]; then
        local log_files=$(find "$PROJECT_ROOT/backend/logs" -name "*.log" -type f | wc -l)
        if [ "$log_files" -gt 0 ]; then
            log_success "Backend log files created ($log_files files)"
        else
            log_warning "No backend log files found"
        fi
    else
        log_warning "Backend logs directory does not exist"
    fi

    # Check if containers are generating logs
    local backend_log_lines=$(docker logs tcg-backend-dev 2>&1 | wc -l)
    local frontend_log_lines=$(docker logs tcg-frontend-dev 2>&1 | wc -l)

    if [ "$backend_log_lines" -gt 10 ]; then
        log_success "Backend generating logs ($backend_log_lines lines)"
    else
        log_warning "Backend generating few logs ($backend_log_lines lines)"
    fi

    if [ "$frontend_log_lines" -gt 10 ]; then
        log_success "Frontend generating logs ($frontend_log_lines lines)"
    else
        log_warning "Frontend generating few logs ($frontend_log_lines lines)"
    fi

    return 0
}

test_performance() {
    log_info "Testing basic performance metrics..."

    # Test response times
    local backend_time=$(curl -o /dev/null -s -w "%{time_total}" "$BACKEND_URL/health" || echo "0")
    local frontend_time=$(curl -o /dev/null -s -w "%{time_total}" "$FRONTEND_URL" || echo "0")

    if (( $(echo "$backend_time < 2.0" | bc -l 2>/dev/null || echo "0") )); then
        log_success "Backend response time good (${backend_time}s)"
    else
        log_warning "Backend response time slow (${backend_time}s)"
    fi

    if (( $(echo "$frontend_time < 3.0" | bc -l 2>/dev/null || echo "0") )); then
        log_success "Frontend load time good (${frontend_time}s)"
    else
        log_warning "Frontend load time slow (${frontend_time}s)"
    fi

    # Check container resource usage
    local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" tcg-backend-dev | sed 's/%//' || echo "0")
    local mem_usage=$(docker stats --no-stream --format "{{.MemPerc}}" tcg-backend-dev | sed 's/%//' || echo "0")

    echo "Resource usage - CPU: ${cpu_usage}%, Memory: ${mem_usage}%"

    return 0
}

run_integration_tests() {
    log_info "Running integration tests..."

    # Test full user workflow simulation
    local test_user_email="test-$(date +%s)@example.com"
    local test_data='{"email":"'$test_user_email'","username":"testuser","password":"testpass123"}'

    # Test user registration (if endpoint exists)
    if curl -f -s -X POST -H "Content-Type: application/json" -d "$test_data" "$BACKEND_URL/api/auth/register" > /dev/null 2>&1; then
        log_success "User registration test passed"
    else
        log_warning "User registration test failed (endpoint may not exist)"
    fi

    # Test API rate limiting
    local rate_limit_passed=true
    for i in {1..10}; do
        if ! curl -f -s --max-time 1 "$BACKEND_URL/health" > /dev/null 2>&1; then
            if [ $i -gt 5 ]; then
                log_success "Rate limiting appears to be working"
                break
            fi
        fi
    done

    return 0
}

show_test_summary() {
    echo ""
    echo "🧪 Test Summary"
    echo "==============="

    local total_tests=8
    local passed_tests=0

    echo "Results:"

    # Run all tests and collect results
    if test_database_connection; then ((passed_tests++)); fi
    if test_redis_connection; then ((passed_tests++)); fi
    if test_backend_endpoints; then ((passed_tests++)); fi
    if test_frontend_loading; then ((passed_tests++)); fi
    if test_hot_reload; then ((passed_tests++)); fi
    if test_networking; then ((passed_tests++)); fi
    if test_logging; then ((passed_tests++)); fi
    if test_performance; then ((passed_tests++)); fi

    echo ""
    echo "Overall: $passed_tests/$total_tests tests passed"

    if [ $passed_tests -eq $total_tests ]; then
        echo -e "${GREEN}🎉 All tests passed! Environment is ready for development.${NC}"
        return 0
    elif [ $passed_tests -gt $((total_tests / 2)) ]; then
        echo -e "${YELLOW}⚠️  Most tests passed. Environment is mostly functional.${NC}"
        return 1
    else
        echo -e "${RED}❌ Many tests failed. Environment needs attention.${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo "🧪 TCG Tactique - Environment Testing"
    echo "====================================="

    # Check if environment is running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep "Up" > /dev/null; then
        log_error "Environment is not running. Please start with ./scripts/dev-setup.sh"
        exit 1
    fi

    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10

    # Run all tests
    show_test_summary

    echo ""
    echo "Additional tests:"
    run_integration_tests

    echo ""
    echo "For detailed logs, run: ./scripts/logs.sh"
    echo "For health monitoring, run: ./scripts/health-check.sh"
}

# Handle script interruption
trap 'log_error "Testing interrupted"; exit 1' INT TERM

# Run main function
main "$@"