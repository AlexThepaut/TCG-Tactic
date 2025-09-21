/**
 * Game State Store
 * Centralized state management for TCG Tactique using Zustand
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  GameState,
  GameCard,
  GamePosition,
  PlayerData,
  GameResult,
  CombatResult,
  GameAction,
} from '@/types';

interface GameStore {
  // Game State
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  useMockData: boolean;

  // Socket Connection State
  isConnected: boolean;
  isAuthenticated: boolean;
  isInGame: boolean;

  // Matchmaking State
  isInQueue: boolean;
  queuePosition: number;
  estimatedWaitTime: number;

  // UI State
  selectedCard: GameCard | null;
  highlightedCells: GamePosition[];
  attackableCells: GamePosition[];
  isDragMode: boolean;

  // Actions
  setGameState: (gameState: GameState | null) => void;
  updateGameState: (updater: (state: GameState) => void) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUseMockData: (useMock: boolean) => void;

  // Socket Actions
  setConnectionState: (connected: boolean, authenticated: boolean, inGame: boolean) => void;

  // Matchmaking Actions
  setQueueState: (inQueue: boolean, position?: number, waitTime?: number) => void;

  // UI Actions
  setSelectedCard: (card: GameCard | null) => void;
  setHighlightedCells: (cells: GamePosition[]) => void;
  setAttackableCells: (cells: GamePosition[]) => void;
  setDragMode: (isDrag: boolean) => void;

  // Game Actions
  handlePlayerJoined: (player: PlayerData) => void;
  handlePlayerLeft: (playerId: string) => void;
  handleActionPerformed: (action: GameAction) => void;
  handleCombatResult: (result: CombatResult) => void;
  handleGameOver: (result: GameResult) => void;
  handleTurnChanged: (currentPlayer: string, timeRemaining?: number) => void;

  // Utility Actions
  reset: () => void;
  clearError: () => void;
}

const initialState = {
  gameState: null,
  isLoading: false,
  error: null,
  useMockData: false,
  isConnected: false,
  isAuthenticated: false,
  isInGame: false,
  isInQueue: false,
  queuePosition: 0,
  estimatedWaitTime: 0,
  selectedCard: null,
  highlightedCells: [],
  attackableCells: [],
  isDragMode: false,
};

export const useGameStore = create<GameStore>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        ...initialState,

        // Basic State Actions
        setGameState: (gameState) =>
          set((state) => {
            state.gameState = gameState;
            state.isLoading = false;
            state.error = null;
          }),

        updateGameState: (updater) =>
          set((state) => {
            if (state.gameState) {
              updater(state.gameState);
            }
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
            state.isLoading = false;
          }),

        setUseMockData: (useMock) =>
          set((state) => {
            state.useMockData = useMock;
          }),

        // Socket State Actions
        setConnectionState: (connected, authenticated, inGame) =>
          set((state) => {
            state.isConnected = connected;
            state.isAuthenticated = authenticated;
            state.isInGame = inGame;
          }),

        // Matchmaking Actions
        setQueueState: (inQueue, position = 0, waitTime = 0) =>
          set((state) => {
            state.isInQueue = inQueue;
            state.queuePosition = position;
            state.estimatedWaitTime = waitTime;
          }),

        // UI Actions
        setSelectedCard: (card) =>
          set((state) => {
            state.selectedCard = card;
          }),

        setHighlightedCells: (cells) =>
          set((state) => {
            state.highlightedCells = cells;
          }),

        setAttackableCells: (cells) =>
          set((state) => {
            state.attackableCells = cells;
          }),

        setDragMode: (isDrag) =>
          set((state) => {
            state.isDragMode = isDrag;
          }),

        // Game Event Handlers
        handlePlayerJoined: (player) =>
          set((state) => {
            if (state.gameState && state.gameState.players) {
              // Add player to the appropriate slot
              if (!state.gameState.players.player1) {
                state.gameState.players.player1 = player;
              } else if (!state.gameState.players.player2) {
                state.gameState.players.player2 = player;
              }
            }
          }),

        handlePlayerLeft: (playerId) =>
          set((state) => {
            if (state.gameState && state.gameState.players) {
              if (state.gameState.players.player1?.id === playerId) {
                state.gameState.players.player1 = null as any;
              } else if (state.gameState.players.player2?.id === playerId) {
                state.gameState.players.player2 = null as any;
              }
            }
          }),

        handleActionPerformed: (action) =>
          set((state) => {
            if (state.gameState) {
              state.gameState.lastActionAt = new Date();
              // Update turn/phase if needed based on action
              if (action.type === 'end_turn') {
                state.gameState.currentPlayer =
                  state.gameState.currentPlayer === 'player-1' ? 'player-2' : 'player-1';
                state.gameState.turn += 1;
              }
            }
          }),

        handleCombatResult: (_result) =>
          set((state) => {
            if (state.gameState) {
              // Apply combat results to the game board
              // This would include updating card health, removing destroyed cards, etc.
              state.gameState.lastActionAt = new Date();
            }
          }),

        handleGameOver: (result) =>
          set((state) => {
            if (state.gameState) {
              state.gameState.gameOver = true;
              state.gameState.winner = result.winner;
            }
            state.isInGame = false;
          }),

        handleTurnChanged: (currentPlayer, timeRemaining) =>
          set((state) => {
            if (state.gameState) {
              state.gameState.currentPlayer = currentPlayer;
              if (timeRemaining !== undefined) {
                state.gameState.timeRemaining = timeRemaining;
              }
            }
          }),

        // Utility Actions
        reset: () =>
          set((state) => {
            Object.assign(state, initialState);
          }),

        clearError: () =>
          set((state) => {
            state.error = null;
          }),
      }))
    ),
    {
      name: 'game-store',
      partialize: (state: GameStore) => ({
        // Only persist certain parts of the state
        useMockData: state.useMockData,
        // Don't persist sensitive or ephemeral state
      }),
    }
  )
);

// Selectors for common state combinations
export const useGameState = () => useGameStore((state) => state.gameState);
export const useGameLoading = () => useGameStore((state) => state.isLoading);
export const useGameError = () => useGameStore((state) => state.error);
export const useConnectionState = () =>
  useGameStore((state) => ({
    isConnected: state.isConnected,
    isAuthenticated: state.isAuthenticated,
    isInGame: state.isInGame,
  }));
export const useMatchmakingState = () =>
  useGameStore((state) => ({
    isInQueue: state.isInQueue,
    queuePosition: state.queuePosition,
    estimatedWaitTime: state.estimatedWaitTime,
  }));
export const useGameUI = () =>
  useGameStore((state) => ({
    selectedCard: state.selectedCard,
    highlightedCells: state.highlightedCells,
    attackableCells: state.attackableCells,
    isDragMode: state.isDragMode,
  }));

// Action selectors
export const useGameActions = () =>
  useGameStore((state) => ({
    setGameState: state.setGameState,
    updateGameState: state.updateGameState,
    setLoading: state.setLoading,
    setError: state.setError,
    setUseMockData: state.setUseMockData,
    setConnectionState: state.setConnectionState,
    setQueueState: state.setQueueState,
    setSelectedCard: state.setSelectedCard,
    setHighlightedCells: state.setHighlightedCells,
    setAttackableCells: state.setAttackableCells,
    setDragMode: state.setDragMode,
    handlePlayerJoined: state.handlePlayerJoined,
    handlePlayerLeft: state.handlePlayerLeft,
    handleActionPerformed: state.handleActionPerformed,
    handleCombatResult: state.handleCombatResult,
    handleGameOver: state.handleGameOver,
    handleTurnChanged: state.handleTurnChanged,
    reset: state.reset,
    clearError: state.clearError,
  }));