/**
 * Touch Interaction Utilities
 * Enhanced touch handling for mobile TCG gameplay
 */

export interface TouchPoint {
  x: number;
  y: number;
}

export interface TouchGesture {
  type: 'tap' | 'longPress' | 'swipe' | 'pinch' | 'drag';
  startPoint: TouchPoint;
  endPoint?: TouchPoint;
  duration: number;
  distance?: number;
  scale?: number;
}

export interface TouchInteractionOptions {
  tapThreshold: number; // Maximum time for tap (ms)
  longPressThreshold: number; // Minimum time for long press (ms)
  swipeThreshold: number; // Minimum distance for swipe (px)
  dragThreshold: number; // Minimum distance to start drag (px)
  preventScroll: boolean; // Prevent default scroll behavior
}

const defaultOptions: TouchInteractionOptions = {
  tapThreshold: 300,
  longPressThreshold: 500,
  swipeThreshold: 50,
  dragThreshold: 10,
  preventScroll: true,
};

export class TouchInteractionManager {
  private startTime: number = 0;
  private startPoint: TouchPoint = { x: 0, y: 0 };
  private currentPoint: TouchPoint = { x: 0, y: 0 };
  private longPressTimer: NodeJS.Timeout | null = null;
  private isDragging: boolean = false;
  private isLongPressing: boolean = false;
  private options: TouchInteractionOptions;

  // Callbacks
  public onTap?: (point: TouchPoint, event: TouchEvent) => void;
  public onLongPress?: (point: TouchPoint, event: TouchEvent) => void;
  public onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number, event: TouchEvent) => void;
  public onDragStart?: (point: TouchPoint, event: TouchEvent) => void;
  public onDragMove?: (point: TouchPoint, event: TouchEvent) => void;
  public onDragEnd?: (point: TouchPoint, event: TouchEvent) => void;
  public onPinch?: (scale: number, event: TouchEvent) => void;

  constructor(options: Partial<TouchInteractionOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  handleTouchStart = (event: TouchEvent) => {
    if (this.options.preventScroll) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    if (!touch) return;

    this.startTime = Date.now();
    this.startPoint = { x: touch.clientX, y: touch.clientY };
    this.currentPoint = { x: touch.clientX, y: touch.clientY };
    this.isDragging = false;
    this.isLongPressing = false;

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      if (!this.isDragging) {
        this.isLongPressing = true;
        this.onLongPress?.(this.startPoint, event);
      }
    }, this.options.longPressThreshold);
  };

  handleTouchMove = (event: TouchEvent) => {
    if (this.options.preventScroll) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    if (!touch) return;

    this.currentPoint = { x: touch.clientX, y: touch.clientY };

    const distance = this.getDistance(this.startPoint, this.currentPoint);

    // Check if we should start dragging
    if (!this.isDragging && distance > this.options.dragThreshold) {
      this.isDragging = true;
      this.clearLongPressTimer();
      this.onDragStart?.(this.startPoint, event);
    }

    // Continue dragging
    if (this.isDragging) {
      this.onDragMove?.(this.currentPoint, event);
    }

    // Handle pinch gestures for multi-touch
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      if (!touch1 || !touch2) return;

      const distance = this.getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );
      // You can implement pinch-to-zoom logic here if needed
    }
  };

  handleTouchEnd = (event: TouchEvent) => {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const distance = this.getDistance(this.startPoint, this.currentPoint);

    this.clearLongPressTimer();

    // Handle different gesture types
    if (this.isDragging) {
      this.onDragEnd?.(this.currentPoint, event);
    } else if (this.isLongPressing) {
      // Long press already handled
    } else if (duration < this.options.tapThreshold && distance < this.options.dragThreshold) {
      // Simple tap
      this.onTap?.(this.startPoint, event);
    } else if (distance > this.options.swipeThreshold) {
      // Swipe gesture
      const direction = this.getSwipeDirection(this.startPoint, this.currentPoint);
      this.onSwipe?.(direction, distance, event);
    }

    // Reset state
    this.isDragging = false;
    this.isLongPressing = false;
  };

  private clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private getDistance(point1: TouchPoint, point2: TouchPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getSwipeDirection(start: TouchPoint, end: TouchPoint): 'up' | 'down' | 'left' | 'right' {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  // Cleanup method
  destroy() {
    this.clearLongPressTimer();
  }
}

/**
 * Hook for using touch interactions in React components
 */
export const useTouchInteractions = (
  options: Partial<TouchInteractionOptions> = {}
) => {
  const manager = new TouchInteractionManager(options);

  return {
    touchHandlers: {
      onTouchStart: manager.handleTouchStart,
      onTouchMove: manager.handleTouchMove,
      onTouchEnd: manager.handleTouchEnd,
    },
    setCallbacks: (callbacks: {
      onTap?: (point: TouchPoint, event: TouchEvent) => void;
      onLongPress?: (point: TouchPoint, event: TouchEvent) => void;
      onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number, event: TouchEvent) => void;
      onDragStart?: (point: TouchPoint, event: TouchEvent) => void;
      onDragMove?: (point: TouchPoint, event: TouchEvent) => void;
      onDragEnd?: (point: TouchPoint, event: TouchEvent) => void;
      onPinch?: (scale: number, event: TouchEvent) => void;
    }) => {
      Object.assign(manager, callbacks);
    },
    cleanup: () => manager.destroy(),
  };
};

/**
 * Mobile-specific optimizations for game components
 */
export const mobileOptimizations = {
  // Viewport meta tag settings for game
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',

  // CSS classes for touch-friendly interactions
  touchTarget: 'min-h-[44px] min-w-[44px]', // 44px minimum touch target
  touchArea: 'touch-manipulation', // Optimized touch handling
  noSelect: 'select-none', // Prevent text selection
  noCallout: '[&]:[-webkit-touch-callout-none]', // Prevent iOS callouts

  // Haptic feedback (if supported)
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  },

  // Check if device supports touch
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Prevent zoom on double-tap
  preventDoubleClickZoom: (element: HTMLElement) => {
    let lastTap = 0;
    element.addEventListener('touchstart', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 500 && tapLength > 0) {
        e.preventDefault();
      }
      lastTap = currentTime;
    });
  },

  // Safe area insets for notched devices
  safeAreaInsets: {
    top: 'env(safe-area-inset-top)',
    right: 'env(safe-area-inset-right)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
  },
};

/**
 * Card interaction helpers for mobile
 */
export const cardTouchHelpers = {
  // Handle card selection with visual feedback
  handleCardTouch: (
    cardElement: HTMLElement,
    onSelect: () => void,
    onLongPress?: () => void
  ) => {
    const manager = new TouchInteractionManager({
      preventScroll: true,
      tapThreshold: 250,
      longPressThreshold: 500,
    });

    manager.onTap = () => {
      cardElement.classList.add('scale-95');
      setTimeout(() => {
        cardElement.classList.remove('scale-95');
        onSelect();
      }, 100);
      mobileOptimizations.hapticFeedback('light');
    };

    manager.onLongPress = () => {
      cardElement.classList.add('ring-2', 'ring-yellow-400');
      onLongPress?.();
      mobileOptimizations.hapticFeedback('medium');
    };

    return {
      onTouchStart: manager.handleTouchStart,
      onTouchMove: manager.handleTouchMove,
      onTouchEnd: manager.handleTouchEnd,
    };
  },

  // Grid cell touch handling
  handleGridCellTouch: (
    cellElement: HTMLElement,
    onTap: () => void,
    isPlayable: boolean = true
  ) => {
    if (!isPlayable) return {};

    const manager = new TouchInteractionManager({
      preventScroll: true,
      tapThreshold: 300,
    });

    manager.onTap = () => {
      cellElement.classList.add('bg-yellow-400/20');
      setTimeout(() => {
        cellElement.classList.remove('bg-yellow-400/20');
        onTap();
      }, 150);
      mobileOptimizations.hapticFeedback('light');
    };

    return {
      onTouchStart: manager.handleTouchStart,
      onTouchMove: manager.handleTouchMove,
      onTouchEnd: manager.handleTouchEnd,
    };
  },
};

/**
 * Performance optimizations for mobile devices
 */
export const mobilePerformance = {
  // Debounced touch events to prevent excessive calls
  debounceTouch: <T extends (...args: any[]) => any>(
    func: T,
    delay: number = 16
  ): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    }) as T;
  },

  // Throttled scroll events
  throttleScroll: <T extends (...args: any[]) => any>(
    func: T,
    delay: number = 16
  ): T => {
    let lastCall = 0;
    return ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(null, args);
      }
    }) as T;
  },

  // Reduce motion for accessibility
  respectsReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Battery optimization
  isLowBattery: () => {
    if ('getBattery' in navigator) {
      return (navigator as any).getBattery().then((battery: any) => {
        return battery.level < 0.2; // Less than 20%
      });
    }
    return Promise.resolve(false);
  },
};