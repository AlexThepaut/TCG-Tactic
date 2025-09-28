/**
 * Game Card Component - Wrapper around UnifiedCard for game context
 * Maintains backward compatibility while using the unified card architecture
 */
import React, { memo, useCallback } from 'react';
import UnifiedCard from '@/components/shared/UnifiedCard';
import type { GameCard, Faction } from '@/types';

export interface CardProps {
  card: GameCard;
  handIndex: number;
  faction: Faction;
  resources: number;
  isPlayable?: boolean;
  isSelected?: boolean;
  showDetails?: boolean;
  onSelect?: (card: GameCard, handIndex: number) => void;
  onDragStart?: (card: GameCard, handIndex: number) => void;
  onDragEnd?: (card: GameCard, handIndex: number, didDrop: boolean) => void;
  onTouch?: (e: React.TouchEvent, card: GameCard, handIndex: number) => void;
}

const Card: React.FC<CardProps> = ({
  card,
  handIndex,
  faction,
  resources,
  isPlayable = true,
  isSelected = false,
  showDetails = true,
  onSelect,
  onDragStart,
  onDragEnd,
  onTouch
}) => {
  // Handle card selection with handIndex
  const handleClick = useCallback((card: GameCard) => {
    if (onSelect) {
      onSelect(card, handIndex);
    }
  }, [onSelect, handIndex]);

  // Handle drag start with handIndex
  const handleDragStart = useCallback((card: GameCard, _handIndex?: number) => {
    if (onDragStart) {
      onDragStart(card, handIndex);
    }
  }, [onDragStart, handIndex]);

  // Handle drag end with handIndex
  const handleDragEnd = useCallback((card: GameCard, _handIndex?: number, didDrop?: boolean) => {
    if (onDragEnd) {
      onDragEnd(card, handIndex, didDrop || false);
    }
  }, [onDragEnd, handIndex]);

  // Handle touch events with handIndex
  const handleTouchStart = useCallback((e: React.TouchEvent, card: GameCard) => {
    if (onTouch) {
      onTouch(e, card, handIndex);
    }
  }, [onTouch, handIndex]);

  return (
    <UnifiedCard
      card={card}
      handIndex={handIndex}
      faction={faction}
      resources={resources}
      isPlayable={isPlayable}
      isSelected={isSelected}
      showDetails={showDetails}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouch={handleTouchStart}
    />
  );
};

export default memo(Card);