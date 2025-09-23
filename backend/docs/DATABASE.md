# Database Setup - TCG Tactique

This project uses **Prisma** as the ORM with **PostgreSQL** as the database.

## Quick Start

```bash
# 1. Setup database connection
cp .env.example .env
# Edit DATABASE_URL in .env

# 2. Generate Prisma client
npm run db:generate

# 3. Run migrations to create tables
npm run db:migrate

# 4. Seed with test data
npm run db:seed
```

## Available Commands

```bash
# Database management
npm run db:migrate         # Run pending migrations
npm run db:reset           # Reset database (destructive!)
npm run db:seed            # Populate with test data
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio (database GUI)

# Development
npm run dev                # Start with auto-reload
npm run build              # Compile TypeScript
npm run test               # Run tests
```

## Schema Overview

### Core Tables

- **users** - Player accounts and authentication
- **active_cards** - Current card pool (240-360 cards in rotation)
- **decks** - Player-created decks (exactly 40 cards)
- **deck_cards** - Junction table for deck composition
- **games** - Game session records
- **game_states** - Real-time game state snapshots (JSONB)
- **user_stats** - Player performance statistics

### Key Constraints

- **Deck Validation**: Exactly 40 cards per deck
- **Card Limits**: Maximum 4 copies per card in deck
- **Faction Consistency**: All cards in deck must match faction
- **Game Integrity**: Winner must be one of the players
- **Statistics Validation**: Wins cannot exceed total games

## Usage Examples

### Basic Queries

```typescript
import { prisma } from './lib/database';

// Get all cards for a faction
const humanCards = await prisma.activeCard.findMany({
  where: { faction: 'humans' }
});

// Get deck with cards
const deck = await prisma.deck.findUnique({
  where: { id: deckId },
  include: {
    cards: {
      include: { card: true }
    }
  }
});

// Create new game
const game = await prisma.game.create({
  data: {
    player1Id: player1.id,
    player2Id: player2.id,
    player1DeckId: deck1.id,
    player2DeckId: deck2.id
  }
});
```

### Game State Management

```typescript
// Update game state (real-time)
await prisma.gameState.create({
  data: {
    gameId: game.id,
    player1Id: game.player1Id,
    player2Id: game.player2Id,
    currentPlayerId: currentPlayer.id,
    turn: turnNumber,
    phase: 'actions',
    boardStateJson: {
      player1: { /* player state */ },
      player2: { /* player state */ },
      // ... complete board state
    }
  }
});
```

### Statistics Tracking

```typescript
// Get player stats with win rates
const stats = await prisma.userStats.findUnique({
  where: { userId: player.id }
});

// Calculate win rate
const winRate = stats.totalGames > 0
  ? (stats.totalWins / stats.totalGames) * 100
  : 0;
```

## Database Schema Features

### 🏗️ Architecture
- **Type-safe** with full TypeScript integration
- **Relational integrity** with proper foreign keys
- **Performance optimized** with strategic indexes
- **ACID compliance** with transaction support

### 🎮 Game-Specific Features
- **Faction formations** encoded in game state
- **Quest system** for victory conditions
- **Card rotation** system for monthly updates
- **Real-time sync** using JSONB board state

### 📊 Analytics Ready
- **Comprehensive statistics** by faction
- **Game history** with detailed tracking
- **Performance metrics** for balancing
- **Meta analysis** capabilities

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tcg_db"

# Optional: Connection pooling
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=60000
```

## Development Workflow

### 1. Schema Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name describe_change
# 3. Update seed data if needed
# 4. Test migration
npm run db:reset
```

### 2. Production Deployment
```bash
# 1. Run migrations
npx prisma migrate deploy
# 2. Generate client
npx prisma generate
# 3. Optional: Seed production data
```

### 3. Debugging
```bash
# Open database GUI
npm run db:studio

# Check migration status
npx prisma migrate status

# View generated SQL
npx prisma migrate diff --preview-feature
```

## Performance Notes

### Optimized Queries
- **Card searches** by faction, type, cost (indexed)
- **Deck building** with efficient card lookups
- **Game history** with player-specific indexes
- **Real-time state** with JSONB for complex queries

### Scaling Considerations
- **Connection pooling** configured for production
- **Read replicas** ready for game state queries
- **Partitioning** possible for game history
- **Caching layer** integration points identified

## Troubleshooting

### Common Issues

**Migration fails:**
```bash
# Reset to clean state
npm run db:reset
# Or manually fix schema and retry
npx prisma migrate resolve --applied MIGRATION_NAME
```

**Prisma client out of sync:**
```bash
npm run db:generate
```

**Constraint violations:**
- Check deck card count (must be exactly 40)
- Verify faction consistency in deck
- Ensure card quantity limits (max 4 per card)

### Database Recovery
```bash
# Backup
pg_dump tcg_db > backup.sql

# Restore
psql tcg_db < backup.sql
```

## Security Notes

- **No sensitive data** in version control
- **Environment variables** for all credentials
- **Prepared statements** prevent SQL injection
- **Connection encryption** in production
- **Audit logging** available through Prisma