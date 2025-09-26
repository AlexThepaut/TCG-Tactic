/**
 * UnifiedCard Component - Classic TCG layout with Gothic theme preservation
 * Serves all three contexts: game, collection, and deck-builder
 */
import React, { memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon
} from '@heroicons/react/24/solid';
import { useSafeDragCard } from '@/hooks/useSafeDragDrop';
import type { GameCard } from '@/types';
import type {
  UnifiedCardProps,
  FactionStyles,
  CardAnimationVariants
} from './UnifiedCard.types';
import {
  CARD_SIZES,
  CONTEXT_CONFIGS,
  DEFAULT_CARD_ANIMATIONS,
  FACTION_STYLE_CONFIGS
} from './UnifiedCard.types';

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  card,
  context = 'game',
  size,
  cardSize,
  className,
  onClick,
  onDragStart,
  onDragEnd,
  onTouch,
  isPlayable = true,
  isSelected = false,
  isAffordable,
  showDetails = true,
  showInteractions = true,
  handIndex = 0,
  resources = 0,
  faction,
  quantity,
  isInDeck = false,
  canAddToDeck = false,
  disableAnimations = false,
  customAnimations
}) => {
  // Get context configuration
  const contextConfig = CONTEXT_CONFIGS[context];
  const effectiveSize = cardSize || size || contextConfig.defaultSize;
  const cardFaction = faction || card.faction;

  // Calculate affordability and playability
  const canAfford = isAffordable !== undefined ? isAffordable : card.cost <= resources;
  const canPlay = isPlayable && canAfford;

  // Drag & drop integration (only for game context)
  const dragEnabled = context === 'game' && contextConfig.interactions.dragDrop.enabled;

  const { isDragging, canDrag, drag } = useSafeDragCard(
    dragEnabled ? card : null,
    handIndex,
    {
      faction: cardFaction,
      resources,
      onDragStart: (cardItem: GameCard, handIndexItem?: number) => onDragStart?.(cardItem, handIndexItem),
      onDragEnd: (cardItem: GameCard, handIndexItem?: number, didDrop?: boolean) => onDragEnd?.(cardItem, handIndexItem, didDrop)
    }
  );

  // Get faction-specific styling
  const factionStyles = useMemo((): FactionStyles => {
    const styleConfig = FACTION_STYLE_CONFIGS[cardFaction];
    return styleConfig ? styleConfig(canPlay, isDragging) : {
      border: 'border-gray-600',
      bg: 'bg-gray-100',
      text: 'text-gray-900',
      accent: 'text-gray-600',
      glow: '',
      gradient: 'from-gray-200 to-gray-300'
    };
  }, [cardFaction, canPlay, isDragging]);

  // Get responsive sizing classes
  const getSizeClasses = useCallback((): string => {
    if (effectiveSize === 'responsive') {
      // Classic TCG aspect ratio: 5:7 (0.714)
      return 'w-full max-w-32 aspect-[5/7]';
    }

    const dimensions = CARD_SIZES[effectiveSize];
    if (dimensions && dimensions !== 'auto') {
      // Use specific pixel values for larger cards via CSS custom properties
      // This allows us to have precise control over card sizes
      const widthPx = dimensions.width;
      const heightPx = dimensions.height;

      // Convert to Tailwind width classes with precise sizing
      return `aspect-[5/7]` +
        (widthPx >= 240 ? ` w-64` : // 256px for xxl
         widthPx >= 210 ? ` w-56` : // 224px for xl
         widthPx >= 180 ? ` w-48` : // 192px for lg
         widthPx >= 150 ? ` w-40` : // 160px for md
         widthPx >= 120 ? ` w-32` : // 128px for sm
         ` w-24`); // 96px for xs
    }

    // Fallback responsive classes
    return 'w-24 h-32 md:w-28 md:h-36 lg:w-32 lg:h-44';
  }, [effectiveSize]);

  // Get animation variants
  const animationVariants = useMemo((): CardAnimationVariants => {
    if (disableAnimations) {
      return {
        idle: { scale: 1, transition: { duration: 0 } },
        hover: { scale: 1, transition: { duration: 0 } },
        dragging: { scale: 1, transition: { duration: 0 } },
        selected: { scale: 1, transition: { duration: 0 } },
        disabled: { scale: 1, transition: { duration: 0 } }
      };
    }

    return customAnimations || DEFAULT_CARD_ANIMATIONS;
  }, [disableAnimations, customAnimations]);

  // Get current animation state
  const getCurrentVariant = useCallback((): string => {
    if (!canPlay && !canAfford) return 'disabled';
    if (isDragging) return 'dragging';
    if (isSelected) return 'selected';
    return 'idle';
  }, [canPlay, canAfford, isDragging, isSelected]);


  // Handle card click
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (contextConfig.interactions.click.enabled && onClick) {
      if (context === 'game' && !canPlay) return; // Only prevent click in game context
      onClick(card);
    }
  }, [onClick, card, context, canPlay, contextConfig.interactions.click.enabled]);

  // Handle touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (onTouch) {
      onTouch(e, card);
    }
  }, [onTouch, card]);

  // Get layout configuration
  const layoutConfig = contextConfig.layout;

  return (
    <motion.div
      ref={dragEnabled ? drag : undefined}
      variants={animationVariants}
      initial="idle"
      animate={getCurrentVariant()}
      whileHover={canPlay && !disableAnimations ? "hover" : "idle"}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      className={clsx(
        // Base card structure with classic TCG proportions
        "relative rounded-lg cursor-pointer select-none touch-manipulation backdrop-blur-sm",
        "transform-gpu", // Enable hardware acceleration

        // Size classes
        getSizeClasses(),

        // Faction and state styling
        factionStyles.border,
        factionStyles.bg,
        factionStyles.glow,

        // Interaction states - enhanced hover glow
        canPlay ? "hover:shadow-xl transition-all duration-300" : "opacity-60 cursor-not-allowed",
        // Add transitions for smooth glow effects
        "transition-shadow duration-500 ease-in-out",
        isSelected && "ring-2 ring-offset-2 ring-blue-500",

        // Gothic theme effects
        contextConfig.theme?.gothic?.scanlines && "scanlines",
        contextConfig.theme?.gothic?.backdropBlur && "backdrop-blur-sm",

        // Custom className
        className
      )}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: dragEnabled && canDrag ? 'grab' : undefined
      }}
      data-testid={`unified-card-${card.id}-${context}`}
    >
      {/* Classic TCG Layout - Art Top, Name Middle, Effects Bottom */}
      <div className="w-full h-full flex flex-col relative">

        {/* Cost - Top Left Corner */}
        <div className="absolute top-2 left-2 z-20">
          <div className={clsx(
            "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold",
            canAfford ? factionStyles.accent : 'text-red-500',
            canAfford ? 'bg-white/80' : 'bg-red-100/80',
            contextConfig.theme?.gothic?.textShadow && "gothic-text-shadow"
          )}>
            {card.cost}
          </div>
        </div>


        {/* Art Area - Top Section (takes up about 50-60% of card) */}
        <div className="px-2 pt-2 pb-1 flex-grow-0" style={{ flexBasis: '55%' }}>
          <div className={clsx(
            "w-full h-full rounded bg-gradient-to-br opacity-80",
            `bg-gradient-to-br ${factionStyles.gradient}`
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
                <div className={clsx("w-8 h-8 opacity-50", factionStyles.accent)}>
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

        {/* Name - Middle Section */}
        <div className="px-2 py-1 flex-shrink-0">
          <h3 className={clsx(
            "text-xs md:text-sm font-semibold leading-tight text-center line-clamp-2",
            factionStyles.text,
            contextConfig.theme?.gothic?.textShadow && "gothic-text-shadow"
          )}>
            {card.name}
          </h3>
        </div>

        {/* Effects/Description Area - Flexible Space */}
        <div className="px-2 flex-1 min-h-0 flex flex-col justify-center">
          {/* Abilities/Effects Text */}
          {card.abilities && card.abilities.length > 0 && (
            <div className={clsx(
              "text-xs text-center opacity-90 line-clamp-3",
              factionStyles.text
            )}>
              {card.abilities.join(' • ')}
            </div>
          )}
        </div>

        {/* Bottom Stats Area - Attack and Health in corners, Range in middle */}
        {card.type === 'unit' && showDetails && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-between items-center px-2">
            {/* Attack - Bottom Left */}
            <div className={clsx(
              "flex items-center text-xs md:text-sm bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5",
              contextConfig.theme?.gothic?.textShadow && "gothic-text-shadow"
            )}>
              <BoltIcon className={clsx("w-3 h-3 md:w-4 md:h-4 mr-1", "text-orange-400")} />
              <span className="font-semibold text-white">
                {card.attack}
              </span>
            </div>

            {/* Range - Center Bottom */}
            {card.range !== undefined && (
              <div className={clsx(
                "flex items-center text-xs md:text-sm bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5",
                contextConfig.theme?.gothic?.textShadow && "gothic-text-shadow"
              )}>
                <span className="font-semibold text-blue-300 mr-1">R</span>
                <span className="font-semibold text-white">
                  {card.range}
                </span>
              </div>
            )}

            {/* Health - Bottom Right */}
            <div className={clsx(
              "flex items-center text-xs md:text-sm bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5",
              contextConfig.theme?.gothic?.textShadow && "gothic-text-shadow"
            )}>
              <HeartIcon className={clsx("w-3 h-3 md:w-4 md:h-4 mr-1", "text-red-400")} />
              <span className="font-semibold text-white">
                {card.health}
              </span>
            </div>
          </div>
        )}

        {/* Collection/Deck builder specific - Quantity display */}
        {(context === 'collection' || context === 'deck-builder') && quantity !== undefined && (
          <div className={clsx(
            "absolute top-2 right-8 w-6 h-6 rounded-full flex items-center justify-center z-10",
            "text-xs font-bold bg-black/60 text-white border border-gray-500"
          )}>
            {quantity}
          </div>
        )}
      </div>

      {/* Type Badge */}
      <div className="absolute top-1 right-1">
        <div className={clsx(
          "px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide",
          "bg-black/20 backdrop-blur-sm text-white",
          contextConfig.theme?.gothic?.textShadow && "gothic-text-shadow"
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
      {context === 'game' && !canAfford && (
        <div className="absolute inset-0 bg-red-900/40 rounded-lg backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-xs font-semibold bg-red-600 px-2 py-1 rounded">
            Need {card.cost - resources} more
          </div>
        </div>
      )}

      {/* Gothic atmospheric effects */}
      {contextConfig.theme?.faction?.atmosphericEffects && (
        <>
          {/* Top border glow */}
          <div className={clsx(
            "absolute top-0 left-0 w-full h-px opacity-0 group-hover:opacity-100 transition-opacity",
            `bg-gradient-to-r from-transparent via-${cardFaction}-500 to-transparent`
          )} />

          {/* Bottom border glow */}
          <div className={clsx(
            "absolute bottom-0 left-0 w-full h-px opacity-0 group-hover:opacity-100 transition-opacity",
            `bg-gradient-to-r from-transparent via-${cardFaction}-500 to-transparent`
          )} />
        </>
      )}
    </motion.div>
  );
};

export default memo(UnifiedCard);