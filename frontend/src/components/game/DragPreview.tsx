/**
 * DragPreview Component - Custom drag preview for better UX
 * Shows card being dragged with visual feedback
 */
import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { BoltIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/solid';
import type { GameCard, Faction } from '@/types';

export interface DragPreviewProps {
  card: GameCard;
  faction: Faction;
  isDragging: boolean;
  position: { x: number; y: number };
}

const DragPreview: React.FC<DragPreviewProps> = ({
  card,
  faction,
  isDragging,
  position
}) => {
  if (!isDragging) return null;

  // Faction-specific styling
  const getFactionStyles = () => {
    switch (faction) {
      case 'humans':
        return {
          border: 'border-humans-600',
          bg: 'bg-gradient-to-br from-humans-50 to-humans-100',
          text: 'text-humans-900',
          accent: 'text-humans-600'
        };
      case 'aliens':
        return {
          border: 'border-aliens-700',
          bg: 'bg-gradient-to-br from-aliens-50 to-aliens-100',
          text: 'text-aliens-900',
          accent: 'text-aliens-700'
        };
      case 'robots':
        return {
          border: 'border-robots-600',
          bg: 'bg-gradient-to-br from-robots-50 to-robots-100',
          text: 'text-robots-900',
          accent: 'text-robots-600'
        };
      default:
        return {
          border: 'border-gray-600',
          bg: 'bg-gray-100',
          text: 'text-gray-900',
          accent: 'text-gray-600'
        };
    }
  };

  const styles = getFactionStyles();

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: 1.1, opacity: 0.9 }}
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x - 50,
        top: position.y - 70,
        transform: 'rotate(5deg)'
      }}
    >
      <div className={clsx(
        "w-24 h-32 rounded-lg border-2 p-2 shadow-2xl backdrop-blur-sm",
        styles.border,
        styles.bg,
        "ring-2 ring-blue-400/50"
      )}>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-1">
          <div className={clsx(
            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
            "bg-white/80",
            styles.accent
          )}>
            {card.cost}
          </div>
          {card.rarity === 'legendary' && (
            <SparklesIcon className="w-4 h-4 text-yellow-500" />
          )}
        </div>

        {/* Card Name */}
        <h3 className={clsx(
          "text-xs font-semibold leading-tight mb-1 line-clamp-2",
          styles.text
        )}>
          {card.name}
        </h3>

        {/* Card Art Placeholder */}
        <div className="w-full aspect-video rounded bg-gradient-to-br opacity-60 mb-1"
             style={{
               background: faction === 'humans' ? 'linear-gradient(to bottom right, #fecaca, #fca5a5)' :
                          faction === 'aliens' ? 'linear-gradient(to bottom right, #e9d5ff, #d8b4fe)' :
                          'linear-gradient(to bottom right, #a7f3d0, #6ee7b7)'
             }}
        />

        {/* Card Stats */}
        {card.type === 'unit' && (
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center">
              <BoltIcon className={clsx("w-3 h-3 mr-1", styles.accent)} />
              <span className={clsx("font-semibold", styles.text)}>
                {card.attack}
              </span>
            </div>
            <div className="flex items-center">
              <HeartIcon className={clsx("w-3 h-3 mr-1", styles.accent)} />
              <span className={clsx("font-semibold", styles.text)}>
                {card.health}
              </span>
            </div>
          </div>
        )}

        {/* Dragging indicator */}
        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-blue-400 animate-pulse" />
      </div>
    </motion.div>
  );
};

export default DragPreview;