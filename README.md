# TCG Tactique

A tactical card game with real-time multiplayer gameplay and AI-generated monthly card rotations. Built with modern web technologies for cross-platform compatibility.

## 🎮 Game Overview

**TCG Tactique** is a strategic card game featuring:

- **Grid-based Combat**: 3×5 tactical grids with faction-specific formations
- **Three Unique Factions**: Humans (discipline), Aliens (evolution), Robots (persistence)
- **Quest Victory System**: 3 victory conditions per faction instead of traditional health points
- **Monthly Card Rotation**: 120 new AI-generated cards monthly, 360-card active pool
- **Real-time Multiplayer**: Synchronized gameplay via Socket.io

## 🏗️ Architecture

### Technology Stack

**Backend**
- Node.js + Express with TypeScript
- Socket.io for real-time communication
- PostgreSQL for persistent data
- Redis for caching and sessions
- ChatGPT API for card generation

**Frontend**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Socket.io Client for real-time features

**Infrastructure**
- Docker + Docker Compose
- Multi-stage builds for development and production
- Nginx for production frontend serving

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd tcg-tactique
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start Development Environment

```bash
# Start all services with Docker Compose
npm run dev

# Or start in detached mode
npm run dev:detached
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Install Dependencies (Optional for local development)

```bash
npm run install:all
```

## 📋 Available Scripts

### Development

```bash
npm run dev              # Start all services
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
npm run logs             # View all logs
npm run logs:backend     # Backend logs only
npm run logs:frontend    # Frontend logs only
```

### Building

```bash
npm run build           # Build both projects
npm run build:backend   # Backend build
npm run build:frontend  # Frontend build
```

### Testing

```bash
npm run test            # Run all tests
npm run test:backend    # Backend tests
npm run test:frontend   # Frontend tests
```

### Quality Assurance

```bash
npm run lint            # Lint all code
npm run typecheck       # TypeScript checks
```

### Database

```bash
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed with test data
npm run db:reset        # Reset database
```

### Maintenance

```bash
npm run clean           # Stop and remove containers/volumes
npm run reset           # Clean and rebuild everything
```

### Production

```bash
npm run prod:build      # Build production images
npm run prod:up         # Start production environment
npm run prod:down       # Stop production environment
```

## 🐳 Docker Configuration

### Development

The development setup uses Docker Compose with:
- **Hot reload** for both frontend and backend
- **Volume mounts** for live code updates
- **Health checks** for service dependencies
- **Network isolation** with inter-service communication

### Production

Production configuration includes:
- **Multi-stage builds** for optimized images
- **Nginx** for static file serving and proxying
- **Security headers** and compression
- **Non-root users** for enhanced security

## 📁 Project Structure

```
tcg-tactique/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript types
│   ├── tests/              # Backend tests
│   ├── scripts/            # Utility scripts
│   ├── Dockerfile          # Backend container
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   ├── Dockerfile          # Frontend container
│   └── package.json
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
└── package.json           # Root package with scripts
```

## 🎮 Game Mechanics

### Factions & Formations

**Humans - Tactical Phalanx**
```
-xxx-
-xxx-
-xxx-
```
- Passive: Complete lines get +2 ATK/+1 HP

**Aliens - Living Swarm**
```
-xxx-
xxxxx
--x--
```
- Passive: Dead aliens reduce next summon cost by 1

**Robots - Immortal Army**
```
xxxxx
--x--
-xxx-
```
- Passive: 30% chance to resurrect with 1 HP

### Victory Conditions

Each faction has 3 unique victory quests chosen secretly at game start:
- **Territorial Control**: Dominate specific grid areas
- **Elimination Quotas**: Destroy certain numbers/types of units
- **Synergy Achievements**: Activate faction-specific combinations

## 🔧 Development

### Environment Variables

Copy the example environment files and configure:

**Backend** (`backend/.env`)
- Database connection settings
- JWT secrets for authentication
- OpenAI API key for card generation
- Socket.io configuration

**Frontend** (`frontend/.env`)
- API endpoint URLs
- Feature flags
- Game configuration values

### Database Setup

The database is automatically initialized with Docker Compose. For manual setup:

```bash
cd backend
npm run db:migrate  # Apply schema migrations
npm run db:seed     # Add initial data
```

### Hot Reload

Both frontend and backend support hot reload in development:
- **Frontend**: Vite's fast HMR
- **Backend**: Nodemon with TypeScript compilation

### Socket.io Events

The game uses Socket.io for real-time communication:

```typescript
// Game Events
'game:create'       // Create new game
'game:join'         // Join existing game
'game:place_unit'   // Place card on grid
'game:attack'       // Attack between units
'game:end_turn'     // End player turn
'game:state_update' // Broadcast state changes

// Matchmaking Events
'matchmaking:join'   // Join queue
'matchmaking:found'  // Match found
'matchmaking:cancel' // Leave queue
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Frontend Testing

```bash
cd frontend
npm test              # Run all tests
npm run test:ui       # Visual test runner
npm run test:coverage # Coverage report
```

### Integration Testing

End-to-end tests verify:
- Real-time game synchronization
- Socket.io event handling
- Database transactions
- Authentication flows

## 📈 Performance

### Development Targets

- **Setup Time**: < 10 minutes for new developers
- **Build Time**: < 2 minutes for full stack
- **Hot Reload**: < 2 seconds for changes

### Production Optimizations

- **Code Splitting**: Automatic chunk optimization
- **Image Optimization**: WebP format with fallbacks
- **Compression**: Gzip for all text assets
- **Caching**: Strategic cache headers

## 🔐 Security

### Development Security

- **Non-root containers**: All services run as non-root users
- **Environment isolation**: Secrets in environment variables
- **CORS configuration**: Restricted to development origins

### Production Security

- **Helmet.js**: Security headers middleware
- **Rate limiting**: Configurable request throttling
- **JWT authentication**: Secure session management
- **Input validation**: Joi schema validation

## 🚀 Deployment

### Development Deployment

```bash
docker-compose up -d
```

### Production Deployment

```bash
# Build production images
npm run prod:build

# Start production environment
npm run prod:up
```

### Environment-Specific Configuration

- **Development**: Volume mounts, debug logging, seed data
- **Production**: Optimized builds, security headers, monitoring

## 🤝 Contributing

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and Node.js
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages

### Development Workflow

1. **Feature Branch**: Create from `main`
2. **Development**: Use `npm run dev` for hot reload
3. **Testing**: Run `npm run test` before commits
4. **Quality**: Use `npm run lint` and `npm run typecheck`
5. **Pull Request**: Submit for review

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Port Conflicts**
```bash
# Check if ports are in use
lsof -i :3000 -i :5001 -i :5432 -i :6379

# Stop conflicting services
npm run clean
```

**Database Connection Issues**
```bash
# Reset database
npm run db:reset

# Check PostgreSQL logs
npm run logs postgres
```

**Hot Reload Not Working**
```bash
# Restart development environment
npm run reset
```

### Logs and Debugging

```bash
# View all service logs
npm run logs

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Performance Issues

```bash
# Check container resource usage
docker stats

# Analyze bundle size
cd frontend && npm run analyze
```

## 📞 Support

For issues and questions:
- Check existing GitHub issues
- Create new issue with reproduction steps
- Include logs and environment details

---

**Ready to play? Start your development environment and build the next generation of tactical card games!** 🎯