#!/bin/bash

# TCG Tactique - Log Viewer Script
# This script provides easy access to service logs

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

show_usage() {
    echo "TCG Tactique - Log Viewer"
    echo "========================"
    echo ""
    echo "Usage: $0 [SERVICE] [OPTIONS]"
    echo ""
    echo "Services:"
    echo "  all       - Show logs from all services"
    echo "  backend   - Show backend application logs"
    echo "  frontend  - Show frontend application logs"
    echo "  postgres  - Show PostgreSQL database logs"
    echo "  redis     - Show Redis cache logs"
    echo ""
    echo "Options:"
    echo "  -f, --follow    Follow logs in real-time"
    echo "  -t, --tail N    Show last N lines (default: 100)"
    echo "  -s, --since T   Show logs since timestamp (e.g., '1h', '30m', '2023-01-01')"
    echo "  -e, --errors    Show only error logs"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backend -f              # Follow backend logs"
    echo "  $0 all -t 50               # Show last 50 lines from all services"
    echo "  $0 postgres --since 1h     # Show postgres logs from last hour"
    echo "  $0 backend --errors        # Show only backend error logs"
    echo ""
}

get_container_name() {
    local service=$1
    case $service in
        "backend")
            echo "tcg-backend-dev"
            ;;
        "frontend")
            echo "tcg-frontend-dev"
            ;;
        "postgres")
            echo "tcg-postgres-dev"
            ;;
        "redis")
            echo "tcg-redis-dev"
            ;;
        *)
            echo ""
            ;;
    esac
}

check_service_exists() {
    local service=$1
    local container_name=$(get_container_name "$service")

    if [ -z "$container_name" ]; then
        return 1
    fi

    if docker ps --format "{{.Names}}" | grep -q "^$container_name$"; then
        return 0
    else
        return 1
    fi
}

show_service_logs() {
    local service=$1
    local follow=$2
    local tail_lines=$3
    local since=$4
    local errors_only=$5

    local container_name=$(get_container_name "$service")

    if [ -z "$container_name" ]; then
        log_error "Unknown service: $service"
        return 1
    fi

    if ! check_service_exists "$service"; then
        log_error "Service $service is not running"
        return 1
    fi

    log_info "Showing logs for $service ($container_name)"

    # Build docker logs command
    local cmd="docker logs"

    if [ "$follow" = true ]; then
        cmd="$cmd -f"
    fi

    if [ -n "$tail_lines" ]; then
        cmd="$cmd --tail $tail_lines"
    fi

    if [ -n "$since" ]; then
        cmd="$cmd --since $since"
    fi

    cmd="$cmd $container_name"

    # Add error filtering if requested
    if [ "$errors_only" = true ]; then
        cmd="$cmd 2>&1 | grep -i 'error\|exception\|fail\|fatal'"
    fi

    # Execute command
    echo "Executing: $cmd"
    echo "----------------------------------------"
    eval "$cmd" || log_warning "No matching logs found"
}

show_all_logs() {
    local follow=$1
    local tail_lines=$2
    local since=$3
    local errors_only=$4

    log_info "Showing logs from all services"

    # Build docker-compose logs command
    local cmd="docker-compose -f $COMPOSE_FILE logs"

    if [ "$follow" = true ]; then
        cmd="$cmd -f"
    fi

    if [ -n "$tail_lines" ]; then
        cmd="$cmd --tail=$tail_lines"
    fi

    if [ -n "$since" ]; then
        # docker-compose doesn't support --since, so we'll use docker logs individually
        log_warning "Using individual service logs for --since option"
        for service in backend frontend postgres redis; do
            if check_service_exists "$service"; then
                echo ""
                echo "=== $service ==="
                show_service_logs "$service" false "$tail_lines" "$since" "$errors_only"
            fi
        done
        return
    fi

    # Add error filtering if requested
    if [ "$errors_only" = true ]; then
        cmd="$cmd 2>&1 | grep -i 'error\|exception\|fail\|fatal'"
    fi

    # Execute command
    echo "Executing: $cmd"
    echo "----------------------------------------"
    eval "$cmd" || log_warning "No matching logs found"
}

show_log_summary() {
    log_info "Log Summary"
    echo "==========="

    local services=("backend" "frontend" "postgres" "redis")

    for service in "${services[@]}"; do
        if check_service_exists "$service"; then
            local container_name=$(get_container_name "$service")
            local log_count=$(docker logs "$container_name" 2>&1 | wc -l)
            local error_count=$(docker logs "$container_name" 2>&1 | grep -ic 'error\|exception\|fail\|fatal' || echo "0")

            echo "  $service: $log_count lines ($error_count errors)"
        else
            echo "  $service: not running"
        fi
    done
}

show_recent_errors() {
    log_info "Recent Errors (last 1 hour)"
    echo "============================"

    local services=("backend" "frontend" "postgres" "redis")

    for service in "${services[@]}"; do
        if check_service_exists "$service"; then
            echo ""
            echo "--- $service errors ---"
            show_service_logs "$service" false "100" "1h" true
        fi
    done
}

# Parse command line arguments
SERVICE=""
FOLLOW=false
TAIL_LINES="100"
SINCE=""
ERRORS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -t|--tail)
            TAIL_LINES="$2"
            shift 2
            ;;
        -s|--since)
            SINCE="$2"
            shift 2
            ;;
        -e|--errors)
            ERRORS_ONLY=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        all|backend|frontend|postgres|redis)
            if [ -z "$SERVICE" ]; then
                SERVICE="$1"
            else
                log_error "Multiple services specified"
                show_usage
                exit 1
            fi
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    # If no service specified, show summary and recent errors
    if [ -z "$SERVICE" ]; then
        show_log_summary
        echo ""
        show_recent_errors
        echo ""
        echo "Use '$0 --help' for more options"
        return
    fi

    # Show logs for specified service
    if [ "$SERVICE" = "all" ]; then
        show_all_logs "$FOLLOW" "$TAIL_LINES" "$SINCE" "$ERRORS_ONLY"
    else
        show_service_logs "$SERVICE" "$FOLLOW" "$TAIL_LINES" "$SINCE" "$ERRORS_ONLY"
    fi
}

# Handle script interruption
trap 'log_info "Log viewing interrupted"; exit 0' INT TERM

# Run main function
main "$@"