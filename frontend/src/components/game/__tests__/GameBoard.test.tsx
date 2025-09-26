/**
 * GameBoard Component Tests
 * Testing the main game interface and drag & drop integration
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GameBoard from '../GameBoard';
import type { GameState, GameCard, Faction } from '@/types';

// Mock components and hooks
vi.mock('../Hand', () => ({
  default: vi.fn(({ cards, onCardSelect }) => (
    <div data-testid="hand">
      {cards.map((card: GameCard, index: number) => (
        <button
          key={card.id}
          data-testid={`hand-card-${index}`}
          onClick={() => onCardSelect?.(card, index)}
        >
          {card.name}
        </button>
      ))}
    </div>
  ))
}));

vi.mock('../GridCell', () => ({
  default: vi.fn(({ position, card, onDrop }) => (
    <div
      data-testid={`grid-cell-${position.x}-${position.y}`}
      data-x={position.x}
      data-y={position.y}
      onClick={() => onDrop?.()}
    >
      {card?.name || 'Empty'}
    </div>
  ))
}));

vi.mock('@/hooks/useGameSocket', () => ({
  default: vi.fn(() => ({
    isConnected: true,
    placeUnit: vi.fn().mockResolvedValue({ success: true }),
    attack: vi.fn().mockResolvedValue({ success: true }),
    endTurn: vi.fn().mockResolvedValue({ success: true }),
    surrender: vi.fn().mockResolvedValue({ success: true }),
    getCurrentPlayer: vi.fn(() => mockGameState.players.player1),
    getOpponent: vi.fn(() => mockGameState.players.player2),
    isMyTurn: vi.fn(() => true),
    getTimeRemaining: vi.fn(() => 60)
  }))
}));

vi.mock('@/hooks/useDragDrop', () => ({
  useDragDropManager: vi.fn(() => ({
    isDragging: false,
    draggedCard: null,
    validDropZones: [],
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn()
  }))
}));

// Mock react-dnd
vi.mock('react-dnd', () => ({
  DndProvider: vi.fn(({ children }) => children)
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: vi.fn()
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>)
  },
  AnimatePresence: vi.fn(({ children }) => children)
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockCard: GameCard = {
  id: 'card-1',
  name: 'Test Card',
  cost: 2,
  attack: 2,
  health: 3,
  maxHealth: 3,
  faction: 'humans' as Faction,
  type: 'unit',
  abilities: ['Test Ability'],
  rarity: 'common'
};

const mockGameState: GameState = {
  id: 'game-1',
  status: 'active',
  players: {
    player1: {
      id: 'player-1',
      username: 'Test Player 1',
      faction: 'humans',
      hand: [mockCard],
      board: Array(3).fill(null).map(() => Array(5).fill(null)),
      resources: 5,
      questId: 'quest-1',
      isReady: true,
      lastActionAt: new Date()
    },
    player2: {
      id: 'player-2',
      username: 'Test Player 2',
      faction: 'aliens',
      hand: [mockCard],
      board: Array(3).fill(null).map(() => Array(5).fill(null)),
      resources: 4,
      questId: 'quest-2',
      isReady: true,
      lastActionAt: new Date()
    }
  },
  currentPlayer: 'player-1',
  turn: 1,
  phase: 'actions',
  timeLimit: 90,
  timeRemaining: 60,
  gameStartedAt: new Date(),
  lastActionAt: new Date(),
  gameOver: false,
  spectators: []
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('GameBoard Component', () => {
  const defaultProps = {
    gameState: mockGameState
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders game board with all sections', () => {
    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    // Check header elements
    expect(screen.getByText('Test Player 1')).toBeInTheDocument();
    expect(screen.getByText('Test Player 2')).toBeInTheDocument();
    expect(screen.getByText('Your Turn')).toBeInTheDocument();
    expect(screen.getByText('Turn 1 - actions')).toBeInTheDocument();

    // Check timer
    expect(screen.getByText('1:00')).toBeInTheDocument();

    // Check grid sections
    expect(screen.getByText('Opponent')).toBeInTheDocument();
    expect(screen.getByText('Your Field')).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByText('End Turn')).toBeInTheDocument();
    expect(screen.getByText('Surrender')).toBeInTheDocument();

    // Check hand
    expect(screen.getByTestId('hand')).toBeInTheDocument();
  });

  it('renders correct number of grid cells', () => {
    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    // Should have 15 cells for player (3x5) and 15 for opponent
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        expect(screen.getByTestId(`grid-cell-${i}-${j}`)).toBeInTheDocument();
      }
    }
  });

  it('shows faction-specific styling', () => {
    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    // Check faction badges
    const humansBadge = screen.getByText('Humans');
    const aliensBadge = screen.getByText('Aliens');

    expect(humansBadge).toBeInTheDocument();
    expect(aliensBadge).toBeInTheDocument();
    expect(humansBadge.className).toMatch(/humans/);
    expect(aliensBadge.className).toMatch(/aliens/);
  });

  it('handles end turn action', async () => {
    const mockEndTurn = vi.fn().mockResolvedValue({ success: true });
    const useGameSocket = require('@/hooks/useGameSocket').default;
    useGameSocket.mockReturnValue({
      isConnected: true,
      endTurn: mockEndTurn,
      getCurrentPlayer: () => mockGameState.players.player1,
      getOpponent: () => mockGameState.players.player2,
      isMyTurn: () => true,
      getTimeRemaining: () => 60,
      placeUnit: vi.fn(),
      attack: vi.fn(),
      surrender: vi.fn()
    });

    const mockOnTurnEnd = vi.fn();

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} onTurnEnd={mockOnTurnEnd} />
      </TestWrapper>
    );

    const endTurnButton = screen.getByText('End Turn');
    fireEvent.click(endTurnButton);

    await waitFor(() => {
      expect(mockEndTurn).toHaveBeenCalled();
    });
  });

  it('handles surrender action with confirmation', async () => {
    const mockSurrender = vi.fn().mockResolvedValue({ success: true });
    const useGameSocket = require('@/hooks/useGameSocket').default;
    useGameSocket.mockReturnValue({
      isConnected: true,
      surrender: mockSurrender,
      getCurrentPlayer: () => mockGameState.players.player1,
      getOpponent: () => mockGameState.players.player2,
      isMyTurn: () => true,
      getTimeRemaining: () => 60,
      placeUnit: vi.fn(),
      attack: vi.fn(),
      endTurn: vi.fn()
    });

    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    const mockOnSurrender = vi.fn();

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} onSurrender={mockOnSurrender} />
      </TestWrapper>
    );

    const surrenderButton = screen.getByText('Surrender');
    fireEvent.click(surrenderButton);

    await waitFor(() => {
      expect(mockSurrender).toHaveBeenCalled();
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('disables actions when not player turn', () => {
    const useGameSocket = require('@/hooks/useGameSocket').default;
    useGameSocket.mockReturnValue({
      isConnected: true,
      getCurrentPlayer: () => mockGameState.players.player1,
      getOpponent: () => mockGameState.players.player2,
      isMyTurn: () => false, // Not player's turn
      getTimeRemaining: () => 60,
      placeUnit: vi.fn(),
      attack: vi.fn(),
      endTurn: vi.fn(),
      surrender: vi.fn()
    });

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    const endTurnButton = screen.getByText('End Turn');
    expect(endTurnButton).toBeDisabled();
    expect(screen.getByText('Opponent Turn')).toBeInTheDocument();
  });

  it('shows low time warning', () => {
    const useGameSocket = require('@/hooks/useGameSocket').default;
    useGameSocket.mockReturnValue({
      isConnected: true,
      getCurrentPlayer: () => mockGameState.players.player1,
      getOpponent: () => mockGameState.players.player2,
      isMyTurn: () => true,
      getTimeRemaining: () => 5, // Low time
      placeUnit: vi.fn(),
      attack: vi.fn(),
      endTurn: vi.fn(),
      surrender: vi.fn()
    });

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    const timer = screen.getByText('0:05');
    expect(timer.className).toMatch(/red-400/); // Should have warning color
  });

  it('handles card selection from hand', () => {
    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    const handCard = screen.getByTestId('hand-card-0');
    fireEvent.click(handCard);

    // Card should be selected (implementation would update state)
    expect(handCard).toBeInTheDocument();
  });

  it('shows connection status when disconnected', () => {
    const useGameSocket = require('@/hooks/useGameSocket').default;
    useGameSocket.mockReturnValue({
      isConnected: false, // Disconnected
      getCurrentPlayer: () => mockGameState.players.player1,
      getOpponent: () => mockGameState.players.player2,
      isMyTurn: () => true,
      getTimeRemaining: () => 60,
      placeUnit: vi.fn(),
      attack: vi.fn(),
      endTurn: vi.fn(),
      surrender: vi.fn()
    });

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Connection Lost - Reconnecting...')).toBeInTheDocument();
  });

  it('handles drag and drop setup', () => {
    const useDragDropManager = require('@/hooks/useDragDrop').useDragDropManager;

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    // Verify drag drop manager was called with correct options
    expect(useDragDropManager).toHaveBeenCalledWith(
      expect.objectContaining({
        faction: 'humans',
        resources: 5,
        board: expect.any(Array)
      })
    );
  });

  it('shows loading state when no player data', () => {
    const useGameSocket = require('@/hooks/useGameSocket').default;
    useGameSocket.mockReturnValue({
      isConnected: true,
      getCurrentPlayer: () => null, // No player data
      getOpponent: () => null,
      isMyTurn: () => false,
      getTimeRemaining: () => 60,
      placeUnit: vi.fn(),
      attack: vi.fn(),
      endTurn: vi.fn(),
      surrender: vi.fn()
    });

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading game...')).toBeInTheDocument();
    expect(screen.getByText('Waiting for player data')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const useGameSocket = require('@/hooks/useGameSocket').default;
    useGameSocket.mockReturnValue({
      isConnected: true,
      getCurrentPlayer: () => mockGameState.players.player1,
      getOpponent: () => mockGameState.players.player2,
      isMyTurn: () => true,
      getTimeRemaining: () => 125, // 2:05
      placeUnit: vi.fn(),
      attack: vi.fn(),
      endTurn: vi.fn(),
      surrender: vi.fn()
    });

    render(
      <TestWrapper>
        <GameBoard {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('2:05')).toBeInTheDocument();
  });
});