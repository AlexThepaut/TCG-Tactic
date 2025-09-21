/**
 * Hand Component - Interactive card display with drag sources
 * Shows player's hand with resource management and selection
 */
import React, { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Card from './Card';
import type { GameCard, Faction } from '@/types';

export interface HandProps {
  cards: GameCard[];
  faction: Faction;
  resources: number;
  maxResources?: number;
  selectedCardIndex?: number | null;
  isMyTurn?: boolean;
  isCompact?: boolean;
  onCardSelect?: (card: GameCard, handIndex: number) => void;
  onCardDragStart?: (card: GameCard, handIndex: number) => void;
  onCardDragEnd?: (card: GameCard, handIndex: number, didDrop: boolean) => void;
  onCardTouch?: (e: React.TouchEvent, card: GameCard, handIndex: number) => void;
}

const Hand: React.FC<HandProps> = ({
  cards,
  faction,
  resources,
  maxResources = 10,
  selectedCardIndex = null,
  isMyTurn = false,
  isCompact = false,
  onCardSelect,
  onCardDragStart,
  onCardDragEnd,
  onCardTouch
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDetails, setShowDetails] = useState(!isCompact);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Calculate hand statistics
  const playableCards = cards.filter(card => card.cost <= resources);
  const totalCost = cards.reduce((sum, card) => sum + card.cost, 0);
  const averageCost = cards.length > 0 ? Math.round(totalCost / cards.length * 10) / 10 : 0;

  // Handle card interactions
  const handleCardSelect = useCallback((card: GameCard, handIndex: number) => {
    if (!isMyTurn) return;
    onCardSelect?.(card, handIndex);
  }, [isMyTurn, onCardSelect]);

  const handleCardDragStart = useCallback((card: GameCard, handIndex: number) => {
    if (!isMyTurn) return;
    onCardDragStart?.(card, handIndex);
  }, [isMyTurn, onCardDragStart]);

  const handleCardDragEnd = useCallback((card: GameCard, handIndex: number, didDrop: boolean) => {
    onCardDragEnd?.(card, handIndex, didDrop);
  }, [onCardDragEnd]);

  const handleCardTouch = useCallback((e: React.TouchEvent, card: GameCard, handIndex: number) => {
    if (!isMyTurn) return;
    onCardTouch?.(e, card, handIndex);
  }, [isMyTurn, onCardTouch]);

  // Scroll controls
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < Math.max(0, cards.length - 5);

  const scrollLeft = useCallback(() => {
    setScrollPosition(prev => Math.max(0, prev - 1));
  }, []);

  const scrollRight = useCallback(() => {
    setScrollPosition(prev => Math.min(Math.max(0, cards.length - 5), prev + 1));
  }, [cards.length]);

  // Faction-specific styling
  const getFactionStyles = useCallback(() => {
    switch (faction) {
      case 'humans':
        return {
          bg: 'bg-gradient-to-t from-humans-900/90 to-humans-800/80',
          border: 'border-humans-600',
          text: 'text-humans-100',
          accent: 'text-humans-400',
          resource: 'bg-humans-600 text-white'
        };
      case 'aliens':
        return {
          bg: 'bg-gradient-to-t from-aliens-900/90 to-aliens-800/80',
          border: 'border-aliens-700',
          text: 'text-aliens-100',
          accent: 'text-aliens-400',
          resource: 'bg-aliens-700 text-white'
        };
      case 'robots':
        return {
          bg: 'bg-gradient-to-t from-robots-900/90 to-robots-800/80',
          border: 'border-robots-600',
          text: 'text-robots-100',
          accent: 'text-robots-400',
          resource: 'bg-robots-600 text-white'
        };
      default:
        return {
          bg: 'bg-gradient-to-t from-gray-900/90 to-gray-800/80',
          border: 'border-gray-600',
          text: 'text-gray-100',
          accent: 'text-gray-400',
          resource: 'bg-gray-600 text-white'
        };
    }
  }, [faction]);

  const styles = getFactionStyles();

  // Resource bar component
  const ResourceBar = memo(() => (
    <div className="flex items-center space-x-2">
      <span className={clsx("text-sm font-medium", styles.accent)}>
        Void Echoes:
      </span>
      <div className="flex items-center space-x-1">
        {/* Resource bubbles */}
        <div className="flex space-x-1">
          {Array.from({ length: maxResources }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                "w-3 h-3 rounded-full border-2 transition-all duration-200",
                i < resources
                  ? clsx(styles.resource, "shadow-sm")
                  : "border-gray-600 bg-gray-800"
              )}
            />
          ))}
        </div>
        {/* Numeric display */}
        <span className={clsx("text-lg font-bold ml-2", styles.text)}>
          {resources}/{maxResources}
        </span>
      </div>
    </div>
  ));

  // Hand stats component
  const HandStats = memo(() => (
    <div className="flex items-center space-x-4 text-sm">
      <div className={styles.accent}>
        Cards: <span className={styles.text}>{cards.length}</span>
      </div>
      <div className={styles.accent}>
        Playable: <span className={playableCards.length > 0 ? styles.text : 'text-red-400'}>
          {playableCards.length}
        </span>
      </div>
      <div className={styles.accent}>
        Avg Cost: <span className={styles.text}>{averageCost}</span>
      </div>
    </div>
  ));

  // Animation variants
  const handVariants = {
    collapsed: {
      height: 60,
      transition: { duration: 0.3 }
    },
    expanded: {
      height: 'auto',
      transition: { duration: 0.3 }
    }
  };

  const cardContainerVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={handVariants}
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      className={clsx(
        "relative w-full border-t-2 backdrop-blur-md",
        styles.bg,
        styles.border,
        "shadow-lg"
      )}
    >
      {/* Hand Header */}
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          {/* Left side - Resources */}
          <ResourceBar />

          {/* Right side - Controls */}
          <div className="flex items-center space-x-2">
            <HandStats />

            {/* View toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={clsx(
                "p-1 rounded transition-colors",
                "hover:bg-white/10 active:bg-white/20",
                styles.accent
              )}
              title={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={clsx(
                "p-1 rounded transition-colors",
                "hover:bg-white/10 active:bg-white/20",
                styles.accent
              )}
              title={isCollapsed ? "Expand hand" : "Collapse hand"}
            >
              <ChevronLeftIcon className={clsx(
                "w-4 h-4 transform transition-transform",
                isCollapsed ? "rotate-90" : "-rotate-90"
              )} />
            </button>
          </div>
        </div>

        {/* Turn indicator */}
        {isMyTurn && (
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white text-sm font-medium">
              Your Turn - {playableCards.length} cards playable
            </div>
          </div>
        )}
      </div>

      {/* Card Display */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={cardContainerVariants}
            className="p-3 md:p-4 pt-0"
          >
            {cards.length === 0 ? (
              <div className="text-center py-8">
                <div className={clsx("text-lg font-medium", styles.accent)}>
                  No cards in hand
                </div>
                <div className={clsx("text-sm", styles.accent, "opacity-60")}>
                  Draw phase will add cards to your hand
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Scroll controls */}
                {cards.length > 5 && (
                  <>
                    <button
                      onClick={scrollLeft}
                      disabled={!canScrollLeft}
                      className={clsx(
                        "absolute left-0 top-1/2 -translate-y-1/2 z-10",
                        "w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm",
                        "flex items-center justify-center transition-opacity",
                        canScrollLeft ? "opacity-100 hover:bg-black/70" : "opacity-30"
                      )}
                    >
                      <ChevronLeftIcon className="w-5 h-5 text-white" />
                    </button>

                    <button
                      onClick={scrollRight}
                      disabled={!canScrollRight}
                      className={clsx(
                        "absolute right-0 top-1/2 -translate-y-1/2 z-10",
                        "w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm",
                        "flex items-center justify-center transition-opacity",
                        canScrollRight ? "opacity-100 hover:bg-black/70" : "opacity-30"
                      )}
                    >
                      <ChevronRightIcon className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Cards container */}
                <div className="overflow-hidden">
                  <motion.div
                    className="flex space-x-2 md:space-x-3 transition-transform duration-300"
                    style={{
                      transform: `translateX(-${scrollPosition * (isCompact ? 100 : 120)}px)`
                    }}
                  >
                    {cards.map((card, index) => (
                      <motion.div
                        key={`${card.id}-${index}`}
                        variants={cardVariants}
                        className="flex-shrink-0"
                      >
                        <Card
                          card={card}
                          handIndex={index}
                          faction={faction}
                          resources={resources}
                          isPlayable={isMyTurn}
                          isSelected={selectedCardIndex === index}
                          showDetails={showDetails}
                          onSelect={handleCardSelect}
                          onDragStart={handleCardDragStart}
                          onDragEnd={handleCardDragEnd}
                          onTouch={handleCardTouch}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(Hand);