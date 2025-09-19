# Système d'Effets de Cartes - TCG Tactique

## 🎯 Structure des Effets

### Types de Triggers

Les effets des unités se déclenchent selon différents moments clés du jeu :

```typescript
enum TriggerType {
  ON_DEPLOY = "on_deploy",           // À l'invocation
  ON_DEATH = "on_death",             // Quand détruit
  ON_ATTACK = "on_attack",           // Quand attaque
  ON_DAMAGE = "on_damage",           // Quand reçoit des dégâts
  START_TURN = "start_turn",         // Début de tour
  END_TURN = "end_turn",             // Fin de tour
  ON_ADVANCE = "on_advance",         // Lors d'une avancée générale
  ON_FORMATION = "on_formation"      // Quand condition de formation remplie
}
```

---

## ⚔️ Effets Communs (Toutes Factions)

### Effets de Combat

#### **Charge**
- **Trigger** : ON_DEPLOY
- **Effet** : Peut attaquer immédiatement au tour d'invocation
- **Thème** : Unités d'assaut rapides

#### **First Strike**
- **Trigger** : ON_ATTACK
- **Effet** : Inflige ses dégâts en premier lors du combat
- **Thème** : Armes rapides, réflexes aiguisés

#### **Riposte**
- **Trigger** : ON_DAMAGE
- **Effet** : Inflige X dégâts à l'attaquant
- **Variantes** :
  - Riposte 1 (1 dégât)
  - Riposte 2 (2 dégâts)

#### **Berserker**
- **Trigger** : ON_DAMAGE
- **Effet** : +1 Attaque jusqu'à la fin du tour
- **Thème** : Rage au combat

#### **Fureur**
- **Trigger** : ON_DEATH (allié)
- **Effet** : +2 Attaque jusqu'à la fin du tour
- **Thème** : Vengeance pour les tombés

### Effets de Protection

#### **Blindage X**
- **Trigger** : ON_DAMAGE
- **Effet** : Réduit les dégâts reçus de X
- **Variantes** : Blindage 1, 2, 3

#### **Bouclier Énergétique**
- **Trigger** : ON_DAMAGE
- **Effet** : Annule les X premiers dégâts reçus ce tour
- **Usage** : Une fois par tour

#### **Camouflage**
- **Trigger** : Passif
- **Effet** : Ne peut être ciblé que par des créatures adjacentes
- **Thème** : Infiltration, discrétion

#### **Résistance Psychique**
- **Trigger** : Passif
- **Effet** : Immunisé aux effets de sorts et capacités mentales
- **Thème** : Protection contre les psykers

### Effets de Soutien

#### **Inspiration**
- **Trigger** : ON_DEPLOY
- **Effet** : Les alliés sur la même ligne gagnent +1/+1
- **Thème** : Leadership, commandement

#### **Ralliement**
- **Trigger** : START_TURN
- **Effet** : Soigne 1 PV à tous les alliés de la formation
- **Thème** : Soins de terrain, moral

#### **Coordonner**
- **Trigger** : ON_ATTACK
- **Effet** : Un allié adjacent peut également attaquer
- **Thème** : Tactiques coordonnées

#### **Suppression**
- **Trigger** : ON_ATTACK
- **Effet** : La cible ne peut pas attaquer au prochain tour
- **Thème** : Tir de suppression

### Effets Utilitaires

#### **Reconnaissance**
- **Trigger** : ON_DEPLOY
- **Effet** : Regarde les 3 prochaines cartes, en garde 1
- **Thème** : Éclaireurs, surveillance

#### **Logistique**
- **Trigger** : START_TURN
- **Effet** : +1 Écho du Néant ce tour
- **Thème** : Support arrière

#### **Sabotage**
- **Trigger** : ON_DEPLOY
- **Effet** : L'adversaire défausse 1 carte aléatoire
- **Thème** : Guerre électronique

---

## 🏛️ Effets Spécifiques par Faction

### Humains - Discipline et Tactiques

#### **Bolter Drill**
- **Trigger** : ON_ATTACK
- **Effet** : Si tue la cible, peut attaquer une seconde fois

#### **Tactical Doctrine**
- **Trigger** : ON_FORMATION (ligne complète)
- **Effet** : Toute la ligne gagne "Coordonner"

#### **Recrutement**
- **Trigger** : ON_DEATH
- **Effet** : Invoque un Scout 1/1 gratuit

#### **Volonté Inébranlable**
- **Trigger** : START_TURN
- **Effet** : Immunisé aux effets de peur et terreur

### Aliens - Évolution et Essaim

#### **Synapse**
- **Trigger** : Passif
- **Effet** : Les Aliens à portée 1 gagnent +1/+1

#### **Rapid Evolution**
- **Trigger** : START_TURN
- **Effet** : Peut gagner un mot-clé aléatoire

#### **Biomass Absorption**
- **Trigger** : ON_DEATH (ennemi)
- **Effet** : +1/+1 permanent et soigne 1 PV

#### **Spawning**
- **Trigger** : END_TURN
- **Effet** : 25% de chance d'invoquer un Ripper 1/1

### Robots - Technologie Ancienne

#### **Living Metal**
- **Trigger** : END_TURN
- **Effet** : Soigne 1 PV si pas attaqué ce tour

#### **Reanimation Protocols**
- **Trigger** : ON_DEATH
- **Effet** : 40% de chance de revenir avec 1 PV

#### **Gauss Weaponry**
- **Trigger** : ON_ATTACK
- **Effet** : Détruit automatiquement les cibles à 1 PV

#### **Phase Out**
- **Trigger** : ON_DAMAGE
- **Effet** : Devient intangible jusqu'au prochain tour

---

## 📋 Notes de Conception

### Équilibrage des Effets
- **Effets communs** : Accessibles à toutes les factions pour la diversité
- **Effets spécifiques** : Renforcent l'identité unique de chaque faction
- **Variantes numériques** : Permettent l'ajustement fin de la puissance (Riposte 1/2, Blindage X)

### Synergies avec les Factions
- **Humains** : Effets orientés formation et coordination
- **Aliens** : Mécaniques d'évolution et de croissance organique
- **Robots** : Technologies défensives et résurrection

### Interactions Stratégiques
Les effets créent des couches de décisions tactiques :
- Timing d'invocation selon les triggers
- Positionnement pour maximiser les synergies
- Anticipation des réactions adverses