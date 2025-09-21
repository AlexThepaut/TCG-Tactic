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
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Game Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mx-auto">

          {/* Left Section: Turn Info + Timer */}
          <div className="flex items-center space-x-6">
            {/* Turn Indicator */}
            <div className="flex items-center space-x-3">
              <div className={clsx(
                'w-3 h-3 rounded-full transition-all duration-300',
                myTurn ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
              )} />
              <div className="flex flex-col">
                <span className={clsx(
                  'text-sm font-semibold',
                  factionClasses.text.replace('text-white', 'text-gray-100')
                )}>
                  {myTurn ? 'Your Turn' : `${opponent.username}'s Turn`}
                </span>
                <span className="text-xs text-gray-400">
                  {formatFactionName(currentPlayer.faction)} vs {formatFactionName(opponent.faction)}
                </span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-2">
              <ClockIcon className={clsx('w-5 h-5', getTimerColor(timeRemaining))} />
              <span className={clsx(
                'text-2xl font-mono font-bold',
                getTimerColor(timeRemaining)
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Center Section: End Turn Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleEndTurn}
              disabled={!myTurn || isProcessingAction}
              className={clsx(
                'px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200',
                'min-w-[120px] min-h-[48px]', // Touch-friendly sizing
                myTurn && !isProcessingAction
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              )}
            >
              {isProcessingAction ? 'Processing...' : 'End Turn'}
            </button>
          </div>

          {/* Right Section: Action Buttons + Connection Status */}
          <div className="flex items-center space-x-3">
            {/* Connection Status - Discreet */}
            {!isConnected && (
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-1 animate-pulse" />
                <span>Reconnecting</span>
              </div>
            )}

            {/* Surrender Button */}
            <div className="relative">
              <button
                onClick={handleSurrender}
                disabled={isProcessingAction}
                className={clsx(
                  'px-4 py-2 rounded-lg font-semibold transition-all duration-200',
                  'min-w-[100px] min-h-[40px]',
                  showSurrenderConfirm
                    ? 'bg-red-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                )}
              >
                {showSurrenderConfirm ? 'Confirm?' : 'Surrender'}
              </button>

              {/* Surrender Confirmation */}
              {showSurrenderConfirm && (
                <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-xl z-10">
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSurrender}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    >
                      Yes
                    </button>
                    <button
                      onClick={cancelSurrender}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={handleSettings}
              className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200"
              title="Settings"
            >
              <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Game Content Area with Side Panels */}
      <div className="flex-1 flex min-h-0">
        {/* Left Player Panel */}
        <div className="flex-shrink-0 p-3">
          <PlayerPanel
            player={currentPlayer}
            isCurrentPlayer={true}
            position="left"
            className="h-full"
          />
        </div>

        {/* Main Game Area - Full Space Battlefield */}
        <main className="flex-1 flex items-stretch justify-center min-w-0 p-4">
          <div className="flex items-center justify-between w-full max-w-7xl">
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