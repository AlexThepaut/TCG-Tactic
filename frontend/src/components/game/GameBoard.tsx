/**
 * GameBoard Component - Click-based card placement interface with combat mode
 * Simplified to pure UI orchestration - all state comes from GameSocketContext
 */
import React, { memo, useCallback, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  ClockIcon,
  CogIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useGameSocketContext } from '@/contexts/GameSocketContext';
import { formatFactionName } from '@/utils/factionThemes';
import PlayerPanel from './PlayerPanel';
import TacticalGrid from './TacticalGrid';
import HearthstoneHand from './HearthstoneHand';
import CardPreview from './CardPreview';
import CombatIndicator from './CombatIndicator';
import TurnTimer from './TurnTimer';
import { useTurnManagement } from '@/hooks/useTurnManagement';
import type { GameState, GamePosition, GameCard, SelectionState, Faction, CombatResult } from '@/types';

// Import formations for calculating valid positions in mock mode
const FORMATIONS_DATA: Record<Faction, GamePosition[]> = {
  humans: [
    { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
  ],
  aliens: [
    { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
    { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
    { x: 2, y: 2 }
  ],
  robots: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
    { x: 2, y: 1 },
    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
  ]
};

export interface GameBoardProps {
  gameState: GameState;
  useMockData?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  useMockData = false
}) => {
  // Get all socket state and actions from context (single source of truth)
  const {
    isConnected,
    getCurrentPlayer,
    getOpponent,
    isMyTurn,
    getTimeRemaining,
    endTurn,
    surrender,
    selectionState,
    selectCard,
    placeCard,
    isSelectionLoading,
    attack,
  } = useGameSocketContext();

  // Local UI state only (not game state)
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Combat mode state
  const [combatMode, setCombatMode] = useState<'placement' | 'combat_select' | 'combat_target'>('placement');
  const [selectedAttacker, setSelectedAttacker] = useState<GamePosition | null>(null);
  const [validTargets, setValidTargets] = useState<GamePosition[]>([]);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);

  // Turn management with timer (Task 1.3F)
  const { timeRemaining: turnTime, isTimerActive } = useTurnManagement({
    gameId: gameState.id,
    onTurnChanged: (turnState) => {
      console.log('Turn changed:', turnState);
    },
    onTimerExpired: () => {
      console.log('Turn timer expired - turn will auto-end');
    }
  });

  // Mock mode selection state (for testing without backend)
  const [mockSelectionState, setMockSelectionState] = useState<SelectionState>({
    selectedCard: null,
    selectedHandIndex: null,
    validPositions: [],
    selectionMode: null
  });

  // Player data - use context methods with fallback to gameState for mock mode
  const currentPlayer = getCurrentPlayer() || gameState.players.player1;
  const opponent = getOpponent() || gameState.players.player2;
  const myTurn = useMockData ? gameState.currentPlayer === 'player-1' : isMyTurn();
  const timeRemaining = useMockData ? gameState.timeRemaining : getTimeRemaining();

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
    if (!myTurn || isProcessingAction || useMockData) return;

    setIsProcessingAction(true);
    try {
      await endTurn();
    } catch (error) {
      console.error('Failed to end turn:', error);
      setErrorMessage('Failed to end turn');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsProcessingAction(false);
    }
  }, [myTurn, isProcessingAction, useMockData, endTurn]);

  // Handle surrender
  const handleSurrender = useCallback(async () => {
    if (isProcessingAction || useMockData) return;

    if (!showSurrenderConfirm) {
      setShowSurrenderConfirm(true);
      return;
    }

    setIsProcessingAction(true);
    try {
      await surrender();
    } catch (error) {
      console.error('Failed to surrender:', error);
      setErrorMessage('Failed to surrender');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsProcessingAction(false);
      setShowSurrenderConfirm(false);
    }
  }, [isProcessingAction, useMockData, showSurrenderConfirm, surrender]);

  // Handle settings
  const handleSettings = useCallback(() => {
    // TODO: Implement settings menu
    console.log('Settings clicked');
  }, []);

  // Cancel surrender confirmation
  const cancelSurrender = useCallback(() => {
    setShowSurrenderConfirm(false);
  }, []);

  // Toggle combat mode
  const handleToggleCombatMode = useCallback(() => {
    if (combatMode === 'placement') {
      setCombatMode('combat_select');
      setErrorMessage('Combat Mode: Select a unit to attack with');
      setTimeout(() => setErrorMessage(null), 2000);
    } else {
      setCombatMode('placement');
      setSelectedAttacker(null);
      setValidTargets([]);
      setErrorMessage('Placement Mode');
      setTimeout(() => setErrorMessage(null), 2000);
    }
  }, [combatMode]);

  // Get valid attack targets for a unit (simplified - would come from backend in real impl)
  const getValidAttackTargets = useCallback((position: GamePosition): GamePosition[] => {
    const unit = currentPlayer.board[position.y]?.[position.x];
    if (!unit) return [];

    // Basic range check: units can attack adjacent opponent units
    const targets: GamePosition[] = [];
    const range = unit.range || 1;

    // Check opponent's board for valid targets within range
    opponent.board.forEach((row, rowIndex) => {
      row.forEach((targetUnit, colIndex) => {
        if (targetUnit) {
          const distance = Math.abs(position.x - colIndex) + Math.abs(position.y - rowIndex);
          if (distance <= range) {
            targets.push({ x: colIndex, y: rowIndex });
          }
        }
      });
    });

    return targets;
  }, [currentPlayer.board, opponent.board]);

  // Handle combat unit selection (Step 1)
  const handleCombatUnitSelect = useCallback(async (position: GamePosition) => {
    if (!myTurn || combatMode !== 'combat_select') return;

    const unit = currentPlayer.board[position.y]?.[position.x];
    if (!unit) {
      setErrorMessage('No unit at this position');
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    // Check if unit has already attacked this turn (would be tracked in gameState)
    // For now, simplified check

    // Get valid targets
    const targets = getValidAttackTargets(position);

    if (targets.length === 0) {
      setErrorMessage('No valid targets in range');
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    setSelectedAttacker(position);
    setValidTargets(targets);
    setCombatMode('combat_target');
    setErrorMessage(`Select target for ${unit.name}`);
    setTimeout(() => setErrorMessage(null), 2000);
  }, [myTurn, combatMode, currentPlayer.board, getValidAttackTargets]);

  // Handle attack target selection (Step 2)
  const handleAttackTarget = useCallback(async (targetPos: GamePosition) => {
    if (!selectedAttacker || combatMode !== 'combat_target') return;

    // Validate target is in valid targets list
    const isValid = validTargets.some(pos => pos.x === targetPos.x && pos.y === targetPos.y);
    if (!isValid) {
      setErrorMessage('Invalid target position');
      setTimeout(() => setErrorMessage(null), 2000);
      return;
    }

    setIsProcessingAction(true);
    try {
      await attack(selectedAttacker, targetPos);

      // Clear combat mode after attack
      setCombatMode('placement');
      setSelectedAttacker(null);
      setValidTargets([]);
    } catch (error) {
      console.error('Attack failed:', error);
      setErrorMessage('Attack failed');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsProcessingAction(false);
    }
  }, [selectedAttacker, combatMode, validTargets, attack]);

  // Listen for combat result events from socket
  useEffect(() => {
    const socketService = (window as any).__socketService;
    if (!socketService) return;

    const handleCombatResultEvent = (result: CombatResult) => {
      console.log('Combat result received in GameBoard:', result);
      setCombatResult(result);

      // Clear after animation (2 seconds)
      setTimeout(() => {
        setCombatResult(null);
      }, 2000);
    };

    socketService.on('game:combat_result', handleCombatResultEvent);

    return () => {
      socketService.off('game:combat_result', handleCombatResultEvent);
    };
  }, []);

  // Calculate valid positions for mock mode
  const getValidPositionsForMockMode = useCallback((faction: Faction, board: (GameCard | null)[][]) => {
    // Get faction formation positions
    const formationPositions = FORMATIONS_DATA[faction] || [];

    // Filter out occupied positions
    const validPositions = formationPositions.filter(pos => {
      // Check if position is within board bounds
      if (pos.x < 0 || pos.x >= 5 || pos.y < 0 || pos.y >= 3) return false;

      // Check if position is not occupied (board is [row][col], position is {x: col, y: row})
      const row = board[pos.y];
      return row && !row[pos.x];
    });

    return validPositions;
  }, []);

  // Handle card selection (Step 1 of two-step placement)
  const handleCardClick = useCallback(async (card: GameCard, index: number) => {
    // Mock mode: Handle locally without socket
    if (useMockData) {
      if (!myTurn) return;

      // Check if clicking the same card (deselect)
      if (mockSelectionState.selectedCard?.id === card.id && mockSelectionState.selectedHandIndex === index) {
        console.log('Deselecting card in mock mode:', card.name);
        setMockSelectionState({
          selectedCard: null,
          selectedHandIndex: null,
          validPositions: [],
          selectionMode: null
        });
        return;
      }

      // Check if player can afford the card
      if (card.cost > currentPlayer.resources) {
        setErrorMessage(`Insufficient resources. Need ${card.cost}, have ${currentPlayer.resources}`);
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      // Calculate valid positions based on faction
      const validPositions = getValidPositionsForMockMode(currentPlayer.faction, currentPlayer.board);

      if (validPositions.length === 0) {
        setErrorMessage('No valid placement positions available');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      console.log('Card selected in mock mode:', card.name, 'at index', index, 'Valid positions:', validPositions.length);

      // Update mock selection state
      setMockSelectionState({
        selectedCard: card,
        selectedHandIndex: index,
        validPositions,
        selectionMode: 'target'
      });

      return;
    }

    // Real mode: Use socket
    if (!myTurn || isSelectionLoading) return;

    try {
      await selectCard(card, index);
    } catch (error) {
      console.error('Failed to select card:', error);
      setErrorMessage('Failed to select card');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [useMockData, myTurn, isSelectionLoading, selectCard, mockSelectionState, currentPlayer, getValidPositionsForMockMode]);

  // Handle cell click - routes to placement or combat based on mode
  const handleCellClick = useCallback(async (position: GamePosition) => {
    // Route to combat mode handlers if in combat mode
    if (combatMode === 'combat_select') {
      // Clicking on own board to select attacker
      await handleCombatUnitSelect(position);
      return;
    }

    if (combatMode === 'combat_target') {
      // Clicking on opponent board to select target
      await handleAttackTarget(position);
      return;
    }

    // Otherwise, handle placement mode (original logic)
    // Mock mode: Handle locally without socket
    if (useMockData) {
      if (!mockSelectionState.selectedCard || !myTurn || isProcessingAction) return;

      // Validate position is in valid positions
      const isValid = mockSelectionState.validPositions.some(
        pos => pos.x === position.x && pos.y === position.y
      );

      if (!isValid) {
        setErrorMessage('Invalid placement position');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      console.log('Mock placement:', mockSelectionState.selectedCard.name, 'at', position);

      // In mock mode, just clear selection to show it worked
      // In a real implementation, we would update the gameState.players.player1.board
      setMockSelectionState({
        selectedCard: null,
        selectedHandIndex: null,
        validPositions: [],
        selectionMode: null
      });

      // Show success message
      setErrorMessage(`✅ Card placed successfully (mock mode)`);
      setTimeout(() => setErrorMessage(null), 2000);

      return;
    }

    // Real mode: Use socket for placement
    if (!selectionState.selectedCard || !myTurn || isProcessingAction) return;

    setIsProcessingAction(true);
    try {
      await placeCard(position);
    } catch (error) {
      console.error('Failed to place card:', error);
      setErrorMessage('Failed to place card');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsProcessingAction(false);
    }
  }, [combatMode, handleCombatUnitSelect, handleAttackTarget, useMockData, mockSelectionState, selectionState.selectedCard, myTurn, isProcessingAction, placeCard]);

  return (
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

            {/* Turn Timer (Task 1.3F) */}
            <TurnTimer
              timeRemaining={turnTime}
              timeLimit={gameState.timeLimit || 300}
              isMyTurn={myTurn}
              className="min-w-[240px]"
            />
          </div>

          {/* Center Section: Combat Mode Toggle + End Turn Button */}
          <div className="flex-shrink-0 flex items-center space-x-4">
            {/* Combat Mode Toggle */}
            <button
              onClick={handleToggleCombatMode}
              disabled={!myTurn || isProcessingAction || useMockData}
              className={clsx(
                'px-5 py-3 border font-gothic font-bold text-base transition-all duration-300 relative group overflow-hidden',
                myTurn && !isProcessingAction && !useMockData
                  ? combatMode !== 'placement'
                    ? 'bg-blood-600/80 hover:bg-blood-500 text-blood-100 border-blood-400/50 hover:box-glow-void'
                    : 'bg-void-600/80 hover:bg-void-500 text-void-100 border-void-400/50 hover:box-glow-void'
                  : 'bg-gothic-darker/60 text-void-500 border-void-700/30 cursor-not-allowed opacity-50'
              )}
            >
              <div className={clsx(
                'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity',
                myTurn && !isProcessingAction && !useMockData && (
                  combatMode !== 'placement'
                    ? 'from-blood-900/20 to-blood-700/10'
                    : 'from-void-900/20 to-void-700/10'
                )
              )}></div>
              <div className="relative z-10 flex items-center space-x-2">
                <ShieldExclamationIcon className="w-5 h-5" />
                <span className="gothic-text-shadow tracking-wider">
                  {combatMode !== 'placement' ? 'ATTACKING' : 'ATTACK MODE'}
                </span>
              </div>
              {myTurn && !isProcessingAction && !useMockData && (
                <>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blood-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blood-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </>
              )}
            </button>

            {/* End Turn Button */}
            <button
              onClick={handleEndTurn}
              disabled={!myTurn || isProcessingAction || useMockData}
              className={clsx(
                'px-6 py-3 border font-gothic font-bold text-base transition-all duration-300 relative group overflow-hidden',
                myTurn && !isProcessingAction && !useMockData
                  ? 'bg-imperial-600/80 hover:bg-imperial-500 text-imperial-100 border-imperial-400/50 hover:box-glow-imperial transform hover:scale-105'
                  : 'bg-gothic-darker/60 text-void-500 border-void-700/30 cursor-not-allowed opacity-50'
              )}
            >
              <div className={clsx(
                'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity',
                myTurn && !isProcessingAction && !useMockData && 'from-imperial-900/20 to-imperial-700/10'
              )}></div>
              <span className="relative z-10 gothic-text-shadow tracking-wider">
                {isProcessingAction ? 'PROCESSING...' : 'END TURN'}
              </span>
              {myTurn && !isProcessingAction && !useMockData && (
                <>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </>
              )}
            </button>
          </div>

          {/* Right Section: Action Buttons + Connection Status */}
          <div className="flex items-center space-x-4">
            {/* Connection Status - Only show if not connected and not in mock mode */}
            {!isConnected && !useMockData && (
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
                disabled={isProcessingAction || useMockData}
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

        {/* Main Game Area - Battlefield with Previews and Hand */}
        <main className="flex-1 flex flex-col min-w-0 p-4 relative">
          {/* Battlefield atmospheric effects */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-imperial-500 rounded-full animate-ember"></div>
            <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-robots-500 rounded-full animate-ember" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-2/3 left-2/3 w-1.5 h-1.5 bg-aliens-500 rounded-full animate-ember" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Grid Area with Flanking Previews */}
          <div className="flex-1 flex items-center justify-center gap-4 md:gap-6 relative z-10">
            {/* Left Preview - Current Player */}
            <CardPreview
              card={useMockData ? mockSelectionState.selectedCard : selectionState.selectedCard}
              faction={currentPlayer.faction}
              position="left"
              className="flex-shrink-0"
            />

            {/* Grids Container with Combat Indicator */}
            <div className="flex items-center justify-center relative">
              {/* Current Player Grid (Left) */}
              <div className="flex flex-col items-center justify-center">
                <TacticalGrid
                  player="current"
                  board={currentPlayer.board}
                  faction={currentPlayer.faction}
                  interactive={myTurn}
                  highlightedCells={
                    combatMode === 'combat_select'
                      ? [] // Show no highlights when selecting attacker
                      : combatMode === 'combat_target'
                      ? [] // Highlights will be on opponent grid
                      : useMockData ? mockSelectionState.validPositions : selectionState.validPositions
                  }
                  onCellClick={handleCellClick}
                  faceToFace={true}
                  className="transform-gpu"
                />
              </div>

              {/* Battle Line Separator */}
              <div className="flex-shrink-0 mx-4 md:mx-8">
                <div className="w-px h-32 md:h-48 lg:h-64 bg-gradient-to-b from-transparent via-imperial-600 to-transparent opacity-60"></div>
              </div>

              {/* Opponent Grid (Right) */}
              <div className="flex flex-col items-center justify-center">
                <TacticalGrid
                  player="opponent"
                  board={opponent.board}
                  faction={opponent.faction}
                  interactive={combatMode === 'combat_target'} // Make interactive in combat target mode
                  highlightedCells={combatMode === 'combat_target' ? validTargets : []}
                  onCellClick={handleCellClick}
                  faceToFace={true}
                  className="transform-gpu"
                />
              </div>

              {/* Combat Indicator Overlay - Only show when there's something to display */}
              {((combatMode !== 'placement' && (selectedAttacker || validTargets.length > 0)) || combatResult) && (() => {
                const attackerPos = selectedAttacker || (combatResult?.attacker.position);
                const targetPos = combatResult?.target.position;
                const result = combatResult || undefined;

                return (
                  <div className="absolute inset-0 pointer-events-none">
                    <CombatIndicator
                      {...(attackerPos && { attackerPosition: attackerPos })}
                      {...(targetPos && { targetPosition: targetPos })}
                      validTargets={validTargets}
                      {...(result && { combatResult: result })}
                      showRangeIndicator={combatMode === 'combat_select'}
                      faction={currentPlayer.faction}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Right Preview - Opponent (Face Down) */}
            <CardPreview
              card={null}
              faction={opponent.faction}
              position="right"
              isFaceDown={true}
              className="flex-shrink-0"
            />
          </div>

          {/* Hand Section Below Grid */}
          <div className="flex-shrink-0 h-[200px] border-t border-imperial-700/30 mt-4 relative z-10">
            <HearthstoneHand
              cards={currentPlayer.hand}
              faction={currentPlayer.faction}
              resources={currentPlayer.resources}
              selectedCardId={useMockData
                ? (mockSelectionState.selectedCard?.id ?? null)
                : (selectionState.selectedCard?.id ?? null)}
              selectedHandIndex={useMockData
                ? (mockSelectionState.selectedHandIndex ?? null)
                : (selectionState.selectedHandIndex ?? null)}
              isMyTurn={myTurn}
              onCardClick={handleCardClick}
            />
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

      {/* Error Notification */}
      {errorMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-60 pointer-events-none">
          <div className="bg-blood-700/95 border-2 border-blood-500/50 px-6 py-3 backdrop-blur-sm shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blood-400 rounded-full animate-pulse" />
              <span className="text-blood-100 font-gothic font-bold tracking-wide gothic-text-shadow">
                {errorMessage}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(GameBoard);
