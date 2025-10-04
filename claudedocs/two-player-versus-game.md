# Two-Player Versus Game Implementation Plan

**Status:** Ready for Implementation
**Priority:** Critical
**Estimated Time:** ~2 hours
**Goal:** Enable complete versus gameplay between two frontend instances

---

## 📊 Current Status Analysis

### ✅ Already Implemented & Working

**Backend Infrastructure:**
- ✅ Socket.io server running (port 5001)
- ✅ Game creation handler (`handleGameCreate`)
- ✅ Game join handler (`handleGameJoin`)
- ✅ Turn management with automatic timers
- ✅ Combat system fully integrated
- ✅ Real-time state synchronization (<100ms)
- ✅ Click-based card placement system
- ✅ End turn mechanics

**Frontend Infrastructure:**
- ✅ Socket.io client service
- ✅ GameSocketContext for state management
- ✅ useGameSocket hook with create/join methods
- ✅ GameBoard component with full game UI
- ✅ Turn timer display
- ✅ Combat indicators
- ✅ Game end screen

### ❌ Missing Components for Two-Player Versus

1. **Game Creation/Join UI** - No lobby or game creation page
2. **Player 2 Configuration** - Backend sets player2 to placeholder (userId: 0)
3. **Ready State Handling** - No "both players ready" trigger
4. **Game Start Sequence** - No transition from waiting → active
5. **Starting Hand Distribution** - Cards not dealt on game start
6. **Basic Win Conditions** - No win/loss detection

---

## 🎯 Implementation Roadmap

### Phase 1: Game Lobby UI (Frontend)
**Time:** ~30 minutes
**Priority:** Critical

#### Files to Create:

**1. `frontend/src/pages/Lobby.tsx`**
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSocket } from '@/hooks/useGameSocket';
import toast from 'react-hot-toast';

const Lobby = () => {
  const navigate = useNavigate();
  const { createGame, joinGame } = useGameSocket();
  const [gameId, setGameId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const response = await createGame({
        timeLimit: 300,
        ranked: false,
        spectatorMode: false,
        faction: 'humans', // Default faction
        deck: [] // Mock deck for now
      });

      if (response.success && response.gameId) {
        toast.success(`Game created! ID: ${response.gameId}`);
        navigate(`/game/${response.gameId}`);
      }
    } catch (error) {
      toast.error('Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameId.trim()) {
      toast.error('Please enter a game ID');
      return;
    }

    setIsJoining(true);
    try {
      const response = await joinGame(gameId);

      if (response.success) {
        navigate(`/game/${gameId}`);
      }
    } catch (error) {
      toast.error('Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <h1 className="text-4xl font-gothic font-bold text-imperial-400 mb-8 text-center gothic-text-shadow">
          Game Lobby
        </h1>

        {/* Create Game Section */}
        <div className="bg-gothic-black/90 border-2 border-imperial-500/50 rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-tech text-imperial-300 mb-4">Create New Game</h2>
          <p className="text-void-400 mb-6">Start a new game and share the Game ID with your opponent</p>

          <button
            onClick={handleCreateGame}
            disabled={isCreating}
            className="w-full px-8 py-4 bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border border-imperial-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-imperial disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Game'}
          </button>
        </div>

        {/* Join Game Section */}
        <div className="bg-gothic-black/90 border-2 border-aliens-500/50 rounded-xl p-8">
          <h2 className="text-2xl font-tech text-aliens-300 mb-4">Join Existing Game</h2>
          <p className="text-void-400 mb-6">Enter the Game ID provided by your opponent</p>

          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID..."
            className="w-full px-4 py-3 bg-gothic-darkest border border-void-600 text-void-200 rounded-lg mb-4 focus:outline-none focus:border-aliens-500 font-tech"
          />

          <button
            onClick={handleJoinGame}
            disabled={isJoining || !gameId.trim()}
            className="w-full px-8 py-4 bg-aliens-600/80 hover:bg-aliens-500 text-aliens-100 border border-aliens-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-aliens disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
```

**2. `frontend/src/components/game/GameWaitingRoom.tsx`**
```typescript
import { useState } from 'react';
import { ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface GameWaitingRoomProps {
  gameId: string;
  isHost: boolean;
  opponentJoined: boolean;
  onReady: () => void;
  isReady: boolean;
  opponentReady: boolean;
}

export const GameWaitingRoom: React.FC<GameWaitingRoomProps> = ({
  gameId,
  isHost,
  opponentJoined,
  onReady,
  isReady,
  opponentReady
}) => {
  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    toast.success('Game ID copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-gothic-black/90 border-2 border-imperial-500/50 rounded-xl p-8">
          <h1 className="text-3xl font-gothic font-bold text-imperial-400 mb-6 text-center gothic-text-shadow">
            Waiting Room
          </h1>

          {/* Game ID Display */}
          <div className="bg-gothic-darkest/60 border border-void-600/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-void-400 font-tech mb-1">Game ID</div>
                <div className="text-xl font-bold text-imperial-300 font-mono">{gameId}</div>
              </div>
              <button
                onClick={copyGameId}
                className="p-3 bg-imperial-600/50 hover:bg-imperial-500 border border-imperial-400/50 rounded-lg transition-all duration-300"
                aria-label="Copy Game ID"
              >
                <ClipboardDocumentIcon className="w-6 h-6 text-imperial-200" />
              </button>
            </div>
            {isHost && !opponentJoined && (
              <div className="mt-3 text-sm text-imperial-300 font-tech">
                Share this ID with your opponent
              </div>
            )}
          </div>

          {/* Player Status */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-gothic-darkest/40 border border-void-600/20 rounded-lg">
              <span className="text-imperial-300 font-tech">
                {isHost ? 'You (Host)' : 'You'}
              </span>
              {isReady && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-tech">Ready</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gothic-darkest/40 border border-void-600/20 rounded-lg">
              <span className="text-aliens-300 font-tech">Opponent</span>
              {opponentJoined ? (
                opponentReady ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-tech">Ready</span>
                  </div>
                ) : (
                  <span className="text-void-400 font-tech">Waiting...</span>
                )
              ) : (
                <span className="text-void-500 font-tech italic">Not joined</span>
              )}
            </div>
          </div>

          {/* Ready Button */}
          {opponentJoined && !isReady && (
            <button
              onClick={onReady}
              className="w-full px-8 py-4 bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border border-imperial-400/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-imperial"
            >
              Ready to Start
            </button>
          )}

          {/* Waiting for opponent to ready */}
          {isReady && !opponentReady && (
            <div className="text-center text-imperial-300 font-tech animate-pulse">
              Waiting for opponent to ready up...
            </div>
          )}

          {/* Both ready - game starting */}
          {isReady && opponentReady && (
            <div className="text-center text-green-400 font-tech font-bold text-xl animate-pulse">
              Game Starting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameWaitingRoom;
```

**3. Update `frontend/src/App.tsx`** - Add route:
```typescript
<Route path="/lobby" element={<Lobby />} />
```

**4. Update `frontend/src/pages/Home.tsx`** - Change button:
```typescript
// Change from:
<Link to="/game">

// To:
<Link to="/lobby">
```

---

### Phase 2: Backend Game Join Fix
**Time:** ~20 minutes
**Priority:** Critical

#### Files to Modify:

**1. `backend/src/socket/handlers/gameHandlers.ts`**

**Fix Player 2 Join Logic (lines 349-400):**
```typescript
// Current issue: Player 2 gets placeholder values
// Fix: Accept faction and deck from join request

async function handleGameJoin(
  socket: AuthenticatedSocket,
  io: SocketIOServer,
  joinData: { gameId: string; faction: string; deck: string[] }, // Add join data
  callback: (response: GameResponse) => void
): Promise<void> {
  try {
    const { gameId, faction, deck } = joinData;
    const userId = parseInt(socket.userData.userId);

    const gameState = await gameStateService.getGameState(gameId);

    // Check if game is full
    if (gameState.player2Id !== 0) {
      return callback({
        success: false,
        error: 'Game is full'
      });
    }

    // Update player 2 configuration
    gameState.player2Id = userId;
    gameState.player2 = await gameStateService.createPlayerState({
      userId,
      faction: faction as any,
      deckId: 1 // TODO: Use actual deck
    });

    // Update game state
    await gameStateService.updateGameState(gameId, gameState, gameState.version);

    // Join socket to room
    socket.gameId = gameId;
    socket.playerId = userId.toString();
    socket.join(`game:${gameId}`);
    socket.join(`game:${gameId}:players`);

    // Notify both players
    io.to(`game:${gameId}`).emit('game:player_joined', gameState.player2);

    callback({
      success: true,
      message: 'Joined game successfully',
      gameId,
      gameState: convertToLegacyFormat(gameState) as any,
      playerId: userId.toString()
    });
  } catch (error: any) {
    callback({
      success: false,
      error: 'Failed to join game'
    });
  }
}
```

**Add Ready Handler (new function):**
```typescript
async function handleReady(
  socket: AuthenticatedSocket,
  io: SocketIOServer,
  callback: (response: BasicResponse) => void
): Promise<void> {
  try {
    if (!socket.gameId) {
      return callback({ success: false, error: 'Not in a game' });
    }

    const gameState = await gameStateService.getGameState(socket.gameId);
    const userId = parseInt(socket.userData.userId);

    // Mark player as ready
    if (gameState.player1Id === userId) {
      gameState.player1.isReady = true;
    } else if (gameState.player2Id === userId) {
      gameState.player2.isReady = true;
    }

    // Update state
    await gameStateService.updateGameState(socket.gameId, gameState, gameState.version);

    // Broadcast ready status
    io.to(`game:${socket.gameId}`).emit('game:player_ready', {
      playerId: userId.toString(),
      isReady: true
    });

    // Check if both ready → start game
    if (gameState.player1.isReady && gameState.player2.isReady) {
      await startGame(socket.gameId, io);
    }

    callback({ success: true });
  } catch (error: any) {
    callback({ success: false, error: 'Failed to ready up' });
  }
}
```

**Add Game Start Function (new function):**
```typescript
async function startGame(
  gameId: string,
  io: SocketIOServer
): Promise<void> {
  try {
    const gameState = await gameStateService.getGameState(gameId);

    // Update status to active
    gameState.status = 'active';
    gameState.turn = 1;
    gameState.phase = 'resources';

    // Deal starting hands (3 cards each)
    const startingHandSize = 3;

    // Player 1 starting hand
    for (let i = 0; i < startingHandSize; i++) {
      if (gameState.player1.deck.length > 0) {
        const card = gameState.player1.deck.shift()!;
        gameState.player1.hand.push(card);
      }
    }

    // Player 2 starting hand
    for (let i = 0; i < startingHandSize; i++) {
      if (gameState.player2.deck.length > 0) {
        const card = gameState.player2.deck.shift()!;
        gameState.player2.hand.push(card);
      }
    }

    // Save updated state
    await gameStateService.updateGameState(gameId, gameState, gameState.version);

    // Start turn timer
    turnTimerService.startTurnTimer(gameId, gameState.currentPlayer.toString(), gameState.timeLimit);

    // Broadcast game start
    io.to(`game:${gameId}`).emit('game:started', {
      gameState: convertToLegacyFormat(gameState)
    });

    loggers.game.info('Game started', { gameId });
  } catch (error: any) {
    loggers.game.error('Failed to start game', {
      gameId,
      error: error.message
    });
  }
}
```

**Register Ready Handler (in setupGameHandlers):**
```typescript
socket.on('game:ready', (callback) => {
  handleReady(socket, io, callback);
});
```

---

### Phase 3: Basic Game Rules
**Time:** ~30 minutes
**Priority:** High

#### Files to Verify/Modify:

**1. `backend/src/services/gameMechanicsService.ts`**

**Verify Resource Increment (should already exist in executeStartTurnPhase):**
```typescript
// Line ~400-450 - Verify this logic exists:
if (phase === 'resources') {
  newState.player1.resources = Math.min(
    newState.player1.resources + GAME_CONSTANTS.RESOURCE_PER_TURN,
    GAME_CONSTANTS.MAX_RESOURCES
  );
  newState.player2.resources = Math.min(
    newState.player2.resources + GAME_CONSTANTS.RESOURCE_PER_TURN,
    GAME_CONSTANTS.MAX_RESOURCES
  );
}
```

**Verify Card Draw (should already exist in executeDrawPhase):**
```typescript
// Line ~450-500 - Verify this logic exists:
if (phase === 'draw' && currentPlayerState.deck.length > 0) {
  const drawnCard = currentPlayerState.deck.shift()!;
  currentPlayerState.hand.push(drawnCard);
}
```

**2. Add Simple Win Condition Detection**

**Add to `executeEndTurn` or create new function:**
```typescript
function checkWinCondition(gameState: GameState): {
  gameOver: boolean;
  winner?: number;
  winCondition?: string;
} {
  // Check if player 1 has no units
  const player1Units = gameState.player1.board.flat().filter(card => card !== null).length;
  if (player1Units === 0 && gameState.turn > 1) {
    return {
      gameOver: true,
      winner: gameState.player2Id,
      winCondition: 'All enemy units destroyed'
    };
  }

  // Check if player 2 has no units
  const player2Units = gameState.player2.board.flat().filter(card => card !== null).length;
  if (player2Units === 0 && gameState.turn > 1) {
    return {
      gameOver: true,
      winner: gameState.player1Id,
      winCondition: 'All enemy units destroyed'
    };
  }

  // Check quest completion (if quest service is ready)
  // TODO: Add quest completion check

  return { gameOver: false };
}

// Call this at end of executeEndTurn:
const winCheck = checkWinCondition(newState);
if (winCheck.gameOver) {
  newState.gameOver = true;
  newState.winner = winCheck.winner;
  newState.winCondition = winCheck.winCondition;
}
```

---

### Phase 4: Frontend Integration
**Time:** ~20 minutes
**Priority:** High

#### Files to Modify:

**1. `frontend/src/pages/Game.tsx`**

**Add waiting room state:**
```typescript
const [showWaitingRoom, setShowWaitingRoom] = useState(false);
const [isReady, setIsReady] = useState(false);
const [opponentReady, setOpponentReady] = useState(false);

// Listen for player joined
useEffect(() => {
  const socketService = getSocketService();
  if (!socketService) return;

  const handlePlayerJoined = (player: any) => {
    toast.success(`${player.username} joined the game!`);
    setShowWaitingRoom(false);
  };

  const handlePlayerReady = (data: { playerId: string; isReady: boolean }) => {
    if (data.playerId === localPlayerId) {
      setIsReady(data.isReady);
    } else {
      setOpponentReady(data.isReady);
    }
  };

  const handleGameStarted = (data: { gameState: GameState }) => {
    setShowWaitingRoom(false);
    setGameState(data.gameState);
  };

  socketService.on('game:player_joined', handlePlayerJoined);
  socketService.on('game:player_ready', handlePlayerReady);
  socketService.on('game:started', handleGameStarted);

  return () => {
    socketService.off('game:player_joined', handlePlayerJoined);
    socketService.off('game:player_ready', handlePlayerReady);
    socketService.off('game:started', handleGameStarted);
  };
}, []);

// Show waiting room if game status is 'waiting'
if (gameState?.status === 'waiting') {
  return (
    <GameWaitingRoom
      gameId={gameState.id}
      isHost={gameState.player1Id === localPlayerId}
      opponentJoined={gameState.player2Id !== 0}
      onReady={handleReady}
      isReady={isReady}
      opponentReady={opponentReady}
    />
  );
}
```

**2. `frontend/src/types/index.ts`**

**Add new Socket events:**
```typescript
export interface ServerToClientEvents {
  // ... existing events
  'game:player_ready': (data: { playerId: string; isReady: boolean }) => void;
  'game:started': (data: { gameState: GameState }) => void;
}
```

---

## 🧪 Testing Flow

### Two-Instance Test Scenario

**Instance 1 (Player 1 - Host):**
1. Open `http://localhost:3000`
2. Click "Play" → Navigate to Lobby
3. Click "Create Game"
4. Copy the generated Game ID (e.g., `game_123_1234567890`)
5. Share ID with Player 2 (paste in chat, etc.)
6. Wait for Player 2 to join
7. Click "Ready to Start"
8. Wait for Player 2 to ready up
9. Game starts automatically
10. Play turns: place units, attack, end turn

**Instance 2 (Player 2 - Joiner):**
1. Open `http://localhost:3000` (new window/incognito)
2. Click "Play" → Navigate to Lobby
3. Click "Join Game"
4. Paste the Game ID from Player 1
5. Click "Join"
6. Click "Ready to Start"
7. Game starts automatically
8. Play turns: place units, attack, end turn

### Expected Behavior:
- Both players see synchronized game state
- Turn timer switches between players
- Card placement works for active player only
- Combat resolves correctly
- Game ends when one player has no units
- Game end screen shows winner/loser

---

## 📝 Implementation Checklist

### Frontend Tasks
- [ ] Create `Lobby.tsx` page with create/join UI
- [ ] Create `GameWaitingRoom.tsx` component
- [ ] Add `/lobby` route to App.tsx
- [ ] Update Home.tsx button to navigate to `/lobby`
- [ ] Add Socket event listeners for player ready/game start
- [ ] Integrate waiting room into Game.tsx

### Backend Tasks
- [ ] Fix `handleGameJoin` to accept player 2 faction/deck
- [ ] Add `handleReady` function
- [ ] Add `startGame` function with hand dealing
- [ ] Register `game:ready` event handler
- [ ] Add simple win condition check
- [ ] Verify resource increment logic
- [ ] Verify card draw logic

### Testing Tasks
- [ ] Test game creation flow
- [ ] Test game join flow
- [ ] Test ready state synchronization
- [ ] Test game start with hand dealing
- [ ] Test turn alternation
- [ ] Test card placement synchronization
- [ ] Test combat synchronization
- [ ] Test win condition detection
- [ ] Test game end flow

---

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Open two browser windows:
# Window 1: http://localhost:3000
# Window 2: http://localhost:3000 (incognito mode)
```

---

## 📌 Important Notes

1. **Authentication:** Currently using guest middleware in development - both instances will work without login
2. **Deck System:** Using mock deck (deckId: 1) - proper deck selection can be added later
3. **Card Pool:** Game uses placeholder cards - actual card data from database not yet integrated
4. **Quest System:** Basic win condition (no units = lose) - full quest system comes later
5. **Turn Phases:** Resources → Draw → Actions phases should already work via existing code

---

## 🔄 Next Steps (Post-MVP)

After basic versus works:
1. Add deck selection UI
2. Integrate actual card pool from database
3. Implement full quest system
4. Add faction passive abilities
5. Add spell casting
6. Add reconnection logic
7. Add spectator mode
8. Add ranked matchmaking

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Author:** Claude Code Analysis
