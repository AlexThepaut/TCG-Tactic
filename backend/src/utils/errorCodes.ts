/**
 * Standardized Error Codes for Task 1.3B
 * Comprehensive error code mapping and validation error handling
 */

/**
 * Placement error codes as specified in Task 1.3B requirements
 */
export const PLACEMENT_ERROR_CODES = {
  INVALID_POSITION: 'INVALID_POSITION',
  INSUFFICIENT_RESOURCES: 'INSUFFICIENT_RESOURCES',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  INVALID_CARD: 'INVALID_CARD',
  POSITION_OCCUPIED: 'POSITION_OCCUPIED'
} as const;

export type PlacementErrorCode = typeof PLACEMENT_ERROR_CODES[keyof typeof PLACEMENT_ERROR_CODES];

/**
 * Extended error codes for comprehensive error handling
 */
export const EXTENDED_ERROR_CODES = {
  // Placement errors (Task 1.3B required)
  ...PLACEMENT_ERROR_CODES,

  // Game state errors
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  GAME_ALREADY_ENDED: 'GAME_ALREADY_ENDED',
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',

  // Player errors
  PLAYER_NOT_IN_GAME: 'PLAYER_NOT_IN_GAME',
  PLAYER_NOT_READY: 'PLAYER_NOT_READY',

  // Formation errors (faction-specific)
  FORMATION_VIOLATION_HUMANS: 'FORMATION_VIOLATION_HUMANS',
  FORMATION_VIOLATION_ALIENS: 'FORMATION_VIOLATION_ALIENS',
  FORMATION_VIOLATION_ROBOTS: 'FORMATION_VIOLATION_ROBOTS',

  // Resource errors (detailed)
  RESOURCE_INSUFFICIENT_FOR_COST: 'RESOURCE_INSUFFICIENT_FOR_COST',
  RESOURCE_OVERFLOW: 'RESOURCE_OVERFLOW',
  RESOURCE_ALREADY_SPENT: 'RESOURCE_ALREADY_SPENT',

  // Card errors (detailed)
  CARD_NOT_IN_HAND: 'CARD_NOT_IN_HAND',
  CARD_NOT_FOUND: 'CARD_NOT_FOUND',
  CARD_INVALID_TYPE: 'CARD_INVALID_TYPE',
  CARD_SUMMONING_SICKNESS: 'CARD_SUMMONING_SICKNESS',

  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_TIMEOUT: 'VALIDATION_TIMEOUT',
  SOCKET_CONNECTION_ERROR: 'SOCKET_CONNECTION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

  // Performance errors
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

export type ExtendedErrorCode = typeof EXTENDED_ERROR_CODES[keyof typeof EXTENDED_ERROR_CODES];

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Detailed error information
 */
export interface DetailedError {
  code: ExtendedErrorCode;
  message: string;
  severity: ErrorSeverity;
  userMessage: string;
  suggestions?: string[];
  context?: any;
  timestamp: Date;
}

/**
 * Validation error mapping
 */
export interface ValidationErrorMapping {
  internalCode: string;
  publicCode: PlacementErrorCode;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  suggestions: string[];
}

/**
 * Error code mappings for validation failures
 */
export const VALIDATION_ERROR_MAPPINGS: Record<string, ValidationErrorMapping> = {
  // Formation validation errors
  'formation_violation_center': {
    internalCode: 'formation_violation_center',
    publicCode: PLACEMENT_ERROR_CODES.INVALID_POSITION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Position not allowed by faction formation rules',
    userMessage: 'This position is not available for your faction formation.',
    suggestions: ['Try placing in highlighted valid positions', 'Check your faction formation pattern']
  },

  'formation_violation_edge': {
    internalCode: 'formation_violation_edge',
    publicCode: PLACEMENT_ERROR_CODES.INVALID_POSITION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Edge position not allowed for this faction',
    userMessage: 'Your faction cannot place units at this edge position.',
    suggestions: ['Select a position within your faction formation', 'Review faction formation rules']
  },

  // Resource validation errors
  'insufficient_void_echoes': {
    internalCode: 'insufficient_void_echoes',
    publicCode: PLACEMENT_ERROR_CODES.INSUFFICIENT_RESOURCES,
    severity: ErrorSeverity.MEDIUM,
    message: 'Not enough Void Echoes to place this card',
    userMessage: 'You need more Void Echoes to place this card.',
    suggestions: ['Wait for next turn to gain more resources', 'Play a lower cost card instead']
  },

  'resource_overflow': {
    internalCode: 'resource_overflow',
    publicCode: PLACEMENT_ERROR_CODES.INSUFFICIENT_RESOURCES,
    severity: ErrorSeverity.LOW,
    message: 'Resource calculation would overflow maximum',
    userMessage: 'Cannot exceed maximum resource limit.',
    suggestions: ['Use resources before gaining more', 'Check resource management']
  },

  // Turn validation errors
  'not_current_player': {
    internalCode: 'not_current_player',
    publicCode: PLACEMENT_ERROR_CODES.NOT_YOUR_TURN,
    severity: ErrorSeverity.HIGH,
    message: 'Action attempted during opponent turn',
    userMessage: 'It is not your turn to play.',
    suggestions: ['Wait for your opponent to finish their turn', 'Check turn indicator']
  },

  'wrong_game_phase': {
    internalCode: 'wrong_game_phase',
    publicCode: PLACEMENT_ERROR_CODES.NOT_YOUR_TURN,
    severity: ErrorSeverity.MEDIUM,
    message: 'Action not allowed in current game phase',
    userMessage: 'You cannot place cards in this game phase.',
    suggestions: ['Wait for the action phase', 'Complete resource phase first']
  },

  // Position validation errors
  'position_occupied': {
    internalCode: 'position_occupied',
    publicCode: PLACEMENT_ERROR_CODES.POSITION_OCCUPIED,
    severity: ErrorSeverity.MEDIUM,
    message: 'Target position already contains a unit',
    userMessage: 'There is already a unit at this position.',
    suggestions: ['Select an empty position', 'Clear the position first if possible']
  },

  'position_out_of_bounds': {
    internalCode: 'position_out_of_bounds',
    publicCode: PLACEMENT_ERROR_CODES.INVALID_POSITION,
    severity: ErrorSeverity.HIGH,
    message: 'Position coordinates are outside valid grid',
    userMessage: 'This position is outside the game board.',
    suggestions: ['Select a position within the 3x5 grid', 'Check position coordinates']
  },

  // Card validation errors
  'card_not_in_hand': {
    internalCode: 'card_not_in_hand',
    publicCode: PLACEMENT_ERROR_CODES.INVALID_CARD,
    severity: ErrorSeverity.HIGH,
    message: 'Card is not in player hand',
    userMessage: 'You do not have this card in your hand.',
    suggestions: ['Select a card from your hand', 'Refresh your hand view']
  },

  'card_not_found': {
    internalCode: 'card_not_found',
    publicCode: PLACEMENT_ERROR_CODES.INVALID_CARD,
    severity: ErrorSeverity.HIGH,
    message: 'Card ID does not exist in active pool',
    userMessage: 'This card is not available.',
    suggestions: ['Select a valid card', 'Check for game updates']
  },

  'invalid_card_type': {
    internalCode: 'invalid_card_type',
    publicCode: PLACEMENT_ERROR_CODES.INVALID_CARD,
    severity: ErrorSeverity.MEDIUM,
    message: 'Card type cannot be placed on board',
    userMessage: 'This card type cannot be placed as a unit.',
    suggestions: ['Use placement for unit cards only', 'Cast spells using spell action']
  }
};

/**
 * Map internal validation code to public error code
 */
export function mapValidationErrorToCode(validationCode: string): PlacementErrorCode {
  const mapping = VALIDATION_ERROR_MAPPINGS[validationCode];
  if (mapping) {
    return mapping.publicCode;
  }

  // Default mapping based on validation code patterns
  if (validationCode.includes('formation')) {
    return PLACEMENT_ERROR_CODES.INVALID_POSITION;
  }
  if (validationCode.includes('resource') || validationCode.includes('cost')) {
    return PLACEMENT_ERROR_CODES.INSUFFICIENT_RESOURCES;
  }
  if (validationCode.includes('turn') || validationCode.includes('phase')) {
    return PLACEMENT_ERROR_CODES.NOT_YOUR_TURN;
  }
  if (validationCode.includes('card') || validationCode.includes('hand')) {
    return PLACEMENT_ERROR_CODES.INVALID_CARD;
  }
  if (validationCode.includes('position') || validationCode.includes('occupied')) {
    return PLACEMENT_ERROR_CODES.POSITION_OCCUPIED;
  }

  // Default fallback
  return PLACEMENT_ERROR_CODES.INVALID_POSITION;
}

/**
 * Create detailed error from validation code
 */
export function createDetailedError(
  validationCode: string,
  context?: any
): DetailedError {
  const mapping = VALIDATION_ERROR_MAPPINGS[validationCode];

  if (mapping) {
    return {
      code: mapping.publicCode as ExtendedErrorCode,
      message: mapping.message,
      severity: mapping.severity,
      userMessage: mapping.userMessage,
      suggestions: mapping.suggestions,
      context,
      timestamp: new Date()
    };
  }

  // Default error
  return {
    code: EXTENDED_ERROR_CODES.INVALID_POSITION,
    message: `Validation failed: ${validationCode}`,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'This action is not allowed.',
    suggestions: ['Try a different action', 'Check game rules'],
    context,
    timestamp: new Date()
  };
}

/**
 * Format error for client response
 */
export function formatErrorForClient(error: DetailedError): {
  success: false;
  error: string;
  errorCode: string;
  suggestions?: string[];
} {
  const result: { success: false; error: string; errorCode: string; suggestions?: string[] } = {
    success: false,
    error: error.userMessage,
    errorCode: error.code
  };

  if (error.suggestions && error.suggestions.length > 0) {
    result.suggestions = error.suggestions;
  }

  return result;
}

/**
 * Check if error code requires immediate attention
 */
export function isHighPriorityError(code: ExtendedErrorCode): boolean {
  const highPriorityErrors: ExtendedErrorCode[] = [
    EXTENDED_ERROR_CODES.DATABASE_ERROR,
    EXTENDED_ERROR_CODES.INTERNAL_SERVER_ERROR,
    EXTENDED_ERROR_CODES.SOCKET_CONNECTION_ERROR,
    EXTENDED_ERROR_CODES.OPERATION_TIMEOUT
  ];

  return highPriorityErrors.includes(code);
}

/**
 * Get error severity level
 */
export function getErrorSeverity(code: ExtendedErrorCode): ErrorSeverity {
  // System errors are always critical
  if (code.includes('DATABASE') || code.includes('INTERNAL') || code.includes('TIMEOUT')) {
    return ErrorSeverity.CRITICAL;
  }

  // Security-related errors are high priority
  if (code.includes('NOT_YOUR_TURN') || code === 'PLAYER_NOT_IN_GAME') {
    return ErrorSeverity.HIGH;
  }

  // Validation errors are medium priority
  if (Object.values(PLACEMENT_ERROR_CODES).includes(code as PlacementErrorCode)) {
    return ErrorSeverity.MEDIUM;
  }

  return ErrorSeverity.LOW;
}