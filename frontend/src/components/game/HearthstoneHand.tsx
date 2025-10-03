/**
 * Enhanced Hearthstone-Style Hand Component
 * Arc-positioned hand with multi-level hover states and responsive design
 * Features peek/raised/focused modes with natural card arrangement
 */
import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  isSelected: boolean;
  isPlayable: boolean;
  isMyTurn: boolean;
  onHover: (index: number | null) => void;
  onClick: (card: GameCard, index: number) => void;
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
  isSelected,
  isPlayable,
  isMyTurn,
  onHover,
  onClick
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

  // Faction-specific glow colors for selection animation
  const FACTION_GLOW = useMemo(() => ({
    humans: {
      inner: 'rgba(98, 125, 152, 0.6)',
      middle: 'rgba(98, 125, 152, 0.4)',
      outer: 'rgba(98, 125, 152, 0.2)',
    },
    aliens: {
      inner: 'rgba(109, 92, 255, 0.6)',
      middle: 'rgba(109, 92, 255, 0.4)',
      outer: 'rgba(109, 92, 255, 0.2)',
    },
    robots: {
      inner: 'rgba(255, 87, 34, 0.6)',
      middle: 'rgba(255, 87, 34, 0.4)',
      outer: 'rgba(255, 87, 34, 0.2)',
    }
  }), []);

  // Track selection timing for animation stages
  const [justSelected, setJustSelected] = useState(false);

  useEffect(() => {
    if (isSelected) {
      setJustSelected(true);
      const timer = setTimeout(() => setJustSelected(false), 400);
      return () => clearTimeout(timer);
    } else {
      setJustSelected(false);
      return undefined;
    }
  }, [isSelected]);

  // Check if reduced motion is preferred
  const prefersReducedMotion = useMemo(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Enhanced animation variants with three-stage sequence
  const getAnimationVariants = useCallback(() => {
    const glowColors = FACTION_GLOW[faction];

    // Simplified animations for reduced motion preference
    if (prefersReducedMotion) {
      return {
        idle: {
          scale: 1,
          y: position.y + getYOffset(),
          rotate: position.rotation,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
        hover: {
          scale: 1.1,
          y: position.y + getYOffset(),
          rotate: position.rotation,
          boxShadow: `0 0 15px ${glowColors.outer}`,
        }
      };
    }

    // Full animations for standard preference
    return {
      idle: {
        scale: 1,
        y: position.y + getYOffset(),
        rotate: position.rotation,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      },

      // Hover states - stay in arc with subtle glow
      hover: {
        scale: 1.1,
        y: position.y + getYOffset(),
        rotate: position.rotation,
        boxShadow: `0 0 15px ${glowColors.outer}`,
        transition: { duration: 0.2 }
      }
    };
  }, [isCardHovered, handState.mode, position, getYOffset, FACTION_GLOW, faction, prefersReducedMotion]);

  // Determine animation state
  const getAnimationState = useCallback(() => {
    // Selection styling moved to CardPreview - cards in hand have no selection state
    if (isCardHovered || handState.mode === 'raised') return 'hover';
    return 'idle';
  }, [isCardHovered, handState.mode]);


  return (
    <motion.div
      className="absolute select-none"
      style={{
        left: `${handWidth / 2 + position.x - cardSize.width / 2}px`,
        zIndex: isSelected ? 200 : position.zIndex,
        transformOrigin: 'bottom center',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity, box-shadow',
        backfaceVisibility: 'hidden',
        filter: 'none',
        imageRendering: '-webkit-optimize-contrast',
        WebkitFontSmoothing: 'antialiased'
      } as React.CSSProperties}
      initial={{ y: 200, opacity: 0, rotate: 0 }}
      animate={{
        ...getAnimationVariants()[getAnimationState()],
        opacity: 1,
      }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <UnifiedCard
        card={card}
        cardSize={cardSize.width >= 224 ? "xl" : cardSize.width >= 192 ? "lg" : "md"}
        handIndex={index}
        faction={faction}
        resources={resources}
        isPlayable={isPlayable && isMyTurn}
        isSelected={isSelected}
        showDetails={isCardHovered || isCardFocused || isSelected}
        onClick={() => isPlayable && isMyTurn && onClick(card, index)}
        disableAnimations={true}
        className={!isPlayable ? 'opacity-50 grayscale' : ''}
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
    prevProps.handWidth === nextProps.handWidth &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isPlayable === nextProps.isPlayable &&
    prevProps.isMyTurn === nextProps.isMyTurn
  );
});

export interface HearthstoneHandProps {
  cards: GameCard[];
  faction: Faction;
  resources: number;
  selectedCardId?: string | null;
  selectedHandIndex?: number | null;
  isMyTurn?: boolean;
  onCardClick?: (card: GameCard, index: number) => void;
}

const HearthstoneHand: React.FC<HearthstoneHandProps> = ({
  cards,
  faction,
  resources,
  selectedCardId = null,
  selectedHandIndex = null,
  isMyTurn = false,
  onCardClick
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

  // Calculate responsive card size with adaptive overlap
  const cardSize = useMemo(() => {
    const { cardSize: layoutCardSize } = layout;
    const availableWidth = layout.availableGameSpace.width * 0.85; // Use 85% of available space

    // Adaptive visible portion based on card count
    // Note: This is the VISIBLE portion of each card after the first
    // Lower value = more overlap (less visible)
    // Increased overlap to fit within fixed arc angle
    const getAdaptiveVisiblePortion = (cardCount: number, isMobile: boolean): number => {
      if (cardCount <= 2) {
        return isMobile ? 0.75 : 0.80;  // 20-25% overlap for 1-2 cards
      } else if (cardCount <= 4) {
        return isMobile ? 0.55 : 0.60;  // 40-45% overlap for 3-4 cards
      } else if (cardCount <= 6) {
        return isMobile ? 0.40 : 0.45;  // 55-60% overlap for 5-6 cards
      } else if (cardCount <= 8) {
        return isMobile ? 0.30 : 0.35;  // 65-70% overlap for 7-8 cards
      } else {
        return isMobile ? 0.20 : 0.25;  // 75-80% overlap for 9+ cards
      }
    };

    const visiblePortion = getAdaptiveVisiblePortion(cards.length, layout.isMobile);

    // Calculate maximum card width using original formula
    // Formula: availableWidth = cardWidth * (n * visiblePortion + (1 - visiblePortion))
    // Simplified: availableWidth = cardWidth * (1 + (n - 1) * visiblePortion)
    const maxCardWidth = availableWidth / (cards.length * visiblePortion + (1 - visiblePortion));

    // Use responsive card size but cap it if too many cards
    const targetWidth = Math.min(layoutCardSize.width, maxCardWidth);
    const aspectRatio = 5 / 7; // Classic TCG ratio

    return {
      width: targetWidth,
      height: targetWidth / aspectRatio
    };
  }, [layout, cards.length]);

  // Calculate arc configuration with FIXED spread angle
  const arcConfig = useMemo((): ArcConfig => {
    const baseRadius = layout.availableGameSpace.width * (layout.isMobile ? 0.8 : 0.5);

    // FIXED spread angle - stays constant regardless of card count
    // Cards fit within this angle via overlap, not by widening the arc
    const fixedSpread = layout.isMobile ? 25 : 35;

    return {
      radius: baseRadius,
      spreadAngle: fixedSpread,
      baseOffset: layout.isMobile ? 20 : 30,
      cardTilt: 0.8 // More pronounced rotation
    };
  }, [layout.isMobile]);

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

  // Click handler for card selection
  const handleCardClick = useCallback((card: GameCard, index: number) => {
    if (!isMyTurn) return;
    onCardClick?.(card, index);
  }, [isMyTurn, onCardClick]);

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
          onCardClick?.(cards[handState.focusedIndex]!, handState.focusedIndex);
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
  }, [cards, handState.focusedIndex, onCardClick]);

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
    <div className="relative w-full h-full pointer-events-none">
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
            {cards.map((card, index) => {
              const isCardSelected = selectedCardId === card.id && selectedHandIndex === index;
              const canAfford = card.cost <= resources;

              return (
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
                  isSelected={isCardSelected}
                  isPlayable={canAfford}
                  isMyTurn={isMyTurn}
                  onHover={handleCardHover}
                  onClick={handleCardClick}
                />
              );
            })}
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