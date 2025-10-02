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

### **Scénarios d'Interaction Détaillés - Placement Click-Based**

Ces scénarios définissent le comportement exact du système de placement par clics.

#### **Scénario 1 : Placement Réussi**
```gherkin
Étant donné : Le joueur a 3 cartes en main et 5 Échos du Néant disponibles
           Et : Le joueur joue la faction Humains avec formation Phalange
Quand : Le joueur clique sur une carte coûtant 3 Échos dans sa main
Alors : La carte est mise en surbrillance (bordure brillante)
    Et : 9 positions valides de la grille s'illuminent en vert (formation Phalange)
    Et : L'event Socket 'game:card_selected' est émis avec cardId
Quand : Le serveur répond avec 'game:valid_positions' contenant 9 positions
    Et : Le joueur clique sur une position valide en surbrillance
Alors : L'event Socket 'game:place_unit' est émis avec {cardId, position}
    Et : La carte se déplace de la main vers la grille (animation fluide)
    Et : Les Échos du Néant du joueur sont réduits de 3
    Et : L'état de sélection est réinitialisé
```

#### **Scénario 2 : Tentative de Placement Invalide**
```gherkin
Étant donné : Le joueur a une carte sélectionnée avec positions valides affichées
Quand : Le joueur clique sur une case NON mise en surbrillance (position invalide)
Alors : Un feedback visuel d'erreur apparaît (animation de secousse rouge)
    Et : Un message d'erreur s'affiche "Position de placement invalide"
    Et : La carte reste sélectionnée avec les positions valides toujours affichées
    Et : Aucun event Socket n'est émis
```

#### **Scénario 3 : Annulation de Sélection**
```gherkin
Étant donné : Le joueur a une carte sélectionnée
Quand : Le joueur clique à nouveau sur la même carte
Alors : Le feedback visuel de sélection disparaît (surbrillance retirée)
    Et : Les positions valides ne sont plus affichées
    Et : L'event Socket 'game:selection_cleared' est émis
    Et : Le joueur peut sélectionner une autre carte
```

#### **Scénario 4 : Ressources Insuffisantes**
```gherkin
Étant donné : Le joueur a 2 Échos du Néant disponibles
Quand : Le joueur tente de sélectionner une carte coûtant 5 Échos
Alors : La carte affiche un feedback "ressources insuffisantes" (grisée + tooltip)
    Et : Aucune sélection ne se produit
    Et : Aucun event Socket n'est émis
```

#### **Scénario 5 : Changement de Sélection**
```gherkin
Étant donné : Le joueur a la Carte A sélectionnée avec positions valides affichées
Quand : Le joueur clique sur une Carte B différente dans sa main
Alors : La Carte A est désélectionnée (surbrillance retirée)
    Et : La Carte B est sélectionnée (nouvelle surbrillance)
    Et : Les nouvelles positions valides pour la Carte B s'affichent
    Et : L'event Socket 'game:card_selected' est émis avec le nouveau cardId
```

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
- 'game:join' (rejoindre partie)
- 'game:card_selected' (joueur sélectionne carte - étape 1)
- 'game:valid_positions' (serveur envoie positions valides)
- 'game:place_unit' (placer unité sur position validée - étape 2)
- 'game:selection_cleared' (annuler sélection)
- 'game:state_update' (sync état entre joueurs)
GameRooms par partie, broadcasting aux 2 joueurs."

@fullstack "Crée gameService.ts avec méthodes :
- createGame()
- calculateValidPositions(faction, boardState) : retourne positions valides selon formation faction
- placeUnit(gameId, playerId, cardId, position) : étape 2 après validation
- validatePlacement() : vérifie coût, position, tour
Intégration Socket events au lieu de REST."
```

**Cartes de Test** :
```bash
@backend "Crée seed data avec 15 cartes simples : 5 Humains, 5 Aliens, 5 Robots. Stats basiques (2/2, 3/3, 1/4 etc), portée 1-2, coût 1-3 Échos."
```

#### Frontend - Click-Based Placement + Socket Integration
**Agent** : `@frontend`

```bash
@frontend "Setup Socket.io client avec useSocket hook React. Events :
- Emit 'game:card_selected' lors clic sur carte (étape 1)
- Listen 'game:valid_positions' pour afficher zones valides
- Emit 'game:place_unit' lors clic sur position valide (étape 2)
- Emit 'game:selection_cleared' pour annuler sélection
- Listen 'game:state_update' pour synchronisation temps réel
- Connection/disconnection handling basique"

@frontend "Implémente placement click-based pour cartes :
- Clic sur carte dans main → carte sélectionnée (highlight visuel)
- Affichage automatique des positions valides (cases vertes)
- Clic sur position valide → placement carte (animation smooth)
- Clic sur carte sélectionnée à nouveau → désélection
- Feedback erreur pour positions invalides (shake + message)"

@frontend "Ajoute Hand component affichant 7 cartes de test. Card component avec stats visibles. SelectionState management avec React hooks. Visual feedback pour états : normal, selected, disabled, hoverable."
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

**Test** : Cliquer cartes dans main → voir zones valides → cliquer position → voir unités placées **en temps réel**

---

### **Tests de Placement Click-Based**

#### Tests Unitaires
**Agent** : `@test`

```bash
@test "Tests unitaires placement click-based :
- Gestion de l'état de sélection de carte (selected, deselected, switch)
- Calcul des positions valides par faction (Humains, Aliens, Robots)
- Validation de placement (coût, position, tour du joueur)
- Flux d'annulation de sélection (deselect, cancel)
- Gestion des états d'erreur (ressources insuffisantes, position invalide)"
```

#### Tests d'Intégration Socket.io
**Agent** : `@fullstack`

```bash
@fullstack "Tests d'intégration Socket.io :
- Séquence d'events : card_selected → valid_positions → place_unit
- Validation côté serveur des positions retournées
- Synchronisation d'état entre les deux joueurs
- Cas limites : déconnexion pendant sélection, sélection pendant tour adverse"
```

#### Tests E2E Interaction Utilisateur
**Agent** : `@test`

```bash
@test "Tests E2E interaction click-based :
- Clic carte → voir zones valides en vert → clic zone → placement confirmé
- Clic carte → clic même carte → désélection complète
- Clic carte A → clic carte B → changement de sélection
- Tentative placement zone invalide → feedback erreur + maintien sélection
- Clic carte sans ressources → carte grisée + tooltip erreur
- Interaction mobile : tap-select, tap-place, cibles minimum 44x44px"
```

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

@frontend "Ajoute système de combat click-based :
- Clic sur unité alliée → sélection + highlight portée possible
- Clic sur cible ennemie dans portée → emit attack
- Animation combat basée sur Socket events
- Feedback visuel : unités attaquables en surbrillance, portée affichée"

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

#### Gestion d'Erreurs et Cas Limites
**Agent** : `@frontend` puis `@fullstack`

```bash
@frontend "Gestion d'erreurs click-based :

1. Latence réseau sur 'game:valid_positions' :
   - Timeout : 3 secondes maximum
   - Comportement : Afficher indicateur de chargement sur carte sélectionnée
   - Désactiver interaction grille pendant attente
   - Récupération : Si timeout, afficher 'Problème de connexion - resélectionnez la carte'

2. Sélection concurrente (edge case multijoueur) :
   - Validation : Serveur vérifie ownership du tour avant 'game:card_selected'
   - Réponse : Event 'game:error' avec message 'Ce n'est pas votre tour'
   - Client : Auto-clear sélection, afficher notification temporaire

3. Sélection pendant animation (carte en cours de placement) :
   - Prévention : Désactiver interaction main pendant animation placement
   - Durée : Verrouillage 300ms pendant animation
   - Visuel : État loading sur cartes de la main"

@fullstack "Tests edge cases système click-based :
- Perte connexion pendant sélection active
- Réception 'game:valid_positions' après timeout
- Double-clic rapide sur carte (debouncing)
- Changement tour pendant sélection en cours
- État synchronisé après reconnexion"
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
