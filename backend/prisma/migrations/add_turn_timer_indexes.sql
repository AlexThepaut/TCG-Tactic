-- Task 1.3F Turn Management System - Performance Indexes
-- Optimizes turn management queries for sub-100ms performance

-- Add turn timer columns if not present
ALTER TABLE games ADD COLUMN IF NOT EXISTS turn_time_limit INTEGER DEFAULT 300; -- 5 minutes default
ALTER TABLE games ADD COLUMN IF NOT EXISTS turn_deadline TIMESTAMP;

-- Performance indexes for turn management queries
CREATE INDEX IF NOT EXISTS idx_games_current_player
  ON games(current_player, status)
  WHERE status IN ('active', 'starting');

CREATE INDEX IF NOT EXISTS idx_game_actions_game_turn
  ON game_actions(game_id, turn, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_games_status_updated
  ON games(status, updated_at DESC)
  WHERE status IN ('active', 'waiting', 'starting');

-- Index for turn timer deadline queries
CREATE INDEX IF NOT EXISTS idx_games_turn_deadline
  ON games(turn_deadline)
  WHERE status = 'active' AND turn_deadline IS NOT NULL;

-- Composite index for game state queries
CREATE INDEX IF NOT EXISTS idx_games_status_player
  ON games(status, player1_id, player2_id)
  WHERE status IN ('active', 'waiting');

COMMENT ON INDEX idx_games_current_player IS 'Task 1.3F: Optimizes current player turn queries';
COMMENT ON INDEX idx_game_actions_game_turn IS 'Task 1.3F: Optimizes turn action history queries';
COMMENT ON INDEX idx_games_status_updated IS 'Task 1.3F: Optimizes active game lookups';
COMMENT ON INDEX idx_games_turn_deadline IS 'Task 1.3F: Optimizes turn timeout monitoring';
COMMENT ON INDEX idx_games_status_player IS 'Task 1.3F: Optimizes player game state queries';
