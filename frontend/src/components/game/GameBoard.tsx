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
import { formatFactionName } from '@/utils/factionThemes';
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


  // Detect touch device for DnD backend
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const dndBackend = isTouchDevice ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={dndBackend}>
    <div className="h-full flex flex-col bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest relative">
      {/* Atmospheric effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-600 to-transparent"></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-aliens-600 to-transparent"></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-imperial-600 to-transparent"></div>
      </div>

      {/* Game Header */}
      <header className="bg-gothic-darkest/95 backdrop-blur-sm border-b-2 border-imperial-700/50 py-2 px-4 flex-shrink-0 relative z-10 scanlines">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent"></div>

        <div className="flex items-center justify-between mx-auto h-full">

          {/* Left Section: Turn Info + Timer */}
          <div className="flex items-center space-x-6">
            {/* Turn Indicator */}
            <div className="bg-gothic-darker/80 border border-imperial-600/30 px-3 py-2 relative group">
              <div className="flex items-center space-x-4">
                <div className={clsx(
                  'w-4 h-4 border-2 transition-all duration-300',
                  myTurn ? 'bg-imperial-500 border-imperial-400 shadow-lg shadow-imperial-500/50 animate-pulse' : 'bg-void-700 border-void-600'
                )} />
                <div className="flex flex-col">
                  <span className={clsx(
                    'text-sm font-gothic font-bold gothic-text-shadow tracking-wider',
                    myTurn ? 'text-imperial-300' : 'text-void-400'
                  )}>
                    {myTurn ? 'YOUR COMMAND' : `${opponent.username.toUpperCase()}'S TURN`}
                  </span>
                  <span className="text-xs font-tech tracking-wide text-imperial-500">
                    {formatFactionName(currentPlayer.faction).toUpperCase()} vs {formatFactionName(opponent.faction).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent group-hover:via-imperial-400 transition-colors"></div>
            </div>

            {/* Timer */}
            <div className="bg-gothic-darker/80 border border-imperial-600/30 px-3 py-2 relative group">
              <div className="flex items-center space-x-3">
                <ClockIcon className={clsx('w-5 h-5 icon-glow-imperial', getTimerColor(timeRemaining))} />
                <span className={clsx(
                  'text-2xl font-mono font-bold gothic-text-shadow',
                  getTimerColor(timeRemaining)
                )}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent group-hover:via-imperial-400 transition-colors"></div>
            </div>
          </div>

          {/* Center Section: End Turn Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleEndTurn}
              disabled={!myTurn || isProcessingAction}
              className={clsx(
                'px-6 py-3 border font-gothic font-bold text-base transition-all duration-300 relative group overflow-hidden',
                myTurn && !isProcessingAction
                  ? 'bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border-imperial-400/50 hover:box-glow-imperial transform hover:scale-105'
                  : 'bg-gothic-darker/60 text-void-500 border-void-700/30 cursor-not-allowed opacity-50'
              )}
            >
              <div className={clsx(
                'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity',
                myTurn && !isProcessingAction && 'from-imperial-900/20 to-imperial-700/10'
              )}></div>
              <span className="relative z-10 gothic-text-shadow tracking-wider">
                {isProcessingAction ? 'PROCESSING...' : 'END TURN'}
              </span>
              {myTurn && !isProcessingAction && (
                <>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </>
              )}
            </button>
          </div>

          {/* Right Section: Action Buttons + Connection Status */}
          <div className="flex items-center space-x-4">
            {/* Connection Status - Discreet */}
            {!isConnected && (
              <div className="bg-blood-600/80 border border-blood-500/50 px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center text-xs font-tech tracking-wide">
                  <div className="w-2 h-2 bg-blood-400 rounded-full mr-2 animate-pulse" />
                  <span className="text-blood-200 gothic-text-shadow">RECONNECTING</span>
                </div>
              </div>
            )}

            {/* Surrender Button */}
            <div className="relative">
              <button
                onClick={handleSurrender}
                disabled={isProcessingAction}
                className={clsx(
                  'px-4 py-2 border font-gothic font-bold transition-all duration-300 relative group overflow-hidden',
                  showSurrenderConfirm
                    ? 'bg-blood-700/80 text-blood-100 border-blood-500/50'
                    : 'bg-blood-600/80 hover:bg-blood-500 text-blood-100 border-blood-400/50 hover:box-glow-void'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blood-900/20 to-blood-700/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 gothic-text-shadow tracking-wider">
                  {showSurrenderConfirm ? 'CONFIRM?' : 'SURRENDER'}
                </span>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blood-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blood-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              {/* Surrender Confirmation */}
              {showSurrenderConfirm && (
                <div className="absolute top-full right-0 mt-2 bg-gothic-darkest/95 border-2 border-blood-700/50 p-3 shadow-xl z-10 backdrop-blur-sm">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSurrender}
                      className="px-4 py-2 bg-blood-600/80 hover:bg-blood-500 text-blood-100 border border-blood-400/50 font-tech font-bold text-sm tracking-wide transition-all"
                    >
                      <span className="gothic-text-shadow">CONFIRM</span>
                    </button>
                    <button
                      onClick={cancelSurrender}
                      className="px-4 py-2 bg-void-600/80 hover:bg-void-500 text-void-100 border border-void-400/50 font-tech font-bold text-sm tracking-wide transition-all"
                    >
                      <span className="gothic-text-shadow">CANCEL</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={handleSettings}
              className="p-3 border border-void-700/50 bg-void-600/80 hover:bg-void-500 text-void-300 hover:text-void-100 transition-all duration-300 hover:box-glow-void"
              title="Tactical Settings"
            >
              <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Game Content Area with Side Panels */}
      <div className="flex-1 flex min-h-0 relative z-10">
        {/* Left Player Panel */}
        <div className="flex-shrink-0 p-3">
          <PlayerPanel
            player={currentPlayer}
            isCurrentPlayer={true}
            position="left"
            className="h-full"
          />
        </div>

        {/* Main Game Area - Centered Battlefield */}
        <main className="flex-1 items-center justify-center min-w-0 p-4 relative">
          {/* Battlefield atmospheric effects */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-imperial-500 rounded-full animate-ember"></div>
            <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-robots-500 rounded-full animate-ember" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-2/3 left-2/3 w-1.5 h-1.5 bg-aliens-500 rounded-full animate-ember" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="flex items-center justify-center w-full relative z-10">
            {/* Current Player Grid (Left) */}
            <div className="flex flex-col items-center justify-center">
              <TacticalGrid
                player="current"
                board={currentPlayer.board}
                faction={currentPlayer.faction}
                interactive={myTurn}
                faceToFace={true}
                className="transform-gpu"
              />
            </div>

            {/* Battle Line Separator */}
            <div className="flex-shrink-0 mx-4 md:mx-8">
              <div className="w-px h-32 md:h-48 lg:h-64 bg-gradient-to-b from-transparent via-imperial-600 to-transparent opacity-60"></div>
              <div className="text-center py-4">
                <div className="text-imperial-400 font-gothic text-lg gothic-text-shadow">⚔</div>
              </div>
            </div>

            {/* Opponent Grid (Right) */}
            <div className="flex flex-col items-center justify-center">
              <TacticalGrid
                player="opponent"
                board={opponent.board}
                faction={opponent.faction}
                interactive={false}
                faceToFace={true}
                className="transform-gpu"
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