/**
 * GridCell Component - Interactive click-based grid cell for tactical placement
 * Handles faction formations, visual feedback, and click-based interactions
 */
import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/solid';
import type { GamePosition, GameCard, Faction } from '@/types';

export interface GridCellProps {
  position: GamePosition;
  card: GameCard | null;
  faction: Faction;
  isPlayerCell: boolean;
  isValidPosition: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: (position: GamePosition) => void;
  className?: string;
}

const GridCell: React.FC<GridCellProps> = ({
  position,
  card,
  faction,
  isPlayerCell,
  isValidPosition,
  isSelected = false,
  isHighlighted = false,
  onClick,
  className
}) => {
  // Handle cell click
  const handleClick = useCallback(() => {
    if (onClick && (isValidPosition || isHighlighted)) {
      onClick(position);
    }
  }, [onClick, position, isValidPosition, isHighlighted]);

  // Faction-specific styling
  const getFactionStyles = useCallback(() => {
    const playerFaction = isPlayerCell ? faction : (faction === 'humans' ? 'aliens' : 'humans'); // Opponent faction logic

    switch (playerFaction) {
      case 'humans':
        return {
          valid: 'border-humans-600 bg-humans-50/20',
          validHover: 'border-humans-500 bg-humans-100/30',
          validDrop: 'border-humans-400 bg-humans-200/40 shadow-lg shadow-humans-500/20',
          invalid: 'border-gray-600 bg-gray-800/20',
          invalidDrop: 'border-red-500 bg-red-500/20',
          occupied: 'border-humans-700 bg-humans-100/40',
          accent: 'text-humans-600'
        };
      case 'aliens':
        return {
          valid: 'border-aliens-700 bg-aliens-50/20',
          validHover: 'border-aliens-600 bg-aliens-100/30',
          validDrop: 'border-aliens-500 bg-aliens-200/40 shadow-lg shadow-aliens-500/20',
          invalid: 'border-gray-600 bg-gray-800/20',
          invalidDrop: 'border-red-500 bg-red-500/20',
          occupied: 'border-aliens-800 bg-aliens-100/40',
          accent: 'text-aliens-700'
        };
      case 'robots':
        return {
          valid: 'border-robots-600 bg-robots-50/20',
          validHover: 'border-robots-500 bg-robots-100/30',
          validDrop: 'border-robots-400 bg-robots-200/40 shadow-lg shadow-robots-500/20',
          invalid: 'border-gray-600 bg-gray-800/20',
          invalidDrop: 'border-red-500 bg-red-500/20',
          occupied: 'border-robots-700 bg-robots-100/40',
          accent: 'text-robots-600'
        };
      default:
        return {
          valid: 'border-gray-500 bg-gray-200/20',
          validHover: 'border-gray-400 bg-gray-200/30',
          validDrop: 'border-gray-300 bg-gray-200/40',
          invalid: 'border-gray-600 bg-gray-800/20',
          invalidDrop: 'border-red-500 bg-red-500/20',
          occupied: 'border-gray-700 bg-gray-200/40',
          accent: 'text-gray-600'
        };
    }
  }, [faction, isPlayerCell]);

  const styles = getFactionStyles();

  // Get cell styling based on current state
  const getCellStyling = useCallback(() => {
    if (card) {
      return styles.occupied;
    }
    if (isSelected) {
      return clsx(styles.validDrop, 'transform scale-105');
    }
    if (isHighlighted) {
      return clsx(styles.validHover, 'transform scale-102 cursor-pointer');
    }
    return isValidPosition ? styles.valid : styles.invalid;
  }, [card, isSelected, isHighlighted, styles, isValidPosition]);

  // Get placement indicator for highlighted cells
  const getPlacementIndicator = useCallback(() => {
    if (!isHighlighted || card) return null;

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <CheckIcon className="w-5 h-5 text-white" />
        </div>
      </motion.div>
    );
  }, [isHighlighted, card]);

  // Animation variants
  const cellVariants = {
    idle: {
      scale: 1,
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.1 }
    },
    selected: {
      scale: 1.05,
      transition: { duration: 0.1 }
    }
  };

  const getCellAnimationVariant = () => {
    if (isSelected) return 'selected';
    if (isHighlighted) return 'hover';
    return 'idle';
  };

  // Render placed card
  const renderPlacedCard = useCallback(() => {
    if (!card) return null;

    const cardFaction = card.faction;

    return (
      <motion.div
        initial={{ scale: 0, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0, rotateY: 180 }}
        transition={{ duration: 0.3 }}
        className={clsx(
          "w-full h-full rounded-lg border-2 p-1 md:p-2",
          "bg-gradient-to-br shadow-lg",
          cardFaction === 'humans' && "border-humans-600 from-humans-50 to-humans-100 text-humans-900",
          cardFaction === 'aliens' && "border-aliens-700 from-aliens-50 to-aliens-100 text-aliens-900",
          cardFaction === 'robots' && "border-robots-600 from-robots-50 to-robots-100 text-robots-900"
        )}
      >
        {/* Card Header */}
        <div className="flex justify-between items-start mb-1">
          <div className={clsx(
            "w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs font-bold",
            "bg-white/80",
            cardFaction === 'humans' && "text-humans-600",
            cardFaction === 'aliens' && "text-aliens-700",
            cardFaction === 'robots' && "text-robots-600"
          )}>
            {card.cost}
          </div>
        </div>

        {/* Card Name */}
        <h4 className="text-xs font-semibold leading-tight mb-1 line-clamp-1">
          {card.name}
        </h4>

        {/* Card Stats */}
        {card.type === 'unit' && (
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center">
              <BoltIcon className="w-3 h-3 mr-1 opacity-70" />
              <span className="font-semibold">{card.attack}</span>
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-3 h-3 mr-1 opacity-70" />
              <span className="font-semibold">{card.health}</span>
            </div>
          </div>
        )}

        {/* Damage Indicator */}
        {card.type === 'unit' && card.health < card.maxHealth && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full -mr-1 -mt-1 border border-white" />
        )}
      </motion.div>
    );
  }, [card]);

  return (
    <motion.div
      variants={cellVariants}
      initial="idle"
      animate={getCellAnimationVariant()}
      onClick={handleClick}
      className={clsx(
        "relative aspect-square border-2 rounded-lg transition-all duration-200",
        "min-h-16 md:min-h-20 lg:min-h-24",
        "backdrop-blur-sm",
        getCellStyling(),
        (isValidPosition || isHighlighted) && !card && "cursor-pointer hover:scale-105",
        className
      )}
      data-click-cell
      data-x={position.x}
      data-y={position.y}
      data-testid={`grid-cell-${position.x}-${position.y}`}
    >
      {/* Position Indicator */}
      {!card && !isHighlighted && (
        <div className="absolute top-1 left-1 text-xs opacity-30 font-mono">
          {position.x},{position.y}
        </div>
      )}

      {/* Formation Indicator */}
      {!card && isValidPosition && !isHighlighted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className={clsx("w-6 h-6", styles.accent)}>
            <ShieldCheckIcon />
          </div>
        </div>
      )}

      {/* Invalid Position Indicator */}
      {!isValidPosition && !card && !isHighlighted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <XMarkIcon className="w-6 h-6 text-gray-500" />
        </div>
      )}

      {/* Placed Card */}
      <AnimatePresence mode="wait">
        {renderPlacedCard()}
      </AnimatePresence>

      {/* Placement Indicator */}
      <AnimatePresence>
        {getPlacementIndicator()}
      </AnimatePresence>

      {/* Highlight ring for valid placement positions */}
      {!card && isHighlighted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-lg border-2 border-green-400 bg-green-500/20 pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default memo(GridCell);