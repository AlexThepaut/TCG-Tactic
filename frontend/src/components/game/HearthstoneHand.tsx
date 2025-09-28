/**
 * Enhanced Hearthstone-Style Hand Component
 * Arc-positioned hand with multi-level hover states and responsive design
 * Features peek/raised/focused modes with natural card arrangement
 */
import React, { memo, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import UnifiedCard from '@/components/shared/UnifiedCard';
import type { GameCard, Faction } from '@/types';

// Enhanced hand state management
interface HandState {
  mode: 'peek' | 'raised' | 'focused';
  hoveredCardIndex: number | null;
  isHandHovered: boolean;
  focusedIndex: number | null; // For keyboard navigation
}

// Arc positioning configuration
interface ArcConfig {
  radius: number;
  spreadAngle: number; // Total angle spread in degrees
  baseOffset: number;
  cardTilt: number; // Individual card rotation multiplier
}

// Individual card position and transform data
interface CardPosition {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

interface CardInHandProps {
  card: GameCard;
  index: number;
  position: CardPosition;
  handState: HandState;
  cardSize: { width: number; height: number };
  handWidth: number;
  faction: Faction;
  resources: number;
  onHover: (index: number | null) => void;
  onSelect: (card: GameCard, index: number) => void;
  onDragStart: (card: GameCard, index: number) => void;
  onDragEnd: (card: GameCard, index: number, didDrop: boolean) => void;
}

const CardInHand: React.FC<CardInHandProps> = ({
  card,
  index,
  position,
  handState,
  cardSize,
  handWidth,
  faction,
  resources,
  onHover,
  onSelect,
  onDragStart,
  onDragEnd
}) => {
  // Determine if this card is currently focused/hovered
  const isCardHovered = handState.hoveredCardIndex === index;
  const isCardFocused = handState.focusedIndex === index;

  // Calculate Y offset based on hand state and card state
  const getYOffset = useCallback(() => {
    if (isCardHovered && handState.mode === 'focused') {
      return -30; // Fully visible when individually hovered (reduced for lower hand zone)
    }
    if (handState.mode === 'raised') {
      return cardSize.height * 0.4; // Show 60% of card when hand is raised (reduced)
    }
    return cardSize.height * 0.85; // Show only 15% of card in peek mode (much lower hand zone)
  }, [handState.mode, isCardHovered, cardSize.height]);

  // Get scale based on hover state (including width expansion)
  const getScale = useCallback(() => {
    if (isCardHovered && handState.mode === 'focused') {
      return { scaleX: 1.4, scaleY: 1.2 }; // Much wider and taller when focused for easier selection
    }
    if (handState.mode === 'raised') {
      return { scaleX: 1.1, scaleY: 1.05 }; // Slight expansion when hand is raised
    }
    return { scaleX: 1, scaleY: 1 };
  }, [isCardHovered, handState.mode]);

  // Check if reduced motion is preferred (memoized to avoid repeated matchMedia calls)
  const animationConfig = useMemo(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Enhanced spring configuration for card spreading effect
    return {
      type: "spring" as const,
      stiffness: prefersReducedMotion ? 500 : 400,  // Snappier for spread effect
      damping: prefersReducedMotion ? 50 : 35,      // Smoother settling
      mass: prefersReducedMotion ? 1.0 : 0.6,      // Lighter, more responsive
      velocity: 0                                   // Clean start from rest
    };
  }, []);

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{
        left: `${handWidth / 2 + position.x - cardSize.width / 2}px`,
        zIndex: position.zIndex,
        transformOrigin: 'bottom center'
      }}
      initial={{ y: 200, opacity: 0, rotate: 0 }}
      animate={{
        y: position.y + getYOffset(),
        opacity: 1,
        rotate: position.rotation,
        scaleX: getScale().scaleX,
        scaleY: getScale().scaleY,
      }}
      transition={animationConfig}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      whileHover={{
        y: position.y - 30,
        scaleX: 1.4,
        scaleY: 1.2,
        transition: animationConfig
      }}
    >
      <UnifiedCard
        card={card}
        cardSize={cardSize.width >= 224 ? "xl" : cardSize.width >= 192 ? "lg" : "md"}
        handIndex={index}
        faction={faction}
        resources={resources}
        isPlayable={true}
        isSelected={isCardFocused}
        showDetails={isCardHovered || isCardFocused}
        onClick={(card) => onSelect(card, index)}
        onDragStart={(card, handIndex) => onDragStart(card, handIndex ?? index)}
        onDragEnd={(card, handIndex, didDrop) => onDragEnd(card, handIndex ?? index, didDrop ?? false)}
        disableAnimations={true}
      />
    </motion.div>
  );
};

// Memoize the CardInHand component for performance
const MemoizedCardInHand = memo(CardInHand, (prevProps, nextProps) => {
  // Only re-render if essential props change (including spread effect changes)
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.handState.mode === nextProps.handState.mode &&
    prevProps.handState.hoveredCardIndex === nextProps.handState.hoveredCardIndex &&
    prevProps.handState.focusedIndex === nextProps.handState.focusedIndex &&
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    prevProps.position.rotation === nextProps.position.rotation &&
    prevProps.position.zIndex === nextProps.position.zIndex &&
    prevProps.cardSize.width === nextProps.cardSize.width &&
    prevProps.cardSize.height === nextProps.cardSize.height &&
    prevProps.handWidth === nextProps.handWidth
  );
});

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
  const layout = useResponsiveLayout();
  const handRef = useRef<HTMLDivElement>(null);

  // Enhanced hand state
  const [handState, setHandState] = useState<HandState>({
    mode: 'peek',
    hoveredCardIndex: null,
    isHandHovered: false,
    focusedIndex: null
  });

  // Calculate responsive card size
  const cardSize = useMemo(() => {
    const { cardSize: layoutCardSize } = layout;
    const availableWidth = layout.availableGameSpace.width * 0.85; // Use 85% of available space

    // Calculate maximum card width that allows all cards to fit with overlap
    const minOverlap = layout.isMobile ? 0.4 : 0.6; // Cards overlap by 40-60%
    const maxCardWidth = availableWidth / (cards.length * minOverlap + (1 - minOverlap));

    // Use responsive card size but cap it if too many cards
    const targetWidth = Math.min(layoutCardSize.width, maxCardWidth);
    const aspectRatio = 5 / 7; // Classic TCG ratio

    return {
      width: targetWidth,
      height: targetWidth / aspectRatio
    };
  }, [layout, cards.length]);

  // Calculate arc configuration based on screen size and card count
  const arcConfig = useMemo((): ArcConfig => {
    const baseRadius = layout.availableGameSpace.width * (layout.isMobile ? 0.8 : 0.5);
    const maxSpread = layout.isMobile ? 40 : 60; // Increased maximum spread angle
    const minSpread = 15; // Minimum spread even for few cards
    const actualSpread = Math.max(minSpread, Math.min(maxSpread, cards.length * 8)); // 8 degrees per card

    return {
      radius: baseRadius,
      spreadAngle: actualSpread,
      baseOffset: layout.isMobile ? 20 : 30,
      cardTilt: 0.8 // More pronounced rotation
    };
  }, [layout, cards.length]);

  // Calculate arc positions for all cards with spread effect
  const cardPositions = useMemo((): CardPosition[] => {
    if (cards.length === 0) return [];

    return cards.map((_, index) => {
      const angleStep = arcConfig.spreadAngle / Math.max(1, cards.length - 1);
      const cardAngle = (index - (cards.length - 1) / 2) * angleStep;
      const angleRad = (cardAngle * Math.PI) / 180;

      // Base arc position
      let x = arcConfig.radius * Math.sin(angleRad);
      const y = arcConfig.baseOffset + arcConfig.radius * (1 - Math.cos(angleRad));
      const rotation = cardAngle * arcConfig.cardTilt;

      // Apply card spreading effect
      if (handState.hoveredCardIndex !== null && handState.mode === 'focused') {
        const hoveredIndex = handState.hoveredCardIndex;
        const distance = Math.abs(index - hoveredIndex);

        // Skip spreading for the hovered card itself
        if (index !== hoveredIndex) {
          // Calculate spread intensity based on distance from hovered card
          const maxDistance = Math.max(hoveredIndex, cards.length - 1 - hoveredIndex);
          const spreadIntensity = Math.max(0, 1 - (distance / (maxDistance + 1)));

          // Base spread distance - responsive to card size and screen size (increased for more dramatic effect)
          const baseSpreadDistance = layout.isMobile ? 75 : 95;

          // Calculate spread offset with exponential falloff
          const spreadOffset = spreadIntensity * baseSpreadDistance * Math.pow(0.6, distance);

          // Determine direction (left or right of hovered card)
          const direction = index < hoveredIndex ? -1 : 1;

          // Apply spread to X position
          x += spreadOffset * direction;
        }
      }

      // Z-index: hovered card on top, then by reverse index for natural stacking
      const zIndex = handState.hoveredCardIndex === index ? 100 : 50 + (cards.length - index);

      return { x, y, rotation, zIndex };
    });
  }, [cards.length, arcConfig, handState.hoveredCardIndex, handState.mode, layout.isMobile]);

  // Hand hover handlers
  const handleHandMouseEnter = useCallback(() => {
    setHandState(prev => ({
      ...prev,
      isHandHovered: true,
      mode: prev.hoveredCardIndex !== null ? 'focused' : 'raised'
    }));
  }, []);

  const handleHandMouseLeave = useCallback(() => {
    setHandState(prev => ({
      ...prev,
      isHandHovered: false,
      hoveredCardIndex: null,
      mode: 'peek'
    }));
  }, []);

  // Card hover handlers
  const handleCardHover = useCallback((index: number | null) => {
    setHandState(prev => ({
      ...prev,
      hoveredCardIndex: index,
      mode: index !== null ? 'focused' : (prev.isHandHovered ? 'raised' : 'peek')
    }));
  }, []);

  // Event handlers
  const handleCardSelect = useCallback((card: GameCard, index: number) => {
    onCardSelect?.(card, index);
  }, [onCardSelect]);

  const handleCardDragStart = useCallback((card: GameCard, index: number) => {
    onCardDragStart?.(card, index);
  }, [onCardDragStart]);

  const handleCardDragEnd = useCallback((card: GameCard, index: number, didDrop: boolean) => {
    onCardDragEnd?.(card, index, didDrop);
  }, [onCardDragEnd]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (cards.length === 0) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setHandState(prev => ({
          ...prev,
          focusedIndex: Math.max(0, (prev.focusedIndex ?? 0) - 1),
          mode: 'focused'
        }));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setHandState(prev => ({
          ...prev,
          focusedIndex: Math.min(cards.length - 1, (prev.focusedIndex ?? 0) + 1),
          mode: 'focused'
        }));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (handState.focusedIndex !== null && cards[handState.focusedIndex]) {
          onCardSelect?.(cards[handState.focusedIndex]!, handState.focusedIndex);
        }
        break;
      case 'Escape':
        setHandState(prev => ({
          ...prev,
          focusedIndex: null,
          mode: 'peek'
        }));
        break;
    }
  }, [cards, handState.focusedIndex, onCardSelect]);

  if (cards.length === 0) {
    return null;
  }

  // Calculate hand container dimensions (account for card widening, spreading, and lower positioning)
  const leftmostX = cardPositions.length > 0 ? Math.min(...cardPositions.map(pos => pos.x)) : 0;
  const rightmostX = cardPositions.length > 0 ? Math.max(...cardPositions.map(pos => pos.x)) : 0;
  const totalCardSpread = rightmostX - leftmostX;

  // Calculate additional space needed for spreading effect (updated to match new spread distances)
  const maxSpreadDistance = layout.isMobile ? 75 : 95;
  const spreadPadding = cards.length > 1 ? maxSpreadDistance * 1.5 : 0; // Extra buffer for spreading

  const handWidth = Math.max(
    cardSize.width * 3, // Minimum width
    totalCardSpread + cardSize.width * 2.8 + spreadPadding // Card spread + scaling + spread padding
  );
  const handHeight = cardSize.height + 80; // Reduced height for more compact hand zone

  // Debug logging (after all variables are calculated)
  console.log('HearthstoneHand Debug:', {
    cardsLength: cards.length,
    handState,
    cardSize,
    arcConfig,
    cardPositions,
    handWidth,
    handHeight,
    leftmostX,
    rightmostX,
    totalCardSpread,
    maxSpreadDistance,
    spreadPadding,
    isSpreadActive: handState.hoveredCardIndex !== null && handState.mode === 'focused'
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div
        ref={handRef}
        className="relative mx-auto pointer-events-auto"
        style={{
          width: `${handWidth}px`,
          height: `${handHeight}px`
        }}
        onMouseEnter={handleHandMouseEnter}
        onMouseLeave={handleHandMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="group"
        aria-label={`Hand with ${cards.length} cards`}
      >
        {/* Center the hand horizontally */}
        <div
          className="absolute bottom-0"
          style={{
            left: '50%',
            transform: 'translateX(-50%)', // Simple center transform
            width: `${handWidth}px`,
            height: `${handHeight}px`
          }}
        >
          <AnimatePresence>
            {cards.map((card, index) => (
              <MemoizedCardInHand
                key={`${card.id}-${index}`}
                card={card}
                index={index}
                position={cardPositions[index]!}
                handState={handState}
                cardSize={cardSize}
                handWidth={handWidth}
                faction={faction}
                resources={resources}
                onHover={handleCardHover}
                onSelect={handleCardSelect}
                onDragStart={handleCardDragStart}
                onDragEnd={handleCardDragEnd}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Accessibility: Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {handState.focusedIndex !== null &&
          `Focused on card ${handState.focusedIndex + 1} of ${cards.length}: ${cards[handState.focusedIndex]?.name}`
        }
      </div>
    </div>
  );
};

export default memo(HearthstoneHand);