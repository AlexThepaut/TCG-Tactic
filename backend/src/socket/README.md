# Socket.io Infrastructure Implementation

## Overview

This document describes the comprehensive Socket.io infrastructure implemented for TCG Tactique real-time multiplayer communication. The implementation provides production-ready WebSocket communication with authentication, game management, matchmaking, and comprehensive error handling.

## Architecture

### Core Components

1. **SocketServer** (`src/socket/socketServer.ts`)
   - Main Socket.io server with Express integration
   - CORS configuration for frontend communication
   - Connection management and health monitoring
   - Graceful shutdown handling

2. **Authentication Middleware** (`src/middleware/socketAuth.ts`)
   - JWT token validation for WebSocket connections
   - User session management and data attachment
   - Rate limiting to prevent abuse
   - Permission validation for game actions

3. **Event Handlers**
   - **Connection Handlers** (`src/socket/handlers/connectionHandlers.ts`)
   - **Game Handlers** (`src/socket/handlers/gameHandlers.ts`)
   - **Matchmaking Handlers** (`src/socket/handlers/matchmakingHandlers.ts`)

4. **Type System** (`src/types/socket.ts`)
   - Comprehensive TypeScript interfaces for all Socket.io events
   - Type-safe client-server communication
   - Game state and player data structures

## Features Implemented

### 🔐 Authentication & Security
- JWT token validation for all socket connections
- Rate limiting (configurable requests per second)
- Permission validation for game actions
- Guest connection support (limited functionality)
- Session tracking and management

### 🎮 Game Management
- **Game Creation**: Create new game sessions with custom configuration
- **Game Joining**: Join existing games with validation
- **Real-time Actions**: Place units, attack, cast spells, end turns
- **Turn Management**: Automatic turn switching with timeouts
- **Game State Sync**: Real-time game state broadcasting
- **Surrender/Leave**: Graceful game exit handling

### 🔍 Matchmaking System
- **Queue Management**: Multiple queue types (casual/ranked, different time limits)
- **Player Matching**: FIFO matching with future rating-based improvements
- **Queue Status**: Real-time queue position and wait time updates
- **Match Creation**: Automatic game creation when players are matched
- **Timeout Handling**: Queue timeout and re-queuing logic

### 📡 Connection Management
- **Session Tracking**: Active user sessions with reconnection support
- **Room Management**: Game rooms for players and spectators
- **Disconnect Handling**: Graceful disconnection with reconnection windows
- **Activity Monitoring**: Track user activity for session management

### 🏥 Health Monitoring
- **Real-time Statistics**: Connection counts, game metrics, queue status
- **Health Endpoints**: Dedicated health checks for monitoring
- **Performance Tracking**: Memory usage, uptime, latency monitoring
- **Cleanup Tasks**: Automatic cleanup of stale connections and rooms

## API Reference

### Client to Server Events

#### Authentication
```typescript
'auth:authenticate': (token: string, callback: (response: AuthResponse) => void)
```

#### Game Management
```typescript
'game:create': (config: GameCreateConfig, callback: (response: GameResponse) => void)
'game:join': (gameId: string, callback: (response: GameResponse) => void)
'game:leave': (callback: (response: BasicResponse) => void)
'game:ready': (callback: (response: BasicResponse) => void)
```

#### Game Actions
```typescript
'game:place_unit': (data: PlaceUnitData, callback: (response: GameActionResponse) => void)
'game:attack': (data: AttackData, callback: (response: GameActionResponse) => void)
'game:cast_spell': (data: CastSpellData, callback: (response: GameActionResponse) => void)
'game:end_turn': (callback: (response: GameActionResponse) => void)
'game:surrender': (callback: (response: BasicResponse) => void)
```

#### Matchmaking
```typescript
'matchmaking:join': (data: MatchmakingJoinData, callback: (response: MatchmakingResponse) => void)
'matchmaking:leave': (callback: (response: BasicResponse) => void)
'matchmaking:status': (callback: (response: MatchmakingStatusResponse) => void)
```

### Server to Client Events

#### Game Updates
```typescript
'game:state_update': (gameState: GameState)
'game:player_joined': (player: PlayerData)
'game:action_performed': (action: GameAction)
'game:turn_changed': (currentPlayer: string, timeRemaining: number)
'game:game_over': (result: GameResult)
```

#### Matchmaking Updates
```typescript
'matchmaking:queue_update': (position: number, estimatedWait: number)
'matchmaking:match_found': (gameId: string, opponent: PlayerData)
'matchmaking:cancelled': (reason: string)
```

#### Connection Events
```typescript
'connection:established': (sessionId: string)
'connection:player_reconnected': (playerId: string)
'connection:player_disconnected': (playerId: string, timeout: number)
```

## Configuration

### Environment Variables
```env
# Socket.io inherits from existing environment configuration
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development|production
```

### CORS Configuration
- Automatically configured to allow frontend URL
- Development mode allows localhost with any port
- Production mode restricts to specific origins

### Rate Limiting
- Default: 30 requests per second in production, 100 in development
- Configurable per-socket rate limiting
- Prevents spam and abuse

## Health Monitoring

### Health Endpoints

#### Socket.io Health Check
```http
GET /health/socket
```
Returns:
- Socket.io server status
- Active connections count
- Room statistics
- Memory usage
- Matchmaking queue status
- Active game sessions

#### Detailed Health Check
```http
GET /health/detailed
```
Includes Socket.io status in comprehensive health report.

### Monitoring Metrics
- **Connection Statistics**: Total, active, authenticated connections
- **Game Metrics**: Active games, players in game, spectators
- **Matchmaking Metrics**: Queue sizes, average wait times
- **Performance Metrics**: Memory usage, uptime, cleanup statistics

## Integration

### Express Integration
```typescript
// In server.ts
import { SocketServer } from './socket/socketServer';

const httpServer = createServer(app);
const socketServer = new SocketServer(httpServer);

// Attach for health checks
(app as any).socketServer = socketServer;
```

### Database Integration
- Ready for database service integration
- Game state persistence planned
- User session storage planned
- Action logging for replay/analysis

### Frontend Integration
```typescript
// Frontend usage example
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  auth: { token: userJWTToken }
});

socket.on('connect', () => {
  console.log('Connected to game server');
});

socket.emit('game:create', gameConfig, (response) => {
  if (response.success) {
    console.log('Game created:', response.gameId);
  }
});
```

## Development

### Running the Server
```bash
npm run dev  # Development with auto-reload
npm start    # Production mode
```

### Testing
```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Type Checking
```bash
npm run typecheck  # TypeScript validation
npm run build      # Compile to JavaScript
```

## Production Considerations

### Performance
- Connection pooling and cleanup
- Memory usage monitoring
- Automatic room cleanup
- Rate limiting protection

### Scalability
- Ready for Redis adapter integration
- Horizontal scaling preparation
- Load balancer compatibility

### Security
- JWT token validation
- CORS protection
- Rate limiting
- Input validation
- Error message sanitization

### Monitoring
- Comprehensive health checks
- Real-time statistics
- Error logging
- Performance metrics

## Future Enhancements

### Planned Features
1. **Redis Integration**: Distributed session storage and pub/sub
2. **Game Replay**: Action logging and replay system
3. **Spectator Mode**: Enhanced spectator features
4. **Rating System**: ELO-based matchmaking
5. **Tournament Mode**: Tournament bracket management
6. **Chat System**: In-game messaging
7. **Notification System**: Push notifications for events

### Optimization Opportunities
1. **Advanced Matchmaking**: Rating-based, skill-based matching
2. **Connection Optimization**: WebSocket compression, binary frames
3. **Caching Layer**: Game state caching for performance
4. **Analytics**: Game analytics and metrics collection
5. **Monitoring**: Advanced APM integration

## Error Handling

### Connection Errors
- Invalid/expired JWT tokens
- Network disconnections
- Rate limit violations
- Server overload

### Game Errors
- Invalid game actions
- Turn timeout handling
- Player disconnections
- Game state corruption

### Recovery Mechanisms
- Automatic reconnection
- Game state recovery
- Session restoration
- Error reporting

All error conditions are logged and handled gracefully with appropriate user feedback and system recovery.