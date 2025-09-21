/**
 * PlayerPanel Component - Side panel displaying player information
 * Shows player name, faction, and echoes count with faction-themed styling
 */
import React, { memo } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  UserIcon,
  ShieldCheckIcon,
  BeakerIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { getFactionClasses, formatFactionName, getFactionFormation } from '@/utils/factionThemes';
import type { PlayerData, Faction } from '@/types';

export interface PlayerPanelProps {
  player: PlayerData;
  isCurrentPlayer: boolean;
  position: 'left' | 'right';
  className?: string;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  isCurrentPlayer,
  position,
  className
}) => {
  // Get faction styling
  const factionClasses = getFactionClasses(player.faction, 'primary');
  const formationName = getFactionFormation(player.faction);

  // Get faction icon
  const getFactionIcon = (faction: Faction) => {
    switch (faction) {
      case 'humans':
        return <ShieldCheckIcon className="w-5 h-5" />;
      case 'aliens':
        return <BeakerIcon className="w-5 h-5" />;
      case 'robots':
        return <CpuChipIcon className="w-5 h-5" />;
      default:
        return <UserIcon className="w-5 h-5" />;
    }
  };

  // Resource bubbles for Void Echoes - Vertical Layout
  const EchoesDisplay = memo(() => (
    <div className="flex items-center space-x-3">
      {/* Vertical resource bubbles */}
      <div className="flex flex-col-reverse gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "w-4 h-4 rounded border-2 transition-all duration-200 relative",
              i < player.resources
                ? `${factionClasses.background} border-white/20 shadow-md`
                : "border-gray-500 bg-gray-700/50"
            )}
          >
            {/* Add inner glow for filled echoes */}
            {i < player.resources && (
              <div className={clsx(
                "absolute inset-0.5 rounded-sm opacity-60",
                factionClasses.background.replace('bg-', 'bg-').replace('-600', '-400')
              )} />
            )}

            {/* Subtle echo number */}
            {i < player.resources && (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">
                {i + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Info section */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-300">Void Echoes</span>
        </div>
        <div className="text-xl font-bold text-white bg-gray-800/60 px-2 py-1 rounded text-center">
          {player.resources}/10
        </div>

        {/* Vertical progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={clsx(
              "h-full transition-all duration-300",
              factionClasses.background
            )}
            style={{ width: `${(player.resources / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  ));

  // Animation variants based on position
  const panelVariants = {
    hidden: {
      x: position === 'left' ? -20 : 20,
      opacity: 0
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        'w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg',
        'flex flex-col justify-between p-3',
        isCurrentPlayer && 'ring-2 ring-blue-500/50',
        className
      )}
    >
      {/* Top Section */}
      <div className="space-y-3">
        {/* Player Header */}
        <div className="flex items-center space-x-2">
          {/* Avatar placeholder */}
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center',
            factionClasses.background
          )}>
            <UserIcon className="w-5 h-5 text-white" />
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {player.username}
              </h3>
              {isCurrentPlayer && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">
              {isCurrentPlayer ? 'Your turn' : 'Opponent'}
            </p>
          </div>
        </div>

        {/* Faction Information */}
        <div className="space-y-2">
          {/* Faction header */}
          <div className="flex items-center space-x-2">
            <div className={clsx(
              'p-1.5 rounded-lg',
              factionClasses.background
            )}>
              {getFactionIcon(player.faction)}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {formatFactionName(player.faction)}
              </div>
              <div className="text-xs text-gray-400">
                {formationName}
              </div>
            </div>
          </div>

          {/* Faction ability hint */}
          <div className="text-xs text-gray-500 bg-gray-800/50 rounded p-2">
            {player.faction === 'humans' && "Complete lines get +2 ATK/+1 HP"}
            {player.faction === 'aliens' && "Dead aliens reduce summon cost by 1"}
            {player.faction === 'robots' && "30% chance to resurrect with 1 HP"}
          </div>
        </div>
      </div>

      {/* Middle Section - Resources */}
      <div>
        <EchoesDisplay />
      </div>

      {/* Bottom Section - Stats & Ready Status */}
      <div className="space-y-2 pt-2 border-t border-gray-700">
        {/* Game Stats */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Hand Size:</span>
            <span className="text-white font-medium">{player.hand.length}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Board Units:</span>
            <span className="text-white font-medium">
              {player.board.flat().filter(card => card !== null).length}
            </span>
          </div>
        </div>

        {/* Ready Status */}
        <div className="flex items-center space-x-2 pt-1 border-t border-gray-700/50">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            player.isReady ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          )} />
          <span className="text-xs text-gray-400">
            {player.isReady ? 'Ready' : 'Not Ready'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(PlayerPanel);