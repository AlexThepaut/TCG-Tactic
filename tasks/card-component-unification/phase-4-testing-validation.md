# Phase 4: Testing & Validation

## Objective
Ensure the unified card component meets all quality standards, performs optimally across contexts, and maintains visual consistency while providing robust functionality.

## Testing Strategy Overview

### Testing Pyramid
1. **Unit Tests**: Component logic and rendering
2. **Integration Tests**: Context-specific behavior
3. **Visual Tests**: Styling and animation consistency
4. **Performance Tests**: Rendering speed and memory usage
5. **Accessibility Tests**: WCAG compliance and keyboard navigation
6. **User Acceptance Tests**: Real-world usage validation

## Unit Testing Strategy

### Component Logic Testing

```typescript
// __tests__/UnifiedCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import UnifiedCard from '@/components/shared/UnifiedCard';
import { mockGameCard, mockFaction } from '@/test-utils/mocks';

const renderWithDnd = (component) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

describe('UnifiedCard Component', () => {
  describe('Core Rendering', () => {
    it('renders card name and basic information', () => {
      render(<UnifiedCard card={mockGameCard} context="collection" />);

      expect(screen.getByText(mockGameCard.name)).toBeInTheDocument();
      expect(screen.getByText(mockGameCard.cost.toString())).toBeInTheDocument();
      expect(screen.getByTestId(`card-${mockGameCard.id}`)).toBeInTheDocument();
    });

    it('displays unit stats for unit cards', () => {
      const unitCard = { ...mockGameCard, type: 'unit', attack: 3, health: 5 };
      render(<UnifiedCard card={unitCard} context="game" />);

      expect(screen.getByText('3')).toBeInTheDocument(); // attack
      expect(screen.getByText('5')).toBeInTheDocument(); // health
    });

    it('handles spell cards without stats', () => {
      const spellCard = { ...mockGameCard, type: 'spell' };
      render(<UnifiedCard card={spellCard} context="collection" />);

      expect(screen.queryByTestId('unit-stats')).not.toBeInTheDocument();
    });
  });

  describe('Context-Specific Behavior', () => {
    it('enables drag functionality in game context', () => {
      const onDragStart = jest.fn();
      renderWithDnd(
        <UnifiedCard
          card={mockGameCard}
          context="game"
          handIndex={0}
          resources={10}
          faction="humans"
          onDragStart={onDragStart}
        />
      );

      const card = screen.getByTestId(`card-${mockGameCard.id}`);
      expect(card).toHaveStyle('cursor: grab');
    });

    it('shows add to deck button in deck-builder context', () => {
      const onAddToDeck = jest.fn();
      render(
        <UnifiedCard
          card={mockGameCard}
          context="deck-builder"
          canAddToDeck={true}
          onAddToDeck={onAddToDeck}
        />
      );

      const addButton = screen.getByRole('button');
      fireEvent.click(addButton);
      expect(onAddToDeck).toHaveBeenCalledWith(mockGameCard);
    });

    it('handles collection browsing clicks', () => {
      const onClick = jest.fn();
      render(
        <UnifiedCard
          card={mockGameCard}
          context="collection"
          onClick={onClick}
        />
      );

      const card = screen.getByTestId(`card-${mockGameCard.id}`);
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledWith(mockGameCard, expect.any(Object));
    });
  });

  describe('Resource Management', () => {
    it('shows unaffordable overlay in game when insufficient resources', () => {
      render(
        <UnifiedCard
          card={{ ...mockGameCard, cost: 5 }}
          context="game"
          resources={3}
          faction="humans"
        />
      );

      expect(screen.getByText('Need 2 more')).toBeInTheDocument();
    });

    it('applies correct styling for affordable cards', () => {
      render(
        <UnifiedCard
          card={{ ...mockGameCard, cost: 3 }}
          context="game"
          resources={5}
          faction="humans"
        />
      );

      const card = screen.getByTestId(`card-${mockGameCard.id}`);
      expect(card).not.toHaveClass('opacity-60');
    });
  });

  describe('Deck Building Features', () => {
    it('displays quantity indicator when card is in deck', () => {
      render(
        <UnifiedCard
          card={mockGameCard}
          context="deck-builder"
          quantity={2}
        />
      );

      expect(screen.getByText('2x')).toBeInTheDocument();
    });

    it('disables add button when deck limit reached', () => {
      render(
        <UnifiedCard
          card={mockGameCard}
          context="deck-builder"
          quantity={2}
          deckLimit={2}
        />
      );

      const addButton = screen.getByRole('button');
      expect(addButton).toBeDisabled();
    });
  });
});
```

### Faction Styling Tests

```typescript
describe('Faction Styling', () => {
  const factions = ['humans', 'aliens', 'robots'] as const;

  factions.forEach(faction => {
    it(`applies correct ${faction} faction styling`, () => {
      render(
        <UnifiedCard
          card={{ ...mockGameCard, faction }}
          context="game"
          faction={faction}
          resources={10}
        />
      );

      const card = screen.getByTestId(`card-${mockGameCard.id}`);
      expect(card).toHaveClass(`border-${faction}-600`);
    });
  });

  it('handles undefined faction gracefully', () => {
    render(<UnifiedCard card={mockGameCard} context="collection" />);

    const card = screen.getByTestId(`card-${mockGameCard.id}`);
    expect(card).toBeInTheDocument();
  });
});
```

## Integration Testing Strategy

### Context Integration Tests

```typescript
// __tests__/integration/CardContextIntegration.test.tsx
describe('Card Context Integration', () => {
  describe('Game Integration', () => {
    it('integrates with game board drag and drop', async () => {
      const mockGameState = createMockGameState();
      render(<GameBoard gameState={mockGameState} />);

      const card = screen.getByTestId('card-1');
      const gridCell = screen.getByTestId('grid-cell-0-0');

      // Simulate drag and drop
      fireEvent.dragStart(card);
      fireEvent.dragEnter(gridCell);
      fireEvent.drop(gridCell);

      await waitFor(() => {
        expect(screen.getByTestId('placed-card-1')).toBeInTheDocument();
      });
    });

    it('updates card state based on game events', () => {
      const gameState = createMockGameState();
      const { rerender } = render(<GameBoard gameState={gameState} />);

      // Update game state
      const updatedState = {
        ...gameState,
        currentPlayer: {
          ...gameState.currentPlayer,
          resources: 2
        }
      };

      rerender(<GameBoard gameState={updatedState} />);

      const expensiveCard = screen.getByTestId('card-expensive');
      expect(expensiveCard).toHaveClass('opacity-60');
    });
  });

  describe('Collection Integration', () => {
    it('filters cards based on search input', async () => {
      render(<Collection />);

      const searchInput = screen.getByPlaceholderText('Search war chronicles...');
      fireEvent.change(searchInput, { target: { value: 'infantry' } });

      await waitFor(() => {
        const cards = screen.getAllByTestId(/^card-/);
        cards.forEach(card => {
          expect(card).toHaveTextContent(/infantry/i);
        });
      });
    });

    it('filters cards by faction selection', async () => {
      render(<Collection />);

      const humansButton = screen.getByText('🛡️ IMPERIAL');
      fireEvent.click(humansButton);

      await waitFor(() => {
        const cards = screen.getAllByTestId(/^card-/);
        cards.forEach(card => {
          expect(card).toHaveClass('border-humans-600');
        });
      });
    });
  });

  describe('Deck Builder Integration', () => {
    it('maintains deck state across card interactions', () => {
      render(<DeckBuilder />);

      const card = screen.getByTestId('card-1');
      const addButton = within(card).getByRole('button');

      // Add card to deck
      fireEvent.click(addButton);
      expect(screen.getByText('1/40 ECHOES')).toBeInTheDocument();

      // Add same card again
      fireEvent.click(addButton);
      expect(screen.getByText('2/40 ECHOES')).toBeInTheDocument();
      expect(within(card).getByText('2x')).toBeInTheDocument();
    });

    it('enforces deck building constraints', () => {
      render(<DeckBuilder />);

      const card = screen.getByTestId('card-1');
      const addButton = within(card).getByRole('button');

      // Add card twice (max limit)
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      // Button should be disabled
      expect(addButton).toBeDisabled();
    });
  });
});
```

## Visual Testing Strategy

### Snapshot Testing

```typescript
// __tests__/visual/CardSnapshots.test.tsx
import { render } from '@testing-library/react';
import UnifiedCard from '@/components/shared/UnifiedCard';

describe('Card Visual Snapshots', () => {
  const contexts = ['game', 'collection', 'deck-builder'] as const;
  const factions = ['humans', 'aliens', 'robots'] as const;
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  contexts.forEach(context => {
    factions.forEach(faction => {
      it(`renders ${context} context with ${faction} faction correctly`, () => {
        const { container } = render(
          <UnifiedCard
            card={{ ...mockGameCard, faction }}
            context={context}
            faction={faction}
            resources={10}
          />
        );
        expect(container.firstChild).toMatchSnapshot();
      });
    });
  });

  sizes.forEach(size => {
    it(`renders ${size} size correctly`, () => {
      const { container } = render(
        <UnifiedCard
          card={mockGameCard}
          context="collection"
          size={size}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  it('renders different card types correctly', () => {
    const unitCard = { ...mockGameCard, type: 'unit', attack: 3, health: 5 };
    const spellCard = { ...mockGameCard, type: 'spell' };

    const { container: unitContainer } = render(
      <UnifiedCard card={unitCard} context="game" />
    );
    const { container: spellContainer } = render(
      <UnifiedCard card={spellCard} context="game" />
    );

    expect(unitContainer.firstChild).toMatchSnapshot('unit-card');
    expect(spellContainer.firstChild).toMatchSnapshot('spell-card');
  });
});
```

### Animation Testing

```typescript
// __tests__/animation/CardAnimations.test.tsx
describe('Card Animations', () => {
  it('applies hover animations correctly', async () => {
    render(<UnifiedCard card={mockGameCard} context="game" />);

    const card = screen.getByTestId(`card-${mockGameCard.id}`);

    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(card).toHaveStyle('transform: translateY(-8px) scale(1.05)');
    });
  });

  it('handles dragging animations', async () => {
    const { container } = renderWithDnd(
      <UnifiedCard
        card={mockGameCard}
        context="game"
        handIndex={0}
        resources={10}
        faction="humans"
      />
    );

    const card = screen.getByTestId(`card-${mockGameCard.id}`);

    fireEvent.dragStart(card);

    await waitFor(() => {
      expect(card).toHaveStyle('opacity: 0.5');
      expect(container.querySelector('.dragging-indicator')).toBeInTheDocument();
    });
  });
});
```

## Performance Testing Strategy

### Rendering Performance Tests

```typescript
// __tests__/performance/CardPerformance.test.tsx
describe('Card Performance', () => {
  it('renders multiple cards efficiently', () => {
    const cards = Array.from({ length: 50 }, (_, i) => ({
      ...mockGameCard,
      id: `card-${i}`,
      name: `Test Card ${i}`
    }));

    const startTime = performance.now();

    render(
      <div className="grid grid-cols-6 gap-4">
        {cards.map(card => (
          <UnifiedCard
            key={card.id}
            card={card}
            context="collection"
            size="md"
          />
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render 50 cards in under 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles rapid state updates efficiently', async () => {
    let resources = 0;
    const { rerender } = render(
      <UnifiedCard
        card={{ ...mockGameCard, cost: 5 }}
        context="game"
        resources={resources}
        faction="humans"
      />
    );

    // Rapidly update resources
    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      resources = i % 10;
      rerender(
        <UnifiedCard
          card={{ ...mockGameCard, cost: 5 }}
          context="game"
          resources={resources}
          faction="humans"
        />
      );
    }

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Should handle 100 updates efficiently
    expect(updateTime).toBeLessThan(50);
  });
});
```

### Memory Leak Tests

```typescript
// __tests__/performance/MemoryLeaks.test.tsx
describe('Memory Management', () => {
  it('cleans up event listeners and animations', () => {
    const { unmount } = render(
      <UnifiedCard
        card={mockGameCard}
        context="game"
        resources={10}
        faction="humans"
      />
    );

    // Simulate interactions to create listeners
    const card = screen.getByTestId(`card-${mockGameCard.id}`);
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    // Unmount and check for leaks
    unmount();

    // Verify cleanup (implementation-specific)
    expect(document.querySelectorAll('[data-testid^="card-"]')).toHaveLength(0);
  });
});
```

## Accessibility Testing Strategy

### Keyboard Navigation Tests

```typescript
// __tests__/accessibility/CardAccessibility.test.tsx
describe('Card Accessibility', () => {
  it('supports keyboard navigation', () => {
    render(<UnifiedCard card={mockGameCard} context="collection" />);

    const card = screen.getByTestId(`card-${mockGameCard.id}`);

    // Should be focusable
    card.focus();
    expect(card).toHaveFocus();

    // Should respond to Enter key
    const onClick = jest.fn();
    render(
      <UnifiedCard
        card={mockGameCard}
        context="collection"
        onClick={onClick}
      />
    );

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('provides proper ARIA labels', () => {
    render(
      <UnifiedCard
        card={mockGameCard}
        context="game"
        resources={5}
      />
    );

    const card = screen.getByTestId(`card-${mockGameCard.id}`);
    expect(card).toHaveAttribute('aria-label');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('meets color contrast requirements', () => {
    // Use axe-core or similar accessibility testing library
    const { container } = render(
      <UnifiedCard card={mockGameCard} context="collection" />
    );

    // Test color contrast ratios
    // Implementation would depend on chosen accessibility testing library
  });
});
```

## Cross-Browser Testing Strategy

### Browser Compatibility Tests

```javascript
// cypress/integration/card-compatibility.spec.js
describe('Cross-Browser Card Compatibility', () => {
  const browsers = ['chrome', 'firefox', 'safari', 'edge'];

  browsers.forEach(browser => {
    context(`${browser} compatibility`, () => {
      it('renders cards correctly', () => {
        cy.visit('/collection');
        cy.get('[data-testid^="card-"]').should('be.visible');
        cy.get('[data-testid^="card-"]').first().should('have.css', 'aspect-ratio');
      });

      it('handles interactions properly', () => {
        cy.visit('/deck-builder');
        cy.get('[data-testid^="card-"]').first().click();
        cy.get('.deck-stats').should('contain', '1/40');
      });
    });
  });
});
```

## Regression Testing Strategy

### Visual Regression Tests

```javascript
// cypress/integration/visual-regression.spec.js
describe('Card Visual Regression', () => {
  it('maintains visual consistency across updates', () => {
    cy.visit('/collection');
    cy.get('[data-testid="card-1"]').matchImageSnapshot('card-collection');

    cy.visit('/deck-builder');
    cy.get('[data-testid="card-1"]').matchImageSnapshot('card-deck-builder');

    cy.visit('/game');
    cy.get('[data-testid="card-1"]').matchImageSnapshot('card-game');
  });

  it('preserves faction styling across contexts', () => {
    const factions = ['humans', 'aliens', 'robots'];

    factions.forEach(faction => {
      cy.visit(`/collection?faction=${faction}`);
      cy.get(`[data-testid^="card-"].faction-${faction}`)
        .first()
        .matchImageSnapshot(`card-${faction}-faction`);
    });
  });
});
```

## Quality Gates

### Automated Quality Checks

```json
// package.json - test scripts
{
  "scripts": {
    "test:unit": "jest --coverage",
    "test:integration": "jest --config jest.integration.config.js",
    "test:visual": "chromatic --project-token=PROJECT_TOKEN",
    "test:accessibility": "jest --config jest.a11y.config.js",
    "test:performance": "jest --config jest.performance.config.js",
    "test:e2e": "cypress run",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  }
}
```

### Coverage Requirements

```json
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/components/shared/UnifiedCard.tsx',
    'src/components/game/**/*.tsx',
    'src/pages/Collection.tsx',
    'src/pages/DeckBuilder.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/shared/UnifiedCard.tsx': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## Validation Checklist

### Functional Validation
- [ ] Card renders correctly in all three contexts
- [ ] Drag-and-drop functionality works in game context
- [ ] Click interactions work in collection/deck-builder contexts
- [ ] Resource checking works correctly in game context
- [ ] Deck building constraints enforced properly
- [ ] Faction filtering works across all contexts
- [ ] Responsive design scales appropriately

### Visual Validation
- [ ] Classic TCG layout maintained across all sizes
- [ ] Gothic theme preserved and enhanced
- [ ] Faction colors consistent and appropriate
- [ ] Animations smooth and context-appropriate
- [ ] Typography readable across all sizes
- [ ] Border effects and atmospheric styling work

### Performance Validation
- [ ] Component renders 50+ cards smoothly
- [ ] Animations maintain 60fps
- [ ] Memory usage stays within acceptable bounds
- [ ] No memory leaks detected
- [ ] Load times meet performance budgets
- [ ] Bundle size impact acceptable

### Accessibility Validation
- [ ] Keyboard navigation works properly
- [ ] Screen reader compatibility verified
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators clearly visible
- [ ] ARIA labels provide proper context

### Cross-Platform Validation
- [ ] Works correctly in all supported browsers
- [ ] Mobile touch interactions function properly
- [ ] Desktop mouse interactions work smoothly
- [ ] Responsive breakpoints behave correctly
- [ ] Print styles appropriate (if applicable)

## Success Metrics

### Performance Benchmarks
- **Initial Render**: < 16ms for single card
- **Grid Render**: < 100ms for 50 cards
- **Animation Frame Rate**: Consistent 60fps
- **Memory Usage**: < 1MB increase for 100 cards
- **Bundle Size**: < 50KB increase from original

### Quality Metrics
- **Test Coverage**: > 90% for core component
- **Bug Density**: < 1 critical bug per 1000 lines of code
- **Accessibility Score**: 100% WCAG AA compliance
- **Performance Score**: > 95 Lighthouse score
- **User Satisfaction**: > 90% positive feedback

## Documentation Requirements

### Testing Documentation
- [ ] Test strategy documentation complete
- [ ] Test case documentation updated
- [ ] Performance benchmark documentation
- [ ] Accessibility compliance documentation
- [ ] Cross-browser compatibility matrix

### User Documentation
- [ ] Component usage examples
- [ ] Integration guide for developers
- [ ] Troubleshooting guide
- [ ] Performance optimization tips
- [ ] Accessibility best practices

## Project Completion Criteria

The unified card component project will be considered complete when:

1. All quality gates pass consistently
2. Visual regression tests show no unexpected changes
3. Performance benchmarks are met or exceeded
4. Accessibility requirements are fully satisfied
5. Cross-browser compatibility is verified
6. User acceptance testing shows positive results
7. Documentation is complete and accurate
8. Migration from existing components is successful

This comprehensive testing and validation strategy ensures the unified card component meets the highest standards of quality, performance, and user experience across all contexts in the TCG Tactique application.