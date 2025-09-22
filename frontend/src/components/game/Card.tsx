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

  // Cyberpunk faction-specific styling
  const getFactionStyles = useCallback(() => {
    switch (faction) {
      case 'humans':
        return {
          border: canPlay ? 'border-humans-600' : 'border-humans-800/30',
          bg: canPlay ? 'cyber-card-container' : 'bg-cyber-surface/30',
          text: canPlay ? 'text-humans-400' : 'text-humans-800',
          accent: 'text-humans-500',
          glow: isDragging ? 'humans-glow' : (canPlay ? 'neon-glow-blue' : ''),
          neonText: canPlay ? 'neon-text-blue' : ''
        };
      case 'aliens':
        return {
          border: canPlay ? 'border-aliens-600' : 'border-aliens-800/30',
          bg: canPlay ? 'cyber-card-container' : 'bg-cyber-surface/30',
          text: canPlay ? 'text-aliens-400' : 'text-aliens-800',
          accent: 'text-aliens-500',
          glow: isDragging ? 'aliens-glow' : (canPlay ? 'neon-glow-pink' : ''),
          neonText: canPlay ? 'neon-text-pink' : ''
        };
      case 'robots':
        return {
          border: canPlay ? 'border-robots-600' : 'border-robots-800/30',
          bg: canPlay ? 'cyber-card-container' : 'bg-cyber-surface/30',
          text: canPlay ? 'text-robots-400' : 'text-robots-800',
          accent: 'text-robots-500',
          glow: isDragging ? 'robots-glow' : (canPlay ? 'neon-glow-green' : ''),
          neonText: canPlay ? 'neon-text-green' : ''
        };
      default:
        return {
          border: 'border-cyber-border',
          bg: 'bg-cyber-surface',
          text: 'text-neon-cyan-400',
          accent: 'text-neon-cyan-500',
          glow: '',
          neonText: ''
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

  // Cyberpunk animation variants
  const cardVariants = {
    idle: {
      scale: 1,
      rotateY: 0,
      y: 0,
      filter: 'brightness(1) saturate(1)',
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    hover: {
      scale: 1.08,
      y: -12,
      rotateY: 3,
      filter: 'brightness(1.2) saturate(1.3)',
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    dragging: {
      scale: 1.15,
      rotateY: 8,
      z: 50,
      filter: 'brightness(1.4) saturate(1.5)',
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    selected: {
      scale: 1.05,
      y: -6,
      filter: 'brightness(1.3) saturate(1.4)',
      transition: { duration: 0.3, ease: 'easeOut' }
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
        "relative w-24 h-32 md:w-28 md:h-36 lg:w-32 lg:h-44 rounded-xl cursor-pointer",
        "select-none touch-manipulation backdrop-blur-sm",
        "border-2 border-opacity-60 transition-all duration-500",
        styles.border,
        styles.bg,
        styles.glow,
        canPlay ? "hover:border-opacity-100" : "opacity-40 cursor-not-allowed saturate-50",
        isSelected && "ring-2 ring-offset-2 ring-offset-cyber-dark",
        isSelected && (faction === 'humans' ? "ring-humans-500" :
                      faction === 'aliens' ? "ring-aliens-500" : "ring-robots-500"),
        "transform-gpu perspective-1000", // Enable hardware acceleration
        canPlay && "faction-card", // Add cyberpunk hover effects
        "scanlines" // Add scanline overlay
      )}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: canDrag ? 'grab' : 'not-allowed'
      }}
      data-testid={`card-${card.id}`}
    >
      {/* Card Header */}
      <div className="p-2 md:p-3 relative z-10">
        <div className="flex justify-between items-start mb-1">
          {/* Cost */}
          <div className={clsx(
            "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold font-cyber",
            "border transition-all duration-300",
            canAfford ? (
              `${styles.neonText} border-current bg-cyber-dark/80 backdrop-blur-sm`
            ) : (
              "text-red-400 border-red-400 bg-red-900/20 backdrop-blur-sm"
            )
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
          "text-xs md:text-sm font-semibold font-sans leading-tight mb-1 line-clamp-2",
          "transition-all duration-300",
          canPlay ? styles.neonText : styles.text,
          canPlay && "text-shadow-sm"
        )}>
          {card.name}
        </h3>
      </div>

      {/* Card Art Placeholder */}
      <div className="px-2 md:px-3 mb-2 relative">
        <div className={clsx(
          "w-full aspect-video rounded-lg relative overflow-hidden",
          "border border-opacity-30 backdrop-blur-sm",
          styles.border,
          canPlay && "holographic-border"
        )}>
          {/* Holographic background */}
          <div className={clsx(
            "absolute inset-0 opacity-30",
            canPlay && "holographic"
          )} />

          {/* Tech grid overlay */}
          <div className="absolute inset-0 tech-grid opacity-20" />

          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover rounded-lg relative z-10"
              loading="lazy"
              style={{
                filter: canPlay ? 'contrast(1.2) saturate(1.3)' : 'contrast(0.8) saturate(0.7)'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative z-10">
              <div className={clsx(
                "w-8 h-8 transition-all duration-300",
                canPlay ? `${styles.neonText} drop-shadow-lg` : `${styles.text} opacity-50`
              )}>
                {card.type === 'unit' ? (
                  <ShieldCheckIcon />
                ) : (
                  <BoltIcon />
                )}
              </div>
            </div>
          )}

          {/* Scanning line effect */}
          {canPlay && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-60 animate-scanline" />
          )}
        </div>
      </div>

      {/* Card Stats */}
      {card.type === 'unit' && showDetails && (
        <div className="px-2 md:px-3 pb-2 relative z-10">
          <div className="flex justify-between items-center">
            {/* Attack */}
            <div className="flex items-center text-xs md:text-sm">
              <BoltIcon className={clsx(
                "w-3 h-3 md:w-4 md:h-4 mr-1 transition-all duration-300",
                canPlay ? styles.neonText : styles.accent,
                canPlay && "drop-shadow-sm"
              )} />
              <span className={clsx(
                "font-bold font-cyber tracking-wider",
                canPlay ? styles.neonText : styles.text,
                canPlay && "text-shadow-sm"
              )}>
                {card.attack}
              </span>
            </div>

            {/* Health */}
            <div className="flex items-center text-xs md:text-sm">
              <HeartIcon className={clsx(
                "w-3 h-3 md:w-4 md:h-4 mr-1 transition-all duration-300",
                canPlay ? styles.neonText : styles.accent,
                canPlay && "drop-shadow-sm"
              )} />
              <span className={clsx(
                "font-bold font-cyber tracking-wider",
                canPlay ? styles.neonText : styles.text,
                canPlay && "text-shadow-sm"
              )}>
                {card.health}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Type Badge */}
      <div className="absolute top-1 right-1 z-20">
        <div className={clsx(
          "px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider font-cyber",
          "border backdrop-blur-md transition-all duration-300",
          canPlay ? (
            `${styles.neonText} border-current bg-cyber-dark/60`
          ) : (
            "text-cyber-muted border-cyber-border bg-cyber-dark/40"
          )
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
            className={clsx(
              "absolute inset-0 rounded-xl border-2 border-dashed backdrop-blur-sm",
              "animate-neon-pulse",
              faction === 'humans' && "border-humans-500 bg-humans-500/10",
              faction === 'aliens' && "border-aliens-500 bg-aliens-500/10",
              faction === 'robots' && "border-robots-500 bg-robots-500/10"
            )}
          />
        )}
      </AnimatePresence>

      {/* Unaffordable Overlay */}
      {!canAfford && (
        <div className="absolute inset-0 bg-red-900/60 rounded-xl backdrop-blur-md flex items-center justify-center z-30">
          <div className="text-red-400 text-xs font-bold font-cyber bg-cyber-dark/80 px-3 py-1.5 rounded-lg border border-red-400/50 backdrop-blur-sm neon-text-red animate-cyber-flicker">
            NEED {card.cost - resources} MORE
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default memo(Card);