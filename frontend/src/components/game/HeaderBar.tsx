import React from 'react';
import { clsx } from 'clsx';
import {
  ClockIcon,
  CogIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { getFactionClasses, formatFactionName } from '@/utils/factionThemes';
import type { PlayerData } from '@/types';

export interface HeaderBarProps {
  currentPlayer: PlayerData;
  opponent: PlayerData;
  isMyTurn: boolean;
  timeRemaining: number;
  resources: number;
  maxResources: number;
  questProgress?: number;
  onSurrender: () => void;
  onSettings: () => void;
  className?: string;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  currentPlayer,
  opponent,
  isMyTurn,
  timeRemaining,
  resources,
  maxResources,
  questProgress = 0,
  onSurrender,
  onSettings,
  className,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResourceDots = () => {
    return Array.from({ length: maxResources }, (_, i) => (
      <div
        key={i}
        className={clsx(
          'w-3 h-3 rounded-full border transition-all duration-200',
          i < resources
            ? 'bg-yellow-400 border-yellow-500 shadow-sm shadow-yellow-400'
            : 'bg-gray-700 border-gray-600'
        )}
      />
    ));
  };

  const getFactionColor = (faction: string) => {
    const classes = getFactionClasses(faction as any, 'primary');
    return classes.text.replace('text-white', 'text-gray-100'); // Adjust for better contrast on dark background
  };

  return (
    <div className={clsx(
      'flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700',
      className
    )}>
      {/* Left Section - Turn & Player Info */}
      <div className="flex items-center space-x-6">
        {/* Turn Indicator */}
        <div className="flex items-center space-x-2">
          <div className={clsx(
            'w-3 h-3 rounded-full transition-all duration-300',
            isMyTurn ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          )} />
          <span className="text-sm font-medium text-white">
            {isMyTurn ? 'Your Turn' : 'Opponent Turn'}
          </span>
        </div>

        {/* Current Player Info */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className="flex flex-col">
            <span className={clsx('text-sm font-semibold', getFactionColor(currentPlayer.faction))}>
              {currentPlayer.username}
            </span>
            <span className="text-xs text-gray-400">
              {formatFactionName(currentPlayer.faction)}
            </span>
          </div>
          <div className="text-gray-400 text-sm">vs</div>
          <div className="flex flex-col">
            <span className={clsx('text-sm font-semibold', getFactionColor(opponent.faction))}>
              {opponent.username}
            </span>
            <span className="text-xs text-gray-400">
              {formatFactionName(opponent.faction)}
            </span>
          </div>
        </div>
      </div>

      {/* Center Section - Resources & Timer */}
      <div className="flex items-center space-x-8">
        {/* Void Echoes */}
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1 mb-1">
            {getResourceDots()}
          </div>
          <span className="text-xs text-gray-400">
            Void Echoes {resources}/{maxResources}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-gray-400" />
          <span className={clsx(
            'text-lg font-mono font-bold',
            timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Quest Progress (subtle) */}
        {questProgress > 0 && (
          <div className="hidden md:flex flex-col items-center">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                style={{ width: `${questProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 mt-1">Quest</span>
          </div>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-3">
        {/* Surrender Button */}
        <button
          onClick={onSurrender}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 transition-all duration-200 hover:scale-105"
        >
          <FlagIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Surrender</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onSettings}
          className="p-2 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
        >
          <CogIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;