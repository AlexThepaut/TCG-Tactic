# Documentation des Règles de Base - TCG Tactique

## 1. Vue d'ensemble du jeu

**TCG Tactique** est un jeu de cartes à collectionner en 1 contre 1 qui se joue sur une grille tactique de 3 lignes par 5 colonnes. Contrairement aux TCG traditionnels, les joueurs placent leurs cartes selon des formations spécifiques à leur faction et utilisent un système de portée pour les combats.

Les joueurs n'ont pas de points de vie mais doivent remplir des conditions de victoire spécifiques à définir selon les factions et variantes de jeu.

## 2. Matériel de jeu

### 2.1 Decks
- **Taille du deck** : Exactement 40 cartes par joueur
- **Types de cartes** : Unités et Sorts

### 2.2 Grille de jeu
- **Dimensions** : 3 lignes × 5 colonnes par joueur
- **Configuration** : Variable selon la faction choisie (certaines cases peuvent être injouables)
- **Orientation** : Chaque joueur fait face à son adversaire

### 2.3 Ressources
- **Échos du Néant** : Ressource principale pour jouer les cartes
- **Maximum** : 10 Échos du Néant
- **Démarrage** : Chaque joueur commence avec 1 Écho du Néant

## 3. Préparation de la partie

### 3.1 Mise en place
1. Chaque joueur choisit sa faction et sa formation associée
2. Les joueurs mélangent leur deck respectif
3. Détermination aléatoire du premier joueur
4. Chaque joueur pioche 7 cartes pour sa main de départ
5. Les grilles commencent vides

### 3.2 Premier tour
Le premier joueur ne pioche pas de carte supplémentaire pour son premier tour.

## 4. Types de cartes

### 4.1 Unités
Les unités sont des cartes permanentes placées sur la grille.

**Statistiques des unités :**
- **Coût** : Nombre d'Échos du Néant nécessaires pour jouer la carte
- **Attaque** : Dégâts infligés lors d'un combat
- **Points de Vie** : Résistance de l'unité
- **Portée** : Distance d'attaque (voir système de portée)
- **Effets** : Une unité peut posséder un ou plusieurs effets spéciaux (capacités passives, déclenchées, ou activées)

### 4.2 Sorts
Les sorts sont des effets instantanés qui ne restent pas sur la grille.

**Caractéristiques des sorts :**
- **Coût** : Nombre d'Échos du Néant nécessaires
- **Effet** : Description de l'effet produit
- **Résolution** : Immédiate lors du jeu de la carte

## 5. Déroulement d'un tour

### 5.1 Séquence de tour
1. **Phase de ressources** : +1 Écho du Néant (maximum 10)
2. **Phase de pioche** : Piocher 1 carte (sauf premier tour du premier joueur)
3. **Phase d'action** : Dans l'ordre souhaité par le joueur actif
   - Jouer des cartes (unités ou sorts)
   - Activer des effets spéciaux
   - Déclarer des attaques

### 5.2 Limitations par tour
- **Échos du Néant** : Seule limite pour jouer des cartes
- **Attaques** : Chaque unité peut attaquer une fois par tour
- **Actions** : Aucune limite d'actions autres que les ressources disponibles

## 6. Système de combat

### 6.1 Déclaration d'attaque
Une unité peut attaquer si :
- Elle a été placée avant ce tour (pas de "rush")
- Une cible est à sa portée
- Elle n'a pas encore attaqué ce tour

### 6.2 Résolution du combat
1. L'attaquant choisit une cible à portée
2. **Combat simultané** : Les deux unités s'infligent mutuellement leurs dégâts d'attaque
3. Les dégâts sont soustraits des points de vie
4. Toute unité à 0 PV ou moins est détruite

### 6.3 Exemple de combat
- Unité A (3 ATK / 4 PV) attaque Unité B (2 ATK / 3 PV)
- Résultat : Unité A (3 ATK / 2 PV), Unité B détruite

## 7. Système de portée

### 7.1 Principe de base
La portée détermine quelles lignes ennemies une unité peut attaquer. Elle se calcule depuis la ligne où se trouve l'unité attaquante.

### 7.2 Calcul de portée
- **Ligne de référence** : Position de l'unité attaquante (distance 0)
- **Lignes atteignables** : Ligne de référence + valeur de portée
- **Ciblage libre** : L'attaquant peut choisir n'importe quelle unité sur les lignes à portée

### 7.3 Exemple pratique
```
Grille adverse :
-333-  ← Ligne 3 (distance 3)
-222-  ← Ligne 2 (distance 2) 
-111-  ← Ligne 1 (distance 1)
-----
Ma grille :
-ABC-  ← Mes unités (ligne 0)
-DEF-
-GHI-
```

**Exemples de portée :**
- Unité A avec portée 1-2 : Peut attaquer toutes les unités des lignes 1 ET 2
- Unité C avec portée 2-3 : Peut attaquer toutes les unités des lignes 2 ET 3 (mais PAS ligne 1)
- Unité E avec portée 1 : Ne peut attaquer personne (trop éloignée, ligne 1 hors de portée depuis ligne 2)

## 8. Formations par faction

### 8.1 Concept
Chaque faction possède une formation unique qui détermine :
- Quelles cases de la grille 3×5 sont jouables
- La stratégie et le style de jeu de la faction
- Les synergies possibles entre les unités
- **Effet passif de faction** : Chaque faction bénéficie d'un effet passif permanent qui influence le gameplay

### 8.2 Exemple de formation
**Faction exemple** :
- **Ligne 1** : 5 cases jouables (formation offensive)
- **Ligne 2** : 3 cases jouables (soutien)  
- **Ligne 3** : 1 case jouable (commandement)

*Note : Les formations spécifiques seront détaillées dans un document dédié aux factions.*

## 9. Règles spéciales

### 9.1 Mouvement
- **Règle générale** : Les unités ne peuvent pas se déplacer une fois posées
- **Exceptions** : Capacités spéciales de cartes ou de factions peuvent permettre le mouvement

### 9.2 Épuisement du deck
Si un joueur ne peut plus piocher (deck et main vides), il perd immédiatement la partie.

### 9.3 Placement des unités
- Les unités doivent être placées sur les cases jouables de sa formation
- Aucun coût supplémentaire selon la position
- Une seule unité par case

## 10. Conditions de victoire

Les conditions de victoire varient selon les factions et modes de jeu. Voici quelques exemples de conditions possibles :

### 10.1 Exemples de conditions
- **Contrôle territorial** : Maintenir une ligne complète d'unités pendant X tours consécutifs
- **Élimination massive** : Éliminer X créatures ennemies en un seul tour
- **Synergie** : Avoir X créatures qui se donnent mutuellement des bonus
- **Survie** : Garder une unité spécifique en vie pendant X tours

*Note : Les conditions de victoire spécifiques seront définies ultérieurement selon les factions et variantes.*

## 11. Concepts avancés (à développer)

### 11.1 Extensions futures possibles
- **Boucliers** : Protection supplémentaire à détruire avant d'atteindre les PV
- **Boosts temporaires** : Améliorations d'attaque limitées dans le temps
- **Effets de terrain** : Cases spéciales avec des propriétés particulières
- **Sorts persistants** : Enchantements restant en jeu

---

*Cette documentation couvre les règles de base du jeu. Des documents complémentaires détailleront les spécificités des factions, les cartes individuelles, et les stratégies avancées.*