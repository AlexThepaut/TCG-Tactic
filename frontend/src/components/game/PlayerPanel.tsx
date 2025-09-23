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
    <div className="flex items-center space-x-4">
      {/* Vertical resource bubbles */}
      <div className="flex flex-col-reverse gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "w-4 h-4 border-2 transition-all duration-200 relative",
              i < player.resources
                ? "bg-void-500 border-void-400 shadow-lg shadow-void-500/50"
                : "border-gothic-medium bg-gothic-darker"
            )}
          >
            {/* Add inner glow for filled echoes */}
            {i < player.resources && (
              <div className="absolute inset-0.5 bg-void-400 opacity-60" />
            )}

            {/* Echo number */}
            {i < player.resources && (
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-void-100 font-tech">
                {i + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Info section */}
      <div className="flex-1 space-y-2">
        <div className="text-2xl font-gothic font-bold text-void-300 bg-gothic-darkest/80 border border-void-600/30 px-3 py-2 text-center gothic-text-shadow">
          {player.resources}/10
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gothic-darker border border-void-600/30 h-3 overflow-hidden">
          <div
            className="h-full transition-all duration-300 bg-void-500 shadow-lg shadow-void-500/50"
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
        'w-52 bg-gothic-darkest/95 backdrop-blur-sm border-2 relative scanlines',
        'flex flex-col justify-between p-4',
        isCurrentPlayer
          ? 'border-imperial-700/50 box-glow-imperial'
          : 'border-void-700/50',
        className
      )}
    >
      {/* Atmospheric border effects */}
      <div className={clsx(
        'absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent transition-opacity',
        isCurrentPlayer ? 'via-imperial-500' : 'via-void-500'
      )}></div>
      <div className={clsx(
        'absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent transition-opacity',
        isCurrentPlayer ? 'via-imperial-500' : 'via-void-500'
      )}></div>
      {/* Top Section */}
      <div className="space-y-4 relative z-10">
        {/* Player Header */}
        <div className="bg-gothic-darker/80 border border-imperial-600/30 p-3 relative group">
          <div className="flex items-center space-x-3">
            {/* Avatar placeholder */}
            <div className={clsx(
              'w-10 h-10 border-2 flex items-center justify-center relative',
              isCurrentPlayer
                ? 'bg-imperial-600 border-imperial-400 box-glow-imperial'
                : `${factionClasses.background} border-white/20`
            )}>
              <UserIcon className="w-6 h-6 text-white" />
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-gothic font-bold text-imperial-300 truncate gothic-text-shadow tracking-wider">
                  {player.username.toUpperCase()}
                </h3>
                {isCurrentPlayer && (
                  <span className="px-2 py-1 bg-imperial-600/80 text-imperial-100 text-xs font-tech font-bold tracking-wide border border-imperial-400/50">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs font-tech tracking-wide">
                <span className={clsx(
                  isCurrentPlayer ? 'text-imperial-400' : 'text-void-500'
                )}>
                  {isCurrentPlayer ? 'COMMAND ACTIVE' : 'ENEMY OPERATIVE'}
                </span>
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent group-hover:via-imperial-400 transition-colors"></div>
        </div>

        {/* Faction Information */}
        <div className="bg-gothic-darker/80 border border-imperial-600/30 p-3 relative group">
          {/* Faction header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className={clsx(
              'p-2 border-2 flex items-center justify-center',
              `${factionClasses.background} border-white/20`
            )}>
              {getFactionIcon(player.faction)}
            </div>
            <div>
              <div className="text-sm font-gothic font-bold text-imperial-300 gothic-text-shadow tracking-wider">
                {formatFactionName(player.faction).toUpperCase()}
              </div>
              <div className="text-xs font-tech text-imperial-500 tracking-wide">
                {formationName.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Faction ability hint */}
          <div className="text-xs font-tech text-imperial-400 bg-gothic-darkest/60 border border-imperial-700/30 p-2 tracking-wide">
            {player.faction === 'humans' && "⚔ TACTICAL FORMATION: Complete lines +2 ATK/+1 HP"}
            {player.faction === 'aliens' && "🧬 EVOLUTION: Dead units reduce summon cost -1"}
            {player.faction === 'robots' && "⚡ REANIMATION: 30% resurrection chance at 1 HP"}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent group-hover:via-imperial-400 transition-colors"></div>
        </div>
      </div>

      {/* Middle Section - Resources */}
      <div className="bg-gothic-darker/80 border border-void-600/30 p-3 relative group">
        <div className="mb-2">
          <h4 className="text-sm font-gothic font-bold text-void-400 gothic-text-shadow tracking-wider">VOID ECHOES</h4>
        </div>
        <EchoesDisplay />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-void-600 to-transparent group-hover:via-void-400 transition-colors"></div>
      </div>

      {/* Bottom Section - Stats & Ready Status */}
      <div className="bg-gothic-darker/80 border border-imperial-600/30 p-3 relative group">
        {/* Game Stats */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-gothic font-bold text-imperial-400 gothic-text-shadow tracking-wider">TACTICAL STATUS</h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gothic-darkest/60 border border-imperial-700/30 p-2 text-center">
              <div className="text-lg font-gothic font-bold text-imperial-300 gothic-text-shadow">{player.hand.length}</div>
              <div className="text-xs font-tech text-imperial-500 tracking-wide">HAND</div>
            </div>

            <div className="bg-gothic-darkest/60 border border-imperial-700/30 p-2 text-center">
              <div className="text-lg font-gothic font-bold text-imperial-300 gothic-text-shadow">
                {player.board.flat().filter(card => card !== null).length}
              </div>
              <div className="text-xs font-tech text-imperial-500 tracking-wide">DEPLOYED</div>
            </div>
          </div>
        </div>

        {/* Ready Status */}
        <div className="border-t border-imperial-700/30 pt-3">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'w-3 h-3 border-2 transition-all',
              player.isReady
                ? 'bg-imperial-500 border-imperial-400 shadow-lg shadow-imperial-500/50 animate-pulse'
                : 'bg-gothic-darker border-void-600'
            )} />
            <span className={clsx(
              'text-xs font-tech font-bold tracking-wide',
              player.isReady ? 'text-imperial-400' : 'text-void-500'
            )}>
              {player.isReady ? 'COMBAT READY' : 'STANDING BY'}
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent group-hover:via-imperial-400 transition-colors"></div>
      </div>
    </motion.div>
  );
};

export default memo(PlayerPanel);