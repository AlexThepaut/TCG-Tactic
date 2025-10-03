# WebSocket Architecture Refactoring Analysis

**Date**: 2025-10-03
**Components Analyzed**: Game.tsx, GameBoard.tsx, HearthstoneHand.tsx
**Current State**: Mixed responsibilities, redundant state management, unclear data flow

---

## Current Architecture Issues

### 1. **Multiple Socket Instances and State Duplication**

**Game.tsx** (Parent Component):
```typescript
// Creates its own useGameSocket instance
const { isConnected: socketConnected, isAuthenticated, isInGame, gameState: socketGameState, ... } = useGameSocket({...})

// Syncs to Zustand store
useEffect(() => {
  setConnectionState(socketConnected, isAuthenticated, isInGame);
}, [socketConnected, isAuthenticated, isInGame, setConnectionState]);

// Maintains local state from socket
useEffect(() => {
  if (socketGameState) {
    setGameState(socketGameState);
  }
}, [socketGameState, ...]);
```

**GameBoard.tsx** (Child Component):
```typescript
// Creates ANOTHER useGameSocket instance with SAME gameId
const { isConnected, socketService, endTurn, surrender, getCurrentPlayer, ... } = useGameSocket({
  gameId: gameState.id,
  callbacks: { onGameStateUpdate, onTurnChanged, onGameError }
});

// Also uses useCardSelection which needs socketService
const cardSelection = useCardSelection({
  socketService,  // Passed from GameBoard's socket
  ...
});
```

**Problem**: Two separate socket connections to the same game!

---

### 2. **State Management Confusion**

**Three competing sources of truth**:
1. **Game.tsx** → Zustand store (`useGameState`, `useGameActions`)
2. **GameBoard.tsx** → `useGameSocket` returns `gameState`
3. **Props drilling** → Game passes `gameState` prop to GameBoard

Current flow:
```
useGameSocket(Game.tsx) → socketGameState → Zustand store → gameState
                                                                  ↓
                                                            Game.tsx passes as prop
                                                                  ↓
                                                            GameBoard.tsx
                                                                  ↓
useGameSocket(GameBoard.tsx) → ANOTHER socketGameState (unused!)
```

**Problem**: GameBoard ignores its own socket's gameState and uses the prop from parent!

---

### 3. **Connection State Fragmentation**

**Game.tsx**:
- Uses `socketConnected`, `isAuthenticated`, `isInGame`
- Syncs to Zustand: `setConnectionState(socketConnected, isAuthenticated, isInGame)`
- Uses Zustand: `const { isConnected } = useConnectionState()`

**GameBoard.tsx**:
- Gets `isConnected` from its own `useGameSocket`
- Displays "CONNECTION LOST" based on this value
- But this value might be different from Game.tsx's connection state!

**Problem**: Two different connection states that can diverge

---

### 4. **Prop Drilling Hell**

**Game.tsx** passes to **GameBoard**:
```typescript
<GameBoard
  gameState={gameState}
  onGameAction={handleGameAction}
  onTurnEnd={handleTurnEnd}
  onSurrender={handleSurrender}
/>
```

But GameBoard:
- Has its own `useGameSocket` returning a gameState (ignored)
- Has its own `endTurn`, `surrender` from socket (used instead of props)
- Still needs the gameState prop because it's the source of truth

**Problem**: Unclear which data source is authoritative

---

### 5. **HearthstoneHand Isolation**

**HearthstoneHand.tsx**:
- Has NO direct socket/WebSocket usage
- Receives props from GameBoard: `cards`, `faction`, `resources`, `selectedCardId`, `isMyTurn`, `onCardClick`
- `onCardClick` calls `cardSelection.selectCard` in GameBoard
- GameBoard's `cardSelection` uses `socketService` from GameBoard's `useGameSocket`

**Problem**: Hand is pure UI (good!) but GameBoard manages ALL game logic (too much responsibility)

---

## Architecture Problems Summary

### ❌ **Current Issues**:

1. **Dual Socket Connections**: Game.tsx and GameBoard.tsx both create separate socket connections
2. **State Duplication**: gameState exists in 3 places (socket, Zustand, props)
3. **Unclear Data Flow**: Socket → Zustand → Props → Component (too many hops)
4. **Connection State Mismatch**: Two different isConnected values
5. **Responsibility Confusion**: GameBoard does too much (socket + UI + game logic)
6. **Prop Drilling**: Unnecessary callbacks passed but not used
7. **Testing Complexity**: Mock data logic duplicated between Game and GameBoard

---

## Recommended Refactoring

### ✅ **Single Source of Truth Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                        Game.tsx                              │
│  - useGameSocket (ONLY ONE instance)                        │
│  - Manages ALL WebSocket state                              │
│  - Provides context to children                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    GameSocketContext
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      GameBoard.tsx                           │
│  - useContext(GameSocketContext)                            │
│  - Pure UI orchestration                                    │
│  - No socket management                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   HearthstoneHand.tsx                        │
│  - Pure UI component                                        │
│  - Receives only display props                              │
└─────────────────────────────────────────────────────────────┘
```

### **Proposed Solution: GameSocketContext**

**1. Create Context Provider** (`contexts/GameSocketContext.tsx`):
```typescript
interface GameSocketContextValue {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  socketService: SocketService | null;

  // Game state
  gameState: GameState | null;
  isMyTurn: boolean;

  // Game actions
  selectCard: (card: GameCard, handIndex: number) => Promise<void>;
  placeCard: (position: GamePosition) => Promise<void>;
  attack: (from: GamePosition, to: GamePosition) => Promise<void>;
  endTurn: () => Promise<void>;
  surrender: () => Promise<void>;

  // Selection state
  selectionState: SelectionState;

  // Error handling
  error: string | null;
}

export const GameSocketProvider: React.FC<{ gameId: string; children: React.ReactNode }> = ({ gameId, children }) => {
  const socket = useGameSocket({ gameId, autoJoinGame: true });
  const cardSelection = useCardSelection({
    socketService: socket.socketService,
    gameId,
    isMyTurn: socket.isMyTurn()
  });

  const value = {
    ...socket,
    ...cardSelection,
  };

  return <GameSocketContext.Provider value={value}>{children}</GameSocketContext.Provider>;
};

export const useGameSocketContext = () => {
  const context = useContext(GameSocketContext);
  if (!context) throw new Error('useGameSocketContext must be used within GameSocketProvider');
  return context;
};
```

**2. Simplify Game.tsx**:
```typescript
const Game = () => {
  const { gameId } = useParams();

  return (
    <GameSocketProvider gameId={gameId}>
      <GameContent />
    </GameSocketProvider>
  );
};

const GameContent = () => {
  const { gameState, isConnected, error } = useGameSocketContext();

  if (!gameState) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return <GameBoard />;
};
```

**3. Simplify GameBoard.tsx**:
```typescript
const GameBoard = () => {
  const {
    gameState,
    isConnected,
    isMyTurn,
    selectionState,
    selectCard,
    placeCard,
    endTurn,
    surrender,
  } = useGameSocketContext();

  const currentPlayer = gameState.players[gameState.currentPlayer];

  return (
    <div>
      <PlayerPanel player={currentPlayer} />
      <TacticalGrid
        board={currentPlayer.board}
        validPositions={selectionState.validPositions}
        onPositionClick={placeCard}
      />
      <HearthstoneHand
        cards={currentPlayer.hand}
        selectedCardId={selectionState.selectedCard?.id}
        onCardClick={selectCard}
      />
    </div>
  );
};
```

---

## Benefits of Refactoring

### ✅ **Improvements**:

1. **Single Socket Instance**: Only one WebSocket connection per game
2. **Clear Data Flow**: Socket → Context → Components (one direction)
3. **Eliminated Duplication**: No more state syncing between Game/GameBoard
4. **Better Separation**: Game = provider, GameBoard = UI orchestrator, Hand = pure UI
5. **Simplified Testing**: Mock context instead of mocking Zustand + sockets
6. **Type Safety**: Context provides complete type information
7. **No Prop Drilling**: Components get what they need from context
8. **Performance**: Fewer re-renders (context memoization)

---

## Migration Strategy

### **Phase 1**: Create Context (Non-Breaking)
- Create `GameSocketContext` with all current functionality
- Keep existing Game.tsx and GameBoard.tsx working

### **Phase 2**: Migrate Game.tsx
- Wrap with `GameSocketProvider`
- Remove Zustand state management for game state
- Simplify connection state handling

### **Phase 3**: Migrate GameBoard.tsx
- Replace `useGameSocket` with `useGameSocketContext`
- Remove redundant socket instance
- Simplify component logic

### **Phase 4**: Cleanup
- Remove unused Zustand stores (if any)
- Remove duplicate connection state logic
- Update tests

---

## Files to Modify

### **New Files**:
- `src/contexts/GameSocketContext.tsx` - Context provider and hook

### **Modified Files**:
- `src/pages/Game.tsx` - Use provider, remove Zustand
- `src/components/game/GameBoard.tsx` - Use context instead of socket
- `src/hooks/useCardSelection.ts` - May need minor adjustments
- `src/stores/gameStore.ts` - Remove game state (keep only UI state if needed)

### **Deleted Files** (potentially):
- Connection state management in Zustand (if only used for this)

---

## Risk Assessment

### **Low Risk**:
- HearthstoneHand.tsx (no changes needed)
- Backend (no changes needed)
- Socket service layer (no changes needed)

### **Medium Risk**:
- Game.tsx (major refactor but well-isolated)
- GameBoard.tsx (major refactor but well-isolated)

### **High Risk**:
- Testing mode / mock data handling (need to preserve this)
- Connection retry logic (need to ensure it still works)

---

## Conclusion

The current architecture has **significant technical debt** from incremental feature additions:
- Started with Game.tsx managing everything
- Added GameBoard.tsx with its own socket (duplication)
- Added Zustand for state management (not fully utilized)
- Added useCardSelection requiring socketService (passed through props)

**Result**: Confusing data flow, redundant state, unclear responsibilities.

**Solution**: GameSocketContext centralizes all socket/game logic, making components simpler and data flow clearer.

**Recommendation**: Proceed with refactoring in phases to minimize risk while achieving architectural improvements.
