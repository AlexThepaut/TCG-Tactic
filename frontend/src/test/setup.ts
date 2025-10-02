/**
 * Vitest Test Setup
 * Global test configuration and setup for all test files
 */
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock Touch API
global.Touch = class Touch {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;
  screenX: number;
  screenY: number;
  pageX: number;
  pageY: number;

  constructor(touchInit: TouchInit) {
    this.identifier = touchInit.identifier;
    this.target = touchInit.target;
    this.clientX = touchInit.clientX || 0;
    this.clientY = touchInit.clientY || 0;
    this.radiusX = touchInit.radiusX || 0;
    this.radiusY = touchInit.radiusY || 0;
    this.rotationAngle = touchInit.rotationAngle || 0;
    this.force = touchInit.force || 0;
    this.screenX = touchInit.screenX || 0;
    this.screenY = touchInit.screenY || 0;
    this.pageX = touchInit.pageX || 0;
    this.pageY = touchInit.pageY || 0;
  }
} as any;

interface TouchInit {
  identifier: number;
  target: EventTarget;
  clientX?: number;
  clientY?: number;
  radiusX?: number;
  radiusY?: number;
  rotationAngle?: number;
  force?: number;
  screenX?: number;
  screenY?: number;
  pageX?: number;
  pageY?: number;
}
