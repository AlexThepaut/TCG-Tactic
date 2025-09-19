# Documentation des Écrans - TCG Tactique

## 🎯 Vue d'Ensemble Technique

### Spécifications Générales
- **Plateformes** : PC, Mobile, Web
- **Orientation** : Paysage uniquement (Landscape)
- **Interface** : 2D épurée et minimaliste
- **Langue** : Anglais uniquement
- **Accessibilité** : Interface claire et lisible

---

## 🏠 Menu Principal

### Fonctionnalités Principales
- **Play** : Accès direct au matchmaking
- **Collection** : Gestion des cartes et découverte mensuelle
- **Deck Builder** : Construction et édition des decks
- **Help** : Règles et documentation complète
- **Profile** : Statistiques personnelles du joueur

### Éléments d'Interface
- **Header** : Logo du jeu, indicateur de connexion
- **Navigation centrale** : Boutons principaux bien espacés
- **Footer** : Version du jeu, crédits
- **Notifications** : Alertes pour nouvelles cartes/rotations

### Flux Utilisateur
```
Menu Principal → [Choix] → Écran Cible
├── Play → Matchmaking
├── Collection → Collection Browser
├── Deck Builder → Deck Editor
├── Help → Help Center
└── Profile → Player Stats
```

---

## 📚 Collection

### Vue d'Ensemble
Interface de découverte et consultation de toutes les cartes disponibles dans le pool actuel (360 cartes en rotation).

### Fonctionnalités
#### **Navigation des Cartes**
- **Grille de cartes** : Affichage visuel de toutes les cartes
- **Filtres avancés** :
  - Par faction (Humans, Aliens, Robots)
  - Par type (Units, Spells)
  - Par coût (1-10 Void Echoes)
  - Par rareté (si système de rareté)
  - Par set (Current month, Previous month, etc.)

#### **Recherche et Tri**
- **Barre de recherche** : Par nom de carte ou effet
- **Options de tri** :
  - Alphabétique
  - Par coût croissant/décroissant
  - Par attaque/vie
  - Par date d'ajout (nouvelles cartes en premier)

#### **Détail des Cartes**
- **Vue agrandie** : Clic sur une carte pour voir les détails
- **Statistiques** : ATK/HP/Range clairement affichées
- **Effets** : Description complète des capacités
- **Set d'origine** : Indication du mois d'introduction

### Nouveautés Mensuelles
#### **Section "New This Month"**
- **Highlight visuel** : 120 nouvelles cartes mises en évidence
- **Changelog** : Cartes retirées ce mois-ci
- **Preview** : Aperçu des cartes du mois prochain (si disponible)

### Navigation
- **Retour** → Menu Principal
- **Vers Deck Builder** → Construction de deck avec cartes sélectionnées

---

## 🔧 Deck Builder

### Interface Principale
Split-screen avec collection à gauche et deck en construction à droite.

### Fonctionnalités
#### **Sélection de Faction**
- **Choix obligatoire** : Humans, Aliens, ou Robots
- **Preview formation** : Visualisation de la grille de faction
- **Effet passif** : Rappel du pouvoir de faction

#### **Construction du Deck**
- **Compteur** : X/40 cartes (obligatoire exactement 40)
- **Limite par carte** : Maximum 4 exemplaires par carte unique
- **Répartition** : Indication Units vs Spells
- **Courbe de coût** : Graphique de distribution des coûts

#### **Interface de Sélection**
- **Collection filtrée** : Seules les cartes de la faction sélectionnée
- **Add/Remove** : Boutons +/- pour ajuster quantités
- **Drag & Drop** : Glisser-déposer depuis collection vers deck

#### **Gestion des Decks**
- **Save Deck** : Sauvegarde avec nom personnalisé
- **Load Deck** : Chargement de decks précédemment sauvés
- **Delete Deck** : Suppression de decks obsolètes
- **Export** : Code de partage de deck (optionnel)

#### **Validation**
- **Deck Checker** : Vérification automatique des règles
  - Exactement 40 cartes ✓
  - Une seule faction ✓
  - Maximum 4 par carte ✓
- **Ready to Play** : Bouton activé seulement si deck valide

### Navigation
- **Back** → Menu Principal ou Collection
- **Play** → Matchmaking avec deck sélectionné

---

## 🎮 Matchmaking

### Interface Simple
Écran de transition entre deck building et partie.

### Fonctionnalités
#### **Deck Selection**
- **Active Deck** : Affichage du deck actuellement sélectionné
- **Quick Stats** : Faction, nombre de cartes, dernière modification
- **Change Deck** → Retour vers Deck Builder

#### **Matchmaking Process**
- **Find Match** : Bouton de recherche d'adversaire
- **Searching** : Indicateur de recherche en cours
- **Match Found** : Notification quand adversaire trouvé
- **Cancel** : Annulation de la recherche

#### **Quest Selection**
- **Secret Choice** : Sélection de l'une des 3 quêtes de faction
- **Quest Preview** : Description des objectifs
- **Confirmation** : Validation du choix (caché à l'adversaire)

### Navigation
- **Cancel** → Menu Principal
- **Match Found** → Game Screen

---

## ⚔️ Game Screen

### Layout Principal
Interface de jeu principale avec grille tactique centrale.

### Composants d'Interface
#### **Game Board**
- **Player Grid** : Grille 3×5 du joueur (formation spécifique)
- **Enemy Grid** : Grille 3×5 adversaire (formation visible)
- **Visual Indicators** :
  - Cases jouables/non-jouables
  - Portées d'attaque (au survol)
  - Unités pouvant attaquer (highlight)

#### **Hand Management**
- **Player Hand** : Cartes en main affichées en bas
- **Card Count** : Nombre de cartes adversaire
- **Drag to Play** : Glisser carte vers grille pour jouer

#### **Resources & Info**
- **Void Echoes** : Compteur de ressources actuel/maximum
- **Turn Indicator** : Tour du joueur actuel
- **Quest Progress** : Indicateur discret (sans révéler la quête)

#### **Action Buttons**
- **End Turn** : Terminer son tour
- **Surrender** : Abandon de partie
- **Settings** : Menu pause/options

### Interactions de Jeu
#### **Card Playing**
- **Unit Placement** : Drag & drop vers cases valides
- **Spell Casting** : Sélection de cible puis confirmation
- **Cost Validation** : Vérification automatique des Void Echoes

#### **Combat System**
- **Attack Declaration** : Clic sur unité attaquante puis cible
- **Range Visualization** : Affichage des portées possibles
- **Combat Resolution** : Animation des dégâts et destructions

#### **Turn Management**
- **Phase Indicators** : Resources → Draw → Actions
- **Free Order** : Actions dans l'ordre souhaité
- **End Turn** : Passage automatique après confirmation

### End Game
- **Victory/Defeat** : Écran de résultat avec raison de victoire
- **Stats Update** : Mise à jour des statistiques personnelles
- **Return Options** : Nouvelle partie ou retour menu

---

## ❓ Help Center

### Structure d'Aide
Documentation complète intégrée au jeu.

### Sections Principales
#### **Rules**
- **Basic Rules** : Règles fondamentales
- **Factions** : Descriptions détaillées des 3 factions
- **Card Effects** : Référence complète des effets
- **Victory Conditions** : Explication des quêtes

#### **How to Play**
- **Game Flow** : Déroulement d'une partie
- **Interface Guide** : Navigation dans les menus
- **Deck Building** : Conseils de construction
- **Strategy Tips** : Astuces tactiques de base

#### **Card Reference**
- **Current Pool** : Liste complète des cartes actuelles
- **Search Function** : Recherche dans la documentation
- **Glossary** : Définitions des termes techniques

### Navigation
- **Breadcrumb** : Navigation hiérarchique
- **Search** : Recherche globale dans l'aide
- **Back** → Menu Principal

---

## 📊 Profile Screen

### Player Statistics
Interface simple d'affichage des performances.

### Informations Affichées
#### **Basic Stats**
- **Games Played** : Nombre total de parties
- **Wins/Losses** : Ratio victoires/défaites
- **Win Rate** : Pourcentage de victoire global

#### **Faction Breakdown**
- **Humans** : Parties jouées, taux de victoire
- **Aliens** : Parties jouées, taux de victoire
- **Robots** : Parties jouées, taux de victoire
- **Preferred Faction** : Faction la plus jouée

#### **Recent Activity**
- **Last 10 Games** : Résultats récents avec faction utilisée
- **Monthly Performance** : Stats du mois en cours
- **Quest Completion** : Quêtes accomplies par type

### Navigation
- **Back** → Menu Principal
- **Reset Stats** : Remise à zéro (avec confirmation)

---

## 🔄 Navigation Globale

### Flux Utilisateur Principal
```
Menu Principal (Hub Central)
├── Play → Matchmaking → Game → Results → Menu
├── Collection → [View Cards] → Deck Builder → Matchmaking
├── Deck Builder → [Manage Decks] → Matchmaking
├── Help → [Read Documentation] → Menu
└── Profile → [View Stats] → Menu
```

### Retours Rapides
- **Bouton Home** : Retour menu depuis n'importe quel écran
- **Navigation Breadcrumb** : Chemin de navigation affiché
- **Back Button** : Retour écran précédent

---

## 🎨 Guidelines d'Interface

### Principes de Design
- **Minimalisme** : Interface épurée, focus sur l'essentiel
- **Lisibilité** : Texte clair, contrastes appropriés
- **Consistance** : Éléments uniformes à travers tous les écrans
- **Feedback** : Retours visuels pour toutes les actions

### Éléments Communs
- **Color Scheme** : Palette cohérente pour les factions
- **Typography** : Police lisible, hiérarchie claire
- **Icons** : Iconographie simple et reconnaissable
- **Animations** : Transitions fluides mais non-intrusives

*Cette architecture d'interface privilégie la simplicité et l'efficacité, permettant aux joueurs de se concentrer sur la stratégie tactique du jeu.*