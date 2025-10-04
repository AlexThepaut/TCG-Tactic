/**
 * GameEndScreen Component
 * Victory/Defeat UI with game statistics and post-game navigation
 * Task 1.3G - Game UI Integration
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrophyIcon,
  HomeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import type { GameResult, Faction } from '@/types';

export interface GameEndScreenProps {
  result: GameResult;
  localPlayerId: string;
  onRematch?: () => void;
  className?: string;
}

const FACTION_COLORS = {
  humans: {
    primary: 'imperial-500',
    secondary: 'imperial-400',
    glow: 'imperial',
    gradient: 'from-imperial-900 to-gothic-darkest'
  },
  aliens: {
    primary: 'aliens-500',
    secondary: 'aliens-400',
    glow: 'aliens',
    gradient: 'from-aliens-900 to-gothic-darkest'
  },
  robots: {
    primary: 'robots-500',
    secondary: 'robots-400',
    glow: 'robots',
    gradient: 'from-robots-900 to-gothic-darkest'
  }
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const GameEndScreen: React.FC<GameEndScreenProps> = ({
  result,
  localPlayerId,
  onRematch,
  className = ''
}) => {
  const navigate = useNavigate();

  const isVictory = result.winner === localPlayerId;

  // Determine faction for theming (assume from result context)
  const faction: Faction = 'humans'; // TODO: Get from game context
  const colors = FACTION_COLORS[faction];

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRematch = () => {
    if (onRematch) {
      onRematch();
    } else {
      navigate('/matchmaking');
    }
  };

  const handleViewDeck = () => {
    navigate('/deck-builder');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${colors.gradient} backdrop-blur-sm ${className}`}
      role="dialog"
      aria-labelledby="game-end-title"
      aria-modal="true"
    >
      {/* Atmospheric effects */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${colors.primary} to-transparent`}></div>
        <div className={`absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-${colors.primary} to-transparent`}></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-4">
        {/* Main result card */}
        <div className={`bg-gothic-black/90 border-2 ${isVictory ? `border-${colors.primary}` : 'border-blood-500'} rounded-xl p-8 backdrop-blur-md`}>

          {/* Victory/Defeat Header */}
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              {isVictory ? (
                <TrophyIcon className={`w-20 h-20 text-${colors.primary} icon-glow-${colors.glow} animate-pulse`} />
              ) : (
                <div className="text-blood-400 text-6xl font-gothic icon-glow-void animate-flicker">☠</div>
              )}
            </div>

            <h1
              id="game-end-title"
              className={`text-5xl font-gothic font-bold mb-4 gothic-text-shadow tracking-wider ${
                isVictory ? `text-${colors.primary}` : 'text-blood-400'
              }`}
            >
              {isVictory ? 'VICTORY' : 'DEFEAT'}
            </h1>

            <p className={`text-xl font-tech tracking-wide ${isVictory ? `text-${colors.secondary}` : 'text-blood-300'}`}>
              {result.winCondition}
            </p>
          </div>

          {/* Game Statistics */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Total Turns */}
            <div className="bg-gothic-darkest/60 border border-void-600/30 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <BoltIcon className="w-6 h-6 text-imperial-400" />
              </div>
              <div className="text-2xl font-bold text-imperial-300 mb-1">{result.totalTurns}</div>
              <div className="text-sm text-void-400 font-tech">Total Turns</div>
            </div>

            {/* Game Duration */}
            <div className="bg-gothic-darkest/60 border border-void-600/30 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <ClockIcon className="w-6 h-6 text-aliens-400" />
              </div>
              <div className="text-2xl font-bold text-aliens-300 mb-1">
                {formatDuration(result.gameDuration)}
              </div>
              <div className="text-sm text-void-400 font-tech">Duration</div>
            </div>

            {/* Actions Performed */}
            <div className="bg-gothic-darkest/60 border border-void-600/30 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <ChartBarIcon className="w-6 h-6 text-robots-400" />
              </div>
              <div className="text-2xl font-bold text-robots-300 mb-1">{result.actions.length}</div>
              <div className="text-sm text-void-400 font-tech">Actions</div>
            </div>
          </div>

          {/* Action Breakdown (optional detailed stats) */}
          <div className="mb-8 bg-gothic-darkest/40 border border-void-600/20 rounded-lg p-4">
            <h3 className="text-lg font-tech text-void-300 mb-3 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Action Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-imperial-300">
                  {result.actions.filter(a => a.type === 'place_unit').length}
                </div>
                <div className="text-xs text-void-400 font-tech">Units Placed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blood-300">
                  {result.actions.filter(a => a.type === 'attack').length}
                </div>
                <div className="text-xs text-void-400 font-tech">Attacks</div>
              </div>
              <div>
                <div className="text-xl font-bold text-aliens-300">
                  {result.actions.filter(a => a.type === 'cast_spell').length}
                </div>
                <div className="text-xs text-void-400 font-tech">Spells Cast</div>
              </div>
              <div>
                <div className="text-xl font-bold text-robots-300">
                  {result.actions.filter(a => a.type === 'end_turn').length}
                </div>
                <div className="text-xs text-void-400 font-tech">Turns Ended</div>
              </div>
            </div>
          </div>

          {/* Post-Game Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Rematch */}
            {onRematch && (
              <button
                onClick={handleRematch}
                className={`px-8 py-4 bg-${colors.primary}/80 hover:bg-${colors.primary} text-${colors.secondary} border border-${colors.primary}/50 font-tech font-bold tracking-wide transition-all duration-300 hover:box-glow-${colors.glow} rounded-lg flex items-center justify-center gap-2`}
                aria-label="Request rematch"
              >
                <ArrowPathIcon className="w-5 h-5" />
                <span className="gothic-text-shadow">Rematch</span>
              </button>
            )}

            {/* View Deck */}
            <button
              onClick={handleViewDeck}
              className="px-8 py-4 bg-void-700/80 hover:bg-void-600 text-void-200 border border-void-500/50 font-tech font-bold tracking-wide transition-all duration-300 hover:border-void-400 rounded-lg flex items-center justify-center gap-2"
              aria-label="View deck builder"
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>Deck Builder</span>
            </button>

            {/* Return Home */}
            <button
              onClick={handleGoHome}
              className="px-8 py-4 bg-gothic-darkest/80 hover:bg-gothic-darkest border border-imperial-600/50 text-imperial-300 font-tech font-bold tracking-wide transition-all duration-300 hover:border-imperial-500 rounded-lg flex items-center justify-center gap-2"
              aria-label="Return to main menu"
            >
              <HomeIcon className="w-5 h-5" />
              <span className="gothic-text-shadow">Main Menu</span>
            </button>
          </div>

          {/* End game timestamp */}
          <div className="mt-6 text-center text-xs text-void-500 font-tech">
            Game ended: {new Date(result.gameEndedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GameEndScreen);
