import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EyeIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export interface GameAction {
  id: string;
  type: 'card_played' | 'attack' | 'spell' | 'turn_end';
  player: string;
  description: string;
  timestamp: Date;
}

export interface StatusPanelProps {
  enemyHandCount: number;
  enemyFaction: string;
  recentActions: GameAction[];
  currentTurnActions: GameAction[];
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  enemyHandCount,
  enemyFaction,
  recentActions,
  currentTurnActions,
  isVisible,
  onToggle,
  className,
}) => {
  const [showCombatLog, setShowCombatLog] = useState(true);
  const [showTurnSummary, setShowTurnSummary] = useState(true);

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'humans': return 'text-blue-400';
      case 'aliens': return 'text-purple-400';
      case 'robots': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'card_played': return '🃏';
      case 'attack': return '⚔️';
      case 'spell': return '✨';
      case 'turn_end': return '🔄';
      default: return '•';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <motion.div
      className={clsx(
        'bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 flex flex-col',
        className
      )}
      initial={{ x: '100%' }}
      animate={{ x: isVisible ? 0 : '100%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Game Info</h3>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Enemy Hand Info */}
      <div className="p-3 border-b border-gray-700/50">
        <div className="flex items-center space-x-2 mb-2">
          <EyeIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">Enemy Info</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Hand Size:</span>
          <span className="text-sm font-semibold text-white">{enemyHandCount} cards</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">Faction:</span>
          <span className={clsx('text-sm font-semibold capitalize', getFactionColor(enemyFaction))}>
            {enemyFaction}
          </span>
        </div>

        {/* Hand Size Indicator */}
        <div className="flex space-x-1 mt-2">
          {Array.from({ length: Math.min(enemyHandCount, 8) }, (_, i) => (
            <div
              key={i}
              className="w-3 h-4 bg-gray-600 rounded-sm border border-gray-500"
            />
          ))}
          {enemyHandCount > 8 && (
            <span className="text-xs text-gray-400 ml-1">+{enemyHandCount - 8}</span>
          )}
        </div>
      </div>

      {/* Combat Log */}
      <div className="flex-1 min-h-0 flex flex-col">
        <button
          onClick={() => setShowCombatLog(!showCombatLog)}
          className="flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-white">Combat Log</span>
          </div>
          <motion.div
            animate={{ rotate: showCombatLog ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showCombatLog && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2 max-h-40 overflow-y-auto">
                {recentActions.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No actions yet
                  </div>
                ) : (
                  recentActions.slice(-10).map((action) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start space-x-2 text-xs"
                    >
                      <span className="text-sm">{getActionIcon(action.type)}</span>
                      <div className="flex-1">
                        <div className="text-gray-300">{action.description}</div>
                        <div className="text-gray-500 flex items-center space-x-2 mt-1">
                          <span>{action.player}</span>
                          <span>•</span>
                          <span>{formatTime(action.timestamp)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Turn Summary */}
      <div className="border-t border-gray-700/50">
        <button
          onClick={() => setShowTurnSummary(!showTurnSummary)}
          className="flex items-center justify-between w-full p-3 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-white">Current Turn</span>
          </div>
          <motion.div
            animate={{ rotate: showTurnSummary ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showTurnSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                {currentTurnActions.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">
                    Turn just started
                  </div>
                ) : (
                  <div className="space-y-1">
                    {currentTurnActions.map((action, index) => (
                      <div key={action.id} className="flex items-center space-x-2 text-xs">
                        <span className="w-4 text-center text-gray-500">{index + 1}.</span>
                        <span className="text-sm">{getActionIcon(action.type)}</span>
                        <span className="text-gray-300 flex-1">{action.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Turn Stats */}
                <div className="mt-3 pt-2 border-t border-gray-700/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Actions:</span>
                    <span className="text-white">{currentTurnActions.length}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StatusPanel;