import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useGridLayout } from '@/hooks/useResponsiveLayout';
import { getFactionClasses } from '@/utils/factionThemes';
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
    'relative border-2 transition-all duration-300 cursor-pointer flex items-center justify-center group',
    {
      // Base states
      'border-gothic-medium/30 bg-gothic-darker/30': !isPlayable && !card,
      [getFactionColor(faction)]: isPlayable && !card,
      'border-imperial-600/50 bg-gothic-darkest/60': card && !isHighlighted,

      // Interactive states
      'border-imperial-400 bg-imperial-500/20 animate-pulse shadow-lg shadow-imperial-500/30': isPlayable && isOver && canDrop,
      'border-imperial-300 bg-imperial-400/20 box-glow-imperial': isHighlighted,
      'border-blood-400 bg-blood-500/20 shadow-lg shadow-blood-500/50 animate-flicker': isAttackable,

      // Hover states
      'hover:border-opacity-80 hover:bg-opacity-30': isInteractive,
      'cursor-not-allowed opacity-40': !isPlayable && isInteractive,
    }
  );

  return (
    <motion.div
      ref={drop}
      className={clsx(cellClassName, 'aspect-square w-full h-full min-h-0')}
      onClick={() => isInteractive && onClick?.(position)}
      {...(isInteractive && { whileHover: { scale: 1.02 } })}
      {...(isInteractive && { whileTap: { scale: 0.98 } })}
      layout
    >
      {/* Grid Position Indicator */}
      <div className="absolute top-1 left-1 text-xs text-void-600 font-tech tracking-wider opacity-60">
        {position.y},{position.x}
      </div>

      {/* Card Display */}
      {card && (
        <motion.div
          className="w-full h-full flex flex-col items-center justify-center p-1 bg-gothic-darkest/90 border border-imperial-600/50 relative scanlines group"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Atmospheric effects */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          {/* Card Name */}
          <div className="text-xs font-gothic font-bold text-imperial-200 text-center leading-tight mb-1 gothic-text-shadow tracking-wider">
            {card.name.toUpperCase()}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-2 text-xs">
            {/* Attack */}
            <div className="flex items-center bg-blood-600/30 border border-blood-500/50 px-1 py-0.5">
              <span className="font-tech font-bold text-blood-300">{card.attack}</span>
            </div>

            {/* Health */}
            <div className="flex items-center bg-imperial-600/30 border border-imperial-500/50 px-1 py-0.5">
              <span className="font-tech font-bold text-imperial-300">{card.health}</span>
              {card.maxHealth !== card.health && (
                <span className="text-void-400 font-tech">/{card.maxHealth}</span>
              )}
            </div>
          </div>

          {/* Faction Indicator */}
          <div className={clsx('absolute bottom-1 right-1 w-3 h-3 border-2 shadow-lg', {
            'bg-humans-500 border-humans-400 shadow-humans-500/50': card.faction === 'humans',
            'bg-aliens-500 border-aliens-400 shadow-aliens-500/50': card.faction === 'aliens',
            'bg-robots-500 border-robots-400 shadow-robots-500/50': card.faction === 'robots',
          })} />
        </motion.div>
      )}

      {/* Drop Zone Indicator */}
      {isPlayable && !card && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={clsx('w-8 h-8 border-2 border-dashed transition-all duration-300 relative', {
            'border-imperial-400 bg-imperial-500/20 shadow-lg shadow-imperial-500/30': isOver && canDrop,
            'border-void-600/50': !isOver,
          })}>
            {isOver && canDrop && (
              <div className="absolute inset-0 bg-imperial-500/10 animate-pulse"></div>
            )}
            <div className="w-2 h-2 bg-current opacity-50 mx-auto"></div>
          </div>
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
  faceToFace = false,
  className,
}) => {
  const gridLayout = useGridLayout(faction);
  const { formationCells } = gridLayout;

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
        if (board[row]?.[col] !== undefined) {
          if (player === 'current') {
            // For current player, flip horizontally so it faces the opponent
            // Map to transformed[col][2-row] to flip the rows
            transformed[col][2 - row] = board[row]![col];
          } else {
            // For opponent, keep normal transformation
            transformed[col][row] = board[row]![col];
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
        if (formationCells[row]?.[col] !== undefined) {
          if (player === 'current') {
            // For current player, flip horizontally to face opponent
            transformed[col][2 - row] = formationCells[row]![col];
          } else {
            // For opponent, keep normal transformation
            transformed[col][row] = formationCells[row]![col];
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
          className={clsx('grid gap-2 border-2 p-3 w-full aspect-[3/5] relative scanlines bg-gothic-darkest/60 backdrop-blur-sm', {
            'grid-cols-5 border-imperial-700/50': !faceToFace,
            'grid-cols-3 border-imperial-700/50': faceToFace
          })}
          style={{
            maxWidth: faceToFace ? '25dvw' : '800px',
            aspectRatio: faceToFace ? '3/5' : '5/3'
          }}
        >
          {/* Atmospheric grid effects */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-500 to-transparent opacity-60"></div>
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-imperial-500 to-transparent opacity-40"></div>
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-imperial-500 to-transparent opacity-40"></div>
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