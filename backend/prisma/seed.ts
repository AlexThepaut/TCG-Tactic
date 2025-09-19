import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in correct order to avoid foreign key issues)
  await prisma.gameState.deleteMany();
  await prisma.game.deleteMany();
  await prisma.deckCard.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.activeCard.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create test users
  const testUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'testuser1',
        email: 'test1@tcg-tactique.com',
        passwordHash: '$2a$10$example.hash.for.user1', // In real app, use bcrypt
      },
    }),
    prisma.user.create({
      data: {
        username: 'testuser2',
        email: 'test2@tcg-tactique.com',
        passwordHash: '$2a$10$example.hash.for.user2',
      },
    }),
    prisma.user.create({
      data: {
        username: 'aitest',
        email: 'ai@tcg-tactique.com',
        passwordHash: '$2a$10$example.hash.for.ai',
      },
    }),
  ]);

  console.log('👥 Created test users');

  // Create test cards (5 per faction = 15 total)
  const testCards = await Promise.all([
    // HUMANS - Disciplined faction focused on formation and coordination
    prisma.activeCard.create({
      data: {
        name: 'Imperial Guard',
        faction: 'humans',
        type: 'unit',
        cost: 2,
        attack: 2,
        hp: 3,
        range: '1',
        effects: ['Disciplined', 'Formation Fighter'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Heavy Bolter Squad',
        faction: 'humans',
        type: 'unit',
        cost: 4,
        attack: 3,
        hp: 2,
        range: '1-3',
        effects: ['Suppression', 'Line Breaker'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Space Marine Captain',
        faction: 'humans',
        type: 'unit',
        cost: 6,
        attack: 4,
        hp: 5,
        range: '1-2',
        effects: ['Leadership', 'Tactical Genius', 'Ultimate Rampart'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Tactical Strike',
        faction: 'humans',
        type: 'spell',
        cost: 3,
        effects: ['Deal 2 damage', 'Formation Bonus'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Fortify Position',
        faction: 'humans',
        type: 'spell',
        cost: 2,
        effects: ['Give +0/+2 to all units in formation', 'Defensive Stance'],
        setId: 'test-set-1',
      },
    }),

    // ALIENS - Adaptive faction focused on evolution and swarm tactics
    prisma.activeCard.create({
      data: {
        name: 'Ripper Swarm',
        faction: 'aliens',
        type: 'unit',
        cost: 1,
        attack: 1,
        hp: 1,
        range: '1',
        effects: ['Spawning', 'Quick Adaptation'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Genestealer',
        faction: 'aliens',
        type: 'unit',
        cost: 3,
        attack: 3,
        hp: 2,
        range: '1',
        effects: ['Infiltration', 'Evolutionary Adaptation'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Hive Tyrant',
        faction: 'aliens',
        type: 'unit',
        cost: 7,
        attack: 5,
        hp: 6,
        range: '1-2',
        effects: ['Hive Mind', 'Synapse Creature', 'Living Swarm'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Biomass Absorption',
        faction: 'aliens',
        type: 'spell',
        cost: 2,
        effects: ['Gain resources from dead aliens', 'Evolutionary Boost'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Swarm Tactics',
        faction: 'aliens',
        type: 'spell',
        cost: 4,
        effects: ['Summon 2 Ripper Swarms', 'Overwhelm'],
        setId: 'test-set-1',
      },
    }),

    // ROBOTS - Persistent faction focused on technology and resurrection
    prisma.activeCard.create({
      data: {
        name: 'Necron Warrior',
        faction: 'robots',
        type: 'unit',
        cost: 3,
        attack: 2,
        hp: 3,
        range: '1-2',
        effects: ['Reanimation Protocols', 'Gauss Weapon'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Scarab Destroyer',
        faction: 'robots',
        type: 'unit',
        cost: 2,
        attack: 1,
        hp: 2,
        range: '1',
        effects: ['Self-Repair', 'Swarm Intelligence'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Necron Lord',
        faction: 'robots',
        type: 'unit',
        cost: 8,
        attack: 6,
        hp: 7,
        range: '1-3',
        effects: ['Resurrection Orb', 'Phase Out', 'Immortal Army'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Reanimation',
        faction: 'robots',
        type: 'spell',
        cost: 3,
        effects: ['Resurrect destroyed robot', 'Improved Protocols'],
        setId: 'test-set-1',
      },
    }),
    prisma.activeCard.create({
      data: {
        name: 'Gauss Barrage',
        faction: 'robots',
        type: 'spell',
        cost: 5,
        effects: ['Deal 1 damage to all enemies', 'Phase Technology'],
        setId: 'test-set-1',
      },
    }),
  ]);

  console.log('🃏 Created 15 test cards (5 per faction)');

  // Create test decks
  const humanDeck = await prisma.deck.create({
    data: {
      userId: testUsers[0].id,
      name: 'Imperial Phalanx',
      faction: 'humans',
      isValid: false, // Will be updated by trigger when cards are added
    },
  });

  const alienDeck = await prisma.deck.create({
    data: {
      userId: testUsers[1].id,
      name: 'Hive Fleet Terror',
      faction: 'aliens',
      isValid: false,
    },
  });

  const robotDeck = await prisma.deck.create({
    data: {
      userId: testUsers[2].id,
      name: 'Eternal Legion',
      faction: 'robots',
      isValid: false,
    },
  });

  console.log('📦 Created test decks');

  // Add cards to human deck (exactly 40 cards)
  const humanCards = testCards.filter(card => card.faction === 'humans');
  // Safe array access: we know we created exactly 5 human cards above
  // Note: DeckCard uses composite key [deckId, cardId], so only one entry per card with quantity
  await Promise.all([
    prisma.deckCard.create({
      data: { deckId: humanDeck.id, cardId: humanCards[0]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: humanDeck.id, cardId: humanCards[1]!.id, quantity: 3 }
    }),
    prisma.deckCard.create({
      data: { deckId: humanDeck.id, cardId: humanCards[2]!.id, quantity: 2 }
    }),
    prisma.deckCard.create({
      data: { deckId: humanDeck.id, cardId: humanCards[3]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: humanDeck.id, cardId: humanCards[4]!.id, quantity: 3 }
    }),
  ]);

  // Add cards to alien deck (exactly 40 cards)
  const alienCards = testCards.filter(card => card.faction === 'aliens');
  // Safe array access: we know we created exactly 5 alien cards above
  await Promise.all([
    prisma.deckCard.create({
      data: { deckId: alienDeck.id, cardId: alienCards[0]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: alienDeck.id, cardId: alienCards[1]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: alienDeck.id, cardId: alienCards[2]!.id, quantity: 2 }
    }),
    prisma.deckCard.create({
      data: { deckId: alienDeck.id, cardId: alienCards[3]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: alienDeck.id, cardId: alienCards[4]!.id, quantity: 2 }
    }),
  ]);

  // Add cards to robot deck (exactly 40 cards)
  const robotCards = testCards.filter(card => card.faction === 'robots');
  // Safe array access: we know we created exactly 5 robot cards above
  await Promise.all([
    prisma.deckCard.create({
      data: { deckId: robotDeck.id, cardId: robotCards[0]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: robotDeck.id, cardId: robotCards[1]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: robotDeck.id, cardId: robotCards[2]!.id, quantity: 1 }
    }),
    prisma.deckCard.create({
      data: { deckId: robotDeck.id, cardId: robotCards[3]!.id, quantity: 4 }
    }),
    prisma.deckCard.create({
      data: { deckId: robotDeck.id, cardId: robotCards[4]!.id, quantity: 3 }
    }),
  ]);

  console.log('🎴 Added cards to decks (should trigger validation)');

  // Create a test game
  const testGame = await prisma.game.create({
    data: {
      player1Id: testUsers[0].id,
      player2Id: testUsers[1].id,
      player1DeckId: humanDeck.id,
      player2DeckId: alienDeck.id,
    },
  });

  // Create initial game state
  const initialBoardState = {
    player1: {
      id: testUsers[0].id,
      faction: 'humans' as const,
      hand: [],
      board: Array(3).fill(null).map(() => Array(5).fill(null)),
      resources: 1,
      deck_remaining: 40,
      graveyard: [],
      quest_id: 'humans_quest_1',
      quest_progress: 0,
    },
    player2: {
      id: testUsers[1].id,
      faction: 'aliens' as const,
      hand: [],
      board: Array(3).fill(null).map(() => Array(5).fill(null)),
      resources: 1,
      deck_remaining: 40,
      graveyard: [],
      quest_id: 'aliens_quest_2',
      quest_progress: 0,
    },
    currentPlayer: testUsers[0].id,
    turn: 1,
    phase: 'resources' as const,
    gameOver: false,
  };

  await prisma.gameState.create({
    data: {
      gameId: testGame.id,
      player1Id: testUsers[0].id,
      player2Id: testUsers[1].id,
      currentPlayerId: testUsers[0].id,
      turn: 1,
      phase: 'resources',
      boardStateJson: initialBoardState,
    },
  });

  console.log('🎮 Created test game with initial state');

  // Initialize user stats
  await Promise.all(testUsers.map(user =>
    prisma.userStats.create({
      data: {
        userId: user.id,
        totalGames: 0,
        totalWins: 0,
        humansGames: 0,
        humansWins: 0,
        aliensGames: 0,
        aliensWins: 0,
        robotsGames: 0,
        robotsWins: 0,
      },
    })
  ));

  console.log('📊 Initialized user statistics');

  // Verify deck validation worked
  const updatedDecks = await prisma.deck.findMany({
    include: {
      _count: {
        select: { deckCards: true }
      }
    }
  });

  console.log('🔍 Deck validation results:');
  updatedDecks.forEach((deck: any) => {
    console.log(`  ${deck.name}: ${deck.isValid ? '✅ Valid' : '❌ Invalid'} (${deck._count.deckCards} unique cards)`);
  });

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });