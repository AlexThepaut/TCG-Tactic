/**
 * Safe Drag & Drop Hook - Handles missing DndProvider gracefully
 * Provides fallback behavior when React DnD context is not available
 */
import { useCallback, useState } from 'react';
import type { GameCard } from '@/types';

// Safe drag hook interface
export interface SafeDragResult {
  isDragging: boolean;
  canDrag: boolean;
  drag: any;
}

export interface SafeDragOptions {
  faction?: string;
  resources?: number;
  onDragStart?: (card: GameCard, handIndex?: number) => void;
  onDragEnd?: (card: GameCard, handIndex?: number, didDrop?: boolean) => void;
}

/**
 * Safe drag hook that gracefully handles missing DndProvider
 * Falls back to basic interaction handling when drag-and-drop is not available
 */
export const useSafeDragCard = (
  card: GameCard | null,
  handIndex: number,
  options: SafeDragOptions
): SafeDragResult => {
  // If no card is provided, return safe defaults
  if (!card) {
    return {
      isDragging: false,
      canDrag: false,
      drag: null
    };
  }

  try {
    // Try to use React DnD context
    const { useDragCard } = require('@/hooks/useDragDrop');
    const result = useDragCard(card, handIndex, options);
    return result;
  } catch (error) {
    // DnD context not available or hook failed - return safe defaults
    const canDrag = card.cost <= (options.resources || 0);

    // We could potentially implement basic mouse/touch drag here
    // For now, just return safe defaults
    return {
      isDragging: false,
      canDrag,
      drag: null
    };
  }
};

/**
 * Alternative implementation that doesn't use React DnD at all
 * Provides basic interaction handling for contexts that don't need drag-and-drop
 */
export const useBasicCardInteractions = (
  card: GameCard,
  handIndex: number,
  options: SafeDragOptions
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const canDrag = card.cost <= (options.resources || 0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canDrag) return;

    setIsDragging(true);
    setDragOffset({ x: e.clientX, y: e.clientY });

    options.onDragStart?.(card, handIndex);

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragOffset(null);
      options.onDragEnd?.(card, handIndex, false);

      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setDragOffset({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
  }, [card, handIndex, canDrag, options]);

  return {
    isDragging,
    canDrag,
    dragOffset,
    drag: null,
    onMouseDown: handleMouseDown
  };
};