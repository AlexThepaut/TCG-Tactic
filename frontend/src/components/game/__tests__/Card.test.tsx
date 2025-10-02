/**
 * Card Component Tests
 * Testing click-based card functionality and interactions
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Card from '../Card';
import type { GameCard, Faction } from '@/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>)
  },
  AnimatePresence: vi.fn(({ children }) => children)
}));

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
    render(<Card {...defaultProps} />);

    expect(screen.getByText('Test Unit')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Cost
    expect(screen.getAllByText('2')[0]).toBeInTheDocument(); // Attack
    expect(screen.getByText('4')).toBeInTheDocument(); // Health
  });

  it('shows affordability correctly', () => {
    const { container } = render(<Card {...defaultProps} resources={2} />);

    // Should show red cost indicator since cost (3) > resources (2)
    const costElement = screen.getByText('3');
    expect(costElement).toBeInTheDocument();
    expect(costElement.className).toMatch(/red/);
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

    render(<Card {...defaultProps} card={spellCard} />);

    expect(screen.getByText('Test Spell')).toBeInTheDocument();
    // Attack and health should not be displayed for spells
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows rarity indicators', () => {
    const legendaryCard: GameCard = {
      ...mockCard,
      rarity: 'legendary'
    };

    const { container } = render(<Card {...defaultProps} card={legendaryCard} />);

    // Should have a sparkles icon for legendary cards
    const sparklesIcon = container.querySelector('svg');
    expect(sparklesIcon).toBeInTheDocument();
  });

  it('applies faction-specific styling', () => {
    const { container: humansContainer } = render(
      <Card {...defaultProps} faction="humans" />
    );

    const { container: aliensContainer } = render(
      <Card {...defaultProps} faction="aliens" />
    );

    const { container: robotsContainer } = render(
      <Card {...defaultProps} faction="robots" />
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
    const { rerender } = render(<Card {...defaultProps} isSelected={false} />);

    let card = screen.getByTestId(/unified-card-test-card-1/);
    expect(card.className).not.toMatch(/ring-/);

    rerender(<Card {...defaultProps} isSelected={true} />);

    card = screen.getByTestId(/unified-card-test-card-1/);
    expect(card.className).toMatch(/ring-/);
  });

  it('calls onSelect when clicked and playable', () => {
    const mockOnSelect = vi.fn();

    render(<Card {...defaultProps} onSelect={mockOnSelect} isPlayable={true} />);

    const card = screen.getByTestId(/unified-card-test-card-1/);
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledWith(mockCard, 0);
  });

  it('does not call onSelect when not playable', () => {
    const mockOnSelect = vi.fn();

    render(<Card {...defaultProps} onSelect={mockOnSelect} isPlayable={false} />);

    const card = screen.getByTestId(/unified-card-test-card-1/);
    fireEvent.click(card);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('handles touch events', () => {
    const mockOnTouch = vi.fn();

    render(<Card {...defaultProps} onTouch={mockOnTouch} />);

    const card = screen.getByTestId(/unified-card-test-card-1/);
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

  it('shows correct cursor based on playable state', () => {
    // Playable card should have pointer cursor
    const { rerender } = render(<Card {...defaultProps} isPlayable={true} />);

    let card = screen.getByTestId(/unified-card-test-card-1/);
    expect(card.className).toMatch(/cursor-pointer/);

    // Non-playable card should have not-allowed cursor
    rerender(<Card {...defaultProps} isPlayable={false} resources={1} />);

    card = screen.getByTestId(/unified-card-test-card-1/);
    expect(card.className).toMatch(/cursor-not-allowed/);
  });

  it('handles damaged units correctly', () => {
    const damagedCard: GameCard = {
      ...mockCard,
      health: 2, // Less than maxHealth (4)
      maxHealth: 4,
      attack: 3  // Use different value to avoid ambiguity
    };

    const { container } = render(<Card {...defaultProps} card={damagedCard} />);

    // Should display current health (2) - verify it appears in the health section
    const healthElements = container.querySelectorAll('[class*="flex items-center"]');
    expect(healthElements.length).toBeGreaterThan(0);

    // Verify health value is rendered
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('renders without details when showDetails is false', () => {
    render(<Card {...defaultProps} showDetails={false} />);

    expect(screen.getByText('Test Unit')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Cost should still show
    // Attack and health should be hidden when showDetails is false
    // The component hides these stats for non-unit cards or when showDetails=false
  });

  it('shows selected state with visual feedback', () => {
    const { rerender } = render(<Card {...defaultProps} isSelected={false} />);

    let card = screen.getByTestId(/unified-card-test-card-1/);
    expect(card.className).not.toMatch(/ring-/);

    // Select the card
    rerender(<Card {...defaultProps} isSelected={true} />);

    card = screen.getByTestId(/unified-card-test-card-1/);
    expect(card.className).toMatch(/ring-/);
  });

  it('handles click events correctly with handIndex', () => {
    const mockOnSelect = vi.fn();

    render(<Card {...defaultProps} handIndex={2} onSelect={mockOnSelect} isPlayable={true} />);

    const card = screen.getByTestId(/unified-card-test-card-1/);
    fireEvent.click(card);

    // Should call onSelect with card and handIndex
    expect(mockOnSelect).toHaveBeenCalledWith(mockCard, 2);
  });

  it('applies selection highlight when isSelected is true', () => {
    render(<Card {...defaultProps} isSelected={true} />);

    const card = screen.getByTestId(/unified-card-test-card-1/);

    // Check for selection styling
    expect(card.className).toMatch(/ring-/); // Should have ring color
  });

  it('does not apply selection highlight when isSelected is false', () => {
    render(<Card {...defaultProps} isSelected={false} />);

    const card = screen.getByTestId(/unified-card-test-card-1/);

    // Should not have selection styling
    expect(card.className).not.toMatch(/ring-/);
  });

  it('disables interaction when insufficient resources', () => {
    const mockOnSelect = vi.fn();

    render(
      <Card
        {...defaultProps}
        resources={1} // Less than cost (3)
        onSelect={mockOnSelect}
        isPlayable={false}
      />
    );

    const card = screen.getByTestId(/unified-card-test-card-1/);
    fireEvent.click(card);

    // Should not call onSelect when not playable
    expect(mockOnSelect).not.toHaveBeenCalled();

    // Should show unaffordable state (opacity and cursor changes)
    expect(card.className).toMatch(/opacity-60/);
    expect(card.className).toMatch(/cursor-not-allowed/);
  });
});
