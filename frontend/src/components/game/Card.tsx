/**
 * Game Card Component - Draggable card with faction styling and animations
 * Supports both desktop drag & drop and mobile touch interactions
 */
import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import { useDragCard } from '@/hooks/useDragDrop';
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
  const canAfford = card.cost <= resources;
  const canPlay = isPlayable && canAfford;

  // Drag & drop integration
  const { isDragging, canDrag, drag } = useDragCard(
    card,
    handIndex,
    {
      faction,
      resources,
      onDragStart: (item) => onDragStart?.(item.card, item.handIndex),
      onDragEnd: (item, didDrop) => onDragEnd?.(item.card, item.handIndex, didDrop)
    }
  );

  // Handle card selection
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onSelect && canPlay) {
      onSelect(card, handIndex);
    }
  }, [onSelect, card, handIndex, canPlay]);

  // Handle touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    onTouch?.(e, card, handIndex);
  }, [onTouch, card, handIndex]);

  // Faction-specific styling
  const getFactionStyles = useCallback(() => {
    switch (faction) {
      case 'humans':
        return {
          border: canPlay ? 'border-humans-600' : 'border-humans-800/50',
          bg: canPlay ? 'bg-gradient-to-br from-humans-50 to-humans-100' : 'bg-humans-900/20',
          text: canPlay ? 'text-humans-900' : 'text-humans-400',
          accent: 'text-humans-600',
          glow: isDragging ? 'shadow-lg shadow-humans-500/30' : ''
        };
      case 'aliens':
        return {
          border: canPlay ? 'border-aliens-700' : 'border-aliens-800/50',
          bg: canPlay ? 'bg-gradient-to-br from-aliens-50 to-aliens-100' : 'bg-aliens-900/20',
          text: canPlay ? 'text-aliens-900' : 'text-aliens-400',
          accent: 'text-aliens-700',
          glow: isDragging ? 'shadow-lg shadow-aliens-500/30' : ''
        };
      case 'robots':
        return {
          border: canPlay ? 'border-robots-600' : 'border-robots-800/50',
          bg: canPlay ? 'bg-gradient-to-br from-robots-50 to-robots-100' : 'bg-robots-900/20',
          text: canPlay ? 'text-robots-900' : 'text-robots-400',
          accent: 'text-robots-600',
          glow: isDragging ? 'shadow-lg shadow-robots-500/30' : ''
        };
      default:
        return {
          border: 'border-gray-600',
          bg: 'bg-gray-100',
          text: 'text-gray-900',
          accent: 'text-gray-600',
          glow: ''
        };
    }
  }, [faction, canPlay, isDragging]);

  const styles = getFactionStyles();

  // Rarity styling
  const getRarityIcon = useCallback(() => {
    switch (card.rarity || 'common') {
      case 'legendary':
        return <SparklesIcon className="w-4 h-4 text-yellow-500" />;
      case 'epic':
        return <SparklesIcon className="w-4 h-4 text-purple-500" />;
      case 'rare':
        return <SparklesIcon className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  }, [card.rarity]);

  // Animation variants
  const cardVariants = {
    idle: {
      scale: 1,
      rotateY: 0,
      y: 0,
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.05,
      y: -8,
      transition: { duration: 0.2 }
    },
    dragging: {
      scale: 1.1,
      rotateY: 5,
      zIndex: 1000,
      transition: { duration: 0.1 }
    },
    selected: {
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2 }
    }
  };

  const getCardVariant = () => {
    if (isDragging) return 'dragging';
    if (isSelected) return 'selected';
    return 'idle';
  };

  return (
    <motion.div
      ref={drag}
      variants={cardVariants}
      initial="idle"
      animate={getCardVariant()}
      whileHover={canPlay ? "hover" : "idle"}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      className={clsx(
        "relative w-24 h-32 md:w-28 md:h-36 lg:w-32 lg:h-44 rounded-lg cursor-pointer",
        "select-none touch-manipulation backdrop-blur-sm",
        styles.border,
        styles.bg,
        styles.glow,
        canPlay ? "hover:shadow-lg" : "opacity-60 cursor-not-allowed",
        isSelected && "ring-2 ring-offset-2 ring-blue-500",
        "transform-gpu" // Enable hardware acceleration
      )}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: canDrag ? 'grab' : 'not-allowed'
      }}
      data-testid={`card-${card.id}`}
    >
      {/* Card Header */}
      <div className="p-2 md:p-3">
        <div className="flex justify-between items-start mb-1">
          {/* Cost */}
          <div className={clsx(
            "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold",
            canAfford ? styles.accent : 'text-red-500',
            canAfford ? 'bg-white/80' : 'bg-red-100/80'
          )}>
            {card.cost}
          </div>

          {/* Rarity */}
          {card.rarity && (
            <div className="flex items-center">
              {getRarityIcon()}
            </div>
          )}
        </div>

        {/* Card Name */}
        <h3 className={clsx(
          "text-xs md:text-sm font-semibold leading-tight mb-1 line-clamp-2",
          styles.text
        )}>
          {card.name}
        </h3>
      </div>

      {/* Card Art Placeholder */}
      <div className="px-2 md:px-3 mb-2">
        <div className={clsx(
          "w-full aspect-video rounded bg-gradient-to-br opacity-80",
          faction === 'humans' && "from-humans-200 to-humans-300",
          faction === 'aliens' && "from-aliens-200 to-aliens-300",
          faction === 'robots' && "from-robots-200 to-robots-300"
        )}>
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover rounded"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={clsx("w-8 h-8 opacity-50", styles.accent)}>
                {card.type === 'unit' ? (
                  <ShieldCheckIcon />
                ) : (
                  <BoltIcon />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Stats */}
      {card.type === 'unit' && showDetails && (
        <div className="px-2 md:px-3 pb-2">
          <div className="flex justify-between items-center">
            {/* Attack */}
            <div className="flex items-center text-xs md:text-sm">
              <BoltIcon className={clsx("w-3 h-3 md:w-4 md:h-4 mr-1", styles.accent)} />
              <span className={clsx("font-semibold", styles.text)}>
                {card.attack}
              </span>
            </div>

            {/* Health */}
            <div className="flex items-center text-xs md:text-sm">
              <HeartIcon className={clsx("w-3 h-3 md:w-4 md:h-4 mr-1", styles.accent)} />
              <span className={clsx("font-semibold", styles.text)}>
                {card.health}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Type Badge */}
      <div className="absolute top-1 right-1">
        <div className={clsx(
          "px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide",
          "bg-black/20 backdrop-blur-sm text-white"
        )}>
          {card.type}
        </div>
      </div>

      {/* Dragging Indicator */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-lg border-2 border-dashed border-blue-400 bg-blue-500/10 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Unaffordable Overlay */}
      {!canAfford && (
        <div className="absolute inset-0 bg-red-900/40 rounded-lg backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-xs font-semibold bg-red-600 px-2 py-1 rounded">
            Need {card.cost - resources} more
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default memo(Card);