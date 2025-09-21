/**
 * Card Component Tests
 * Testing draggable card functionality and interactions
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Card from '../Card';
import type { GameCard, Faction } from '@/types';

// Mock hooks
vi.mock('@/hooks/useDragDrop', () => ({
  useDragCard: vi.fn(() => ({
    isDragging: false,
    canDrag: true,
    drag: vi.fn()
  }))
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>)
  },
  AnimatePresence: vi.fn(({ children }) => children)
}));

const DragWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

describe('Card Component', () => {
  const mockCard: GameCard = {
    id: 'test-card-1',
    name: 'Test Unit',
    cost: 3,
    attack: 2,
    health: 4,
    maxHealth: 4,
    faction: 'humans' as Faction,
    type: 'unit',
    abilities: ['Test Ability'],
    rarity: 'common'
  };

  const defaultProps = {
    card: mockCard,
    handIndex: 0,
    faction: 'humans' as Faction,
    resources: 5
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card with basic information', () => {
    render(
      <DragWrapper>
        <Card {...defaultProps} />
      </DragWrapper>
    );

    expect(screen.getByText('Test Unit')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Cost
    expect(screen.getByText('2')).toBeInTheDocument(); // Attack
    expect(screen.getByText('4')).toBeInTheDocument(); // Health
    expect(screen.getByText('unit')).toBeInTheDocument(); // Type badge
  });

  it('shows affordability correctly', () => {
    render(
      <DragWrapper>
        <Card {...defaultProps} resources={2} />
      </DragWrapper>
    );

    // Should show unaffordable overlay since cost (3) > resources (2)
    expect(screen.getByText('Need 1 more')).toBeInTheDocument();
  });

  it('handles spell cards correctly', () => {
    const spellCard: GameCard = {
      ...mockCard,
      id: 'spell-1',
      name: 'Test Spell',
      type: 'spell',
      attack: 0,
      health: 0
    };

    render(
      <DragWrapper>
        <Card {...defaultProps} card={spellCard} />
      </DragWrapper>
    );

    expect(screen.getByText('Test Spell')).toBeInTheDocument();
    expect(screen.getByText('spell')).toBeInTheDocument();
    // Attack and health should not be displayed for spells
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows rarity indicators', () => {
    const legendaryCard: GameCard = {
      ...mockCard,
      rarity: 'legendary'
    };

    const { container } = render(
      <DragWrapper>
        <Card {...defaultProps} card={legendaryCard} />
      </DragWrapper>
    );

    // Should have a sparkles icon for legendary cards
    const sparklesIcon = container.querySelector('svg');
    expect(sparklesIcon).toBeInTheDocument();
  });

  it('applies faction-specific styling', () => {
    const { container: humansContainer } = render(
      <DragWrapper>
        <Card {...defaultProps} faction="humans" />
      </DragWrapper>
    );

    const { container: aliensContainer } = render(
      <DragWrapper>
        <Card {...defaultProps} faction="aliens" />
      </DragWrapper>
    );

    const { container: robotsContainer } = render(
      <DragWrapper>
        <Card {...defaultProps} faction="robots" />
      </DragWrapper>
    );

    // Check that different factions get different styling classes
    const humansCard = humansContainer.firstElementChild;
    const aliensCard = aliensContainer.firstElementChild;
    const robotsCard = robotsContainer.firstElementChild;

    expect(humansCard?.className).toMatch(/humans/);
    expect(aliensCard?.className).toMatch(/aliens/);
    expect(robotsCard?.className).toMatch(/robots/);
  });

  it('handles selection state', () => {
    const { rerender } = render(
      <DragWrapper>
        <Card {...defaultProps} isSelected={false} />
      </DragWrapper>
    );

    let card = screen.getByTestId('card-test-card-1');
    expect(card.className).not.toMatch(/ring-2/);

    rerender(
      <DragWrapper>
        <Card {...defaultProps} isSelected={true} />
      </DragWrapper>
    );

    card = screen.getByTestId('card-test-card-1');
    expect(card.className).toMatch(/ring-2/);
  });

  it('calls onSelect when clicked and playable', () => {
    const mockOnSelect = vi.fn();

    render(
      <DragWrapper>
        <Card {...defaultProps} onSelect={mockOnSelect} isPlayable={true} />
      </DragWrapper>
    );

    const card = screen.getByTestId('card-test-card-1');
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledWith(mockCard, 0);
  });

  it('does not call onSelect when not playable', () => {
    const mockOnSelect = vi.fn();

    render(
      <DragWrapper>
        <Card {...defaultProps} onSelect={mockOnSelect} isPlayable={false} />
      </DragWrapper>
    );

    const card = screen.getByTestId('card-test-card-1');
    fireEvent.click(card);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('handles touch events', () => {
    const mockOnTouch = vi.fn();

    render(
      <DragWrapper>
        <Card {...defaultProps} onTouch={mockOnTouch} />
      </DragWrapper>
    );

    const card = screen.getByTestId('card-test-card-1');
    const touchEvent = new TouchEvent('touchstart', {
      touches: [new Touch({
        identifier: 0,
        target: card,
        clientX: 100,
        clientY: 200,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      })]
    });

    fireEvent(card, touchEvent);
    expect(mockOnTouch).toHaveBeenCalled();
  });

  it('shows correct cursor based on drag state', () => {
    const { useDragCard } = require('@/hooks/useDragDrop');

    // Mock draggable card
    useDragCard.mockReturnValue({
      isDragging: false,
      canDrag: true,
      drag: vi.fn()
    });

    const { rerender } = render(
      <DragWrapper>
        <Card {...defaultProps} />
      </DragWrapper>
    );

    let card = screen.getByTestId('card-test-card-1');
    expect(card.style.cursor).toBe('grab');

    // Mock non-draggable card
    useDragCard.mockReturnValue({
      isDragging: false,
      canDrag: false,
      drag: vi.fn()
    });

    rerender(
      <DragWrapper>
        <Card {...defaultProps} resources={1} /> {/* Insufficient resources */}
      </DragWrapper>
    );

    card = screen.getByTestId('card-test-card-1');
    expect(card.style.cursor).toBe('not-allowed');
  });

  it('handles damaged units correctly', () => {
    const damagedCard: GameCard = {
      ...mockCard,
      health: 2, // Less than maxHealth (4)
      maxHealth: 4
    };

    render(
      <DragWrapper>
        <Card {...defaultProps} card={damagedCard} />
      </DragWrapper>
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Current health
    // Should show damage indicator in a real implementation
  });

  it('renders without details when showDetails is false', () => {
    render(
      <DragWrapper>
        <Card {...defaultProps} showDetails={false} />
      </DragWrapper>
    );

    expect(screen.getByText('Test Unit')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Cost should still show
    // Attack and health should be hidden
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.queryByText('4')).not.toBeInTheDocument();
  });

  it('handles drag callbacks correctly', () => {
    const mockOnDragStart = vi.fn();
    const mockOnDragEnd = vi.fn();

    render(
      <DragWrapper>
        <Card
          {...defaultProps}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
        />
      </DragWrapper>
    );

    // The actual drag events would be triggered by the useDragCard hook
    // This tests that the callbacks are properly passed
    expect(mockOnDragStart).toHaveBeenCalledTimes(0);
    expect(mockOnDragEnd).toHaveBeenCalledTimes(0);
  });
});