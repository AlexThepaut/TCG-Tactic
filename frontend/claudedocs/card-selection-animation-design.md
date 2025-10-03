# Card Selection Animation Design - HearthstoneHand Component

**Design Document** | TCG Tactique
**Component**: `HearthstoneHand.tsx` - CardInHand selection animation
**Design Date**: 2025-10-03
**Status**: Design Specification

---

## 🎯 Design Goals

1. **Visual Clarity**: Make card selection unmistakably clear and satisfying
2. **Engagement**: Create a "juicy" interaction that feels responsive and polished
3. **Performance**: Maintain 60fps with GPU-accelerated animations
4. **Faction Identity**: Incorporate faction-specific visual theming
5. **Accessibility**: Support reduced motion preferences

---

## 📊 Current Animation Analysis

### Current Behavior
```typescript
// Current selection animation (lines 84-94)
if (isSelected) {
  return { scaleX: 1.5, scaleY: 1.3 }; // Simple scale
}
```

**Issues with Current Design**:
- ❌ Basic scale transformation feels flat and unpolished
- ❌ No anticipation or follow-through (animation principles)
- ❌ Missing visual feedback beyond size change
- ❌ No faction-specific theming
- ❌ Lacks the "pop" feeling of modern card game UIs

**Current Strengths**:
- ✅ Spring animation provides smooth motion
- ✅ Different states for hover/selection
- ✅ Performance optimized with memoization
- ✅ Respects reduced motion preferences

---

## 🎨 New Animation Design

### Animation Stages

```
IDLE STATE          ANTICIPATION       POP & ELEVATE        SELECTED IDLE
    ↓                    ↓                   ↓                    ↓
┌─────────┐         ┌────────┐         ┌──────────┐         ┌──────────┐
│  Card   │   →     │ Card   │   →     │   CARD   │   →     │   CARD   │
│ 1.0x    │         │ 0.95x  │         │   1.6x   │         │   1.5x   │
│         │         │ -2deg  │         │   +0deg  │         │  pulse   │
└─────────┘         └────────┘         └──────────┘         └──────────┘
                                        ✨ Glow              🌟 Float
  0ms               0-100ms             100-300ms            300ms+
```

### Stage 1: Anticipation (0-100ms)
**Purpose**: Create visual "windup" for satisfying release

```typescript
{
  scale: 0.95,
  rotate: -2,
  y: position.y + getYOffset() + 5, // Slight downward push
  transition: {
    type: "spring",
    stiffness: 600,
    damping: 25
  }
}
```

### Stage 2: Pop & Elevate (100-300ms)
**Purpose**: Dramatic "pop" with overshoot for satisfaction

```typescript
{
  scale: 1.6,      // Overshoot target
  rotate: 0,
  y: position.y - 80, // Dramatic elevation
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 20,
    mass: 0.8
  }
}
```

### Stage 3: Selected Idle (300ms+)
**Purpose**: Continuous visual indication of selection

```typescript
{
  scale: 1.5,      // Settle to final size
  y: position.y - 60, // Elevated position
  // Continuous animations:
  // - Floating motion (sine wave)
  // - Pulsing glow
  // - Particle effects (optional)
}
```

---

## 💫 Visual Effects Design

### 1. Multi-Layer Glow System

**Faction-Specific Glow Colors**:
```typescript
const FACTION_GLOW = {
  humans: {
    inner: 'rgba(59, 130, 246, 0.6)',    // Imperial blue
    middle: 'rgba(59, 130, 246, 0.4)',
    outer: 'rgba(59, 130, 246, 0.2)',
  },
  aliens: {
    inner: 'rgba(34, 197, 94, 0.6)',     // Alien green
    middle: 'rgba(34, 197, 94, 0.4)',
    outer: 'rgba(34, 197, 94, 0.2)',
  },
  robots: {
    inner: 'rgba(239, 68, 68, 0.6)',     // Robot red
    middle: 'rgba(239, 68, 68, 0.4)',
    outer: 'rgba(239, 68, 68, 0.2)',
  }
};
```

**Glow Animation**:
```typescript
boxShadow: [
  // Pulse animation keyframes
  `0 0 20px ${inner}, 0 0 40px ${middle}, 0 0 60px ${outer}`,
  `0 0 30px ${inner}, 0 0 60px ${middle}, 0 0 90px ${outer}`,
  `0 0 20px ${inner}, 0 0 40px ${middle}, 0 0 60px ${outer}`,
],
transition: {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut"
}
```

### 2. Animated Border Effect

**Drawing Border Animation**:
```typescript
// Animated border that "draws" around card on selection
<motion.div
  className="absolute inset-0 rounded-lg pointer-events-none"
  initial={{
    background: `linear-gradient(90deg,
      ${factionColor} 0%,
      transparent 0%)`
  }}
  animate={{
    background: `linear-gradient(90deg,
      ${factionColor} 100%,
      transparent 100%)`
  }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  style={{
    padding: '3px',
    WebkitMaskImage: `linear-gradient(#fff 0 0) content-box,
                      linear-gradient(#fff 0 0)`,
    WebkitMaskComposite: 'xor'
  }}
/>
```

### 3. Floating Idle Animation

**Continuous Motion When Selected**:
```typescript
// Gentle floating motion using sine wave
animate={{
  y: [
    position.y - 60,
    position.y - 65,
    position.y - 60,
  ],
}}
transition={{
  duration: 2.5,
  repeat: Infinity,
  ease: "easeInOut"
}}
```

### 4. Particle Burst Effect (Optional Enhancement)

**Selection Moment Particles**:
```typescript
const ParticleBurst = ({ faction, position }) => {
  const particleCount = 12;
  const particles = Array.from({ length: particleCount });

  return (
    <>
      {particles.map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 60;

        return (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-${faction}-400`}
            initial={{
              x: position.x,
              y: position.y,
              opacity: 1,
              scale: 1
            }}
            animate={{
              x: position.x + Math.cos(angle) * distance,
              y: position.y + Math.sin(angle) * distance,
              opacity: 0,
              scale: 0
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut"
            }}
          />
        );
      })}
    </>
  );
};
```

---

## 🔧 Implementation Approach

### Enhanced Animation Variants

```typescript
const cardAnimationVariants = {
  idle: {
    scale: 1,
    y: position.y + getYOffset(),
    rotate: position.rotation,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },

  // Anticipation phase
  anticipate: {
    scale: 0.95,
    y: position.y + getYOffset() + 5,
    rotate: position.rotation - 2,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 25,
      duration: 0.1
    }
  },

  // Pop phase with overshoot
  selected: {
    scale: [0.95, 1.6, 1.5],  // Anticipate → overshoot → settle
    y: [
      position.y + getYOffset() + 5,  // From anticipation
      position.y - 80,                 // Peak elevation
      position.y - 60                  // Final elevation
    ],
    rotate: [position.rotation - 2, 0, 0],
    boxShadow: [
      '0 4px 6px rgba(0,0,0,0.1)',
      `0 0 40px ${FACTION_GLOW[faction].middle}`,
      `0 0 30px ${FACTION_GLOW[faction].middle}`
    ],
    transition: {
      scale: {
        times: [0, 0.7, 1],
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1] // Custom ease for overshoot
      },
      y: {
        times: [0, 0.6, 1],
        duration: 0.4,
        type: "spring",
        stiffness: 400,
        damping: 20
      }
    }
  },

  // Idle selected state with pulse
  selectedIdle: {
    scale: 1.5,
    y: [
      position.y - 60,
      position.y - 65,
      position.y - 60
    ],
    boxShadow: [
      `0 0 20px ${FACTION_GLOW[faction].inner}, 0 0 40px ${FACTION_GLOW[faction].middle}`,
      `0 0 30px ${FACTION_GLOW[faction].inner}, 0 0 60px ${FACTION_GLOW[faction].middle}`,
      `0 0 20px ${FACTION_GLOW[faction].inner}, 0 0 40px ${FACTION_GLOW[faction].middle}`
    ],
    transition: {
      y: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      },
      boxShadow: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};
```

### Animation State Machine

```typescript
// Determine which animation variant to use
const getAnimationState = () => {
  if (!isSelected) return 'idle';

  // On selection transition
  if (justSelected) {
    return 'selected'; // Plays anticipate → pop sequence
  }

  // After selection animation completes
  return 'selectedIdle'; // Continuous floating/pulse
};

// Track selection timing
const [justSelected, setJustSelected] = useState(false);

useEffect(() => {
  if (isSelected) {
    setJustSelected(true);
    const timer = setTimeout(() => setJustSelected(false), 400);
    return () => clearTimeout(timer);
  }
}, [isSelected]);
```

---

## 🎮 Faction-Specific Theming

### Visual Identity Per Faction

**Humans (Imperial)**:
- Color: Blue (#3B82F6)
- Glow: Sharp, military precision
- Particles: Geometric, orderly pattern
- Border: Clean, angular

**Aliens (Living Swarm)**:
- Color: Green (#22C55E)
- Glow: Organic, pulsing
- Particles: Flowing, organic movement
- Border: Smooth, curved

**Robots (Immortal Army)**:
- Color: Red (#EF4444)
- Glow: Mechanical, precise
- Particles: Grid-like, systematic
- Border: Technological, circuit-like

```typescript
const getFactionSelectionStyle = (faction: Faction) => {
  const styles = {
    humans: {
      glowIntensity: 1.0,
      particlePattern: 'grid',
      borderStyle: 'angular',
      pulseSpeed: 2.0
    },
    aliens: {
      glowIntensity: 1.2,
      particlePattern: 'organic',
      borderStyle: 'smooth',
      pulseSpeed: 1.5
    },
    robots: {
      glowIntensity: 0.9,
      particlePattern: 'circuit',
      borderStyle: 'tech',
      pulseSpeed: 2.5
    }
  };

  return styles[faction];
};
```

---

## ⚡ Performance Optimization

### GPU Acceleration
```typescript
// Force GPU acceleration for smooth 60fps
style={{
  transform: 'translateZ(0)',
  willChange: 'transform, opacity, box-shadow',
  backfaceVisibility: 'hidden'
}}
```

### Animation Priorities
1. **High Priority** (60fps required):
   - Transform (scale, translate, rotate)
   - Opacity

2. **Medium Priority** (30fps acceptable):
   - Box-shadow (glow effects)
   - Border animations

3. **Low Priority** (one-time):
   - Particle burst (can skip on low-end devices)

### Reduced Motion Support
```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const motionConfig = prefersReducedMotion ? {
  // Simplified animations
  selected: {
    scale: 1.3,  // Less dramatic
    y: position.y - 40,  // Less movement
    transition: { duration: 0.2, ease: 'easeOut' }
  }
} : {
  // Full animations (as designed above)
};
```

---

## 📱 Touch & Mobile Considerations

### Touch Feedback
```typescript
// Enhanced touch feedback for mobile
<motion.div
  whileTap={{
    scale: 0.95,
    transition: { duration: 0.05 }
  }}
  onTouchStart={() => {
    // Haptic feedback if available
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  }}
>
```

### Mobile-Specific Adjustments
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const mobileAdjustments = {
  scale: isMobile ? 1.3 : 1.5,  // Less dramatic on mobile
  elevation: isMobile ? -40 : -60,  // Less Y movement
  particleCount: isMobile ? 6 : 12  // Fewer particles
};
```

---

## 🔊 Sound Design (Future Enhancement)

### Audio Hooks for Selection

```typescript
// Sound effect integration points
const playSelectionSound = (faction: Faction) => {
  const sounds = {
    humans: '/sounds/selection-imperial.mp3',
    aliens: '/sounds/selection-organic.mp3',
    robots: '/sounds/selection-tech.mp3'
  };

  const audio = new Audio(sounds[faction]);
  audio.volume = 0.3;
  audio.play().catch(e => console.warn('Audio play failed:', e));
};

// Trigger on selection
useEffect(() => {
  if (isSelected && !prevIsSelected) {
    playSelectionSound(faction);
  }
}, [isSelected, faction]);
```

---

## 📋 Implementation Checklist

### Phase 1: Core Animation (Essential)
- [ ] Implement anticipation → pop → settle sequence
- [ ] Add multi-layer glow effects with faction colors
- [ ] Create floating idle animation for selected state
- [ ] Add GPU acceleration and performance optimizations
- [ ] Implement reduced motion support

### Phase 2: Visual Polish (Recommended)
- [ ] Add animated border drawing effect
- [ ] Implement faction-specific glow intensities
- [ ] Add particle burst on selection moment
- [ ] Create hover → selection transition smoothing
- [ ] Add deselection animation (reverse sequence)

### Phase 3: Advanced Features (Optional)
- [ ] Integrate sound effects for selection
- [ ] Add haptic feedback for mobile
- [ ] Create faction-specific particle patterns
- [ ] Implement keyboard selection animations
- [ ] Add selection combo animations (multi-select)

---

## 🧪 Testing Strategy

### Visual Testing
1. **Cross-Faction**: Test all three factions for visual consistency
2. **State Transitions**: Idle → Select → Deselect → Reselect
3. **Rapid Selection**: Quick card switching without animation conflicts
4. **Mobile Viewport**: Test on various screen sizes

### Performance Testing
1. **Frame Rate**: Monitor 60fps during animations
2. **Memory**: Check for animation cleanup and leaks
3. **Battery Impact**: Test on mobile devices
4. **Reduced Motion**: Verify accessibility compliance

### User Testing
1. **Clarity**: Users easily identify selected card
2. **Satisfaction**: Animation feels responsive and "juicy"
3. **Performance**: No perceived lag or stutter
4. **Accessibility**: Works for users with motion sensitivity

---

## 📊 Success Metrics

**Quantitative**:
- Animation maintains 60fps on target devices
- Selection recognition time < 200ms
- User satisfaction score > 8/10
- Zero animation-related bugs in production

**Qualitative**:
- Animation feels polished and professional
- Faction identity clearly communicated through visuals
- Interactions feel satisfying and responsive
- UI feels modern and engaging

---

## 🔗 Related Components

**Dependencies**:
- `UnifiedCard.tsx` - Card rendering (receives selection state)
- `HearthstoneHand.tsx` - Parent hand container
- `@/utils/factionThemes.ts` - Faction color system

**Integration Points**:
- Selection state from `useCardSelection` hook
- Faction data from game state
- Animation preferences from user settings

---

## 📝 Notes & Considerations

1. **Animation Complexity**: Start with Phase 1 (core animation), then iterate based on user feedback

2. **Performance Budget**: Allocate max 16ms per frame for card animations to maintain 60fps

3. **Faction Balance**: Ensure all faction animations are equally appealing and don't create gameplay preference bias

4. **Accessibility First**: Always provide reduced motion alternative

5. **Future Expansion**: Design allows for additional effects (trails, afterimages, combo animations) without architectural changes

---

**Next Steps**: Review this design specification, approve/modify as needed, then proceed to implementation phase using `/sc:implement` command.
