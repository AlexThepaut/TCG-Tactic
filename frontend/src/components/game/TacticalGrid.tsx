import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useGridLayout } from '@/hooks/useResponsiveLayout';
import { getFactionClasses, formatFactionName, getFactionFormation } from '@/utils/factionThemes';
import type { GameCard, GamePosition } from '@/types';

export interface TacticalGridProps {
  player: 'current' | 'opponent';
  board: (GameCard | null)[][];
  faction: string;
  interactive?: boolean;
  highlightedCells?: GamePosition[];
  attackableCells?: GamePosition[];
  onCellClick?: (position: GamePosition) => void;
  onCardDrop?: (card: GameCard, position: GamePosition) => void;
  rotated?: boolean; // Old prop for 180-degree rotation
  faceToFace?: boolean; // New prop for 90-degree face-to-face rotation
  className?: string;
}

interface GridCellProps {
  position: GamePosition;
  card: GameCard | null;
  isPlayable: boolean;
  isHighlighted: boolean;
  isAttackable: boolean;
  isInteractive: boolean;
  cellWidth: number;
  cellHeight: number;
  faction: string;
  onClick?: (position: GamePosition) => void;
  onDrop?: (card: GameCard, position: GamePosition) => void;
}

const GridCell: React.FC<GridCellProps> = ({
  position,
  card,
  isPlayable,
  isHighlighted,
  isAttackable,
  isInteractive,
  cellWidth,
  cellHeight,
  faction,
  onClick,
  onDrop,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item: { card: GameCard }) => {
      if (onDrop && isPlayable) {
        onDrop(item.card, position);
      }
    },
    canDrop: () => isPlayable,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [isPlayable, onDrop, position]);

  const getFactionColor = (faction: string) => {
    const classes = getFactionClasses(faction as any, 'accent');
    return `${classes.border} ${classes.background}/10`;
  };

  const cellClassName = clsx(
    'relative border-2 transition-all duration-200 cursor-pointer flex items-center justify-center',
    {
      // Base states
      'border-gray-600 bg-gray-800/50': !isPlayable && !card,
      [getFactionColor(faction)]: isPlayable && !card,
      'border-gray-500 bg-gray-700/80': card && !isHighlighted,

      // Interactive states
      'border-yellow-400 bg-yellow-400/20 animate-pulse': isPlayable && isOver && canDrop,
      'border-yellow-300 bg-yellow-300/10': isHighlighted,
      'border-red-400 bg-red-400/20 shadow-lg shadow-red-400/30': isAttackable,

      // Hover states
      'hover:border-opacity-80 hover:bg-opacity-20': isInteractive,
      'cursor-not-allowed opacity-50': !isPlayable && isInteractive,
    }
  );

  return (
    <motion.div
      ref={drop}
      className={clsx(cellClassName, 'aspect-square w-full h-full min-h-0')}
      onClick={() => isInteractive && onClick?.(position)}
      whileHover={isInteractive ? { scale: 1.02 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      layout
    >
      {/* Grid Position Indicator */}
      <div className="absolute top-1 left-1 text-xs text-gray-500 font-mono">
        {position.y},{position.x}
      </div>

      {/* Card Display */}
      {card && (
        <motion.div
          className="w-full h-full flex flex-col items-center justify-center p-1 bg-gray-900/80 rounded border border-gray-600"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Card Name */}
          <div className="text-xs font-semibold text-white text-center leading-tight mb-1">
            {card.name}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-2 text-xs">
            {/* Attack */}
            <div className="flex items-center text-red-400">
              <span className="font-bold">{card.attack}</span>
            </div>

            {/* Health */}
            <div className="flex items-center text-green-400">
              <span className="font-bold">{card.health}</span>
              {card.maxHealth !== card.health && (
                <span className="text-gray-400">/{card.maxHealth}</span>
              )}
            </div>
          </div>

          {/* Faction Indicator */}
          <div className={clsx('absolute bottom-1 right-1 w-2 h-2 rounded-full', {
            'bg-blue-400': card.faction === 'humans',
            'bg-purple-400': card.faction === 'aliens',
            'bg-red-400': card.faction === 'robots',
          })} />
        </motion.div>
      )}

      {/* Drop Zone Indicator */}
      {isPlayable && !card && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={clsx('w-6 h-6 rounded-full border-2 border-dashed transition-all duration-200', {
            'border-yellow-400 bg-yellow-400/10': isOver && canDrop,
            'border-gray-500': !isOver,
          })} />
        </div>
      )}
    </motion.div>
  );
};

const TacticalGrid: React.FC<TacticalGridProps> = ({
  player,
  board,
  faction,
  interactive = false,
  highlightedCells = [],
  attackableCells = [],
  onCellClick,
  onCardDrop,
  rotated = false,
  faceToFace = false,
  className,
}) => {
  const gridLayout = useGridLayout(faction);
  const { cellWidth, cellHeight, formationCells } = gridLayout;

  // Memoize highlighted positions for performance
  const highlightedPositions = useMemo(() => {
    const positions = new Set<string>();
    highlightedCells.forEach(pos => positions.add(`${pos.x},${pos.y}`));
    return positions;
  }, [highlightedCells]);

  const attackablePositions = useMemo(() => {
    const positions = new Set<string>();
    attackableCells.forEach(pos => positions.add(`${pos.x},${pos.y}`));
    return positions;
  }, [attackableCells]);

  // Transform 3x5 board data to 5x3 for face-to-face display
  const transformedBoard = useMemo(() => {
    if (!faceToFace) return board;

    // Create 5x3 grid (5 rows, 3 columns)
    const transformed: (GameCard | null)[][] = Array(5).fill(null).map(() => Array(3).fill(null));

    // Map original 3x5 (3 rows, 5 cols) to new 5x3 (5 rows, 3 cols)
    // Original board[row][col] -> transformed[col][row]
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        if (board[row] && board[row][col] !== undefined) {
          if (player === 'current') {
            // For current player, flip horizontally so it faces the opponent
            // Map to transformed[col][2-row] to flip the rows
            transformed[col][2 - row] = board[row][col];
          } else {
            // For opponent, keep normal transformation
            transformed[col][row] = board[row][col];
          }
        }
      }
    }

    return transformed;
  }, [board, faceToFace, player]);

  // Transform formation cells for face-to-face display
  const transformedFormation = useMemo(() => {
    if (!faceToFace) return formationCells;

    // Create 5x3 formation grid
    const transformed: boolean[][] = Array(5).fill(null).map(() => Array(3).fill(false));

    // Map original formation 3x5 to new 5x3
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        if (formationCells[row] && formationCells[row][col] !== undefined) {
          if (player === 'current') {
            // For current player, flip horizontally to face opponent
            transformed[col][2 - row] = formationCells[row][col];
          } else {
            // For opponent, keep normal transformation
            transformed[col][row] = formationCells[row][col];
          }
        }
      }
    }

    return transformed;
  }, [formationCells, faceToFace, player]);

  return (
    <div className={clsx('flex flex-col', className)}>
      {/* Grid Container with Face-to-Face Rotation - Responsive */}
      <div className={clsx('relative flex justify-center w-full')}>
        <div
          className={clsx('grid gap-1 border-2 border-gray-700 rounded-lg p-2 bg-gray-900/50 w-full aspect-[3/5]', {
            'grid-cols-5': !faceToFace,
            'grid-cols-3': faceToFace
          })}
          style={{
            maxWidth: faceToFace ? '500px' : '800px',
            aspectRatio: faceToFace ? '3/5' : '5/3'
          }}
        >
          {transformedBoard.map((row, rowIndex) =>
            row.map((card, colIndex) => {
              // For faceToFace mode, we need to map back to original coordinates
              let originalPosition: GamePosition;
              if (!faceToFace) {
                originalPosition = { x: colIndex, y: rowIndex };
              } else if (player === 'current') {
                // Current player is flipped: transformed[col][2-row] = original[row][col]
                // So: transformedRow = col, transformedCol = 2-row
                // Therefore: col = transformedRow, row = 2-transformedCol
                originalPosition = { x: rowIndex, y: 2 - colIndex };
              } else {
                // Opponent normal: transformed[col][row] = original[row][col]
                // So: transformedRow = col, transformedCol = row
                // Therefore: col = transformedRow, row = transformedCol
                originalPosition = { x: rowIndex, y: colIndex };
              }

              const displayPositionKey = `${colIndex},${rowIndex}`; // For highlighting (display coords)
              const originalPositionKey = `${originalPosition.x},${originalPosition.y}`; // For game logic

              const isPlayable = transformedFormation[rowIndex]?.[colIndex] || false;
              const isHighlighted = highlightedPositions.has(originalPositionKey);
              const isAttackable = attackablePositions.has(originalPositionKey);

              return (
                <GridCell
                  key={displayPositionKey}
                  position={originalPosition}
                  card={card}
                  isPlayable={isPlayable && interactive}
                  isHighlighted={isHighlighted}
                  isAttackable={isAttackable}
                  isInteractive={interactive}
                  cellWidth={0} // Will use CSS instead
                  cellHeight={0} // Will use CSS instead
                  faction={faction}
                  onClick={onCellClick}
                  onDrop={onCardDrop}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TacticalGrid;