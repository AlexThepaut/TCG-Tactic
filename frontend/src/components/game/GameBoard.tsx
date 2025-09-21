/**
 * GameBoard Component - Main tactical grid interface
 * Manages the 3×5 grid layout with faction formations and real-time gameplay
 */
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ClockIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/solid';
import { useDragDropManager } from '@/hooks/useDragDrop';
import useGameSocket from '@/hooks/useGameSocket';
import GridCell from './GridCell';
import Hand from './Hand';
import type {
  GameState,
  GameCard,
  GamePosition,
  DragItem
} from '@/types';

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
  // Socket integration
  const {
    isConnected,
    placeUnit,
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

  // Local state
  const [selectedCard, setSelectedCard] = useState<{
    card: GameCard;
    handIndex: number;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: string;
    position?: GamePosition;
    timestamp: number;
  } | null>(null);

  // Player data - use direct gameState for testing mode
  const currentPlayer = getCurrentPlayer() || gameState.players.player1; // Fallback to player1 for testing
  const opponent = getOpponent() || gameState.players.player2; // Fallback to player2 for testing
  const myTurn = isMyTurn() || gameState.currentPlayer === 'player-1'; // Fallback for testing
  const timeRemaining = getTimeRemaining() || gameState.timeRemaining;

  // Drag & drop setup
  const dragDropOptions = useMemo(() => ({
    faction: currentPlayer?.faction || 'humans',
    resources: currentPlayer?.resources || 0,
    board: currentPlayer?.board || Array(3).fill(null).map(() => Array(5).fill(null)),
    onDrop: async (item: DragItem, position: GamePosition): Promise<boolean> => {
      if (!myTurn || isProcessingAction) return false;

      setIsProcessingAction(true);
      try {
        const response = await placeUnit(item.cardId, position, item.handIndex);

        if (response.success) {
          setLastAction({
            type: 'place_unit',
            position,
            timestamp: Date.now()
          });

          onGameAction?.('unit_placed', {
            card: item.card,
            position,
            handIndex: item.handIndex
          });

          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to place unit:', error);
        return false;
      } finally {
        setIsProcessingAction(false);
      }
    }
  }), [currentPlayer, myTurn, isProcessingAction, placeUnit, onGameAction]);

  const {
    isDragging,
    draggedCard,
    validDropZones,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useDragDropManager(dragDropOptions);

  // Handle card selection from hand
  const handleCardSelect = useCallback((card: GameCard, handIndex: number) => {
    if (!myTurn) return;

    if (selectedCard?.handIndex === handIndex) {
      setSelectedCard(null); // Deselect if already selected
    } else {
      setSelectedCard({ card, handIndex });
    }
  }, [myTurn, selectedCard]);

  // Handle card drag from hand
  const handleCardDragStart = useCallback((card: GameCard, _handIndex: number) => {
    if (!myTurn) return;
    console.log('Card drag started:', card.name);
  }, [myTurn]);

  const handleCardDragEnd = useCallback((card: GameCard, _handIndex: number, didDrop: boolean) => {
    console.log('Card drag ended:', card.name, 'dropped:', didDrop);
    if (didDrop) {
      setSelectedCard(null); // Clear selection on successful drop
    }
  }, []);

  // Handle turn management
  const handleEndTurn = useCallback(async () => {
    if (!myTurn || isProcessingAction) return;

    setIsProcessingAction(true);
    try {
      const response = await endTurn();
      if (response.success) {
        setSelectedCard(null);
        onTurnEnd?.();
      }
    } catch (error) {
      console.error('Failed to end turn:', error);
    } finally {
      setIsProcessingAction(false);
    }
  }, [myTurn, isProcessingAction, endTurn, onTurnEnd]);

  // Handle surrender
  const handleSurrender = useCallback(async () => {
    if (isProcessingAction) return;

    const confirmed = window.confirm('Are you sure you want to surrender?');
    if (!confirmed) return;

    setIsProcessingAction(true);
    try {
      const response = await surrender();
      if (response.success) {
        onSurrender?.();
      }
    } catch (error) {
      console.error('Failed to surrender:', error);
    } finally {
      setIsProcessingAction(false);
    }
  }, [isProcessingAction, surrender, onSurrender]);

  // Timer effect
  useEffect(() => {
    if (!myTurn || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      // Time warning at 10 seconds
      if (timeRemaining <= 10 && timeRemaining > 0) {
        // Could add warning sounds or visual effects here
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [myTurn, timeRemaining]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Grid animation variants
  const gridVariants = {
    initial: {
      opacity: 0,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.02
      }
    }
  };

  const cellVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  if (!currentPlayer || !opponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-300 mb-2">
            Loading game...
          </div>
          <div className="text-gray-500">
            Waiting for player data
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Game Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {/* Player Info */}
            <div className="flex items-center space-x-4">
              <div className="text-white font-semibold">
                {currentPlayer.username}
              </div>
              <div className={clsx(
                "px-3 py-1 rounded-full text-sm font-medium",
                currentPlayer.faction === 'humans' && "bg-humans-600 text-white",
                currentPlayer.faction === 'aliens' && "bg-aliens-700 text-white",
                currentPlayer.faction === 'robots' && "bg-robots-600 text-white"
              )}>
                {currentPlayer.faction.charAt(0).toUpperCase() + currentPlayer.faction.slice(1)}
              </div>
            </div>

            {/* Turn Timer */}
            <div className="flex items-center space-x-2">
              <ClockIcon className={clsx(
                "w-5 h-5",
                timeRemaining <= 10 ? "text-red-400" : "text-gray-400"
              )} />
              <span className={clsx(
                "text-lg font-mono font-bold",
                timeRemaining <= 10 ? "text-red-400" : "text-white"
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Game Status */}
            <div className="flex items-center space-x-2">
              <div className={clsx(
                "flex items-center px-3 py-1 rounded-full text-sm font-medium",
                myTurn ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"
              )}>
                {myTurn ? <PlayIcon className="w-4 h-4 mr-1" /> : <PauseIcon className="w-4 h-4 mr-1" />}
                {myTurn ? 'Your Turn' : 'Opponent Turn'}
              </div>

              <div className="text-sm text-gray-400">
                Turn {gameState.turn} - {gameState.phase}
              </div>
            </div>

            {/* Opponent Info */}
            <div className="flex items-center space-x-4">
              <div className={clsx(
                "px-3 py-1 rounded-full text-sm font-medium",
                opponent.faction === 'humans' && "bg-humans-600 text-white",
                opponent.faction === 'aliens' && "bg-aliens-700 text-white",
                opponent.faction === 'robots' && "bg-robots-600 text-white"
              )}>
                {opponent.faction.charAt(0).toUpperCase() + opponent.faction.slice(1)}
              </div>
              <div className="text-white font-semibold">
                {opponent.username}
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Opponent Board */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="text-center mb-2">
              <div className="text-sm text-gray-400">Opponent</div>
            </div>
            <motion.div
              variants={gridVariants}
              initial="initial"
              animate="animate"
              className="grid grid-cols-5 gap-1 max-w-2xl mx-auto"
            >
              {Array.from({ length: 15 }).map((_, i) => {
                const x = i % 5;
                const y = Math.floor(i / 5);
                const position: GamePosition = { x, y };
                const card = opponent.board[y]?.[x] || null;

                return (
                  <motion.div key={`opp-${x}-${y}`} variants={cellVariants}>
                    <GridCell
                      position={position}
                      card={card}
                      faction={opponent.faction}
                      isPlayerCell={false}
                      options={{
                        ...dragDropOptions,
                        faction: opponent.faction,
                        board: opponent.board
                      }}
                      className="opacity-80"
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Player Board */}
          <div className="flex-1 p-4">
            <div className="h-full flex flex-col">
              <div className="text-center mb-2">
                <div className="text-sm text-gray-400">Your Field</div>
              </div>
              <motion.div
                variants={gridVariants}
                initial="initial"
                animate="animate"
                className="grid grid-cols-5 gap-1 max-w-2xl mx-auto flex-1"
              >
                {Array.from({ length: 15 }).map((_, i) => {
                  const x = i % 5;
                  const y = Math.floor(i / 5);
                  const position: GamePosition = { x, y };
                  const card = currentPlayer.board[y]?.[x] || null;

                  return (
                    <motion.div key={`player-${x}-${y}`} variants={cellVariants}>
                      <GridCell
                        position={position}
                        card={card}
                        faction={currentPlayer.faction}
                        isPlayerCell={true}
                        options={dragDropOptions}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={handleEndTurn}
                  disabled={!myTurn || isProcessingAction}
                  className={clsx(
                    "px-6 py-2 rounded-lg font-semibold transition-all",
                    myTurn && !isProcessingAction
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isProcessingAction ? 'Processing...' : 'End Turn'}
                </button>

                <button
                  onClick={handleSurrender}
                  disabled={isProcessingAction}
                  className="px-6 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg"
                >
                  Surrender
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <Hand
          cards={currentPlayer.hand}
          faction={currentPlayer.faction}
          resources={currentPlayer.resources}
          selectedCardIndex={selectedCard?.handIndex ?? null}
          isMyTurn={myTurn}
          onCardSelect={handleCardSelect}
          onCardDragStart={handleCardDragStart}
          onCardDragEnd={handleCardDragEnd}
          onCardTouch={handleTouchStart}
        />

        {/* Drag Preview Overlay */}
        <AnimatePresence>
          {isDragging && draggedCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-50"
            >
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
                <div className="text-sm font-semibold mb-2">
                  Dragging: {draggedCard.name}
                </div>
                <div className="text-xs text-gray-300">
                  Valid positions: {validDropZones.length}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Status */}
        {!isConnected && (
          <div className="fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Connection Lost - Reconnecting...
          </div>
        )}

        {/* Last Action Indicator */}
        <AnimatePresence>
          {lastAction && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
              onAnimationComplete={() => {
                setTimeout(() => setLastAction(null), 2000);
              }}
            >
              Action successful: {lastAction.type.replace('_', ' ')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
};

export default memo(GameBoard);