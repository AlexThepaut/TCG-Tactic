import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  BoltIcon,
  SparklesIcon,
  CheckIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

export interface MiddleActionZoneProps {
  canAttack: boolean;
  canCastSpell: boolean;
  canEndTurn: boolean;
  isMyTurn: boolean;
  onAttackMode: () => void;
  onSpellMode: () => void;
  onEndTurn: () => void;
  onMenu: () => void;
  attackMode?: boolean;
  spellMode?: boolean;
  className?: string;
}

const MiddleActionZone: React.FC<MiddleActionZoneProps> = ({
  canAttack,
  canCastSpell,
  canEndTurn,
  isMyTurn,
  onAttackMode,
  onSpellMode,
  onEndTurn,
  onMenu,
  attackMode = false,
  spellMode = false,
  className,
}) => {
  const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    enabled: boolean;
    active?: boolean;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'success';
  }> = ({ icon, label, enabled, active = false, onClick, variant = 'default' }) => {
    const getButtonStyles = () => {
      if (!enabled) {
        return 'bg-gray-700/50 text-gray-500 cursor-not-allowed';
      }

      const baseStyles = 'transition-all duration-200 transform hover:scale-105 active:scale-95';

      if (active) {
        return clsx(baseStyles, {
          'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30': variant === 'default',
          'bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/30': variant === 'success',
          'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30': variant === 'primary',
        });
      }

      return clsx(baseStyles, {
        'bg-gray-800/80 text-gray-300 border-gray-600 hover:bg-gray-700/80 hover:text-white': variant === 'default',
        'bg-green-700/20 text-green-400 border-green-600/50 hover:bg-green-600/30': variant === 'success',
        'bg-purple-700/20 text-purple-400 border-purple-600/50 hover:bg-purple-600/30': variant === 'primary',
      });
    };

    return (
      <motion.button
        onClick={enabled ? onClick : undefined}
        className={clsx(
          'flex flex-col items-center justify-center p-3 rounded-lg border-2 min-w-[60px] min-h-[60px]',
          getButtonStyles()
        )}
        {...(enabled && { whileHover: { y: -2 } })}
        {...(enabled && { whileTap: { scale: 0.95 } })}
        disabled={!enabled}
      >
        <div className="w-6 h-6 mb-1">
          {icon}
        </div>
        <span className="text-xs font-medium text-center leading-tight">
          {label}
        </span>
      </motion.button>
    );
  };

  return (
    <div className={clsx(
      'flex flex-col items-center justify-center space-y-3 px-2',
      className
    )}>
      {/* Turn Phase Indicator */}
      <div className="text-center">
        <div className={clsx('text-xs font-medium', {
          'text-green-400': isMyTurn,
          'text-gray-500': !isMyTurn,
        })}>
          {isMyTurn ? 'Action Phase' : 'Waiting...'}
        </div>
        {isMyTurn && (
          <div className="w-16 h-1 bg-green-500/30 rounded-full mt-1">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2">
        {/* Attack Button */}
        <ActionButton
          icon={<BoltIcon />}
          label="Attack"
          enabled={canAttack && isMyTurn}
          active={attackMode}
          onClick={onAttackMode}
          variant="default"
        />

        {/* Spell Button */}
        <ActionButton
          icon={<SparklesIcon />}
          label="Spell"
          enabled={canCastSpell && isMyTurn}
          active={spellMode}
          onClick={onSpellMode}
          variant="primary"
        />

        {/* End Turn Button */}
        <ActionButton
          icon={<CheckIcon />}
          label="End Turn"
          enabled={canEndTurn && isMyTurn}
          onClick={onEndTurn}
          variant="success"
        />

        {/* Menu Button */}
        <ActionButton
          icon={<EllipsisVerticalIcon />}
          label="Menu"
          enabled={true}
          onClick={onMenu}
          variant="default"
        />
      </div>

      {/* Current Mode Indicator */}
      {(attackMode || spellMode) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className={clsx('text-xs font-semibold px-2 py-1 rounded-full', {
            'bg-red-500/20 text-red-400': attackMode,
            'bg-purple-500/20 text-purple-400': spellMode,
          })}>
            {attackMode && 'Select Target'}
            {spellMode && 'Choose Spell Target'}
          </div>
        </motion.div>
      )}

      {/* Combat Divider */}
      <div className="w-full border-t border-gray-600 my-2" />

      {/* Combat Indicator */}
      <div className="text-center">
        <div className="text-xs text-gray-500">
          Battle Zone
        </div>
        <div className="flex items-center justify-center space-x-1 mt-1">
          <div className="w-2 h-2 bg-red-500/50 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="w-2 h-2 bg-green-500/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    </div>
  );
};

export default MiddleActionZone;