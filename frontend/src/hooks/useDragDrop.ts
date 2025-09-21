/**
 * useDragDrop Hook - Comprehensive drag & drop state management
 * Handles react-dnd integration, touch support, and game validation
 */
import { useCallback, useState, useRef, useEffect } from 'react';
import { useDrag, useDrop, DragSourceMonitor, DropTargetMonitor } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import type {
  DragItem,
  DropResult,
  GamePosition,
  GameCard,
  Faction
} from '@/types';
import { FORMATIONS } from '@/types';

export interface UseDragDropOptions {
  faction: Faction;
  resources: number;
  board: (GameCard | null)[][];
  validPlacements?: GamePosition[];
  onDrop?: (item: DragItem, position: GamePosition) => Promise<boolean>;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, didDrop: boolean) => void;
}

export interface DragCollectedProps {
  isDragging: boolean;
  canDrag: boolean;
  dragOffset: { x: number; y: number } | null;
}

export interface DropCollectedProps {
  isOver: boolean;
  canDrop: boolean;
  isValidDrop: boolean;
  dragItem: DragItem | null;
}

// Hook for draggable cards
export const useDragCard = (
  card: GameCard,
  handIndex: number,
  options: Pick<UseDragDropOptions, 'faction' | 'resources' | 'onDragStart' | 'onDragEnd'>
) => {
  const canDrag = card.cost <= options.resources;

  const [{ isDragging, dragOffset }, drag, preview] = useDrag<
    DragItem,
    DropResult,
    DragCollectedProps
  >({
    type: 'CARD',
    item: () => {
      const dragItem: DragItem = {
        type: 'CARD',
        id: `${card.id}-${handIndex}`,
        cardId: card.id,
        handIndex,
        card
      };

      options.onDragStart?.(dragItem);
      return dragItem;
    },
    canDrag,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
      dragOffset: monitor.getClientOffset()
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      options.onDragEnd?.(item, didDrop);
    }
  });

  // Hide default HTML5 drag preview - we'll use custom
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return {
    isDragging,
    canDrag,
    dragOffset,
    drag,
    preview
  };
};

// Hook for droppable grid cells
export const useDropCell = (
  position: GamePosition,
  options: UseDragDropOptions
) => {
  const { faction, board, onDrop } = options;
  const formation = FORMATIONS[faction];

  // Check if this position is valid for the faction
  const isValidPosition = formation.positions.some(
    pos => pos.x === position.x && pos.y === position.y
  );

  // Check if cell is occupied
  const isOccupied = board[position.y]?.[position.x] !== null;

  const [dropCollected, drop] = useDrop<
    DragItem,
    DropResult,
    DropCollectedProps
  >({
    accept: 'CARD',
    canDrop: (item) => {
      // Can't drop if position is invalid for faction
      if (!isValidPosition) return false;

      // Can't drop if cell is already occupied
      if (isOccupied) return false;

      // Can't drop if insufficient resources
      if (item.card.cost > options.resources) return false;

      return true;
    },
    drop: (item) => {
      if (!onDrop) {
        return { position, isValid: false };
      }

      // Execute async drop in background
      onDrop(item, position).catch(error => {
        console.error('Drop failed:', error);
      });

      return { position, isValid: true, faction };
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      isValidDrop: monitor.isOver() && monitor.canDrop(),
      dragItem: monitor.getItem() as DragItem | null
    })
  });

  const { isOver, canDrop, isValidDrop, dragItem } = dropCollected;

  const getCellVariant = useCallback(() => {
    if (!isValidPosition) return 'invalid';
    if (isOccupied) return 'occupied';
    if (isValidDrop) return 'valid-drop';
    if (isOver && !canDrop) return 'invalid-drop';
    if (canDrop && dragItem) return 'can-drop';
    return 'default';
  }, [isValidPosition, isOccupied, isValidDrop, isOver, canDrop, dragItem]);

  return {
    isOver,
    canDrop,
    isValidDrop,
    dragItem,
    isValidPosition,
    isOccupied,
    cellVariant: getCellVariant(),
    drop
  };
};

// Main hook for drag & drop state management
export const useDragDropManager = (options: UseDragDropOptions) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState<GameCard | null>(null);
  const [validDropZones, setValidDropZones] = useState<GamePosition[]>([]);
  const dropResultRef = useRef<DropResult | null>(null);

  const handleDragStart = useCallback((item: DragItem) => {
    setIsDragging(true);
    setDraggedCard(item.card);

    // Calculate valid drop zones for this card
    const formation = FORMATIONS[options.faction];
    const validZones = formation.positions.filter(pos => {
      const isOccupied = options.board[pos.y]?.[pos.x] !== null;
      const hasResources = item.card.cost <= options.resources;
      return !isOccupied && hasResources;
    });

    setValidDropZones(validZones);
  }, [options.faction, options.board, options.resources]);

  const handleDragEnd = useCallback((_item: DragItem, _didDrop: boolean) => {
    setIsDragging(false);
    setDraggedCard(null);
    setValidDropZones([]);

    // Clear drop result after a short delay to allow animations
    setTimeout(() => {
      dropResultRef.current = null;
    }, 300);
  }, []);

  const handleDrop = useCallback(async (item: DragItem, position: GamePosition): Promise<boolean> => {
    try {
      if (options.onDrop) {
        const success = await options.onDrop(item, position);
        dropResultRef.current = { position, isValid: success, faction: options.faction };
        return success;
      }
      return false;
    } catch (error) {
      console.error('Drop failed:', error);
      return false;
    }
  }, [options.onDrop, options.faction]);

  // Touch support utilities
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent, card: GameCard, handIndex: number) => {
    const touch = e.touches[0];
    if (!touch) return;
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });

    // Start drag after a short delay to distinguish from scroll
    setTimeout(() => {
      if (touchStartPos) {
        setIsTouchDragging(true);
        const dragItem: DragItem = {
          type: 'CARD',
          id: `${card.id}-${handIndex}`,
          cardId: card.id,
          handIndex,
          card
        };
        handleDragStart(dragItem);
      }
    }, 150);
  }, [touchStartPos, handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchDragging || !touchStartPos) return;

    e.preventDefault(); // Prevent scrolling during drag

    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);

    // Cancel if movement is too small
    if (deltaX < 10 && deltaY < 10) {
      setIsTouchDragging(false);
      setTouchStartPos(null);
    }
  }, [isTouchDragging, touchStartPos]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTouchDragging || !touchStartPos || !draggedCard) {
      setIsTouchDragging(false);
      setTouchStartPos(null);
      return;
    }

    // Find drop target element at touch position
    const touch = e.changedTouches[0];
    if (!touch) return;
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

    if (elementBelow) {
      const dropCell = elementBelow.closest('[data-drop-cell]');
      if (dropCell) {
        const posX = parseInt(dropCell.getAttribute('data-x') || '0');
        const posY = parseInt(dropCell.getAttribute('data-y') || '0');

        // Simulate drop
        const dragItem: DragItem = {
          type: 'CARD',
          id: `${draggedCard.id}-touch`,
          cardId: draggedCard.id,
          handIndex: 0, // Will be corrected by the actual implementation
          card: draggedCard
        };

        handleDrop(dragItem, { x: posX, y: posY });
      }
    }

    // Clean up touch state
    setIsTouchDragging(false);
    setTouchStartPos(null);
    handleDragEnd(
      {
        type: 'CARD',
        id: `${draggedCard.id}-touch`,
        cardId: draggedCard.id,
        handIndex: 0,
        card: draggedCard
      },
      true
    );
  }, [isTouchDragging, touchStartPos, draggedCard, handleDrop, handleDragEnd]);

  return {
    // Drag state
    isDragging,
    draggedCard,
    validDropZones,
    dropResult: dropResultRef.current,

    // Handlers
    handleDragStart,
    handleDragEnd,
    handleDrop,

    // Touch support
    isTouchDragging,
    touchStartPos,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Utilities
    isValidPosition: (position: GamePosition) => {
      const formation = FORMATIONS[options.faction];
      return formation.positions.some(pos => pos.x === position.x && pos.y === position.y);
    },

    getFormationInfo: () => FORMATIONS[options.faction],

    getDropPreview: (position: GamePosition) => {
      if (!draggedCard) return null;

      const formation = FORMATIONS[options.faction];
      const isValidPos = formation.positions.some(pos => pos.x === position.x && pos.y === position.y);
      const isOccupied = options.board[position.y]?.[position.x] !== null;
      const hasResources = draggedCard.cost <= options.resources;

      return {
        card: draggedCard,
        isValid: isValidPos && !isOccupied && hasResources,
        reason: !isValidPos ? 'Invalid position for faction' :
                isOccupied ? 'Cell occupied' :
                !hasResources ? 'Insufficient resources' : 'Valid placement'
      };
    }
  };
};

export default useDragDropManager;