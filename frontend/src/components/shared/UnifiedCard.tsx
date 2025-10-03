/**
 * UnifiedCard Component - Classic TCG layout with Gothic theme preservation
 * Serves all three contexts: game, collection, and deck-builder
 * Updated to use click-based interactions instead of drag-and-drop
 */
import React, { memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ShieldCheckIcon,
  BoltIcon,
  HeartIcon
} from '@heroicons/react/24/solid';
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
  isPlayable = true,
  isSelected = false,
  isAffordable,
  showDetails = true,
  resources = 0,
  faction,
  quantity,
  disableAnimations = false,
  customAnimations
}) => {
  // Use collection configuration as default for all cards
  const contextConfig = CONTEXT_CONFIGS['collection'];
  const effectiveSize = cardSize || size || contextConfig.defaultSize;
  const cardFaction = faction || card.faction;

  // Calculate affordability and playability
  const canAfford = isAffordable !== undefined ? isAffordable : card.cost <= resources;
  const canPlay = isPlayable && canAfford;

  // Click-based interaction handler
  const handleCardClick = useCallback(() => {
    if (onClick && canPlay) {
      onClick(card);
    }
  }, [onClick, card, canPlay]);

  // Get faction-specific styling
  const factionStyles = useMemo((): FactionStyles => {
    const styleConfig = FACTION_STYLE_CONFIGS[cardFaction];
    return styleConfig ? styleConfig(canPlay, false) : {
      border: 'border-gray-600',
      bg: 'bg-gray-100',
      text: 'text-gray-900',
      accent: 'text-gray-600',
      glow: '',
      gradient: 'from-gray-200 to-gray-300'
    };
  }, [cardFaction, canPlay]);

  // Get responsive sizing classes
  const getSizeClasses = useCallback((): string => {
    if (effectiveSize === 'responsive') {
      // Classic TCG aspect ratio: 5:7 (0.714)
      return 'w-full max-w-32 aspect-[5/7]';
    }

    const dimensions = CARD_SIZES[effectiveSize];
    if (dimensions && typeof dimensions === 'object' && 'width' in dimensions) {
      // Use specific pixel values for larger cards via CSS custom properties
      // This allows us to have precise control over card sizes
      const widthPx = dimensions.width;

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
      // Return completely empty variants to avoid creating any transform context
      // This prevents double-layering when parent component controls all transforms
      return {
        idle: {},
        hover: {},
        dragging: {},
        selected: {},
        disabled: {}
      };
    }

    return customAnimations || DEFAULT_CARD_ANIMATIONS;
  }, [disableAnimations, customAnimations]);

  // Get current animation state
  const getCurrentVariant = useCallback((): string => {
    if (!canPlay && !canAfford) return 'disabled';
    if (isSelected) return 'selected';
    return 'idle';
  }, [canPlay, canAfford, isSelected]);


  return (
    <motion.div
      variants={animationVariants}
      initial="idle"
      animate={getCurrentVariant()}
      whileHover={canPlay && !disableAnimations ? "hover" : undefined}
      onClick={handleCardClick}
      whileTap={canPlay && !disableAnimations ? { scale: 0.95 } : undefined}
      className={clsx(
        // Base card structure with classic TCG proportions
        "relative rounded-lg select-none touch-manipulation",
        "transform-gpu", // Enable hardware acceleration

        // Size classes
        getSizeClasses(),

        // Faction and state styling
        factionStyles.border,
        factionStyles.bg,
        factionStyles.glow,

        // Interaction states - enhanced hover glow and click-based selection
        // Only apply hover effects when animations are enabled (not in hand context)
        !disableAnimations && canPlay && "hover:shadow-xl",
        !disableAnimations && "transition-all duration-300",
        canPlay ? "cursor-pointer" : "cursor-not-allowed",
        !canPlay && "opacity-60",
        // Add transitions for smooth glow effects
        "transition-shadow duration-500 ease-in-out",
        isSelected && "ring-4 ring-blue-500 ring-offset-2 scale-105",

        // Gothic theme effects
        "scanlines",

        // Custom className
        className
      )}
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
"gothic-text-shadow"
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
"gothic-text-shadow"
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
              "flex items-center text-xs md:text-sm bg-black/40 rounded px-1.5 py-0.5",
  "gothic-text-shadow"
            )}>
              <BoltIcon className={clsx("w-3 h-3 md:w-4 md:h-4 mr-1", "text-orange-400")} />
              <span className="font-semibold text-white">
                {card.attack}
              </span>
            </div>

            {/* Range - Center Bottom */}
            {card.range !== undefined && (
              <div className={clsx(
                "flex items-center text-xs md:text-sm bg-black/40 rounded px-1.5 py-0.5",
    "gothic-text-shadow"
              )}>
                <span className="font-semibold text-blue-300 mr-1">R</span>
                <span className="font-semibold text-white">
                  {card.range}
                </span>
              </div>
            )}

            {/* Health - Bottom Right */}
            <div className={clsx(
              "flex items-center text-xs md:text-sm bg-black/40 rounded px-1.5 py-0.5",
  "gothic-text-shadow"
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
          "bg-black/20 text-white",
          contextConfig.theme?.gothic?.textShadow && "gothic-text-shadow"
        )}>
          {card.type}
        </div>
      </div>

      {/* Selection Indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 rounded-lg border-4 border-blue-400 bg-blue-500/10 pointer-events-none"
          />
        )}
      </AnimatePresence>


    </motion.div>
  );
};

export default memo(UnifiedCard);