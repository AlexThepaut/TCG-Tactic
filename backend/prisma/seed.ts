import { PrismaClient } from '@prisma/client';
import { FACTION_SEED_DATA, FACTION_IDS } from './seed-factions';
import { CARD_ABILITIES_SEED_DATA } from './seed-abilities';
import { ALL_CARD_SEED_DATA } from './seed-cards';

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
  await prisma.cardAbility.deleteMany();
  await prisma.factionData.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Seed faction data
  console.log('🏴 Seeding faction data...');
  await Promise.all(
    FACTION_IDS.map((factionId, index) =>
      prisma.factionData.create({
        data: {
          id: factionId,
          name: FACTION_SEED_DATA[index]!.name!,
          description: FACTION_SEED_DATA[index]!.description!,
          formation: FACTION_SEED_DATA[index]!.formation!,
          passiveAbility: FACTION_SEED_DATA[index]!.passiveAbility! as any,
          colorTheme: FACTION_SEED_DATA[index]!.colorTheme!
        }
      })
    )
  );
  console.log('✅ Created 3 factions with formations and passive abilities');

  // Seed card abilities
  console.log('🔮 Seeding card abilities...');
  await Promise.all(
    CARD_ABILITIES_SEED_DATA.map(ability =>
      prisma.cardAbility.create({
        data: ability
      })
    )
  );
  console.log(`✅ Created ${CARD_ABILITIES_SEED_DATA.length} card abilities`);

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

  // Seed comprehensive card set (120 cards total)
  console.log('🃏 Seeding comprehensive card set...');

  const createdCards = [];
  for (const cardData of ALL_CARD_SEED_DATA) {
    const card = await prisma.activeCard.create({
      data: {
        name: cardData.name,
        faction: cardData.faction,
        type: cardData.type,
        cost: cardData.cost,
        attack: cardData.attack ?? null,
        hp: cardData.hp ?? null,
        range: cardData.range ?? null,
        abilities: (cardData.abilities || []) as any,
        description: cardData.description ?? null,
        flavorText: cardData.flavorText ?? null,
        setId: cardData.setId,
        isActive: cardData.isActive
      }
    });
    createdCards.push(card);
  }

  // Group cards by faction for stats
  const cardsByFaction = {
    humans: createdCards.filter(c => c.faction === 'humans').length,
    aliens: createdCards.filter(c => c.faction === 'aliens').length,
    robots: createdCards.filter(c => c.faction === 'robots').length
  };

  console.log(`✅ Created ${createdCards.length} cards total:`);
  console.log(`  🔵 Humans: ${cardsByFaction.humans} cards`);
  console.log(`  🟢 Aliens: ${cardsByFaction.aliens} cards`);
  console.log(`  🔴 Robots: ${cardsByFaction.robots} cards`);

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

  // Add cards to decks - create balanced sample decks
  const humanCards = createdCards.filter(card => card.faction === 'humans');
  const alienCards = createdCards.filter(card => card.faction === 'aliens');
  const robotCards = createdCards.filter(card => card.faction === 'robots');

  // Helper function to create a balanced deck with exactly 40 cards
  const createBalancedDeck = async (deckId: number, cards: any[]) => {
    // Sort cards by cost for balanced distribution
    const sortedCards = cards.sort((a, b) => a.cost - b.cost);
    const deckCards: { cardId: string; quantity: number }[] = [];
    let totalCards = 0;

    // Add cards with quantity based on cost (cheaper cards get more copies)
    for (const card of sortedCards) {
      let quantity = 0;
      if (card.cost <= 2) quantity = 4;
      else if (card.cost <= 4) quantity = 3;
      else if (card.cost <= 6) quantity = 2;
      else quantity = 1;

      // Ensure we don't exceed 40 cards
      if (totalCards + quantity > 40) {
        quantity = 40 - totalCards;
      }

      if (quantity > 0) {
        deckCards.push({ cardId: card.id, quantity });
        totalCards += quantity;
      }

      if (totalCards >= 40) break;
    }

    // Create deck cards
    await Promise.all(
      deckCards.map(({ cardId, quantity }) =>
        prisma.deckCard.create({
          data: { deckId, cardId, quantity }
        })
      )
    );
  };

  // Create balanced decks for each faction
  await createBalancedDeck(humanDeck.id, humanCards);
  await createBalancedDeck(alienDeck.id, alienCards);
  await createBalancedDeck(robotDeck.id, robotCards);

  console.log('🎴 Added cards to decks with balanced distribution');

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