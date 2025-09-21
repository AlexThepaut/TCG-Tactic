/**
 * Faction Seed Data
 * Core faction data with formations and passive abilities
 */
import { FactionData, PassiveAbility } from '../src/types/database';

// Faction passive abilities
const FACTION_PASSIVE_ABILITIES: Record<string, PassiveAbility> = {
  humans: {
    id: 'ultimate_rampart',
    name: 'Ultimate Rampart',
    description: 'Complete lines get +2 ATK/+1 HP',
    effectType: 'passive',
    parameters: {
      attackBonus: 2,
      healthBonus: 1,
      triggerCondition: 'complete_line'
    }
  },
  aliens: {
    id: 'evolutionary_adaptation',
    name: 'Evolutionary Adaptation',
    description: 'Dead aliens reduce next summon cost by 1',
    effectType: 'triggered',
    parameters: {
      costReduction: 1,
      triggerCondition: 'unit_death',
      stackable: true
    }
  },
  robots: {
    id: 'reanimation_protocols',
    name: 'Reanimation Protocols',
    description: '30% chance to resurrect with 1 HP',
    effectType: 'triggered',
    parameters: {
      resurrectionChance: 0.3,
      resurrectionHp: 1,
      triggerCondition: 'unit_death'
    }
  }
};

// Faction formation patterns
export const FACTION_SEED_DATA: Omit<FactionData, 'id'>[] = [
  {
    name: 'Humans',
    description: 'Masters of discipline and coordination. The Human faction excels at tactical formations and structured combat, emphasizing teamwork and strategic positioning.',
    formation: [
      // "Tactical Phalanx" - disciplined formation
      [false, true, true, true, false],
      [false, true, true, true, false],
      [false, true, true, true, false]
    ],
    passiveAbility: FACTION_PASSIVE_ABILITIES['humans']!,
    colorTheme: '#3B82F6' // Blue
  },
  {
    name: 'Aliens',
    description: 'Practitioners of evolution and adaptation. The Alien faction thrives on biological flexibility and swarm tactics, constantly evolving to overcome challenges.',
    formation: [
      // "Living Swarm" - adaptive formation
      [false, true, true, true, false],
      [true, true, true, true, true],
      [false, false, true, false, false]
    ],
    passiveAbility: FACTION_PASSIVE_ABILITIES['aliens']!,
    colorTheme: '#10B981' // Green
  },
  {
    name: 'Robots',
    description: 'Champions of persistence and technology. The Robot faction relies on mechanical durability and technological superiority to outlast their enemies.',
    formation: [
      // "Immortal Army" - persistent formation
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, true, true, true, false]
    ],
    passiveAbility: FACTION_PASSIVE_ABILITIES['robots']!,
    colorTheme: '#EF4444' // Red
  }
];

export const FACTION_IDS: string[] = ['humans', 'aliens', 'robots'];