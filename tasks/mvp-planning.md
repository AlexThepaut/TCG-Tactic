# Roadmap de Développement - TCG Tactique

## 🎯 Approche de Développement

### Stratégie
- **Développeur solo** avec assistance Claude Code
- **Tests utilisateurs** à chaque étape
- **Prototype jouable** rapidement
- **Livrables fonctionnels** de bout en bout

### Objectif Principal
Prototype permettant de **jouer une partie complète** et **construire des decks** pour tests par les proches.

---

## 📋 Tâches Ordonnées

### **Tâche 1 : Core Game Engine + Interface Basique**
**Livrable Testable** : Jeu minimal jouable visuellement

#### Développement Incrémental

**Étape 1.1 : Setup + Grille Vide**
- Setup projet complet (Backend + Frontend)
- Base de données avec modèles simples
- Interface React avec grilles 3x5 vides
- Navigation basique entre écrans
- **Test** : Voir les grilles, navigation fonctionne

**Étape 1.2 : Placement d'Unités**
- Logique de placement backend
- Drag & drop basique frontend
- 5-6 cartes hardcodées simples (ex: 2/2 portée 1)
- Validation des règles de placement
- **Test** : Placer des unités sur la grille

**Étape 1.3 : Système de Combat**
- Logique d'attaque backend
- Interface de ciblage frontend
- Calcul de dégâts et mort des unités
- Système de portée basique
- **Test** : Faire combattre les unités

**Étape 1.4 : Tours et Ressources**
- Système de tours (changement joueur)
- Échos du Néant (gain +1 par tour)
- Coûts des cartes
- Fin de partie basique (deck vide)
- **Test** : Partie complète tour par tour

**Étape 1.5 : Polish Basique**
- Indicateurs visuels (tour actuel, ressources)
- Feedback des actions (cartes jouables/non)
- Messages d'erreur clairs
- État de jeu lisible
- **Test** : Partie fluide et compréhensible

#### Test Utilisateur Final
- **Partie complète** : Deux joueurs peuvent jouer une partie entière
- **Interface intuitive** : Règles comprises sans explication
- **Gameplay fonctionnel** : Toutes les mécaniques de base marchent
- **Feedback** : Clarté des règles, plaisir de jeu, bugs critiques

---

### **Tâche 2 : Deck Builder Fonctionnel**
**Livrable Testable** : Construction de decks personnalisés

#### Développement
- Collection de cartes (pool fixe de 120 cartes pour tests)
- Interface Deck Builder :
  - Sélection de faction
  - Liste des cartes disponibles avec filtres
  - Construction deck 40 cartes
  - Validation automatique (4 max par carte, faction unique)
  - Sauvegarde des decks
- Intégration avec l'interface de jeu (jouer avec son deck)
- Navigation entre écrans (Menu → Deck Builder → Game)

#### Test Utilisateur
- **Création de deck** : Construire plusieurs decks différents
- **Test en jeu** : Jouer avec ses propres decks construits
- **Validation** : Le deck building est-il satisfaisant ? Les cartes sont-elles équilibrées ?
- **Feedback** : Améliorer l'expérience de construction

---

### **Tâche 3 : Matchmaking Simple + Temps Réel**
**Livrable Testable** : Parties en ligne contre d'autres joueurs

#### Développement
- Système d'authentification basique (login/register)
- Socket.io integration pour temps réel
- Matchmaking simple (file d'attente, premier arrivé)
- Synchronisation temps réel des parties :
  - Actions simultanées
  - Déconnexion/reconnexion basique
  - États de jeu partagés
- Menu principal avec navigation

#### Test Utilisateur
- **Parties multijoueurs** : Tests avec plusieurs proches en simultané
- **Validation** : Le temps réel fonctionne-t-il bien ? Y a-t-il des bugs de synchro ?
- **Feedback** : Problèmes de connexion, lag, expérience utilisateur

---

### **Tâche 4 : Système de Quêtes (Conditions de Victoire)**
**Livrable Testable** : Mécaniques de victoire complètes

#### Développement
- Implémentation des 9 quêtes (3 par faction)
- Sélection secrète de quête en début de partie
- Vérification automatique des conditions en fin de tour
- Interface pour afficher les quêtes (sans révéler celle de l'adversaire)
- Écrans de victoire/défaite avec raison

#### Test Utilisateur
- **Parties avec quêtes** : Tester toutes les conditions de victoire
- **Validation** : Les quêtes sont-elles équilibrées ? Amusantes à jouer ?
- **Feedback** : Certaines quêtes trop faciles/difficiles ? Autres idées de quêtes ?

---

### **Tâche 5 : Polish d'Interface + Stats Basiques**
**Livrable Testable** : Expérience utilisateur améliorée

#### Développement
- Amélioration visuelle de toutes les interfaces
- Animations et feedback visuels basiques
- Écran de profil avec statistiques simples :
  - Victoires/défaites globales
  - Stats par faction
  - Historique des dernières parties
- Écran d'aide avec règles intégrées
- Responsive design pour mobile/tablette

#### Test Utilisateur
- **Expérience complète** : Test de toutes les fonctionnalités enchaînées
- **Validation** : L'ensemble est-il cohérent et agréable ?
- **Feedback** : Derniers ajustements avant version "stable"

---

### **Tâche 6 : Génération IA + Rotation (MVP)**
**Livrable Testable** : Première rotation de cartes automatique

#### Développement
- Service de génération ChatGPT 3.5
- Pool de cartes dynamique (3 sets de 30 cartes = 90 total)
- Système de rotation simplifié (manuel pour les tests)
- Interface pour voir les nouvelles cartes du mois
- Script d'analyse basique du meta

#### Test Utilisateur
- **Découverte** : Test de nouvelles cartes générées par IA
- **Validation** : Les cartes IA sont-elles jouables ? Équilibrées ?
- **Feedback** : Qualité de génération, mécaniques intéressantes

---

## ✅ Critères de Validation par Tâche

### Tâche 1
- ✅ Chaque étape incrémentale testable
- ✅ Partie complète jouable visuellement
- ✅ Interface intuitive et gameplay clair

### Tâche 2
- ✅ Construction de deck satisfaisante
- ✅ Validation automatique fonctionne
- ✅ Integration jeu smooth

### Tâche 3
- ✅ Parties multijoueurs stables
- ✅ Pas de désync majeure
- ✅ Expérience temps réel fluide

### Tâche 4
- ✅ Toutes les quêtes testées et fonctionnelles
- ✅ Équilibrage acceptable
- ✅ Gameplay varié et intéressant

### Tâche 5
- ✅ Interface polie et professionnelle
- ✅ Stats utiles et motivantes
- ✅ Expérience utilisateur cohérente

### Tâche 6
- ✅ Génération IA produit des cartes jouables
- ✅ Système de rotation opérationnel
- ✅ Prototype complet et stable

---

## 🎯 Résultat Final

**Prototype Complet** permettant :
- Construction de decks personnalisés
- Parties en temps réel multijoueurs
- Système de quêtes complet
- Interface polie et intuitive
- Génération de contenu par IA
- Tests utilisateurs validés à chaque étape

Prêt pour démonstrations, tests élargis, et développement des fonctionnalités avancées.