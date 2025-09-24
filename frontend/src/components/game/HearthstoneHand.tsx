/**
 * Hearthstone-Style Hand Component
 * Bottom-positioned hand with hover expansion and drag functionality
 * Warhammer 40K themed with grimdark aesthetic
 */
import React, { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { GameCard, Faction } from '@/types';

interface CardInHandProps {
  card: GameCard;
  index: number;
  faction: Faction;
  resources: number;
  isHovered: boolean;
  isOtherHovered: boolean;
  totalCards: number;
  maxCardsWithoutOverlap: number;
  onHover: (index: number | null) => void;
  onSelect: (card: GameCard, index: number) => void;
  onDragStart: (card: GameCard, index: number) => void;
  onDragEnd: (card: GameCard, index: number, didDrop: boolean) => void;
}

const CardInHand: React.FC<CardInHandProps> = ({
  card,
  index,
  faction,
  resources,
  isHovered,
  isOtherHovered,
  totalCards,
  maxCardsWithoutOverlap,
  onHover,
  onSelect,
  onDragStart,
  onDragEnd
}) => {
  const canAfford = card.cost <= resources;
  const [isDragging, setIsDragging] = useState(false);

  // Calculate card positioning
  const needsOverlap = totalCards > maxCardsWithoutOverlap;
  const cardWidth = 128; // w-32 = 128px
  const overlapAmount = needsOverlap ? Math.min(96, cardWidth - (totalCards - maxCardsWithoutOverlap) * 8) : cardWidth;

  // Position calculation for horizontal layout
  const basePosition = needsOverlap ? index * overlapAmount : index * (cardWidth + 8);

  // Hover adjustments - when a card is hovered, others move aside
  let adjustedPosition = basePosition;
  if (isOtherHovered && !isHovered) {
    // Calculate offset based on position relative to hovered card
    const hoveredIndex = Array.from({ length: totalCards }).findIndex((_, i) => i !== index);
    // This is simplified - in real implementation you'd track the actual hovered index
    adjustedPosition += index > hoveredIndex ? 40 : -40;
  }

  // Faction-specific styling
  const getFactionStyles = () => {
    switch (faction) {
      case 'humans':
        return {
          border: 'border-humans-600',
          bg: 'bg-gradient-to-br from-humans-800 to-humans-900',
          text: 'text-humans-100',
          accent: 'text-humans-400',
          glow: 'shadow-humans-500/10'
        };
      case 'aliens':
        return {
          border: 'border-aliens-600',
          bg: 'bg-gradient-to-br from-aliens-800 to-aliens-900',
          text: 'text-aliens-100',
          accent: 'text-aliens-400',
          glow: 'shadow-aliens-500/10'
        };
      case 'robots':
        return {
          border: 'border-robots-600',
          bg: 'bg-gradient-to-br from-robots-800 to-robots-900',
          text: 'text-robots-100',
          accent: 'text-robots-400',
          glow: 'shadow-robots-500/10'
        };
      default:
        return {
          border: 'border-gothic-steel',
          bg: 'bg-gradient-to-br from-gothic-darker to-gothic-darkest',
          text: 'text-imperial-100',
          accent: 'text-imperial-400',
          glow: 'shadow-imperial-500/10'
        };
    }
  };

  const styles = getFactionStyles();

  // Handle drag events
  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(card, index);

    // Create drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 60, 80);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, [card, index, onDragStart]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    const didDrop = e.dataTransfer.dropEffect !== 'none';
    onDragEnd(card, index, didDrop);
  }, [card, index, onDragEnd]);

  return (
    <motion.div
      className="absolute bottom-0 cursor-pointer select-none"
      style={{
        left: `${adjustedPosition}px`,
        zIndex: isHovered ? 50 : 10 + index,
      }}
      initial={{ y: 200, opacity: 0 }}
      animate={{
        y: isHovered ? -30 : 90, // Show half card normally (pushed down), full card on hover (pulled up)
        x: 0, // Remove sideways movement
        opacity: 1,
        scale: isHovered ? 1.3 : 1,
        rotateY: isDragging ? 10 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(card, index)}
      draggable={canAfford}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={clsx(
          "relative w-32 h-44 rounded-lg border-2 backdrop-blur-sm transition-all duration-200",
          styles.border,
          canAfford ? `hover:shadow-lg ${styles.glow}` : "opacity-60 cursor-not-allowed",
          isDragging && "opacity-50",
          "gothic-card-frame overflow-hidden"
        )}
        style={{
          background: `linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(42, 42, 42, 0.90) 50%, rgba(20, 20, 20, 0.95) 100%)`
        }}
      >
        {/* Collapsed State - Name & Cost */}
        <AnimatePresence>
          {!isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col justify-between p-3"
            >
              {/* Cost */}
              <div className="flex justify-end">
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                  canAfford ?
                    "bg-imperial-400 text-gothic-black border-imperial-300" :
                    "bg-blood-600 text-white border-blood-500"
                )}>
                  {card.cost}
                </div>
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className={clsx(
                  "text-sm font-gothic font-semibold leading-tight",
                  styles.text,
                  "gothic-text-shadow"
                )}>
                  {card.name}
                </h3>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded State - Full Details */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 p-3 flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                  canAfford ?
                    "bg-imperial-400 text-gothic-black border-imperial-300" :
                    "bg-blood-600 text-white border-blood-500"
                )}>
                  {card.cost}
                </div>

                <div className={clsx(
                  "px-2 py-1 rounded text-xs font-medium uppercase tracking-wide border",
                  "bg-gothic-darkest/80 border-imperial-600 text-imperial-300"
                )}>
                  {card.type}
                </div>
              </div>

              {/* Name */}
              <h3 className={clsx(
                "text-sm font-gothic font-bold mb-2 leading-tight",
                styles.text,
                "gothic-text-shadow"
              )}>
                {card.name}
              </h3>

              {/* Art Area */}
              <div className="flex-1 mb-2">
                <div
                  className="w-full h-16 rounded border border-gothic-steel relative overflow-hidden"
                  style={{
                    background: faction === 'humans'
                      ? `linear-gradient(135deg,
                          rgba(72, 101, 129, 0.8) 0%,
                          rgba(36, 59, 83, 0.9) 50%,
                          rgba(16, 42, 67, 0.8) 100%
                        ),
                        radial-gradient(circle at 70% 30%, rgba(130, 154, 177, 0.3) 0%, transparent 60%)`
                      : faction === 'aliens'
                      ? `linear-gradient(135deg,
                          rgba(90, 70, 229, 0.8) 0%,
                          rgba(61, 39, 179, 0.9) 50%,
                          rgba(46, 26, 153, 0.8) 100%
                        ),
                        radial-gradient(circle at 70% 30%, rgba(139, 125, 255, 0.3) 0%, transparent 60%)`
                      : `linear-gradient(135deg,
                          rgba(230, 74, 25, 0.8) 0%,
                          rgba(216, 67, 21, 0.9) 50%,
                          rgba(165, 42, 0, 0.8) 100%
                        ),
                        radial-gradient(circle at 70% 30%, rgba(255, 121, 97, 0.3) 0%, transparent 60%)`
                  }}
                >
                  {/* Background pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 4px,
                        rgba(255, 255, 255, 0.1) 4px,
                        rgba(255, 255, 255, 0.1) 8px
                      )`
                    }}
                  ></div>

                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover rounded relative z-10"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative z-10">
                      <div className={clsx("text-2xl drop-shadow-lg", styles.accent)}>
                        {card.type === 'spell' ? '🔮' : '⚔'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              {card.type === 'unit' && (
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center">
                    <span className={clsx("font-bold mr-1", styles.accent)}>⚡</span>
                    <span className={clsx("font-semibold", styles.text)}>{card.attack}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={clsx("font-bold mr-1", styles.accent)}>❤</span>
                    <span className={clsx("font-semibold", styles.text)}>{card.health}</span>
                  </div>
                </div>
              )}

              {/* Abilities or description */}
              {card.abilities && card.abilities.length > 0 && (
                <div className="mt-1">
                  <p className={clsx("text-xs leading-tight opacity-80", styles.text)}>
                    {card.abilities[0].substring(0, 50)}...
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gothic decorative corners */}
        <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-imperial-600 opacity-60"></div>
        <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-imperial-600 opacity-60"></div>
        <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-imperial-600 opacity-60"></div>
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-imperial-600 opacity-60"></div>
      </div>
    </motion.div>
  );
};

export interface HearthstoneHandProps {
  cards: GameCard[];
  faction: Faction;
  resources: number;
  onCardSelect?: (card: GameCard, index: number) => void;
  onCardDragStart?: (card: GameCard, index: number) => void;
  onCardDragEnd?: (card: GameCard, index: number, didDrop: boolean) => void;
}

const HearthstoneHand: React.FC<HearthstoneHandProps> = ({
  cards,
  faction,
  resources,
  onCardSelect,
  onCardDragStart,
  onCardDragEnd
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const maxCardsWithoutOverlap = 7;
  const handWidth = Math.max(cards.length * 136, 800); // 128px card + 8px gap

  const handleCardHover = useCallback((index: number | null) => {
    setHoveredCard(index);
  }, []);

  const handleCardSelect = useCallback((card: GameCard, index: number) => {
    onCardSelect?.(card, index);
  }, [onCardSelect]);

  const handleCardDragStart = useCallback((card: GameCard, index: number) => {
    onCardDragStart?.(card, index);
  }, [onCardDragStart]);

  const handleCardDragEnd = useCallback((card: GameCard, index: number, didDrop: boolean) => {
    onCardDragEnd?.(card, index, didDrop);
  }, [onCardDragEnd]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="relative mx-auto" style={{ width: `${handWidth}px`, height: '300px' }}>
        <div className="absolute bottom-0 w-full h-80 pointer-events-auto">
          {cards.map((card, index) => (
            <CardInHand
              key={`${card.id}-${index}`}
              card={card}
              index={index}
              faction={faction}
              resources={resources}
              isHovered={hoveredCard === index}
              isOtherHovered={hoveredCard !== null && hoveredCard !== index}
              totalCards={cards.length}
              maxCardsWithoutOverlap={maxCardsWithoutOverlap}
              onHover={handleCardHover}
              onSelect={handleCardSelect}
              onDragStart={handleCardDragStart}
              onDragEnd={handleCardDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(HearthstoneHand);