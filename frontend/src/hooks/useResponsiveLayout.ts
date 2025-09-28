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

  // Responsive grid container dimensions
  gridContainer: {
    // For 3x5 layout (normal)
    normal: {
      width: number;
      height: number;
      cellSize: number;
    };
    // For 5x3 layout (face-to-face)
    faceToFace: {
      width: number;
      height: number;
      cellSize: number;
    };
  };

  // Card dimensions
  cardSize: {
    width: number;
    height: number;
  };

  // Layout dimensions
  sidePanelWidth: number;
  middleZoneWidth: number;

  // Available space calculations
  availableGameSpace: {
    width: number;
    height: number;
  };

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

    // Layout dimensions - be more aggressive with space usage
    // PlayerPanel: w-52 (208px) + p-3 container (12px) = 220px total per panel
    const sidePanelActualWidth = isMobile ? 0 : 220; // Simplified for both tablet and desktop
    const mainContainerPadding = 32; // p-4 on main game area (16px per side)
    const separatorWidth = isMobile ? 16 : isTablet ? 32 : 64; // mx-4 md:mx-8
    const gridGap = isMobile ? 4 : 8; // gap-1 md:gap-2

    // Calculate available space for game area - be more generous
    const totalSidePanelWidth = isMobile ? 0 : sidePanelActualWidth * 2; // Both sides
    const totalHorizontalOverhead = totalSidePanelWidth + mainContainerPadding + separatorWidth;
    const availableGameWidth = viewport.width - totalHorizontalOverhead;
    const availableGameHeight = gameAreaHeight - 32; // Reduced overhead

    // Available space for two grids - maximize usage
    const availableGridSpace = availableGameWidth;
    const maxSingleGridWidth = Math.floor(availableGridSpace / 2);

    // Calculate optimal grid dimensions maintaining aspect ratios
    // Face-to-face: 3x5 aspect ratio (3 wide, 5 tall)
    // Normal: 5x3 aspect ratio (5 wide, 3 tall)

    // For face-to-face layout (3 columns, 5 rows) - aspect ratio 3:5
    const faceToFaceAspectRatio = 3 / 5; // 0.6
    const maxFaceToFaceHeight = availableGameHeight;
    const maxFaceToFaceWidth = maxSingleGridWidth;

    // Calculate face-to-face dimensions - maximize grid size
    const targetWidthUtilization = 0.98; // Increase width utilization to 98%
    const targetHeightUtilization = isMobile ? 0.85 : 0.8; // Increase height utilization to 80-85%
    const targetWidth = maxFaceToFaceWidth * targetWidthUtilization;
    const targetHeight = maxFaceToFaceHeight * targetHeightUtilization;

    // Increase maximum height constraints for bigger grids
    const maxGridHeight = isMobile ? 350 : isTablet ? 420 : 480; // Increased maximum grid heights
    const constrainedTargetHeight = Math.min(targetHeight, maxGridHeight);

    // Try both width-constrained and height-constrained approaches, use the larger one
    const widthConstrainedWidth = targetWidth;
    const widthConstrainedHeight = widthConstrainedWidth / faceToFaceAspectRatio;

    const heightConstrainedHeight = constrainedTargetHeight; // Use constrained height
    const heightConstrainedWidth = heightConstrainedHeight * faceToFaceAspectRatio;

    // Choose the approach that gives us the larger grid (while still fitting)
    let faceToFaceWidth, faceToFaceHeight;
    if (widthConstrainedHeight <= maxFaceToFaceHeight && heightConstrainedWidth <= maxFaceToFaceWidth) {
      // Both fit, choose the one that gives larger area
      const widthConstrainedArea = widthConstrainedWidth * widthConstrainedHeight;
      const heightConstrainedArea = heightConstrainedWidth * heightConstrainedHeight;

      if (widthConstrainedArea >= heightConstrainedArea) {
        faceToFaceWidth = widthConstrainedWidth;
        faceToFaceHeight = widthConstrainedHeight;
      } else {
        faceToFaceWidth = heightConstrainedWidth;
        faceToFaceHeight = heightConstrainedHeight;
      }
    } else if (widthConstrainedHeight <= maxFaceToFaceHeight) {
      // Only width-constrained fits
      faceToFaceWidth = widthConstrainedWidth;
      faceToFaceHeight = widthConstrainedHeight;
    } else {
      // Only height-constrained fits (or neither, fallback to height)
      faceToFaceWidth = heightConstrainedWidth;
      faceToFaceHeight = heightConstrainedHeight;
    }

    // Reduced minimum size constraints for bigger grids
    const minGridSize = isMobile ? 120 : 150; // Even smaller minimums to allow bigger grids
    const minWidth = minGridSize * faceToFaceAspectRatio;
    if (faceToFaceWidth < minWidth) {
      faceToFaceWidth = minWidth;
      faceToFaceHeight = minGridSize;
    }

    // Calculate cell size for face-to-face (divide by smaller dimension for square cells)
    const faceToFaceCellSize = Math.floor((faceToFaceWidth - gridGap * 2) / 3); // 3 columns, account for gaps

    // For normal layout (5 columns, 3 rows) - aspect ratio 5:3
    const normalAspectRatio = 5 / 3; // 1.67
    const maxNormalHeight = availableGameHeight;
    const maxNormalWidth = maxSingleGridWidth;

    // Calculate normal dimensions - use same height constraints
    const targetNormalWidth = maxNormalWidth * targetWidthUtilization;
    const targetNormalHeight = maxNormalHeight * targetHeightUtilization;
    const constrainedTargetNormalHeight = Math.min(targetNormalHeight, maxGridHeight);

    // Try both approaches for normal layout too
    const normalWidthConstrainedWidth = targetNormalWidth;
    const normalWidthConstrainedHeight = normalWidthConstrainedWidth / normalAspectRatio;

    const normalHeightConstrainedHeight = constrainedTargetNormalHeight; // Use constrained height
    const normalHeightConstrainedWidth = normalHeightConstrainedHeight * normalAspectRatio;

    // Choose the larger grid for normal layout
    let normalWidth, normalHeight;
    if (normalWidthConstrainedHeight <= maxNormalHeight && normalHeightConstrainedWidth <= maxNormalWidth) {
      const normalWidthConstrainedArea = normalWidthConstrainedWidth * normalWidthConstrainedHeight;
      const normalHeightConstrainedArea = normalHeightConstrainedWidth * normalHeightConstrainedHeight;

      if (normalWidthConstrainedArea >= normalHeightConstrainedArea) {
        normalWidth = normalWidthConstrainedWidth;
        normalHeight = normalWidthConstrainedHeight;
      } else {
        normalWidth = normalHeightConstrainedWidth;
        normalHeight = normalHeightConstrainedHeight;
      }
    } else if (normalWidthConstrainedHeight <= maxNormalHeight) {
      normalWidth = normalWidthConstrainedWidth;
      normalHeight = normalWidthConstrainedHeight;
    } else {
      normalWidth = normalHeightConstrainedWidth;
      normalHeight = normalHeightConstrainedHeight;
    }

    // Apply same reduced minimum size constraints
    const minNormalWidth = minGridSize * normalAspectRatio;
    if (normalWidth < minNormalWidth) {
      normalWidth = minNormalWidth;
      normalHeight = minGridSize;
    }

    // Calculate cell size for normal (divide by smaller dimension for square cells)
    const normalCellSize = Math.floor((normalHeight - gridGap * 4) / 3); // 3 rows, account for gaps

    // Legacy grid dimensions (for backward compatibility)
    const gridWidth = Math.min(
      isMobile ? 160 : isTablet ? 200 : 240,
      Math.floor(availableGridSpace / 3) // Ensure 2 grids + middle zone fit
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

      // Legacy grid dimensions (for backward compatibility)
      gridSize: {
        width: gridWidth,
        height: gridHeight,
      },

      // Responsive grid container dimensions
      gridContainer: {
        normal: {
          width: Math.floor(normalWidth),
          height: Math.floor(normalHeight),
          cellSize: normalCellSize,
        },
        faceToFace: {
          width: Math.floor(faceToFaceWidth),
          height: Math.floor(faceToFaceHeight),
          cellSize: faceToFaceCellSize,
        },
      },

      // Card dimensions
      cardSize: {
        width: cardWidth,
        height: cardHeight,
      },

      // Layout dimensions (accurate measurements)
      sidePanelWidth: sidePanelActualWidth,
      middleZoneWidth: separatorWidth,

      // Available space calculations
      availableGameSpace: {
        width: availableGameWidth,
        height: availableGameHeight,
      },

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
              grid[row]![col] = true;
            }
          }
          break;

        case 'aliens': // Adaptive spread
          // Top row: 3 center cells
          grid[0]![1] = grid[0]![2] = grid[0]![3] = true;
          // Middle row: all 5 cells
          grid[1]![0] = grid[1]![1] = grid[1]![2] = grid[1]![3] = grid[1]![4] = true;
          // Bottom row: 1 center cell
          grid[2]![2] = true;
          break;

        case 'robots': // Full top row + center bottom
          // Top row: all 5 cells
          grid[0]![0] = grid[0]![1] = grid[0]![2] = grid[0]![3] = grid[0]![4] = true;
          // Middle row: 1 center cell
          grid[1]![2] = true;
          // Bottom row: 3 center cells
          grid[2]![1] = grid[2]![2] = grid[2]![3] = true;
          break;

        default:
          // Default: 3×3 center
          for (let row = 0; row < 3; row++) {
            for (let col = 1; col <= 3; col++) {
              grid[row]![col] = true;
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