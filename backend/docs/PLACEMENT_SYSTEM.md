# Unit Placement System - TCG Tactique

## Overview

The Unit Placement System is the core gameplay mechanic that allows players to strategically place units on a 3×5 tactical grid. This system enforces faction-specific formations, manages resources, validates moves in real-time, and synchronizes game state across all players.

## Architecture

### Core Components

1. **PlacementService** - Main service handling validation and execution
2. **GameStateService** - Manages persistent game state with caching
3. **GameValidationService** - Comprehensive validation rules
4. **Socket.io Handlers** - Real-time placement event handling
5. **REST API** - Placement validation and information endpoints

### Database Schema

```sql
-- Game actions tracking for replay and debugging
CREATE TABLE "game_actions" (
    "id" TEXT PRIMARY KEY,
    "game_id" INTEGER NOT NULL,
    "game_state_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "action_type" VARCHAR(30) NOT NULL,
    "action_data" JSONB NOT NULL,
    "game_state_before" JSONB,
    "game_state_after" JSONB,
    "turn" INTEGER NOT NULL DEFAULT 1,
    "phase" GamePhase NOT NULL DEFAULT 'actions',
    "resource_cost" INTEGER NOT NULL DEFAULT 0,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validation_errors" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Faction Formations

### Humans - "Tactical Phalanx"
```
-XXX-
-XXX-
-XXX-
```
- **Valid Positions**: 9 (3×3 center formation)
- **Strategy**: Disciplined, coordinated units in tight formation
- **Passive**: Ultimate Rampart - Complete lines get +2 ATK/+1 HP

### Aliens - "Living Swarm"
```
-XXX-
XXXXX
--X--
```
- **Valid Positions**: 9 (adaptive spread formation)
- **Strategy**: Evolutionary adaptation and flexibility
- **Passive**: Dead aliens reduce next summon cost by 1

### Robots - "Immortal Army"
```
XXXXX
--X--
-XXX-
```
- **Valid Positions**: 9 (technological superiority formation)
- **Strategy**: Persistent advance with resurrection capabilities
- **Passive**: 30% chance to resurrect with 1 HP

## API Endpoints

### REST API

#### GET `/api/placement/formations`
Returns faction formation patterns and passive abilities.

```json
{
  "success": true,
  "formations": {
    "humans": {
      "name": "Tactical Phalanx",
      "pattern": [[false, true, true, true, false], ...],
      "validPositions": [{"row": 0, "col": 1}, ...],
      "passiveAbility": {
        "name": "Ultimate Rampart",
        "description": "Complete lines get +2 ATK/+1 HP"
      }
    }
  }
}
```

#### POST `/api/placement/validate`
Validates a placement without executing it.

```json
{
  "gameId": "game_123_456",
  "cardId": "card_789",
  "position": {"row": 0, "col": 1}
}
```

#### GET `/api/placement/game/:gameId/state`
Returns current placement state for authenticated player.

### Socket.io Events

#### Client → Server

**`game:place_unit`**
```typescript
{
  cardId: string;
  handIndex: number;
  position: { x: number; y: number };
}
```

#### Server → Client

**`game:action_performed`**
```typescript
{
  id: string;
  playerId: string;
  type: 'place_unit';
  data: PlaceUnitActionData;
  timestamp: Date;
}
```

**`game:state_update`**
```typescript
{
  gameState: GameState;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
}
```

## Validation Rules

### Pre-Placement Validation

1. **Game State Validation**
   - Game must be active
   - Must be current player's turn
   - Must be in 'actions' phase
   - Player must be able to act

2. **Card Validation**
   - Card must exist in player's hand
   - Card must be a unit (not spell)
   - Player must have sufficient resources

3. **Position Validation**
   - Position must be within grid bounds (0-2 rows, 0-4 cols)
   - Position must be valid for player's faction formation
   - Position must not be occupied

4. **Resource Validation**
   - Available resources = total - spent
   - Must have enough resources for card cost
   - Resource cost cannot exceed maximum (10)

### Error Codes

- `INVALID_POSITION` - Position outside grid bounds
- `INSUFFICIENT_RESOURCES` - Not enough Void Echoes
- `NOT_YOUR_TURN` - Not current player
- `INVALID_CARD` - Card not found or invalid
- `POSITION_OCCUPIED` - Grid position already has a unit
- `INVALID_FORMATION_POSITION` - Position not valid for faction
- `GAME_NOT_ACTIVE` - Game not in active state
- `NOT_UNIT_CARD` - Trying to place a spell card

## Performance Requirements

### Response Times
- **Placement Validation**: <50ms
- **Database Operations**: <100ms
- **State Synchronization**: <100ms
- **Socket.io Events**: <50ms

### Scalability
- **Concurrent Games**: 1000+ active games
- **Players per Game**: 2 players + spectators
- **Actions per Second**: 100+ validations/placements
- **Memory Usage**: <100MB for 1000 games

## Usage Examples

### Validating a Placement

```typescript
import { placementService } from '../services/placementService';

const validation = await placementService.validatePlacement(
  'game_123_456',
  1, // playerId
  'card_789',
  { row: 0, col: 1 }
);

if (validation.canPlace) {
  console.log(`Can place card for ${validation.resourceCost} resources`);
} else {
  console.log(`Cannot place: ${validation.errors[0]?.message}`);
}
```

### Executing a Placement

```typescript
const result = await placementService.executePlacement(
  'game_123_456',
  1, // playerId
  'card_789',
  { row: 0, col: 1 }
);

if (result.success) {
  console.log('Unit placed successfully!');
  console.log('Updated game state:', result.gameState);
} else {
  console.log('Placement failed:', result.error);
}
```

### Real-time Socket Integration

```typescript
// Client-side
socket.emit('game:place_unit', {
  cardId: 'card_789',
  handIndex: 0,
  position: { x: 0, y: 1 }
}, (response) => {
  if (response.success) {
    console.log('Unit placed successfully');
  } else {
    console.log('Placement failed:', response.error);
  }
});

// Listen for state updates
socket.on('game:state_update', (gameState) => {
  updateGameBoard(gameState);
});
```

## Testing

### Unit Tests
- **Formation Validation**: All faction patterns tested
- **Resource Management**: Cost calculations and deduction
- **Error Handling**: All error codes and edge cases
- **Integration**: Database persistence and state updates

### Performance Tests
- **Load Testing**: 1000+ concurrent validations
- **Memory Testing**: No memory leaks during extended play
- **Response Time**: All operations under performance thresholds

### Integration Tests
- **Real-time Flow**: Complete placement flow with Socket.io
- **Database Consistency**: State persistence and rollback
- **Concurrent Operations**: Optimistic locking validation

## Security Considerations

### Validation Security
- All validation performed server-side
- Client inputs sanitized and validated
- Turn order strictly enforced
- Resource calculations server-authoritative

### Authentication
- Socket connections require authentication
- Player permissions validated for each action
- Game access restricted to participants

### Data Integrity
- Atomic state updates with rollback capability
- Optimistic locking prevents race conditions
- Action logging for audit trails and debugging

## Monitoring and Debugging

### Logging
- Comprehensive action logging to database
- Performance metrics for all operations
- Error tracking with stack traces
- Game state snapshots for debugging

### Metrics
- Placement success/failure rates
- Average response times
- Resource usage patterns
- Popular faction formations

### Debug Tools
- Game state inspection endpoints
- Action replay capability
- Performance profiling integration
- Real-time monitoring dashboard

## Future Enhancements

### Planned Features
1. **Undo/Redo System** - Allow players to undo recent actions
2. **AI Placement Hints** - Suggest optimal placement positions
3. **Batch Placement** - Allow multiple units placed simultaneously
4. **Formation Variants** - Alternative formations for each faction
5. **Spectator Mode** - Real-time viewing for non-players

### Performance Optimizations
1. **Caching Strategy** - Cache formation patterns and validations
2. **Connection Pooling** - Optimize database connections
3. **State Compression** - Compress large game states
4. **Predictive Loading** - Pre-validate likely moves

## Configuration

### Environment Variables
```bash
# Performance tuning
PLACEMENT_VALIDATION_TIMEOUT=5000
PLACEMENT_CACHE_SIZE=1000
PLACEMENT_CACHE_TTL=3600000

# Feature flags
ENABLE_PLACEMENT_HINTS=true
ENABLE_BATCH_PLACEMENT=false
ENABLE_UNDO_SYSTEM=false

# Monitoring
ENABLE_PLACEMENT_METRICS=true
PLACEMENT_LOG_LEVEL=info
```

### Service Configuration
```typescript
// services/placementService.ts configuration
const PLACEMENT_CONFIG = {
  VALIDATION_TIMEOUT: 5000,
  MAX_CONCURRENT_OPERATIONS: 100,
  CACHE_SIZE: 1000,
  PERFORMANCE_MONITORING: true
};
```