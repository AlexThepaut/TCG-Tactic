-- Migration for Task 1.3B Performance Optimizations
-- Target: <100ms database operations for game state and action operations

-- ========================================
-- Game State Performance Indexes
-- ========================================

-- Primary index for active game lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_game_states_game_current_player
ON game_states (game_id, current_player);

-- Optimistic locking index for version control
CREATE INDEX IF NOT EXISTS idx_game_states_id_updated
ON game_states (id, updated_at);

-- Player-specific game lookups
CREATE INDEX IF NOT EXISTS idx_game_states_player1_phase
ON game_states (player1_id, phase);

CREATE INDEX IF NOT EXISTS idx_game_states_player2_phase
ON game_states (player2_id, phase);

-- Turn and phase combination for placement validation
CREATE INDEX IF NOT EXISTS idx_game_states_turn_phase
ON game_states (turn, phase);

-- ========================================
-- Game Action Performance Indexes
-- ========================================

-- Recent actions by game (most common audit query)
CREATE INDEX IF NOT EXISTS idx_game_actions_game_timestamp
ON game_actions (game_id, timestamp);

-- Player action statistics
CREATE INDEX IF NOT EXISTS idx_game_actions_player_action_type
ON game_actions (player_id, action_type);

-- Performance monitoring index
CREATE INDEX IF NOT EXISTS idx_game_actions_valid_timestamp
ON game_actions (is_valid, timestamp);

-- Error analysis index
CREATE INDEX IF NOT EXISTS idx_game_actions_invalid_actions
ON game_actions (action_type, is_valid) WHERE is_valid = false;

-- ========================================
-- Placement Validation Indexes
-- ========================================

-- Game state lookups for placement validation
CREATE INDEX IF NOT EXISTS idx_game_states_placement_validation
ON game_states (game_id, turn, phase);

-- Resource validation index
CREATE INDEX IF NOT EXISTS idx_game_actions_resource_cost
ON game_actions (resource_cost, timestamp);

-- ========================================
-- Performance Threshold Monitoring
-- ========================================

-- Index for identifying slow operations
CREATE INDEX IF NOT EXISTS idx_game_actions_performance_monitoring
ON game_actions (timestamp, action_type, is_valid);