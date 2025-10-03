/**
 * useCardSelection Hook
 * Manages click-based card selection state for tactical placement
 * Coordinates two-step interaction: select card → click position
 */
import { useState, useCallback, useEffect } from 'react';
import type { SocketService } from '@/services/socketService';
import type {
  GameCard,
  GamePosition,
  SelectionState,
  CardSelectedData,
  ValidPositionsResponse
} from '@/types';

export interface UseCardSelectionOptions {
  gameId: string;
  currentPlayer: string;
  isMyTurn: boolean;
  socketService: SocketService | null;
  onError?: (error: string) => void;
  onCardPlaced?: (card: GameCard, position: GamePosition) => void;
}

export interface UseCardSelectionReturn {
  selectionState: SelectionState;
  selectCard: (card: GameCard, handIndex: number) => Promise<void>;
  placeCard: (position: GamePosition) => Promise<void>;
  clearSelection: () => void;
  isPositionValid: (position: GamePosition) => boolean;
  isCardSelected: (card: GameCard, handIndex: number) => boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing card selection and placement
 */
export function useCardSelection({
  gameId: _gameId,
  currentPlayer: _currentPlayer,
  isMyTurn,
  socketService,
  onError,
  onCardPlaced
}: UseCardSelectionOptions): UseCardSelectionReturn {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedCard: null,
    selectedHandIndex: null,
    validPositions: [],
    selectionMode: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear current selection
   */
  const clearSelection = useCallback(() => {
    if (socketService && socketService.isConnected()) {
      socketService.clearSelection();
    }

    setSelectionState({
      selectedCard: null,
      selectedHandIndex: null,
      validPositions: [],
      selectionMode: null
    });
    setError(null);
  }, [socketService]);

  /**
   * Select a card from hand (Step 1 of click-based placement)
   */
  const selectCard = useCallback(
    async (card: GameCard, handIndex: number) => {
      if (!isMyTurn) {
        const errorMsg = 'Not your turn';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Check socket connection
      if (!socketService || !socketService.isConnected()) {
        const errorMsg = 'Connection lost. Please wait for reconnection...';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // If clicking the same card, deselect it
      if (selectionState.selectedCard?.id === card.id && selectionState.selectedHandIndex === handIndex) {
        clearSelection();
        return;
      }

      setIsLoading(true);
      setError(null);

      try {

        // Emit card selection to backend for validation
        const data: CardSelectedData = {
          cardId: card.id,
          handIndex
        };

        const response: ValidPositionsResponse = await socketService.selectCard(data);

        if (!response.success) {
          const errorMsg = response.error || 'Failed to select card';
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }

        // Update selection state with valid positions
        setSelectionState({
          selectedCard: card,
          selectedHandIndex: handIndex,
          validPositions: response.validPositions || [],
          selectionMode: 'target'
        });

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to select card';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('Card selection failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isMyTurn, selectionState.selectedCard, socketService, onError, clearSelection]
  );

  /**
   * Place card at selected position (Step 2 of click-based placement)
   */
  const placeCard = useCallback(
    async (position: GamePosition) => {
      if (!selectionState.selectedCard || !isMyTurn) {
        return;
      }

      // Check socket connection
      if (!socketService || !socketService.isConnected()) {
        const errorMsg = 'Connection lost. Please wait for reconnection...';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Validate position is in valid positions
      const isValid = selectionState.validPositions.some(
        pos => pos.x === position.x && pos.y === position.y
      );

      if (!isValid) {
        const errorMsg = 'Invalid placement position';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {

        // Get hand index for the selected card
        const handIndex = 0; // TODO: Get actual hand index from selection state

        // Emit placement to backend
        const placementData = {
          cardId: selectionState.selectedCard.id,
          position,
          handIndex
        };

        const response = await socketService.placeUnit(placementData);

        if (!response.success) {
          const errorMsg = response.error || 'Failed to place card';
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }

        // Notify parent component
        onCardPlaced?.(selectionState.selectedCard, position);

        // Clear selection after successful placement
        clearSelection();

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to place card';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('Card placement failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [selectionState, isMyTurn, socketService, onError, onCardPlaced, clearSelection]
  );

  /**
   * Check if a position is valid for placement
   */
  const isPositionValid = useCallback(
    (position: GamePosition): boolean => {
      return selectionState.validPositions.some(
        pos => pos.x === position.x && pos.y === position.y
      );
    },
    [selectionState.validPositions]
  );

  /**
   * Check if a card is currently selected
   */
  const isCardSelected = useCallback(
    (card: GameCard, handIndex: number): boolean => {
      return selectionState.selectedCard?.id === card.id &&
             selectionState.selectedHandIndex === handIndex;
    },
    [selectionState.selectedCard, selectionState.selectedHandIndex]
  );

  /**
   * Clear selection when it's not our turn
   */
  useEffect(() => {
    if (!isMyTurn && selectionState.selectedCard) {
      clearSelection();
    }
  }, [isMyTurn, selectionState.selectedCard, clearSelection]);

  /**
   * Listen for valid positions updates from server
   */
  useEffect(() => {
    if (!socketService) return;

    const handleValidPositions = (response: ValidPositionsResponse) => {
      if (response.success && response.validPositions) {
        setSelectionState(prev => ({
          ...prev,
          validPositions: response.validPositions || [],
          selectionMode: 'target'
        }));
      }
    };

    socketService.on('game:valid_positions', handleValidPositions);

    return () => {
      socketService.off('game:valid_positions', handleValidPositions);
    };
  }, [socketService]);

  return {
    selectionState,
    selectCard,
    placeCard,
    clearSelection,
    isPositionValid,
    isCardSelected,
    isLoading,
    error
  };
}

export default useCardSelection;
