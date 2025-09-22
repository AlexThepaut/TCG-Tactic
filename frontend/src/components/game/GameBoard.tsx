/**
 * GameBoard Component - Clean header-only implementation
 * Starting fresh with just turn info, timer, and action buttons
 */
import React, { memo, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import {
  ClockIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import useGameSocket from '@/hooks/useGameSocket';
import { getFactionClasses, formatFactionName } from '@/utils/factionThemes';
import PlayerPanel from './PlayerPanel';
import TacticalGrid from './TacticalGrid';
import type { GameState } from '@/types';

export interface GameBoardProps {
  gameState: GameState;
  onGameAction?: (action: string, data: any) => void;
  onTurnEnd?: () => void;
  onSurrender?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onGameAction,
  onTurnEnd,
  onSurrender
}) => {
  // Socket integration for real-time game state
  const {
    isConnected,
    endTurn,
    surrender,
    getCurrentPlayer,
    getOpponent,
    isMyTurn,
    getTimeRemaining
  } = useGameSocket({
    gameId: gameState.id,
    callbacks: {
      onGameStateUpdate: (newState) => {
        console.log('Game board received state update:', newState);
      },
      onTurnChanged: (currentPlayer, timeRemaining) => {
        console.log('Turn changed:', currentPlayer, timeRemaining);
      },
      onGameError: (error) => {
        console.error('Game error:', error);
      }
    }
  });

  // Local state for UI interactions
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);

  // Player data - use socket data with fallback to gameState
  const currentPlayer = getCurrentPlayer() || gameState.players.player1;
  const opponent = getOpponent() || gameState.players.player2;
  const myTurn = isMyTurn() || gameState.currentPlayer === 'player-1';
  const timeRemaining = getTimeRemaining() || gameState.timeRemaining;

  // Format time display (MM:SS)
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get time-based color for timer
  const getTimerColor = useCallback((seconds: number) => {
    if (seconds <= 10) return 'text-red-400';
    if (seconds <= 30) return 'text-yellow-400';
    return 'text-green-400';
  }, []);

  // Handle turn end
  const handleEndTurn = useCallback(async () => {
    if (!myTurn || isProcessingAction) return;

    setIsProcessingAction(true);
    try {
      const response = await endTurn();
      if (response.success) {
        onTurnEnd?.();
        onGameAction?.('turn_ended', { playerId: currentPlayer.id });
      }
    } catch (error) {
      console.error('Failed to end turn:', error);
    } finally {
      setIsProcessingAction(false);
    }
  }, [myTurn, isProcessingAction, endTurn, onTurnEnd, onGameAction, currentPlayer.id]);

  // Handle surrender
  const handleSurrender = useCallback(async () => {
    if (isProcessingAction) return;

    if (!showSurrenderConfirm) {
      setShowSurrenderConfirm(true);
      return;
    }

    setIsProcessingAction(true);
    try {
      const response = await surrender();
      if (response.success) {
        onSurrender?.();
        onGameAction?.('surrendered', { playerId: currentPlayer.id });
      }
    } catch (error) {
      console.error('Failed to surrender:', error);
    } finally {
      setIsProcessingAction(false);
      setShowSurrenderConfirm(false);
    }
  }, [isProcessingAction, showSurrenderConfirm, surrender, onSurrender, onGameAction, currentPlayer.id]);

  // Handle settings
  const handleSettings = useCallback(() => {
    // TODO: Implement settings menu
    console.log('Settings clicked');
  }, []);

  // Cancel surrender confirmation
  const cancelSurrender = useCallback(() => {
    setShowSurrenderConfirm(false);
  }, []);

  // Get faction styling for current player
  const factionClasses = getFactionClasses(currentPlayer.faction, 'primary');

  // Detect touch device for DnD backend
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const dndBackend = isTouchDevice ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={dndBackend}>
    <div className="h-full flex flex-col bg-cyber-black relative overflow-hidden">
      {/* Cyberpunk background pattern */}
      <div className="cyber-bg-pattern" />

      {/* Game Header */}
      <header className="cyber-panel border-b-2 border-neon-cyan-500/30 p-4 flex-shrink-0 relative z-10 scanlines">
        {/* Header glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan-500/5 to-transparent" />
        <div className="flex items-center justify-between mx-auto">

          {/* Left Section: Turn Info + Timer */}
          <div className="flex items-center space-x-8 relative z-10">
            {/* Turn Indicator */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={clsx(
                  'w-4 h-4 rounded-full transition-all duration-500 border-2',
                  myTurn ? 'bg-neon-cyan-500 border-neon-cyan-400 animate-neon-pulse neon-glow-cyan' : 'bg-cyber-muted border-cyber-border'
                )} />
                {myTurn && (
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-neon-cyan-500 animate-ping opacity-75" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={clsx(
                  'text-sm font-bold font-cyber tracking-wider uppercase',
                  myTurn ? 'neon-text-cyan' : 'text-cyber-muted'
                )}>
                  {myTurn ? 'YOUR TURN' : `${opponent.username.toUpperCase()}'S TURN`}
                </span>
                <span className="text-xs font-mono text-cyber-muted">
                  {formatFactionName(currentPlayer.faction).toUpperCase()} VS {formatFactionName(opponent.faction).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-3 cyber-panel px-4 py-2 rounded-lg">
              <ClockIcon className={clsx(
                'w-6 h-6 transition-all duration-300',
                getTimerColor(timeRemaining),
                timeRemaining <= 10 && 'animate-cyber-flicker'
              )} />
              <span className={clsx(
                'text-3xl font-cyber font-bold tracking-wider',
                getTimerColor(timeRemaining),
                timeRemaining <= 30 && 'animate-neon-pulse'
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Center Section: End Turn Button */}
          <div className="flex-shrink-0 relative z-10">
            <button
              onClick={handleEndTurn}
              disabled={!myTurn || isProcessingAction}
              className={clsx(
                'neon-button px-10 py-4 rounded-xl font-bold text-lg font-cyber tracking-wider uppercase',
                'min-w-[160px] min-h-[56px] relative overflow-hidden transition-all duration-500', // Touch-friendly sizing
                myTurn && !isProcessingAction
                  ? 'text-neon-cyan-400 border-neon-cyan-400 neon-glow-cyan hover:text-neon-cyan-300 hover:border-neon-cyan-300 transform hover:scale-105'
                  : 'text-cyber-muted border-cyber-border cursor-not-allowed opacity-40'
              )}
            >
              <span className="relative z-10">
                {isProcessingAction ? 'PROCESSING...' : 'END TURN'}
              </span>
              {myTurn && !isProcessingAction && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan-500/10 to-transparent animate-scanline" />
              )}
            </button>
          </div>

          {/* Right Section: Action Buttons + Connection Status */}
          <div className="flex items-center space-x-4 relative z-10">
            {/* Connection Status - Cyberpunk */}
            {!isConnected && (
              <div className="flex items-center text-xs font-cyber text-red-400 cyber-panel px-3 py-1 rounded-lg">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-cyber-flicker neon-glow-red" />
                <span className="tracking-wider uppercase">RECONNECTING</span>
              </div>
            )}

            {/* Surrender Button */}
            <div className="relative">
              <button
                onClick={handleSurrender}
                disabled={isProcessingAction}
                className={clsx(
                  'neon-button px-6 py-3 rounded-lg font-bold font-cyber tracking-wider uppercase transition-all duration-300',
                  'min-w-[120px] min-h-[48px] text-sm',
                  showSurrenderConfirm
                    ? 'text-red-300 border-red-300 neon-glow-red animate-cyber-flicker'
                    : 'text-red-400 border-red-400 hover:text-red-300 hover:border-red-300'
                )}
              >
                {showSurrenderConfirm ? 'CONFIRM?' : 'SURRENDER'}
              </button>

              {/* Surrender Confirmation */}
              {showSurrenderConfirm && (
                <div className="absolute top-full right-0 mt-2 cyber-panel rounded-lg p-3 shadow-2xl z-20 border border-red-400/30">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSurrender}
                      className="neon-button px-4 py-2 text-red-400 border-red-400 hover:text-red-300 hover:border-red-300 text-sm font-cyber tracking-wider rounded"
                    >
                      YES
                    </button>
                    <button
                      onClick={cancelSurrender}
                      className="neon-button px-4 py-2 text-cyber-muted border-cyber-border hover:text-neon-cyan-400 hover:border-neon-cyan-400 text-sm font-cyber tracking-wider rounded"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={handleSettings}
              className="p-4 rounded-lg cyber-panel text-cyber-muted hover:text-neon-cyan-400 transition-all duration-300 hover:neon-glow-cyan group"
              title="Settings"
            >
              <CogIcon className="w-6 h-6 group-hover:animate-spin" />
            </button>
          </div>
        </div>
      </header>

      {/* Game Content Area with Side Panels */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Tech grid overlay for main area */}
        <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none" />

        {/* Left Player Panel */}
        <div className="flex-shrink-0 p-4">
          <PlayerPanel
            player={currentPlayer}
            isCurrentPlayer={true}
            position="left"
            className="h-full"
          />
        </div>

        {/* Main Game Area - Full Space Battlefield */}
        <main className="flex-1 flex items-stretch justify-center min-w-0 p-6 relative">
          <div className="flex items-center justify-between w-full max-w-7xl relative z-10">
            {/* Current Player Grid (Left) - Take available space */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <TacticalGrid
                player="current"
                board={currentPlayer.board}
                faction={currentPlayer.faction}
                interactive={myTurn}
                faceToFace={true}
                className="transform-gpu w-full max-w-md"
              />
            </div>

            {/* Opponent Grid (Right) - Take available space */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <TacticalGrid
                player="opponent"
                board={opponent.board}
                faction={opponent.faction}
                interactive={false}
                faceToFace={true}
                className="transform-gpu w-full max-w-md"
              />
            </div>
          </div>
        </main>

        {/* Right Side - Player Panel Only */}
        <div className="flex-shrink-0 p-3">
          <PlayerPanel
            player={opponent}
            isCurrentPlayer={false}
            position="right"
            className="h-full"
          />
        </div>
      </div>
    </div>
    </DndProvider>
  );
};

export default memo(GameBoard);