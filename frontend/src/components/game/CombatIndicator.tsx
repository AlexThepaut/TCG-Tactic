/**
 * Combat Indicator Component - Task 1.3D Combat Logic Engine Integration
 * Visual feedback for attack validation, range indication, and combat results
 */
import React, { useEffect, useState } from 'react';
import { GamePosition, GameCard, Faction } from '../../types';

interface CombatIndicatorProps {
  attackerPosition?: GamePosition;
  targetPosition?: GamePosition;
  validTargets?: GamePosition[];
  combatResult?: CombatResult;
  showRangeIndicator?: boolean;
  faction: Faction;
}

interface CombatResult {
  success: boolean;
  attacker: {
    name: string;
    damage: number;
    destroyed: boolean;
    newHealth: number;
  };
  target: {
    name: string;
    damage: number;
    destroyed: boolean;
    newHealth: number;
  };
  factionEffects: FactionEffect[];
}

interface FactionEffect {
  faction: Faction;
  effectName: string;
  description: string;
  unitsAffected: GamePosition[];
}

export const CombatIndicator: React.FC<CombatIndicatorProps> = ({
  attackerPosition,
  targetPosition,
  validTargets = [],
  combatResult,
  showRangeIndicator = false,
  faction
}) => {
  const [animationPhase, setAnimationPhase] = useState<'none' | 'attack' | 'damage' | 'effects'>('none');
  const [showDamageNumbers, setShowDamageNumbers] = useState(false);

  useEffect(() => {
    if (combatResult) {
      // Animate combat sequence
      setAnimationPhase('attack');

      setTimeout(() => {
        setAnimationPhase('damage');
        setShowDamageNumbers(true);
      }, 300);

      setTimeout(() => {
        setAnimationPhase('effects');
      }, 800);

      setTimeout(() => {
        setAnimationPhase('none');
        setShowDamageNumbers(false);
      }, 2000);
    }
  }, [combatResult]);

  const getFactionColors = (faction: Faction) => {
    switch (faction) {
      case 'humans':
        return {
          primary: 'bg-blue-500',
          secondary: 'bg-blue-300',
          border: 'border-blue-400',
          glow: 'shadow-blue-400/50'
        };
      case 'aliens':
        return {
          primary: 'bg-green-500',
          secondary: 'bg-green-300',
          border: 'border-green-400',
          glow: 'shadow-green-400/50'
        };
      case 'robots':
        return {
          primary: 'bg-purple-500',
          secondary: 'bg-purple-300',
          border: 'border-purple-400',
          glow: 'shadow-purple-400/50'
        };
      default:
        return {
          primary: 'bg-gray-500',
          secondary: 'bg-gray-300',
          border: 'border-gray-400',
          glow: 'shadow-gray-400/50'
        };
    }
  };

  const colors = getFactionColors(faction);

  const renderRangeIndicator = () => {
    if (!showRangeIndicator || !attackerPosition) return null;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Range circle visualization */}
        <div
          className={`absolute rounded-full border-2 border-dashed ${colors.border} opacity-60`}
          style={{
            left: `${attackerPosition.x * 20}%`,
            top: `${attackerPosition.y * 33.33}%`,
            width: '60px',
            height: '60px',
            transform: 'translate(-50%, -50%)'
          }}
        />

        {/* Valid target indicators */}
        {validTargets.map((target, index) => (
          <div
            key={index}
            className={`absolute w-4 h-4 ${colors.secondary} rounded-full border-2 ${colors.border} animate-pulse`}
            style={{
              left: `${target.x * 20}%`,
              top: `${target.y * 33.33}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </div>
    );
  };

  const renderAttackLine = () => {
    if (!attackerPosition || !targetPosition || animationPhase !== 'attack') return null;

    const x1 = attackerPosition.x * 20;
    const y1 = attackerPosition.y * 33.33;
    const x2 = targetPosition.x * 20;
    const y2 = targetPosition.y * 33.33;

    return (
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <line
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke={colors.primary.replace('bg-', '')}
            strokeWidth="3"
            className="animate-pulse"
            style={{
              filter: `drop-shadow(0 0 6px ${colors.primary.replace('bg-', '')})`
            }}
          />
        </svg>
      </div>
    );
  };

  const renderDamageNumbers = () => {
    if (!showDamageNumbers || !combatResult || !attackerPosition || !targetPosition) return null;

    return (
      <>
        {/* Attacker damage */}
        {combatResult.attacker.damage > 0 && (
          <div
            className="absolute text-red-500 font-bold text-lg animate-bounce pointer-events-none"
            style={{
              left: `${attackerPosition.x * 20}%`,
              top: `${attackerPosition.y * 33.33}%`,
              transform: 'translate(-50%, -150%)'
            }}
          >
            -{combatResult.attacker.damage}
          </div>
        )}

        {/* Target damage */}
        {combatResult.target.damage > 0 && (
          <div
            className="absolute text-red-500 font-bold text-lg animate-bounce pointer-events-none"
            style={{
              left: `${targetPosition.x * 20}%`,
              top: `${targetPosition.y * 33.33}%`,
              transform: 'translate(-50%, -150%)'
            }}
          >
            -{combatResult.target.damage}
          </div>
        )}
      </>
    );
  };

  const renderFactionEffects = () => {
    if (animationPhase !== 'effects' || !combatResult?.factionEffects.length) return null;

    return (
      <div className="absolute top-4 right-4 space-y-2 pointer-events-none">
        {combatResult.factionEffects.map((effect, index) => (
          <div
            key={index}
            className={`px-3 py-2 rounded-lg ${colors.primary} text-white text-sm font-medium animate-fade-in-up shadow-lg ${colors.glow}`}
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <div className="font-bold">{effect.effectName}</div>
            <div className="text-xs opacity-90">{effect.description}</div>
            {effect.unitsAffected.length > 0 && (
              <div className="text-xs mt-1">
                Affects {effect.unitsAffected.length} unit(s)
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCombatLog = () => {
    if (!combatResult) return null;

    return (
      <div className="absolute bottom-4 left-4 max-w-md bg-black/80 text-white p-3 rounded-lg text-sm">
        <div className="font-bold mb-2">Combat Result</div>

        <div className="space-y-1">
          <div>
            <span className="text-blue-300">{combatResult.attacker.name}</span>
            {combatResult.attacker.damage > 0 && (
              <span className="text-red-300"> takes {combatResult.attacker.damage} damage</span>
            )}
            {combatResult.attacker.destroyed && (
              <span className="text-red-500 font-bold"> - DESTROYED</span>
            )}
          </div>

          <div>
            <span className="text-green-300">{combatResult.target.name}</span>
            {combatResult.target.damage > 0 && (
              <span className="text-red-300"> takes {combatResult.target.damage} damage</span>
            )}
            {combatResult.target.destroyed && (
              <span className="text-red-500 font-bold"> - DESTROYED</span>
            )}
          </div>

          {combatResult.factionEffects.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-yellow-300 font-medium">Faction Effects:</div>
              {combatResult.factionEffects.map((effect, index) => (
                <div key={index} className="text-xs text-yellow-200">
                  • {effect.effectName}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      {renderRangeIndicator()}
      {renderAttackLine()}
      {renderDamageNumbers()}
      {renderFactionEffects()}
      {renderCombatLog()}
    </div>
  );
};

// CSS animations for combat effects
const combatStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
  }

  .combat-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }

  .combat-line {
    filter: drop-shadow(0 0 6px currentColor);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = combatStyles;
  document.head.appendChild(styleElement);
}

export default CombatIndicator;