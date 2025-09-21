import { useState, useEffect, useMemo } from 'react';

export interface Dimensions {
  width: number;
  height: number;
}

export interface ResponsiveLayout {
  // Screen type
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Component dimensions
  headerHeight: number;
  handHeight: number;
  gameAreaHeight: number;

  // Grid dimensions
  gridSize: {
    width: number;
    height: number;
  };

  // Card dimensions
  cardSize: {
    width: number;
    height: number;
  };

  // Layout dimensions
  sidePanelWidth: number;
  middleZoneWidth: number;

  // Breakpoint info
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

export const useViewportSize = (): Dimensions => {
  const [viewport, setViewport] = useState<Dimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

export const useResponsiveLayout = (): ResponsiveLayout => {
  const viewport = useViewportSize();

  return useMemo(() => {
    const isMobile = viewport.width < 768;
    const isTablet = viewport.width >= 768 && viewport.width < 1024;
    const isDesktop = viewport.width >= 1024;

    // Base dimensions
    const headerHeight = isMobile ? 60 : 80;
    const handHeight = isMobile ? 120 : 160;
    const gameAreaHeight = viewport.height - headerHeight - handHeight;

    // Grid sizing based on available space
    const availableGridWidth = isMobile
      ? viewport.width - 40  // Less margin on mobile
      : viewport.width - 280; // Account for side panel

    const gridWidth = Math.min(
      isMobile ? 160 : isTablet ? 200 : 240,
      Math.floor(availableGridWidth / 3) // Ensure 2 grids + middle zone fit
    );

    const gridHeight = Math.min(
      isMobile ? 100 : isTablet ? 125 : 150,
      Math.floor(gameAreaHeight / 3) // Ensure grids fit vertically
    );

    // Card sizing
    const maxCardWidth = isMobile ? 80 : isTablet ? 100 : 120;
    const availableCardSpace = viewport.width / 6; // Assume 5 cards + info
    const cardWidth = Math.min(maxCardWidth, availableCardSpace - 10);
    const cardHeight = Math.floor(cardWidth * 1.4); // 1.4:1 aspect ratio

    return {
      // Screen type
      isMobile,
      isTablet,
      isDesktop,

      // Component dimensions
      headerHeight,
      handHeight,
      gameAreaHeight,

      // Grid dimensions
      gridSize: {
        width: gridWidth,
        height: gridHeight,
      },

      // Card dimensions
      cardSize: {
        width: cardWidth,
        height: cardHeight,
      },

      // Layout dimensions
      sidePanelWidth: isMobile ? 0 : isTablet ? 160 : 200,
      middleZoneWidth: isMobile ? 80 : 100,

      // Breakpoint info
      breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    };
  }, [viewport]);
};

// Hook for responsive grid calculations
export const useGridLayout = (faction: string) => {
  const layout = useResponsiveLayout();

  return useMemo(() => {
    const { gridSize } = layout;
    const cellWidth = gridSize.width / 5; // 5 columns
    const cellHeight = gridSize.height / 3; // 3 rows

    // Calculate formation positions based on faction
    const getFormationCells = (faction: string): boolean[][] => {
      const grid = Array(3).fill(null).map(() => Array(5).fill(false));

      switch (faction) {
        case 'humans': // 3×3 center formation
          for (let row = 0; row < 3; row++) {
            for (let col = 1; col <= 3; col++) {
              grid[row][col] = true;
            }
          }
          break;

        case 'aliens': // Adaptive spread
          // Top row: 3 center cells
          grid[0][1] = grid[0][2] = grid[0][3] = true;
          // Middle row: all 5 cells
          grid[1][0] = grid[1][1] = grid[1][2] = grid[1][3] = grid[1][4] = true;
          // Bottom row: 1 center cell
          grid[2][2] = true;
          break;

        case 'robots': // Full top row + center bottom
          // Top row: all 5 cells
          grid[0][0] = grid[0][1] = grid[0][2] = grid[0][3] = grid[0][4] = true;
          // Middle row: 1 center cell
          grid[1][2] = true;
          // Bottom row: 3 center cells
          grid[2][1] = grid[2][2] = grid[2][3] = true;
          break;

        default:
          // Default: 3×3 center
          for (let row = 0; row < 3; row++) {
            for (let col = 1; col <= 3; col++) {
              grid[row][col] = true;
            }
          }
      }

      return grid;
    };

    return {
      cellWidth,
      cellHeight,
      formationCells: getFormationCells(faction),
      totalWidth: gridSize.width,
      totalHeight: gridSize.height,
    };
  }, [layout, faction]);
};