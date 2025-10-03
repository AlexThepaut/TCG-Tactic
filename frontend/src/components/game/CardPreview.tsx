/**
 * CardPreview Component - Displays selected card in preview area
 * Shows current player's card with effects or opponent's card face-down
 */
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import UnifiedCard from '@/components/shared/UnifiedCard';
import type { GameCard, Faction } from '@/types';

export interface CardPreviewProps {
  card: GameCard | null;
  faction: Faction;
  position: 'left' | 'right';
  isFaceDown?: boolean;
  className?: string;
}

const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  faction,
  position,
  isFaceDown = false,
  className
}) => {
  // Faction-specific styling
  const factionStyles = {
    humans: {
      border: 'border-imperial-500/60',
      glow: 'shadow-lg shadow-imperial-500/40',
      bg: 'bg-imperial-900/70'
    },
    aliens: {
      border: 'border-aliens-500/60',
      glow: 'shadow-lg shadow-aliens-500/40',
      bg: 'bg-aliens-900/70'
    },
    robots: {
      border: 'border-robots-500/60',
      glow: 'shadow-lg shadow-robots-500/40',
      bg: 'bg-robots-900/70'
    }
  };

  const styles = factionStyles[faction];

  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        'w-[180px] md:w-[200px]',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {card ? (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              'relative',
              'p-4 rounded-lg border-2',
              styles.border,
              styles.bg,
              styles.glow
            )}
          >
            {isFaceDown ? (
              // Face-down card back for opponent
              <div className="w-[160px] md:w-[180px] h-[240px] md:h-[270px] relative">
                <div className={clsx(
                  'absolute inset-0 rounded-lg',
                  'bg-gradient-to-br from-gothic-darker to-gothic-black',
                  'border-2',
                  styles.border,
                  'flex items-center justify-center',
                  'scanlines'
                )}>
                  <div className="text-6xl opacity-20">🃏</div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <div className="text-xs font-gothic text-void-400 uppercase tracking-wider">
                      Opponent
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Face-up card for current player
              <div className="relative">
                <UnifiedCard
                  card={card}
                  cardSize="lg"
                  faction={faction}
                  context="game"
                  isSelected={true}
                  disableAnimations={false}
                />
                <div className="absolute -top-3 left-0 right-0 text-center">
                  <div className="text-xs font-gothic text-imperial-300 uppercase tracking-wider bg-imperial-900/90 px-3 py-1 inline-block rounded-md border-2 border-imperial-500/70 shadow-lg shadow-imperial-500/30">
                    ⚔ Selected
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // Empty state
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx(
              'w-[160px] md:w-[180px] h-[240px] md:h-[270px]',
              'border-2 border-dashed rounded-lg',
              'border-void-700/30',
              'flex items-center justify-center',
              'bg-void-950/10'
            )}
          >
            <div className="text-center px-4">
              <div className="text-4xl mb-2 opacity-20">🃏</div>
              <div className="text-xs font-tech text-void-500 uppercase tracking-wide">
                {position === 'left' ? 'Select a card' : 'Waiting...'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(CardPreview);
