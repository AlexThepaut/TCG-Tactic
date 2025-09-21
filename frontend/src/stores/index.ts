/**
 * Stores Index
 * Central export for all Zustand stores
 */

export {
  useGameStore,
  useGameState,
  useGameLoading,
  useGameError,
  useConnectionState,
  useMatchmakingState,
  useGameUI,
  useGameActions,
} from './gameStore';

// Future stores can be exported here:
// export { useUserStore } from './userStore';
// export { useAppStore } from './appStore';