/**
 * TurnTimer Component
 * Visual turn timer with countdown and progress bar
 * Integrates with turn management system via Socket.io
 * Optimized with React.memo for performance (Task 1.3G)
 */
import React, { useEffect, useState, useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export interface TurnTimerProps {
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Total turn time limit in seconds */
  timeLimit?: number;
  /** Whether it's the current player's turn */
  isMyTurn: boolean;
  /** Callback when timer expires */
  onTimeExpired?: () => void;
  /** Optional className for custom styling */
  className?: string;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
  timeRemaining,
  timeLimit = 300,
  isMyTurn,
  onTimeExpired,
  className
}) => {
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Update urgency states based on remaining time
  useEffect(() => {
    const percentage = (timeRemaining / timeLimit) * 100;

    setIsCritical(percentage <= 10); // Last 10%
    setIsUrgent(percentage <= 25); // Last 25%
  }, [timeRemaining, timeLimit]);

  // Handle timer expiration
  useEffect(() => {
    if (timeRemaining <= 0 && isMyTurn && onTimeExpired) {
      onTimeExpired();
    }
  }, [timeRemaining, isMyTurn, onTimeExpired]);

  // Memoize formatted time string
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  // Memoize progress percentage calculation
  const progressPercentage = useMemo(
    () => Math.max(0, Math.min(100, (timeRemaining / timeLimit) * 100)),
    [timeRemaining, timeLimit]
  );

  // Determine color scheme based on state
  const getColorClasses = () => {
    if (!isMyTurn) {
      return {
        bg: 'bg-gray-700/50',
        text: 'text-gray-400',
        border: 'border-gray-600',
        fill: 'bg-gray-500'
      };
    }

    if (isCritical) {
      return {
        bg: 'bg-red-900/50',
        text: 'text-red-200',
        border: 'border-red-500',
        fill: 'bg-red-500'
      };
    }

    if (isUrgent) {
      return {
        bg: 'bg-yellow-900/50',
        text: 'text-yellow-200',
        border: 'border-yellow-500',
        fill: 'bg-yellow-500'
      };
    }

    return {
      bg: 'bg-void-800/50',
      text: 'text-void-200',
      border: 'border-void-500',
      fill: 'bg-void-500'
    };
  };

  const colors = getColorClasses();

  return (
    <div
      className={clsx(
        'turn-timer relative flex items-center gap-3 px-4 py-2 rounded-lg border-2',
        colors.bg,
        colors.border,
        'transition-all duration-300',
        {
          'animate-pulse': isCritical && isMyTurn,
          'shadow-lg': isMyTurn,
          'shadow-red-500/50': isCritical && isMyTurn,
          'shadow-yellow-500/50': isUrgent && isMyTurn && !isCritical,
          'shadow-void-500/50': isMyTurn && !isUrgent
        },
        className
      )}
      role="timer"
      aria-label={`Turn timer: ${formattedTime} remaining`}
    >
      {/* Clock Icon */}
      <ClockIcon
        className={clsx(
          'w-5 h-5',
          colors.text,
          {
            'animate-spin': isCritical && isMyTurn
          }
        )}
      />

      {/* Time Display */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className={clsx(
              'text-sm font-medium',
              colors.text
            )}
          >
            {isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}
          </span>
          <span
            className={clsx(
              'text-lg font-bold tabular-nums',
              colors.text,
              {
                'text-red-400': isCritical && isMyTurn,
                'text-yellow-400': isUrgent && isMyTurn && !isCritical
              }
            )}
          >
            {formattedTime}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-gray-900/50 rounded-full overflow-hidden">
          <div
            className={clsx(
              'absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-linear',
              colors.fill,
              {
                'animate-pulse': isUrgent && isMyTurn
              }
            )}
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={timeRemaining}
            aria-valuemin={0}
            aria-valuemax={timeLimit}
          />
        </div>
      </div>

      {/* Warning Indicator */}
      {isCritical && isMyTurn && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(TurnTimer, (prevProps, nextProps) => {
  return (
    prevProps.timeRemaining === nextProps.timeRemaining &&
    prevProps.timeLimit === nextProps.timeLimit &&
    prevProps.isMyTurn === nextProps.isMyTurn
  );
});
