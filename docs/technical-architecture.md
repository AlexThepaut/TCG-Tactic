# Architecture Technique - TCG Tactique

## 🎯 Vue d'Ensemble

**TCG Tactique** est une application de jeu de cartes tactique en temps réel avec un système de rotation mensuelle de cartes généré par IA. L'architecture privilégie la simplicité, la fiabilité et la rapidité de développement pour le prototype.

### Contraintes Techniques
- **Multi-plateforme** : PC, Mobile, Web (orientation paysage)
- **Temps réel** : Parties synchronisées entre joueurs
- **Génération IA** : 120 nouvelles cartes par mois
- **Rotation automatique** : Pool de 360 cartes en rotation
- **Prototype-first** : Priorité au time-to-market

---

## 🏗️ Stack Technologique

### Frontend
- **React 18** : Framework principal avec hooks et concurrent features
- **TypeScript** : Type safety et meilleure DX
- **Vite** : Build tool rapide et HMR performant
- **TailwindCSS** : Framework CSS utility-first pour interface épurée

### Backend
- **Node.js + Express** : Runtime JavaScript et framework web
- **Socket.io** : Communication temps réel bidirectionnelle
- **PostgreSQL** : Base de données relationnelle principale
- **Redis** : Cache en mémoire et gestion des sessions

### Services Externes
- **ChatGPT 3.5 API** : Génération automatique de cartes
- **Docker + Docker Compose** : Containerisation et orchestration

### DevOps
- **Docker** : Containerisation pour tous les services
- **Docker Compose** : Orchestration locale et production
- **Git** : Contrôle de version

---

## 🏛️ Architecture des Services

### Structure Générale
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (React App)   │◄──►│   (Node.js)     │◄──►│   Externes      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         │              │   (Database)    │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│      Redis      │──────────────┘
                        │    (Cache)      │
                        └─────────────────┘
```

### Services Backend
```
backend/
├── src/
│   ├── services/
│   │   ├── gameService.ts          # Logique de jeu + gestion tours
│   │   ├── cardService.ts          # Génération IA + pool management
│   │   ├── deckService.ts          # Construction et validation decks
│   │   ├── matchmakingService.ts   # Appariement des joueurs
│   │   └── userService.ts          # Authentification et stats
│   ├── models/                     # Modèles de données PostgreSQL
│   ├── routes/                     # Endpoints API REST
│   ├── middleware/                 # Authentification et validation
│   └── utils/                      # Fonctions utilitaires
```

---

## 💾 Architecture Base de Données

### Modèle de Données PostgreSQL

#### Tables Principales
```sql
-- Utilisateurs
users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pool de cartes actif (rotation mensuelle)
active_cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  faction VARCHAR(20) CHECK (faction IN ('humans', 'aliens', 'robots')),
  type VARCHAR(20) CHECK (type IN ('unit', 'spell')),
  cost INTEGER CHECK (cost BETWEEN 1 AND 10),
  attack INTEGER, -- NULL pour les sorts
  hp INTEGER,     -- NULL pour les sorts
  range VARCHAR(10), -- Ex: "1-2", "3" pour les unités
  effects TEXT[], -- Array des effets
  set_id VARCHAR(20), -- Identifiant du set (ex: "2024-01")
  created_at TIMESTAMP DEFAULT NOW()
);

-- Decks des utilisateurs
decks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(50),
  faction VARCHAR(20),
  is_valid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cartes dans les decks
deck_cards (
  deck_id INTEGER REFERENCES decks(id),
  card_id INTEGER REFERENCES active_cards(id),
  quantity INTEGER CHECK (quantity BETWEEN 1 AND 4),
  PRIMARY KEY (deck_id, card_id)
);

-- Historique des parties
games (
  id SERIAL PRIMARY KEY,
  player1_id INTEGER REFERENCES users(id),
  player2_id INTEGER REFERENCES users(id),
  player1_deck_id INTEGER REFERENCES decks(id),
  player2_deck_id INTEGER REFERENCES decks(id),
  winner_id INTEGER REFERENCES users(id),
  duration_seconds INTEGER,
  end_reason VARCHAR(50), -- 'quest_completed', 'surrender', 'deck_empty'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Logs détaillés des parties (pour analyse IA)
game_logs (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  player_id INTEGER REFERENCES users(id),
  turn_number INTEGER,
  action_type VARCHAR(50), -- 'play_card', 'attack', 'end_turn'
  card_played VARCHAR(100),
  target_position VARCHAR(10), -- Ex: "1,2" pour ligne 1 colonne 2
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Statistiques utilisateurs
user_stats (
  user_id INTEGER REFERENCES users(id) PRIMARY KEY,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  humans_games INTEGER DEFAULT 0,
  humans_wins INTEGER DEFAULT 0,
  aliens_games INTEGER DEFAULT 0,
  aliens_wins INTEGER DEFAULT 0,
  robots_games INTEGER DEFAULT 0,
  robots_wins INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Contraintes Métier
```sql
-- Validation des decks (exactement 40 cartes)
ALTER TABLE decks ADD CONSTRAINT valid_deck_size 
CHECK (
  (SELECT SUM(quantity) FROM deck_cards WHERE deck_id = id) = 40
);

-- Maximum 4 exemplaires par carte
ALTER TABLE deck_cards ADD CONSTRAINT max_card_copies
CHECK (quantity <= 4);
```

### Cache Redis
```
Structure des clés Redis :

├── user:session:{userId}           # Sessions utilisateur
├── game:state:{gameId}            # État complet de la partie
├── matchmaking:queue              # File d'attente matchmaking
├── active:cards:pool              # Cache du pool de cartes actif
├── deck:validation:{deckId}       # Cache validation des decks
└── user:stats:{userId}            # Cache des statistiques utilisateur
```

---

## 🔄 Génération IA et Rotation

### Pipeline de Génération Mensuelle

#### Service de Génération
```typescript
class CardGenerationService {
  async generateMonthlySet(): Promise<Card[]> {
    // 1. Analyser le meta actuel
    const metaAnalysis = await this.analyzeCurrentMeta();
    
    // 2. Construire le prompt contextualisé
    const prompt = this.buildGenerationPrompt(metaAnalysis);
    
    // 3. Appel ChatGPT 3.5
    const response = await this.callChatGPTAPI(prompt);
    
    // 4. Validation et parsing
    const cards = await this.validateAndParseCards(response);
    
    return cards;
  }

  private buildGenerationPrompt(analysis: MetaAnalysis): string {
    return `
    Tu es un designer de TCG. Génère exactement 120 cartes selon ces contraintes :

    CONTEXTE ACTUEL :
    - Cartes en rotation : ${analysis.currentCardPool}
    - Archétypes dominants : ${analysis.dominantArchetypes}
    - Cartes problématiques : ${analysis.problematicCards}

    CONTRAINTES STRICTES :
    - 40 Humains, 40 Aliens, 40 Robots
    - 90 Unités, 30 Sorts
    - Coûts équilibrés 1-10 Échos du Néant
    - Éviter les combos > 60% de winrate

    FORMAT JSON REQUIS :
    {
      "cards": [
        {
          "name": "Nom Unique",
          "faction": "humans|aliens|robots",
          "type": "unit|spell",
          "cost": 1-10,
          "attack": 0-10, // si unité uniquement
          "hp": 1-15,     // si unité uniquement
          "range": "1-3", // si unité uniquement
          "effects": ["effet1", "effet2"],
          "description": "Description claire de la carte"
        }
      ]
    }
    `;
  }
}
```

#### Système de Rotation
```typescript
class RotationService {
  async performMonthlyRotation(): Promise<void> {
    const newCards = await cardGeneration.generateMonthlySet();
    
    await db.transaction(async (trx) => {
      // 1. Insérer les nouvelles cartes
      await this.insertNewCardSet(newCards, trx);
      
      // 2. Retirer le set le plus ancien (n-3)
      await this.retireOldestSet(trx);
      
      // 3. Invalider tous les decks (contiennent potentiellement des cartes retirées)
      await this.invalidateAllDecks(trx);
      
      // 4. Purger le cache Redis
      await this.clearCache();
      
      // 5. Logger la rotation
      await this.logRotation(newCards.length, trx);
    });
  }
}
```

---

## ⚡ Communication Temps Réel

### Architecture Socket.io

#### Events Principaux
```typescript
// Côté serveur
io.on('connection', (socket) => {
  // Matchmaking
  socket.on('matchmaking:join', handleMatchmakingJoin);
  socket.on('matchmaking:cancel', handleMatchmakingCancel);
  
  // Game events
  socket.on('game:play_card', handlePlayCard);
  socket.on('game:attack', handleAttack);
  socket.on('game:end_turn', handleEndTurn);
  socket.on('game:surrender', handleSurrender);
  
  // Utilitaires
  socket.on('disconnect', handleDisconnect);
});

// Events émis vers le client
socket.emit('matchmaking:found', { gameId, opponent });
socket.emit('game:state_update', gameState);
socket.emit('game:turn_changed', { currentPlayer });
socket.emit('game:game_over', { winner, reason });
```

#### Gestion des États de Jeu
```typescript
interface GameState {
  id: string;
  players: {
    player1: {
      id: string;
      faction: string;
      hand: Card[];
      board: (Card | null)[][];
      resources: number;
      questId: string; // Secret
    };
    player2: {
      id: string;
      faction: string;
      hand: Card[];
      board: (Card | null)[][];
      resources: number;
      questId: string; // Secret
    };
  };
  currentPlayer: string;
  turn: number;
  phase: 'resources' | 'draw' | 'actions';
  gameOver: boolean;
  winner?: string;
}
```

---

## 🔒 Sécurité et Validation

### Authentification
```typescript
// JWT middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
```

### Validation des Actions
```typescript
// Toutes les actions de jeu sont validées côté serveur
class GameValidator {
  static validatePlayCard(gameState: GameState, playerId: string, cardId: string, position?: Position): boolean {
    const player = gameState.players[playerId];
    
    // Vérifications :
    // 1. C'est le tour du joueur
    // 2. Le joueur a assez de ressources
    // 3. La carte est dans sa main
    // 4. La position est valide pour sa faction
    // 5. La case n'est pas occupée (ou sacrifice autorisé)
    
    return /* validations... */;
  }
  
  static validateAttack(gameState: GameState, attackerId: string, attackerPos: Position, targetPos: Position): boolean {
    // Vérifications :
    // 1. L'unité appartient au joueur actuel
    // 2. L'unité n'a pas encore attaqué ce tour
    // 3. La cible est à portée
    // 4. La cible existe et est hostile
    
    return /* validations... */;
  }
}
```

---

## 🚀 Déploiement et DevOps

### Configuration Docker

#### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:5001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=postgresql://tcg_user:password@postgres:5432/tcg_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
      - OPENAI_API_KEY=your-openai-key
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=tcg_db
      - POSTGRES_USER=tcg_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Scripts d'Administration

#### Génération Mensuelle
```bash
#!/bin/bash
# scripts/monthly-rotation.sh

echo "🤖 Démarrage de la rotation mensuelle..."

# 1. Générer les nouvelles cartes
node dist/scripts/generateCards.js

# 2. Effectuer la rotation
node dist/scripts/rotateCardPool.js

# 3. Analyser la nouvelle meta
node dist/scripts/analyzeMeta.js

echo "✅ Rotation terminée avec succès!"
```

#### Analyse des Données
```bash
#!/bin/bash
# scripts/analyze-balance.sh

echo "📊 Analyse de l'équilibrage..."

# Statistiques des cartes les plus jouées
node dist/scripts/cardUsageStats.js

# Taux de victoire par faction
node dist/scripts/factionWinRates.js

# Détection des combos problématiques
node dist/scripts/detectBrokenCombos.js
```

---

## 📈 Monitoring et Analytics

### Métriques Clés
- **Performance** : Latence Socket.io, temps de réponse API
- **Gameplay** : Durée moyenne des parties, taux d'abandon
- **Balance** : Win rate par faction, cartes les plus/moins jouées
- **Technique** : Erreurs IA, échecs de génération

### Logs Structurés
```typescript
// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('Card generation started', { 
  setId: '2024-01',
  requestedCards: 120 
});
```

---

## 🔧 Outils de Développement

### Scripts Utiles
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "test": "npm run test:backend && npm run test:frontend",
    "generate:cards": "node backend/dist/scripts/generateCards.js",
    "rotate:pool": "node backend/dist/scripts/rotateCardPool.js",
    "analyze:meta": "node backend/dist/scripts/analyzeMeta.js",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "db:migrate": "cd backend && npm run migrate",
    "db:seed": "cd backend && npm run seed"
  }
}
```

---

## 🎯 Évolutions Futures

### Migration Godot (Post-Succès)

#### **Vision Long Terme**
Si le prototype React rencontre le succès, une migration vers **Godot Engine** est envisagée pour bénéficier d'applications natives multi-plateformes et d'une expérience utilisateur améliorée.

#### **Avantages de Godot pour TCG Tactique**
- **Multi-plateforme native** : PC, Mobile, Web en un seul build
- **Performance optimisée** : Rendu 2D natif plus fluide que web
- **Animations avancées** : Transitions de cartes, effets de combat immersifs
- **Distribution native** : Publication sur Steam, App Stores
- **Audio intégré** : Sons et musique natifs

#### **Architecture Hybride Godot**
```
┌─────────────────┐    ┌─────────────────┐
│   Godot Client  │    │   Backend       │
│   (GDScript)    │◄──►│   (Inchangé)    │
│                 │    │   Node.js       │
└─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   PostgreSQL    │
         │              │   + Redis       │
         │              └─────────────────┘
```

#### **Communication WebSocket Godot**
```gdscript
# Godot WebSocket client
extends Node

var socket = WebSocketClient.new()

func _ready():
    socket.connect_to_url("ws://backend:5001")
    socket.connect("connection_established", _on_connection_established)
    socket.connect("data_received", _on_data_received)

func send_game_action(action_data):
    socket.send_text(JSON.stringify(action_data))

func _on_data_received(data):
    var game_state = JSON.parse(data)
    update_game_board(game_state)
```

#### **Fonctionnalités Améliorées**
```gdscript
# Drag & Drop tactique fluide
extends Control

func _can_drop_data(position, data):
    return data.has("card_id") and is_valid_drop_position(position)

func _drop_data(position, data):
    play_card(data.card_id, position)
    animate_card_placement()

# Animations de combat
func animate_attack(attacker_pos, target_pos):
    var tween = create_tween()
    tween.tween_method(draw_attack_line, attacker_pos, target_pos, 0.5)
    tween.tween_callback(apply_damage)
    play_combat_sound()
```

#### **Stratégie de Migration**
1. **Phase Prototype** : Validation concept avec React/Web
2. **Phase PoC** : Test architecture Godot + backend existant
3. **Phase Migration** : Réécriture complète avec améliorations UX
4. **Phase Production** : Déploiement multi-plateforme

#### **Backend Réutilisable**
L'avantage majeur de cette architecture est la **réutilisabilité complète du backend** :
- Logique métier inchangée (Node.js)
- Base de données identique (PostgreSQL + Redis)
- API/WebSocket compatible avec Godot
- Génération IA preservée (ChatGPT pipeline)

### Optimisations Prévues
- **Cache intelligent** : Mise en cache des calculs de validation
- **Load balancing** : Multiple instances backend si succès
- **CDN** : Distribution des assets statiques
- **Database sharding** : Si volume de données important

### Fonctionnalités Avancées
- **Mode spectateur** : Observer les parties en cours
- **Replays** : Revoir ses parties précédentes  
- **Tournament mode** : Système de tournois automatisés
- **Mobile app native** : Version mobile dédiée

*Cette architecture privilégie la simplicité et la fiabilité pour permettre un développement rapide du prototype tout en maintenant des fondations solides pour l'évolution future du produit.*