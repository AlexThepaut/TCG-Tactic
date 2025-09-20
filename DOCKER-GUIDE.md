# TCG Tactique - Docker Development Guide

Complete Docker development environment for the TCG Tactique project with hot reload, comprehensive monitoring, and automated setup.

## 🚀 Quick Start

### One-Command Setup
```bash
# Set up complete environment
./scripts/dev-setup.sh
```

### Individual Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Reset environment
./scripts/dev-reset.sh
```

## 📋 Prerequisites

- **Docker Desktop** 4.0+ (includes Docker Compose)
- **Git** (for cloning the repository)
- **Minimum Requirements:**
  - 4GB RAM available for Docker
  - 10GB free disk space
  - Ports 3000, 5001, 5432, 6379 available

### Installation Links
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/downloads)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   React + Vite  │◄──►│   Express + TS  │
│   Port: 3000    │    │   Port: 5001    │
└─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   PostgreSQL    │
         │              │   Port: 5432    │
         │              └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────┤     Redis       │
                        │   Port: 6379    │
                        └─────────────────┘
```

## 🛠️ Services

### Frontend (React + Vite)
- **URL:** http://localhost:3000
- **Hot Reload:** ✅ Enabled (1-3 seconds)
- **Features:** TailwindCSS, TypeScript, React 18
- **Volume:** Source code mounted for development
- **Health Check:** HTTP request to port 3000

### Backend (Express + TypeScript)
- **URL:** http://localhost:5001
- **Hot Reload:** ✅ Enabled with nodemon
- **Features:** Prisma ORM, Socket.io, JWT auth
- **Volume:** Source code and logs mounted
- **Health Check:** GET /health endpoint
- **Debug Port:** 9229 (for Node.js debugging)

### PostgreSQL Database
- **Port:** 5432
- **Database:** tcg_tactique
- **User:** tcg_user
- **Password:** tcg_password
- **Volume:** Persistent data storage
- **Health Check:** pg_isready command

### Redis Cache
- **Port:** 6379
- **Features:** Session storage, caching
- **Volume:** Persistent data storage
- **Health Check:** Redis PING command

## 📁 Project Structure

```
tcg-tactique/
├── docker-compose.yml           # Development services
├── docker-compose.prod.yml      # Production services
├── .env.example                 # Environment template
├── .env.production.example      # Production environment template
├── backend/
│   ├── Dockerfile.dev          # Development backend image
│   ├── Dockerfile.prod         # Production backend image
│   ├── .env.example            # Backend environment template
│   └── src/                    # Backend source code
├── frontend/
│   ├── Dockerfile.dev          # Development frontend image
│   ├── Dockerfile.prod         # Production frontend image
│   ├── .env.example            # Frontend environment template
│   └── src/                    # Frontend source code
└── scripts/
    ├── dev-setup.sh            # Complete environment setup
    ├── dev-reset.sh            # Reset environment
    ├── health-check.sh         # Service health validation
    ├── logs.sh                 # Log viewer utility
    └── test-environment.sh     # Environment testing
```

## 🔧 Environment Configuration

### Development (.env)
```bash
# Copy and customize
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Key Variables
- `OPENAI_API_KEY`: Required for card generation features
- `JWT_SECRET`: Authentication secret (auto-generated for dev)
- `CORS_ORIGIN`: Frontend URL for CORS (http://localhost:3000)

## 🚀 Development Commands

### Setup and Management
```bash
# Complete setup (recommended for first time)
./scripts/dev-setup.sh

# Start all services
docker-compose up -d

# Start with logs visible
docker-compose up

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend frontend
```

### Monitoring and Debugging
```bash
# Check service health
./scripts/health-check.sh

# View all logs
./scripts/logs.sh

# View specific service logs
./scripts/logs.sh backend -f
./scripts/logs.sh frontend --tail 100

# View error logs only
./scripts/logs.sh backend --errors

# Test environment functionality
./scripts/test-environment.sh
```

### Development Workflows
```bash
# Reset everything (clean slate)
./scripts/dev-reset.sh

# Quick restart after changes
docker-compose restart backend frontend

# Database operations
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
docker-compose exec backend npm run db:studio
```

## 🔄 Hot Reload

### Frontend Hot Reload
- **Technology:** Vite HMR (Hot Module Replacement)
- **Speed:** 1-3 seconds for most changes
- **Scope:** React components, styles, TypeScript files
- **Port:** 24678 (HMR WebSocket)

### Backend Hot Reload
- **Technology:** Nodemon with TypeScript compilation
- **Speed:** 2-5 seconds for server restart
- **Scope:** All TypeScript files in src/
- **Features:** Preserves database connections

### Troubleshooting Hot Reload
```bash
# If hot reload stops working
docker-compose restart frontend backend

# Check for file watching issues
docker-compose logs frontend | grep -i "hmr\|reload"
docker-compose logs backend | grep -i "restart\|nodemon"

# Force rebuild if needed
docker-compose up -d --build frontend backend
```

## 🏥 Health Monitoring

### Health Check Endpoints
- **Basic:** http://localhost:5001/health
- **Detailed:** http://localhost:5001/health/detailed
- **Database:** http://localhost:5001/health/db
- **Statistics:** http://localhost:5001/health/stats
- **Simple Status:** http://localhost:5001/health/status

### Automated Health Checks
```bash
# Run comprehensive health check
./scripts/health-check.sh

# Check specific aspects
curl http://localhost:5001/health
curl http://localhost:3000
```

### Container Health Status
```bash
# Check all container status
docker-compose ps

# Check container health
docker inspect tcg-backend-dev --format='{{.State.Health.Status}}'
docker inspect tcg-postgres-dev --format='{{.State.Health.Status}}'
```

## 📊 Logging

### Log Management
```bash
# View recent logs from all services
./scripts/logs.sh

# Follow logs in real-time
./scripts/logs.sh all -f

# View last 50 lines from backend
./scripts/logs.sh backend -t 50

# View logs since 1 hour ago
./scripts/logs.sh backend --since 1h

# View only error logs
./scripts/logs.sh backend --errors
```

### Log Locations
- **Backend Logs:** `backend/logs/` (mounted volume)
- **Container Logs:** Available via `docker logs` command
- **Database Logs:** Available via `docker logs tcg-postgres-dev`

## 🧪 Testing

### Environment Testing
```bash
# Run comprehensive environment tests
./scripts/test-environment.sh

# Manual testing
curl http://localhost:5001/health
curl http://localhost:3000
```

### Test Coverage
- ✅ Database connectivity and queries
- ✅ Redis connectivity and operations
- ✅ Backend API endpoints
- ✅ Frontend application loading
- ✅ Hot reload functionality
- ✅ Container networking
- ✅ Log generation
- ✅ Performance metrics

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5001
lsof -i :5432

# Stop conflicting services
docker-compose down
pkill -f "node.*3000"
```

#### Database Connection Issues
```bash
# Check database status
docker-compose ps postgres
docker-compose logs postgres

# Reset database
docker-compose down
docker volume rm tcg-postgres-data-dev
docker-compose up -d postgres
```

#### Hot Reload Not Working
```bash
# Restart development services
docker-compose restart frontend backend

# Check file watching
docker-compose logs frontend | grep -i "watching"

# Rebuild if necessary
docker-compose up -d --build frontend backend
```

#### Memory Issues
```bash
# Check Docker memory usage
docker system df
docker stats

# Clean up unused resources
docker system prune -f
docker volume prune -f
```

### Recovery Commands
```bash
# Nuclear option: complete reset
./scripts/dev-reset.sh

# Selective reset: just containers
docker-compose down --remove-orphans
docker-compose up -d --build

# Database reset only
docker-compose down
docker volume rm tcg-postgres-data-dev tcg-redis-data-dev
docker-compose up -d
```

## 🚀 Performance Optimization

### Development Performance
- **Backend:** Uses named volumes for node_modules (faster installs)
- **Frontend:** Vite with optimized HMR configuration
- **Database:** Optimized PostgreSQL settings for development
- **Redis:** Memory-optimized configuration

### Resource Usage Monitoring
```bash
# Check container resource usage
docker stats

# Check system resource usage
./scripts/health-check.sh
```

## 🔐 Security

### Development Security
- ✅ Non-root users in containers
- ✅ Proper file permissions
- ✅ Environment variable isolation
- ✅ Network isolation via Docker networks
- ✅ Security headers in production nginx config

### Production Security
- ✅ Multi-stage builds (smaller images)
- ✅ Production-optimized configurations
- ✅ SSL/TLS ready nginx configuration
- ✅ Rate limiting and security headers
- ✅ Log rotation and management

## 📚 Additional Resources

### Useful Commands Reference
```bash
# Database operations
docker-compose exec postgres psql -U tcg_user -d tcg_tactique

# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# View network information
docker network ls
docker network inspect tcg-network-dev

# Volume management
docker volume ls
docker volume inspect tcg-postgres-data-dev
```

### API Endpoints
- **Health Check:** GET /health
- **Database Health:** GET /health/db
- **Detailed Health:** GET /health/detailed
- **Statistics:** GET /health/stats
- **API Documentation:** Available when implemented

### Development URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Database:** localhost:5432 (via psql or database client)
- **Redis:** localhost:6379 (via redis-cli)

## 🤝 Contributing

When working with the Docker environment:

1. **Start with setup:** Always run `./scripts/dev-setup.sh` for first-time setup
2. **Check health:** Use `./scripts/health-check.sh` when issues arise
3. **Monitor logs:** Use `./scripts/logs.sh` for debugging
4. **Test changes:** Run `./scripts/test-environment.sh` before committing
5. **Clean up:** Use `./scripts/dev-reset.sh` for fresh starts

## 📞 Support

If you encounter issues:

1. **Check this guide** for common solutions
2. **Run health check:** `./scripts/health-check.sh`
3. **Check logs:** `./scripts/logs.sh`
4. **Reset environment:** `./scripts/dev-reset.sh`
5. **Test environment:** `./scripts/test-environment.sh`

For persistent issues, collect the output of the health check and logs before seeking help.