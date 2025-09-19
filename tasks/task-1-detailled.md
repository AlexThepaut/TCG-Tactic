# Plan de Développement Détaillé - TCG Tactique

## 🎯 Vue d'Ensemble des Agents Claude Code

### Agents Recommandés par Type de Tâche
- **@architect** : Architecture générale, structure de projet
- **@database** : Modèles de données, migrations, requêtes SQL
- **@backend** : API REST, services, logique métier
- **@frontend** : Interface React, composants, UX/UI
- **@fullstack** : Intégration frontend/backend, debug cross-stack
- **@test** : Tests unitaires, tests d'intégration
- **@debug** : Résolution de bugs, optimisation performance

---

## 📋 Tâche 1 : Core Game Engine + Interface Basique

### **Étape 1.1 : Setup + Grille Vide**

#### Backend Setup
**Agent** : `@architect` puis `@backend`

**Objectifs** :
```typescript
// Structure de projet à créer
tcg-tactique/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── services/
│   │   ├── routes/
│   │   └── middleware/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

**Commandes Claude Code** :
```bash
# 1. Architecture générale
@architect "Crée la structure complète d'un projet TCG avec backend Node.js/Express/TypeScript/PostgreSQL et frontend React/TypeScript/Vite. Inclus Docker Compose pour dev local."

# 2. Configuration backend
@backend "Setup Express + TypeScript avec middleware cors, helmet, morgan. Ajoute connection PostgreSQL avec pg. Structure basique avec routes healthcheck."

# 3. Configuration frontend  
@frontend "Setup React 18 + TypeScript + Vite + TailwindCSS. Crée composant App basique avec routing React Router."
```

**Modèles de Données Initiaux** :
**Agent** : `@database`

```bash
@database "Crée le schéma PostgreSQL pour TCG Tactique avec tables : users, active_cards, decks, deck_cards, games. Inclus contraintes de validation (deck = 40 cartes, max 4 par carte)."
```

**Livrables** :
- Projet structuré avec Docker Compose
- Backend + Frontend démarrent sans erreur
- Base de données PostgreSQL connectée
- Page web vide accessible

**Test** : `npm run dev` → Application accessible sur localhost

---

#### Frontend Grilles Vides
**Agent** : `@frontend`

**Objectifs** :
- Affichage des grilles 3×5 joueur et adversaire
- Navigation basique entre pages
- Layout responsive paysage

**Commandes Claude Code** :
```bash
@frontend "Crée composant GameBoard avec 2 grilles 3x5 (joueur en bas, adversaire en haut). Style TailwindCSS épuré, cases vides cliquables. Format paysage obligatoire."

@frontend "Ajoute navigation simple : Menu Principal → Game Screen. Boutons clairs avec TailwindCSS."
```

**Composants à créer** :
```typescript
// Components/GameBoard.tsx
// Components/GameGrid.tsx  
// Components/Navigation.tsx
// Pages/MainMenu.tsx
// Pages/GameScreen.tsx
```

**Test** : Voir 2 grilles vides, naviguer entre menu et jeu

---

### **Étape 1.2 : Placement d'Unités**

#### Backend - WebSocket + Logique de Placement
**Agent** : `@fullstack` puis `@database`

**Modèles de Données** :
```bash
@database "Étend le schéma avec game_states (id, player1_id, player2_id, current_player, turn, board_state_json, created_at). Board_state stocke positions des cartes."
```

**Socket.io Setup** :
```bash
@fullstack "Setup Socket.io dès maintenant avec events de base :
- 'game:create' (créer partie)
- 'game:place_unit' (placer unité) 
- 'game:state_update' (sync état entre joueurs)
- 'game:join' (rejoindre partie)
GameRooms par partie, broadcasting aux 2 joueurs."

@fullstack "Crée gameService.ts avec méthodes : createGame(), placeUnit(gameId, playerId, cardId, position), validatePlacement(). Intégration Socket events au lieu de REST."
```

**Cartes de Test** :
```bash
@backend "Crée seed data avec 15 cartes simples : 5 Humains, 5 Aliens, 5 Robots. Stats basiques (2/2, 3/3, 1/4 etc), portée 1-2, coût 1-3 Échos."
```

#### Frontend - Drag & Drop + Socket Integration
**Agent** : `@frontend`

```bash
@frontend "Setup Socket.io client avec useSocket hook React. Events :
- Emit 'game:place_unit' lors drag & drop
- Listen 'game:state_update' pour synchronisation temps réel
- Connection/disconnection handling basique"

@frontend "Implémente drag & drop pour cartes. Main de cartes en bas, glisser vers grille. Validation visuelle (cases vertes/rouges). Socket events pour placement."

@frontend "Ajoute Hand component affichant 7 cartes de test. Card component avec stats visibles. Feedback visuel lors drag & drop."
```

**Composants** :
```typescript
// Components/Hand.tsx
// Components/Card.tsx
// Components/GameCell.tsx
// Services/socketService.ts (au lieu de gameApi.ts)
// Hooks/useSocket.ts
```

**Avantages Architecture WebSocket dès le début :**
- ✅ Cohérence : Une seule méthode de communication
- ✅ Préparation multijoueur naturelle pour Tâche 3
- ✅ Pas de refactoring REST → WebSocket plus tard
- ✅ Tests temps réel possibles dès cette étape

**Test** : Glisser cartes de la main vers grille, voir unités placées **en temps réel**

---

### **Étape 1.3 : Système de Combat**

#### Backend - Logique Combat via WebSocket
**Agent** : `@fullstack`

```bash
@fullstack "Ajoute events Socket.io pour combat :
- 'game:attack' (attaque entre unités)
- 'game:combat_result' (résultat du combat)
Intégré au gameService existant avec broadcasting automatique."

@backend "Ajoute au gameService : 
- attackUnit(gameId, attackerPos, targetPos)
- calculateCombat(attacker, defender)  
- checkPortee(attackerPos, targetPos, range)
- updateGameState après combat
Combat simultané : les 2 unités se font des dégâts."

@backend "Crée portée system : calcul distance entre lignes, validation range '1-2' ou '2-3'. Méthode isInRange(from, to, range)."
```

#### Frontend - Interface Combat + Socket Events
**Agent** : `@frontend`

```bash
@frontend "Étend useSocket hook avec events combat :
- Emit 'game:attack' avec positions
- Listen 'game:combat_result' pour animations
- Listen 'game:state_update' pour sync post-combat"

@frontend "Ajoute système de combat : clic sur unité → highlight portée possible → clic cible → emit attack. Animation combat basée sur Socket events."

@frontend "Visual feedback : unités attaquables en vert, portée affichée au hover. Animation simple pour attaque (ligne rouge temporaire)."
```

**Test** : Placer unités, cliquer pour attaquer, voir combats résolus **en temps réel**

---

### **Étape 1.4 : Tours et Ressources**

#### Backend - Système de Tours via WebSocket
**Agent** : `@fullstack`

```bash
@fullstack "Ajoute events Socket.io pour gestion tours :
- 'game:end_turn' (fin de tour joueur)
- 'game:turn_changed' (nouveau tour commencé)
- 'game:phase_update' (changement phase : resources/draw/actions)
Broadcasting automatique des changements de tour."

@backend "Ajoute gestion tours au gameService :
- endTurn(gameId, playerId) 
- startNewTurn() : +1 Écho, pioche 1 carte, reset attaques
- checkVictoryConditions() : deck vide = défaite
- Phases : Resources → Draw → Actions"

@backend "Gère Échos du Néant : commence à 1, +1 par tour, max 10. Validation coût cartes avant placement."
```

#### Frontend - UI Tours + Socket Integration
**Agent** : `@frontend`

```bash
@frontend "Étend useSocket hook avec events tours :
- Emit 'game:end_turn' sur bouton End Turn
- Listen 'game:turn_changed' pour UI update
- Listen 'game:phase_update' pour feedback visuel phases"

@frontend "Ajoute UI gestion tours : 
- Indicateur tour actuel et joueur  
- Compteur Échos du Néant
- Bouton 'End Turn'
- Feedback visuel tour adversaire (disabled state)"

@frontend "Ajoute deck et défausse visuels. Compteur cartes restantes. Zone de jeu responsive avec tous éléments."
```

**Test** : Partie complète avec tours, ressources, condition victoire **synchronisée en temps réel**

---

### **Étape 1.5 : Polish Basique**

#### Frontend - UX Polish
**Agent** : `@frontend`

```bash
@frontend "Améliore UX : 
- Messages d'erreur clairs (pas assez d'Échos, placement invalide)
- Animations smooth pour toutes actions
- États loading pendant API calls
- Design cohérent TailwindCSS"

@frontend "Responsive design mobile/tablette en paysage. Tooltips pour cartes. States visuels (hoverable, selected, disabled)."
```

#### Integration & Debug
**Agent** : `@fullstack` puis `@debug`

```bash
@fullstack "Intégration complète frontend/backend. Test flow complet : créer partie → placer unités → combats → changement tours → victoire."

@debug "Optimise performance : requêtes API, re-renders React. Debug issues de synchronisation. Gestion erreurs robuste."
```

**Test Final** : Partie fluide A→Z, interface claire, aucun bug bloquant

---

## 📋 Tâche 2 : Deck Builder Fonctionnel

#### Backend - Gestion Decks
**Agent** : `@backend` puis `@database`

```bash
@database "Crée collection complète 120 cartes : 40 Humains, 40 Aliens, 40 Robots. Mix unités/sorts. Range de coûts 1-10. Effets basiques intégrés."

@backend "Service deckService.ts :
- createDeck(userId, factionId, name)
- addCardToDeck(deckId, cardId, quantity)  
- validateDeck(deckId) : 40 cartes exactement, 1 faction, max 4 par carte
- getDeckList(userId)"
```

#### Frontend - Interface Deck Builder
**Agent** : `@frontend`

```bash
@frontend "Page Deck Builder : split-screen collection/deck en cours. Filtres par faction, coût, type. Search bar. Drag & drop ou +/- buttons."

@frontend "Composants :
- CollectionBrowser avec pagination
- DeckEditor avec validation live  
- CardFilters avec tous critères
- DeckSummary (courbe coût, répartition)"
```

**API Routes** :
```bash
@backend "Routes decks :
- GET /api/cards (collection complète avec filtres)
- POST /api/decks (créer deck)
- PUT /api/decks/:id (modifier deck)  
- GET /api/decks/user/:userId (liste decks utilisateur)"
```

**Test** : Construire decks 40 cartes, validation automatique, sauvegarde

---

## 📋 Tâche 3 : Matchmaking + Temps Réel

#### Backend - Authentification  
**Agent** : `@backend`

```bash
@backend "Auth system : register, login avec JWT. Middleware authenticateToken. Hash passwords avec bcrypt. Routes auth sécurisées."

@backend "userService.ts : createUser, authenticateUser, getUserProfile. Validation email unique, password strength."
```

#### Socket.io Integration
**Agent** : `@fullstack`

```bash
@fullstack "Étend Socket.io existant avec matchmaking :
- 'matchmaking:join' (rejoindre queue avec deckId)
- 'matchmaking:cancel' (quitter queue)  
- 'matchmaking:found' (match trouvé, gameId fourni)
- 'game:player_joined' (joueur rejoint partie)
MatchmakingService avec Redis queue, auto-match 2 joueurs."

@fullstack "Integration complète temps réel : de la queue jusqu'à la partie. Gestion déconnexion/reconnexion pendant matchmaking et jeu."
```

#### Frontend - Auth & Matchmaking
**Agent** : `@frontend`

```bash
@frontend "Pages Login/Register avec validation forms. Integration JWT storage. Protected routes avec React Router."

@frontend "Matchmaking screen : select deck, queue status, cancel option. Socket.io integration avec React hooks."
```

**Test** : 2 joueurs se connectent, matchmaking, partie temps réel

---

## 📋 Tâche 4 : Système de Quêtes

#### Backend - Quêtes Logic
**Agent** : `@backend`

```bash
@backend "questService.ts : 
- checkQuestCompletion(gameState, playerId, questId)
- 9 quêtes implémentées (3 par faction)
- Vérification en fin de tour
- Logic spécifique : lignes complètes, éliminations, synergies"

@backend "Extend game state avec selectedQuests (secret). Victory check intégré au turn system."
```

#### Frontend - Quest Selection
**Agent** : `@frontend`

```bash
@frontend "Quest selection pendant matchmaking : affiche 3 options faction, choix secret. Quest progress indicator discret pendant jeu."

@frontend "Victory/Defeat screens avec raison victoire. Quest achievement display."
```

**Test** : Toutes quêtes testées, conditions fonctionnelles

---

## 📋 Tâche 5 : Polish Interface + Stats

#### Frontend - UI Polish
**Agent** : `@frontend`

```bash
@frontend "Polish complet :
- Animations polies (card reveal, combat effects, turn transitions)
- Sound effects basiques (placeholders)
- Loading states partout
- Error handling UX"

@frontend "Profile page : stats globales, breakdown par faction, historique parties. Charts simples avec recharts."
```

#### Help System
**Agent** : `@frontend`

```bash
@frontend "Help Center intégré : règles complètes, tutorial interactif, card reference. Navigation breadcrumb, search function."
```

**Test** : Expérience utilisateur complète et polie

---

## 📋 Tâche 6 : Génération IA + Rotation

#### IA Integration
**Agent** : `@backend`

```bash
@backend "cardGenerationService.ts :
- generateMonthlySet() avec ChatGPT 3.5 API
- analyzeCurrentMeta() pour context IA
- validateGeneratedCards() 
- rotationService pour cycle mensuel"

@backend "Scripts automation :
- monthly-rotation.sh
- analyze-meta.js  
- generate-cards.js
Administration tools."
```

#### Frontend - New Cards Display
**Agent** : `@frontend`

```bash
@frontend "Collection : section 'New This Month' highlighted. Changelog des rotations. Preview system pour prochaines cartes."
```

**Test** : Génération IA fonctionnelle, rotation testée

---

## 🧪 Tests et Debug

### Tests Unitaires
**Agent** : `@test`

```bash
@test "Tests backend : gameService, deckService, auth. Tests frontend : components critiques, game logic. Coverage >80%."
```

### Integration Testing  
**Agent** : `@fullstack`

```bash
@fullstack "Tests e2e : flow complet utilisateur. Tests Socket.io. Tests API avec supertest. Cypress pour frontend."
```

### Performance & Debug
**Agent** : `@debug`

```bash
@debug "Profile performance : 
- API response times
- React re-renders
- Socket.io latency  
- Database query optimization"
```

---

## 🚀 Commandes de Déploiement

### Docker & DevOps
**Agent** : `@architect`

```bash
@architect "Production setup :
- Multi-stage Dockerfiles optimisés
- Docker-compose production  
- Nginx reverse proxy
- Environment variables management"
```

### Monitoring
**Agent** : `@backend`

```bash
@backend "Setup logging Winston, metrics basiques. Health checks endpoints. Error tracking et monitoring."
```

---

## 💡 Tips d'Utilisation des Agents

### Workflow Recommandé
1. **@architect** pour structure générale
2. **@database** pour modèles de données
3. **@backend** pour logique métier
4. **@frontend** pour interface  
5. **@fullstack** pour intégration
6. **@debug** pour optimisation
7. **@test** pour validation

### Prompts Efficaces
```bash
# Spécifique et détaillé
@backend "Crée un service de gestion des parties de TCG avec méthodes pour placer unités, gérer combat simultané, et changer de tour. Include validation des règles."

# Avec contexte
@frontend "En utilisant TailwindCSS, crée un composant de grille 3x5 pour TCG tactique. Chaque case doit pouvoir afficher une carte ou être vide, avec feedback visuel pour drag & drop."
```
