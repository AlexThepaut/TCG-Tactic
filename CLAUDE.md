# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TCG Tactique** is a tactical card game with real-time multiplayer gameplay and AI-generated monthly card rotations. It's being developed as a prototype-first approach using a modern web stack with plans for potential Godot migration later.

### Key Game Mechanics
- **Grid-based combat**: 3×5 tactical grid per player with faction-specific formations
- **Three factions**: Humans (discipline/coordination), Aliens (evolution/adaptation), Robots (persistence/technology)
- **Quest system**: 3 victory conditions per faction instead of traditional health points
- **Monthly rotation**: 120 new AI-generated cards each month, 360-card active pool
- **Real-time multiplayer**: Synchronized gameplay via Socket.io

## Technology Stack

### Backend
- **Node.js + Express** with TypeScript
- **Socket.io** for real-time communication (primary communication method)
- **PostgreSQL** for persistent data
- **Redis** for caching and session management
- **ChatGPT 3.5 API** for card generation

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Socket.io Client** for real-time features

### Infrastructure
- **Docker + Docker Compose** for development and deployment
- All services containerized

## Development Commands

Since this is a documentation-only project currently, actual build commands will be created during development. The planned structure includes:

```bash
# Development (when implemented)
npm run dev              # Start both frontend and backend in development
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Production (when implemented)
npm run build           # Build both frontend and backend
npm run build:backend   # Backend build
npm run build:frontend  # Frontend build

# Database (when implemented)
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with test data

# Docker
docker-compose up -d    # Start all services
docker-compose down     # Stop all services

# Card generation (when implemented)
npm run generate:cards  # Generate new cards via AI
npm run rotate:pool     # Perform monthly rotation
npm run analyze:meta    # Analyze current meta
```

## Architecture Principles

### Communication Strategy
- **Socket.io first**: Use WebSocket events for all game interactions, not REST API
- **Real-time sync**: All game state changes broadcast to players immediately
- **Event-driven**: Game logic based on Socket events (game:place_unit, game:attack, etc.)

### Game State Management
```typescript
interface GameState {
  id: string;
  players: {
    player1: PlayerData;
    player2: PlayerData;
  };
  currentPlayer: string;
  turn: number;
  phase: 'resources' | 'draw' | 'actions';
  gameOver: boolean;
  winner?: string;
}

interface PlayerData {
  id: string;
  faction: 'humans' | 'aliens' | 'robots';
  hand: Card[];
  board: (Card | null)[][];  // 3x5 grid
  resources: number;         // Void Echoes (0-10)
  questId: string;          // Secret victory condition
}
```

### Database Schema Key Tables
- **active_cards**: Current 360-card pool (rotation managed)
- **decks**: User-created decks (exactly 40 cards, single faction)
- **games**: Game history and state
- **game_logs**: Detailed action logs for AI analysis
- **user_stats**: Performance tracking by faction

## Faction-Specific Mechanics

### Formations (Playable Grid Positions)
```
Humans - "Tactical Phalanx":    Aliens - "Living Swarm":     Robots - "Immortal Army":
-xxx-                           -xxx-                        xxxxx
-xxx-                           xxxxx                        --x--
-xxx-                           --x--                        -xxx-
```

### Passive Powers
- **Humans**: Complete lines get +2 ATK/+1 HP ("Ultimate Rampart")
- **Aliens**: Dead aliens reduce next summon cost by 1 ("Evolutionary Adaptation")
- **Robots**: 30% chance to resurrect with 1 HP ("Reanimation Protocols")

### Victory Conditions (Quests)
Each faction has 3 unique victory conditions chosen secretly at game start, ranging from territorial control to elimination quotas to synergy achievements.

## Development Workflow

### Progressive Development Approach
The project follows an incremental development strategy:

1. **Core Game Engine**: Basic placement, combat, turns with Socket.io
2. **Deck Builder**: 40-card deck construction with validation
3. **Matchmaking**: Real-time multiplayer with authentication
4. **Quest System**: Victory conditions implementation
5. **UI Polish**: Visual improvements and statistics
6. **AI Generation**: ChatGPT integration for monthly rotations

### Socket.io Events
All game interactions use Socket.io events instead of REST API:
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

## Testing Strategy

### Key Testing Areas
- **Game Logic**: Unit placement validation, combat resolution, turn management
- **Real-time Sync**: Socket.io event handling and state synchronization
- **Deck Validation**: 40-card limit, faction consistency, max 2 per card
- **Quest Completion**: All 9 victory conditions function correctly
- **AI Generation**: Generated cards are valid and balanced

### User Testing Approach
Each development phase includes user testing with real players to validate gameplay mechanics and user experience before proceeding to the next phase.

## AI Card Generation

### Monthly Rotation System
- **Generation**: 160 new cards monthly via ChatGPT 3.5
- **Validation**: Automated balance checking against existing cards
- **Rotation**: 3-month overlap (360 total active cards)
- **Analysis**: Meta analysis feeds back into next generation

### Card Balance Constraints
- **Faction Distribution**: 40 cards per faction per set
- **Type Balance**: 90 units, 30 spells per set
- **Cost Curve**: Distributed across 1-10 Void Echoes
- **Power Level**: Avoid combos exceeding 60% win rate

## File Organization

### Expected Structure (when implemented)
```
tcg-tactique/
├── backend/
│   ├── src/
│   │   ├── models/        # Database models
│   │   ├── services/      # Game logic (gameService, deckService, etc.)
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Authentication, validation
│   │   └── utils/         # Helper functions
│   └── scripts/           # Card generation, rotation automation
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # Socket.io client, API calls
│   │   ├── hooks/         # Custom React hooks (useSocket, etc.)
│   │   └── types/         # TypeScript type definitions
└── docs/                  # Game documentation (current)
```

## Important Notes

- **Landscape Orientation**: Game designed exclusively for landscape mode (PC, mobile, web)
- **No Collection System**: All players have access to same 360-card pool (equality focus)
- **Prototype First**: Prioritize working gameplay over polish initially
- **Socket.io Primary**: Avoid REST API for game actions, use real-time events
- **Faction Identity**: Maintain distinct playstyles and thematic consistency
- **French Documentation**: Game documentation is in French, but code should be in English

## Current Status

This is a documentation and planning repository. No code has been implemented yet. Development will begin with Task 1 (Core Game Engine) using the detailed development plan in `tasks/task-1-detailled.md`.