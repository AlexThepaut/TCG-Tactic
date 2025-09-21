/**
 * useDragDrop Hook Tests
 * Comprehensive testing for drag & drop functionality
 */
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDragDropManager } from '../useDragDrop';
import type { GameCard, GamePosition, Faction } from '@/types';

// Mock react-dnd
vi.mock('react-dnd', () => ({
  useDrag: vi.fn(() => [
    { isDragging: false, canDrag: true, dragOffset: null },
    vi.fn(),
    vi.fn()
  ]),
  useDrop: vi.fn(() => [
    { isOver: false, canDrop: true, isValidDrop: false, dragItem: null },
    vi.fn()
  ])
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children }) => children)
  },
  AnimatePresence: vi.fn(({ children }) => children)
}));

describe('useDragDropManager', () => {
  const mockCard: GameCard = {
    id: 'test-card-1',
    name: 'Test Card',
    cost: 2,
    attack: 2,
    health: 3,
    maxHealth: 3,
    faction: 'humans' as Faction,
    type: 'unit',
    abilities: ['Test Ability']
  };

  const mockOptions = {
    faction: 'humans' as Faction,
    resources: 5,
    board: Array(3).fill(null).map(() => Array(5).fill(null)),
    onDrop: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDragDropManager(mockOptions));

    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedCard).toBeNull();
    expect(result.current.validDropZones).toEqual([]);
  });

  it('should handle drag start correctly', () => {
    const { result } = renderHook(() => useDragDropManager(mockOptions));

    const dragItem = {
      type: 'CARD' as const,
      id: 'test-card-1',
      cardId: 'test-card-1',
      handIndex: 0,
      card: mockCard
    };

    act(() => {
      result.current.handleDragStart(dragItem);
    });

    expect(result.current.isDragging).toBe(true);
    expect(result.current.draggedCard).toEqual(mockCard);
    expect(result.current.validDropZones.length).toBeGreaterThan(0);
  });

  it('should handle drag end correctly', () => {
    const { result } = renderHook(() => useDragDropManager(mockOptions));

    const dragItem = {
      type: 'CARD' as const,
      id: 'test-card-1',
      cardId: 'test-card-1',
      handIndex: 0,
      card: mockCard
    };

    // Start drag first
    act(() => {
      result.current.handleDragStart(dragItem);
    });

    // End drag
    act(() => {
      result.current.handleDragEnd(dragItem, true);
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedCard).toBeNull();
    expect(result.current.validDropZones).toEqual([]);
  });

  it('should validate position correctly for humans faction', () => {
    const { result } = renderHook(() => useDragDropManager(mockOptions));

    // Valid positions for humans (3x3 center)
    expect(result.current.isValidPosition({ x: 1, y: 0 })).toBe(true);
    expect(result.current.isValidPosition({ x: 2, y: 1 })).toBe(true);
    expect(result.current.isValidPosition({ x: 3, y: 2 })).toBe(true);

    // Invalid positions for humans
    expect(result.current.isValidPosition({ x: 0, y: 0 })).toBe(false);
    expect(result.current.isValidPosition({ x: 4, y: 0 })).toBe(false);
    expect(result.current.isValidPosition({ x: 2, y: 3 })).toBe(false);
  });

  it('should handle touch interactions', () => {
    const { result } = renderHook(() => useDragDropManager(mockOptions));

    const mockTouchEvent = {
      touches: [{ clientX: 100, clientY: 200 }],
      preventDefault: vi.fn()
    } as any;

    act(() => {
      result.current.handleTouchStart(mockTouchEvent, mockCard, 0);
    });

    expect(result.current.touchStartPos).toEqual({ x: 100, y: 200 });
  });

  it('should calculate valid drop zones based on resources', () => {
    const lowResourceOptions = {
      ...mockOptions,
      resources: 1 // Lower than card cost
    };

    const { result } = renderHook(() => useDragDropManager(lowResourceOptions));

    const dragItem = {
      type: 'CARD' as const,
      id: 'test-card-1',
      cardId: 'test-card-1',
      handIndex: 0,
      card: mockCard // Cost is 2, resources is 1
    };

    act(() => {
      result.current.handleDragStart(dragItem);
    });

    // Should have no valid drop zones due to insufficient resources
    expect(result.current.validDropZones).toEqual([]);
  });

  it('should exclude occupied positions from valid drop zones', () => {
    const occupiedBoard = Array(3).fill(null).map(() => Array(5).fill(null));
    occupiedBoard[1]![1] = mockCard; // Occupy center position

    const optionsWithOccupiedBoard = {
      ...mockOptions,
      board: occupiedBoard
    };

    const { result } = renderHook(() => useDragDropManager(optionsWithOccupiedBoard));

    const dragItem = {
      type: 'CARD' as const,
      id: 'test-card-1',
      cardId: 'test-card-1',
      handIndex: 0,
      card: mockCard
    };

    act(() => {
      result.current.handleDragStart(dragItem);
    });

    // Valid zones should exclude the occupied position
    const hasOccupiedPosition = result.current.validDropZones.some(
      pos => pos.x === 1 && pos.y === 1
    );
    expect(hasOccupiedPosition).toBe(false);
  });

  it('should provide drop preview information', () => {
    const { result } = renderHook(() => useDragDropManager(mockOptions));

    const dragItem = {
      type: 'CARD' as const,
      id: 'test-card-1',
      cardId: 'test-card-1',
      handIndex: 0,
      card: mockCard
    };

    // Start dragging
    act(() => {
      result.current.handleDragStart(dragItem);
    });

    // Test valid position
    const validPreview = result.current.getDropPreview({ x: 1, y: 1 });
    expect(validPreview).toMatchObject({
      card: mockCard,
      isValid: true,
      reason: 'Valid placement'
    });

    // Test invalid position
    const invalidPreview = result.current.getDropPreview({ x: 0, y: 0 });
    expect(invalidPreview).toMatchObject({
      card: mockCard,
      isValid: false,
      reason: 'Invalid position for faction'
    });
  });

  it('should handle different factions correctly', () => {
    const aliensOptions = {
      ...mockOptions,
      faction: 'aliens' as Faction
    };

    const { result } = renderHook(() => useDragDropManager(aliensOptions));

    const formationInfo = result.current.getFormationInfo();
    if (!formationInfo) throw new Error('Formation info not found');
    expect(formationInfo.name).toBe('Living Swarm');
    expect(formationInfo.positions.length).toBe(9); // Aliens have 9 positions

    // Test aliens-specific valid position
    expect(result.current.isValidPosition({ x: 0, y: 1 })).toBe(true); // Aliens can use x=0
    expect(result.current.isValidPosition({ x: 4, y: 1 })).toBe(true); // Aliens can use x=4
  });

  it('should call onDrop when drop is handled', async () => {
    const mockOnDrop = vi.fn().mockResolvedValue(true);
    const optionsWithDrop = {
      ...mockOptions,
      onDrop: mockOnDrop
    };

    const { result } = renderHook(() => useDragDropManager(optionsWithDrop));

    const dragItem = {
      type: 'CARD' as const,
      id: 'test-card-1',
      cardId: 'test-card-1',
      handIndex: 0,
      card: mockCard
    };

    const position: GamePosition = { x: 1, y: 1 };

    await act(async () => {
      const success = await result.current.handleDrop(dragItem, position);
      expect(success).toBe(true);
    });

    expect(mockOnDrop).toHaveBeenCalledWith(dragItem, position);
  });

  it('should handle touch move correctly', () => {
    const { result } = renderHook(() => useDragDropManager(mockOptions));

    // Start touch
    const startEvent = {
      touches: [{ clientX: 100, clientY: 200 }]
    } as any;

    act(() => {
      result.current.handleTouchStart(startEvent, mockCard, 0);
    });

    // Move touch significantly
    const moveEvent = {
      touches: [{ clientX: 150, clientY: 250 }],
      preventDefault: vi.fn()
    } as any;

    act(() => {
      result.current.handleTouchMove(moveEvent);
    });

    expect(moveEvent.preventDefault).toHaveBeenCalled();
  });
});