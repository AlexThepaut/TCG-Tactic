/**
 * useTurnManagement Hook
 * Comprehensive turn management with timer integration
 * Handles Socket.io events for turn changes, timers, and phase transitions
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState } from '@/types';

export interface TurnState {
  currentPlayer: string;
  turn: number;
  phase: 'resources' | 'draw' | 'actions' | 'end';
  timeRemaining: number;
  timeLimit: number;
  phaseStartedAt: Date;
}

export interface TurnTimerData {
  duration: number;
  deadline: number;
  playerId: string;
}

export interface TurnTimeoutData {
  playerId: string;
  newState: {
    currentPlayer: string;
    turn: number;
    phase: string;
    timeRemaining: number;
  };
}

export interface PhaseTransitionData {
  from: 'resources' | 'draw' | 'actions' | 'end';
  to: 'resources' | 'draw' | 'actions' | 'end';
  auto: boolean;
}

export interface UseTurnManagementOptions {
  gameId: string;
  onTurnChanged?: (turnState: TurnState) => void;
  onTimerExpired?: () => void;
  onPhaseTransition?: (transition: PhaseTransitionData) => void;
}

export interface UseTurnManagementReturn {
  turnState: TurnState | null;
  timeRemaining: number;
  isTimerActive: boolean;
  error: string | null;
}

export const useTurnManagement = (options: UseTurnManagementOptions): UseTurnManagementReturn => {
  const { gameId, onTurnChanged, onTimerExpired, onPhaseTransition } = options;

  const [turnState, setTurnState] = useState<TurnState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // Default 5 minutes
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number | null>(null);

  // Get socket service from window (set by GameSocketContext)
  const getSocketService = useCallback(() => {
    return (window as any).__socketService;
  }, []);

  // Cleanup timer interval
  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Start local timer countdown
  const startLocalTimer = useCallback((deadline: number) => {
    clearTimerInterval();

    deadlineRef.current = deadline;
    setIsTimerActive(true);

    // Update time remaining every second
    timerIntervalRef.current = setInterval(() => {
      if (!deadlineRef.current) return;

      const remaining = Math.max(0, Math.floor((deadlineRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);

      // Stop timer when it reaches zero
      if (remaining === 0) {
        clearTimerInterval();
        setIsTimerActive(false);

        if (onTimerExpired) {
          onTimerExpired();
        }
      }
    }, 1000);

  }, [clearTimerInterval, onTimerExpired]);

  // Handle turn:timer_started event
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService) return;

    const handleTimerStarted = (data: TurnTimerData) => {
      console.log('Turn timer started:', data);

      startLocalTimer(data.deadline);
      setTimeRemaining(Math.floor((data.deadline - Date.now()) / 1000));
    };

    socketService.on('turn:timer_started', handleTimerStarted);

    return () => {
      socketService.off('turn:timer_started', handleTimerStarted);
    };
  }, [getSocketService, startLocalTimer]);

  // Handle turn:changed event
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService) return;

    const handleTurnChanged = (data: any) => {
      console.log('Turn changed:', data);

      const newTurnState: TurnState = {
        currentPlayer: data.currentPlayer,
        turn: data.turn,
        phase: data.phase,
        timeRemaining: data.timeRemaining || 300,
        timeLimit: data.timeLimit || 300,
        phaseStartedAt: new Date()
      };

      setTurnState(newTurnState);
      setTimeRemaining(data.timeRemaining || 300);

      if (onTurnChanged) {
        onTurnChanged(newTurnState);
      }
    };

    socketService.on('turn:changed', handleTurnChanged);

    return () => {
      socketService.off('turn:changed', handleTurnChanged);
    };
  }, [getSocketService, onTurnChanged]);

  // Handle turn:timeout event
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService) return;

    const handleTurnTimeout = (data: TurnTimeoutData) => {
      console.log('Turn timeout:', data);

      const newTurnState: TurnState = {
        currentPlayer: data.newState.currentPlayer,
        turn: data.newState.turn,
        phase: data.newState.phase as any,
        timeRemaining: data.newState.timeRemaining,
        timeLimit: 300,
        phaseStartedAt: new Date()
      };

      setTurnState(newTurnState);
      setTimeRemaining(data.newState.timeRemaining);
      clearTimerInterval();
      setIsTimerActive(false);

      setError(`Player ${data.playerId} timed out. Turn auto-ended.`);
      setTimeout(() => setError(null), 5000);
    };

    socketService.on('turn:timeout', handleTurnTimeout);

    return () => {
      socketService.off('turn:timeout', handleTurnTimeout);
    };
  }, [getSocketService, clearTimerInterval]);

  // Handle phase:transition event
  useEffect(() => {
    const socketService = getSocketService();
    if (!socketService) return;

    const handlePhaseTransition = (data: PhaseTransitionData) => {
      console.log('Phase transition:', data);

      if (turnState) {
        setTurnState({
          ...turnState,
          phase: data.to,
          phaseStartedAt: new Date()
        });
      }

      if (onPhaseTransition) {
        onPhaseTransition(data);
      }
    };

    socketService.on('phase:transition', handlePhaseTransition);

    return () => {
      socketService.off('phase:transition', handlePhaseTransition);
    };
  }, [getSocketService, turnState, onPhaseTransition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  return {
    turnState,
    timeRemaining,
    isTimerActive,
    error
  };
};

export default useTurnManagement;
