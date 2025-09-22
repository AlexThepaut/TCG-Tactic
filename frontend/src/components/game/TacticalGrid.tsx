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
    'relative border-2 transition-all duration-500 cursor-pointer flex items-center justify-center',
    'backdrop-blur-sm transform-gpu',
    {
      // Base states
      'border-cyber-border bg-cyber-dark/30': !isPlayable && !card,
      [getFactionColor(faction)]: isPlayable && !card,
      'border-cyber-border bg-cyber-surface/60': card && !isHighlighted,

      // Interactive states - Cyberpunk styling
      'border-neon-cyan-400 bg-neon-cyan-500/20 animate-neon-pulse neon-glow-cyan': isPlayable && isOver && canDrop,
      'border-neon-cyan-300 bg-neon-cyan-300/10 neon-glow-cyan': isHighlighted,
      'border-red-400 bg-red-400/20 neon-glow-red animate-cyber-flicker': isAttackable,

      // Hover states
      'hover:border-opacity-100 hover:bg-opacity-30 hover:scale-105': isInteractive && isPlayable,
      'cursor-not-allowed opacity-30 saturate-50': !isPlayable && isInteractive,
    }
  );

  return (
    <motion.div
      ref={drop}
      className={clsx(cellClassName, 'aspect-square w-full h-full min-h-0 relative overflow-hidden')}
      onClick={() => isInteractive && onClick?.(position)}
      whileHover={isInteractive && isPlayable ? {
        scale: 1.05,
        filter: 'brightness(1.2)',
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={isInteractive ? {
        scale: 0.95,
        transition: { duration: 0.1 }
      } : undefined}
      layout
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Scanning grid lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="tech-grid opacity-30 w-full h-full" />
      </div>

      {/* Grid Position Indicator */}
      <div className="absolute top-1 left-1 text-xs text-cyber-muted font-cyber tracking-wider z-10">
        {position.y},{position.x}
      </div>

      {/* Card Display */}
      {card && (
        <motion.div
          className="w-full h-full flex flex-col items-center justify-center p-1 cyber-card-container relative z-20"
          initial={{ scale: 0, opacity: 0, rotateY: 90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0, opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Card Name */}
          <div className="text-xs font-bold font-sans text-center leading-tight mb-1 neon-text-cyan">
            {card.name}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Attack */}
            <div className="flex items-center">
              <span className="font-bold font-cyber tracking-wider text-red-400 neon-text-red">
                {card.attack}
              </span>
            </div>

            {/* Health */}
            <div className="flex items-center">
              <span className="font-bold font-cyber tracking-wider text-green-400 neon-text-green">
                {card.health}
              </span>
              {card.maxHealth !== card.health && (
                <span className="text-cyber-muted font-cyber">/{card.maxHealth}</span>
              )}
            </div>
          </div>

          {/* Faction Indicator */}
          <div className={clsx('absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 z-30', {
            'bg-humans-500 border-humans-400 neon-glow-blue': card.faction === 'humans',
            'bg-aliens-500 border-aliens-400 neon-glow-pink': card.faction === 'aliens',
            'bg-robots-500 border-robots-400 neon-glow-green': card.faction === 'robots',
          })} />

          {/* Holographic effect for cards */}
          <div className="absolute inset-0 holographic opacity-20 rounded" />
        </motion.div>
      )}

      {/* Drop Zone Indicator */}
      {isPlayable && !card && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className={clsx('w-8 h-8 rounded-full border-2 border-dashed transition-all duration-500 relative', {
            'border-neon-cyan-400 bg-neon-cyan-400/20 neon-glow-cyan animate-neon-pulse': isOver && canDrop,
            'border-cyber-border': !isOver,
          })}>
            {/* Scanning circle */}
            {isOver && canDrop && (
              <div className="absolute inset-0 rounded-full border border-neon-cyan-300 animate-ping" />
            )}
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
      {/* Grid Container with Face-to-Face Rotation - Cyberpunk */}
      <div className={clsx('relative flex justify-center w-full')}>
        <div
          className={clsx(
            'grid gap-2 border-2 rounded-xl p-4 w-full relative overflow-hidden',
            'cyber-panel backdrop-blur-md transition-all duration-500',
            'border-neon-cyan-500/40 neon-glow-cyan',
            {
              'grid-cols-5': !faceToFace,
              'grid-cols-3': faceToFace,
              'aspect-[3/5]': faceToFace,
              'aspect-[5/3]': !faceToFace
            }
          )}
          style={{
            maxWidth: faceToFace ? '25dvw' : '800px',
          }}
        >
          {/* Grid background effects */}
          <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan-500/5 via-transparent to-neon-blue-500/5 pointer-events-none" />

          {/* Corner accent lights */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-neon-cyan-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-neon-cyan-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-neon-cyan-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-neon-cyan-400 rounded-br-xl" />

          {/* Scanning line animation */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan-400 to-transparent animate-scanline opacity-60" />
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