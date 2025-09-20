/**
 * Card Abilities Seed Data
 * Reference data for card abilities and effects
 */
import { CardAbility } from '../src/types/database';

export const CARD_ABILITIES_SEED_DATA: CardAbility[] = [
  // Basic Combat Abilities
  {
    id: 'armor',
    name: 'Armor Plating',
    description: 'Takes 1 less damage from attacks (minimum 1)',
    effectType: 'passive',
    parameters: {
      damageReduction: 1,
      minimumDamage: 1
    }
  },
  {
    id: 'first_strike',
    name: 'First Strike',
    description: 'Attacks first in combat',
    effectType: 'passive',
    parameters: {
      combatPriority: 1
    }
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Heals 1 HP at the start of each turn',
    effectType: 'triggered',
    parameters: {
      healAmount: 1,
      trigger: 'turn_start'
    }
  },

  // Swarm/Group Abilities (Aliens)
  {
    id: 'swarm',
    name: 'Swarm',
    description: '+1 attack for each adjacent alien unit',
    effectType: 'passive',
    parameters: {
      attackBonus: 1,
      condition: 'adjacent_faction_units',
      faction: 'aliens'
    }
  },
  {
    id: 'hive_mind',
    name: 'Hive Mind',
    description: 'When this unit dies, adjacent aliens gain +1/+1',
    effectType: 'triggered',
    parameters: {
      attackBonus: 1,
      healthBonus: 1,
      trigger: 'death',
      target: 'adjacent_faction_units',
      faction: 'aliens'
    }
  },
  {
    id: 'evolution',
    name: 'Evolution',
    description: 'Gains +1/+1 whenever an alien dies',
    effectType: 'triggered',
    parameters: {
      attackBonus: 1,
      healthBonus: 1,
      trigger: 'faction_unit_death',
      faction: 'aliens'
    }
  },

  // Tactical Abilities (Humans)
  {
    id: 'leadership',
    name: 'Leadership',
    description: 'Adjacent human units gain +1 attack',
    effectType: 'passive',
    parameters: {
      attackBonus: 1,
      target: 'adjacent_faction_units',
      faction: 'humans'
    }
  },
  {
    id: 'discipline',
    name: 'Discipline',
    description: 'Cannot be affected by negative effects',
    effectType: 'passive',
    parameters: {
      immunity: 'negative_effects'
    }
  },
  {
    id: 'tactical_strike',
    name: 'Tactical Strike',
    description: 'Deals +2 damage if in formation with other humans',
    effectType: 'passive',
    parameters: {
      damageBonus: 2,
      condition: 'formation_bonus',
      faction: 'humans'
    }
  },

  // Technological Abilities (Robots)
  {
    id: 'self_repair',
    name: 'Self-Repair',
    description: 'Heals 2 HP when played',
    effectType: 'triggered',
    parameters: {
      healAmount: 2,
      trigger: 'enter_battlefield'
    }
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    description: 'Double attack this turn, then takes 1 damage',
    effectType: 'activated',
    parameters: {
      attackMultiplier: 2,
      selfDamage: 1,
      duration: 'one_turn'
    }
  },
  {
    id: 'shield_generator',
    name: 'Shield Generator',
    description: 'Adjacent robots take 1 less damage',
    effectType: 'passive',
    parameters: {
      damageReduction: 1,
      target: 'adjacent_faction_units',
      faction: 'robots'
    }
  },

  // Range/Movement Abilities
  {
    id: 'sniper_scope',
    name: 'Sniper Scope',
    description: 'Can attack any unit on the battlefield',
    effectType: 'passive',
    parameters: {
      range: 'unlimited'
    }
  },
  {
    id: 'charge',
    name: 'Charge',
    description: 'Can attack immediately when played',
    effectType: 'triggered',
    parameters: {
      immediateAttack: true,
      trigger: 'enter_battlefield'
    }
  },
  {
    id: 'defensive_position',
    name: 'Defensive Position',
    description: 'Cannot attack but takes half damage',
    effectType: 'passive',
    parameters: {
      cannotAttack: true,
      damageReduction: 0.5
    }
  },

  // Special Effects
  {
    id: 'stealth',
    name: 'Stealth',
    description: 'Cannot be targeted by attacks for 1 turn',
    effectType: 'triggered',
    parameters: {
      untargetable: true,
      duration: 1,
      trigger: 'enter_battlefield'
    }
  },
  {
    id: 'explosive',
    name: 'Explosive',
    description: 'Deals 2 damage to adjacent units when destroyed',
    effectType: 'triggered',
    parameters: {
      damage: 2,
      target: 'adjacent_units',
      trigger: 'death'
    }
  },
  {
    id: 'barrier',
    name: 'Barrier',
    description: 'Absorbs the first 3 damage dealt to this unit',
    effectType: 'passive',
    parameters: {
      damageAbsorption: 3,
      oneTime: true
    }
  },

  // Resource/Cost Effects
  {
    id: 'efficient',
    name: 'Efficient',
    description: 'Costs 1 less Void Echo to play',
    effectType: 'passive',
    parameters: {
      costReduction: 1
    }
  },
  {
    id: 'energy_drain',
    name: 'Energy Drain',
    description: 'Enemy loses 1 Void Echo when this attacks',
    effectType: 'triggered',
    parameters: {
      resourceDrain: 1,
      trigger: 'attack'
    }
  },
  {
    id: 'sacrifice',
    name: 'Sacrifice',
    description: 'Destroy this unit to gain 2 Void Echoes',
    effectType: 'activated',
    parameters: {
      selfDestruct: true,
      resourceGain: 2
    }
  }
];