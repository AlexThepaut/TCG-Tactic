-- TCG Tactique Database Schema
-- PostgreSQL 14+ with JSONB support
-- Optimized for real-time gameplay and card rotation system

-- Enable UUID extension for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- CORE TABLES
-- ================================================================

-- Users table for authentication and profile management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT users_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Active cards pool (240-360 cards in rotation)
-- Optimized for frequent queries during deck building
CREATE TABLE active_cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faction VARCHAR(20) NOT NULL CHECK (faction IN ('humans', 'aliens', 'robots')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('unit', 'spell')),
    cost INTEGER NOT NULL CHECK (cost BETWEEN 1 AND 10),
    attack INTEGER CHECK (attack >= 0 AND attack <= 50), -- NULL for spells
    hp INTEGER CHECK (hp >= 1 AND hp <= 100), -- NULL for spells
    range VARCHAR(10), -- e.g., "1-2", "3", "1-5" for units
    effects TEXT[] NOT NULL DEFAULT '{}', -- Array of effect keywords
    set_id VARCHAR(20) NOT NULL, -- Rotation set identifier
    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraints for card validity
    CONSTRAINT unit_has_stats CHECK (
        (type = 'spell') OR
        (type = 'unit' AND attack IS NOT NULL AND hp IS NOT NULL)
    ),
    CONSTRAINT spell_no_combat_stats CHECK (
        (type = 'unit') OR
        (type = 'spell' AND attack IS NULL AND hp IS NULL AND range IS NULL)
    )
);

-- User decks (exactly 40 cards per deck)
CREATE TABLE decks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    faction VARCHAR(20) NOT NULL CHECK (faction IN ('humans', 'aliens', 'robots')),
    is_valid BOOLEAN DEFAULT false, -- True when exactly 40 cards
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT deck_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Cards in decks (max 4 per card, exactly 40 total)
CREATE TABLE deck_cards (
    deck_id INTEGER REFERENCES decks(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES active_cards(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 4),

    PRIMARY KEY (deck_id, card_id)
);

-- Game sessions with comprehensive tracking
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    player1_id INTEGER NOT NULL REFERENCES users(id),
    player2_id INTEGER NOT NULL REFERENCES users(id),
    player1_deck_id INTEGER NOT NULL REFERENCES decks(id),
    player2_deck_id INTEGER NOT NULL REFERENCES decks(id),
    winner_id INTEGER REFERENCES users(id),
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    end_reason VARCHAR(50) CHECK (end_reason IN ('quest_completed', 'surrender', 'deck_empty', 'timeout')),
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,

    -- Constraints
    CONSTRAINT different_players CHECK (player1_id != player2_id),
    CONSTRAINT winner_is_player CHECK (
        winner_id IS NULL OR
        winner_id = player1_id OR
        winner_id = player2_id
    ),
    CONSTRAINT ended_game_has_reason CHECK (
        (ended_at IS NULL AND end_reason IS NULL) OR
        (ended_at IS NOT NULL AND end_reason IS NOT NULL)
    )
);

-- Game state snapshots for real-time synchronization
-- Uses JSONB for efficient board state storage and querying
CREATE TABLE game_states (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player1_id INTEGER NOT NULL REFERENCES users(id),
    player2_id INTEGER NOT NULL REFERENCES users(id),
    current_player INTEGER NOT NULL REFERENCES users(id),
    turn INTEGER DEFAULT 1 CHECK (turn > 0),
    phase VARCHAR(20) DEFAULT 'resources' CHECK (phase IN ('resources', 'draw', 'actions')),
    board_state_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT current_player_valid CHECK (
        current_player = player1_id OR current_player = player2_id
    )
);

-- User statistics for performance tracking and matchmaking
CREATE TABLE user_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0 CHECK (total_games >= 0),
    total_wins INTEGER DEFAULT 0 CHECK (total_wins >= 0),
    humans_games INTEGER DEFAULT 0 CHECK (humans_games >= 0),
    humans_wins INTEGER DEFAULT 0 CHECK (humans_wins >= 0),
    aliens_games INTEGER DEFAULT 0 CHECK (aliens_games >= 0),
    aliens_wins INTEGER DEFAULT 0 CHECK (aliens_wins >= 0),
    robots_games INTEGER DEFAULT 0 CHECK (robots_games >= 0),
    robots_wins INTEGER DEFAULT 0 CHECK (robots_wins >= 0),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Logical constraints
    CONSTRAINT wins_not_exceed_games CHECK (total_wins <= total_games),
    CONSTRAINT faction_wins_valid CHECK (
        humans_wins <= humans_games AND
        aliens_wins <= aliens_games AND
        robots_wins <= robots_games
    ),
    CONSTRAINT stats_sum_valid CHECK (
        total_games = humans_games + aliens_games + robots_games AND
        total_wins = humans_wins + aliens_wins + robots_wins
    )
);

-- ================================================================
-- BUSINESS CONSTRAINT FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to validate deck size (exactly 40 cards)
CREATE OR REPLACE FUNCTION validate_deck_size()
RETURNS TRIGGER AS $$
DECLARE
    total_cards INTEGER;
BEGIN
    -- Calculate total cards in deck
    SELECT COALESCE(SUM(quantity), 0) INTO total_cards
    FROM deck_cards
    WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id);

    -- Check if deck exceeds 40 cards
    IF total_cards > 40 THEN
        RAISE EXCEPTION 'Deck cannot have more than 40 cards (currently has %)', total_cards;
    END IF;

    -- Update deck validity
    UPDATE decks
    SET is_valid = (total_cards = 40),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to validate faction consistency in decks
CREATE OR REPLACE FUNCTION validate_deck_faction()
RETURNS TRIGGER AS $$
DECLARE
    deck_faction VARCHAR(20);
    card_faction VARCHAR(20);
BEGIN
    -- Get deck faction
    SELECT faction INTO deck_faction
    FROM decks
    WHERE id = NEW.deck_id;

    -- Get card faction
    SELECT faction INTO card_faction
    FROM active_cards
    WHERE id = NEW.card_id;

    -- Check faction match
    IF deck_faction != card_faction THEN
        RAISE EXCEPTION 'Card faction (%) does not match deck faction (%)', card_faction, deck_faction;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user statistics after game completion
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update stats when game ends
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        -- Update player 1 stats
        INSERT INTO user_stats (user_id) VALUES (NEW.player1_id)
        ON CONFLICT (user_id) DO NOTHING;

        -- Update player 2 stats
        INSERT INTO user_stats (user_id) VALUES (NEW.player2_id)
        ON CONFLICT (user_id) DO NOTHING;

        -- Get deck factions for faction-specific stats
        DECLARE
            p1_faction VARCHAR(20);
            p2_faction VARCHAR(20);
        BEGIN
            SELECT d.faction INTO p1_faction FROM decks d WHERE d.id = NEW.player1_deck_id;
            SELECT d.faction INTO p2_faction FROM decks d WHERE d.id = NEW.player2_deck_id;

            -- Update player 1 stats
            UPDATE user_stats SET
                total_games = total_games + 1,
                total_wins = total_wins + CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
                humans_games = humans_games + CASE WHEN p1_faction = 'humans' THEN 1 ELSE 0 END,
                humans_wins = humans_wins + CASE WHEN p1_faction = 'humans' AND NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
                aliens_games = aliens_games + CASE WHEN p1_faction = 'aliens' THEN 1 ELSE 0 END,
                aliens_wins = aliens_wins + CASE WHEN p1_faction = 'aliens' AND NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
                robots_games = robots_games + CASE WHEN p1_faction = 'robots' THEN 1 ELSE 0 END,
                robots_wins = robots_wins + CASE WHEN p1_faction = 'robots' AND NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END,
                updated_at = NOW()
            WHERE user_id = NEW.player1_id;

            -- Update player 2 stats
            UPDATE user_stats SET
                total_games = total_games + 1,
                total_wins = total_wins + CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
                humans_games = humans_games + CASE WHEN p2_faction = 'humans' THEN 1 ELSE 0 END,
                humans_wins = humans_wins + CASE WHEN p2_faction = 'humans' AND NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
                aliens_games = aliens_games + CASE WHEN p2_faction = 'aliens' THEN 1 ELSE 0 END,
                aliens_wins = aliens_wins + CASE WHEN p2_faction = 'aliens' AND NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
                robots_games = robots_games + CASE WHEN p2_faction = 'robots' THEN 1 ELSE 0 END,
                robots_wins = robots_wins + CASE WHEN p2_faction = 'robots' AND NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END,
                updated_at = NOW()
            WHERE user_id = NEW.player2_id;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Deck size validation trigger
CREATE TRIGGER deck_size_check
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW EXECUTE FUNCTION validate_deck_size();

-- Deck faction consistency trigger
CREATE TRIGGER deck_faction_check
    BEFORE INSERT OR UPDATE ON deck_cards
    FOR EACH ROW EXECUTE FUNCTION validate_deck_faction();

-- User statistics update trigger
CREATE TRIGGER update_stats_trigger
    AFTER UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Updated timestamp trigger for users
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decks_timestamp
    BEFORE UPDATE ON decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- PERFORMANCE INDEXES
-- ================================================================

-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Active cards indexes (heavily queried for deck building)
CREATE INDEX idx_active_cards_faction ON active_cards(faction);
CREATE INDEX idx_active_cards_type ON active_cards(type);
CREATE INDEX idx_active_cards_cost ON active_cards(cost);
CREATE INDEX idx_active_cards_set_id ON active_cards(set_id);
CREATE INDEX idx_active_cards_faction_type ON active_cards(faction, type);
CREATE INDEX idx_active_cards_faction_cost ON active_cards(faction, cost);
CREATE INDEX idx_active_cards_name_search ON active_cards USING gin(to_tsvector('english', name));

-- Decks table indexes
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_decks_faction ON decks(faction);
CREATE INDEX idx_decks_valid ON decks(is_valid);
CREATE INDEX idx_decks_user_faction ON decks(user_id, faction);

-- Deck cards indexes
CREATE INDEX idx_deck_cards_card_id ON deck_cards(card_id);

-- Games table indexes (for matchmaking and history)
CREATE INDEX idx_games_players ON games(player1_id, player2_id);
CREATE INDEX idx_games_player1 ON games(player1_id);
CREATE INDEX idx_games_player2 ON games(player2_id);
CREATE INDEX idx_games_winner ON games(winner_id);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_games_ended_at ON games(ended_at);
CREATE INDEX idx_games_duration ON games(duration_seconds);

-- Game states indexes (for real-time queries)
CREATE INDEX idx_game_states_game_id ON game_states(game_id);
CREATE INDEX idx_game_states_current_player ON game_states(current_player);
CREATE INDEX idx_game_states_created_at ON game_states(created_at);

-- User stats indexes
CREATE INDEX idx_user_stats_total_games ON user_stats(total_games);
CREATE INDEX idx_user_stats_total_wins ON user_stats(total_wins);

-- JSONB indexes for game state queries
CREATE INDEX idx_game_states_board_state ON game_states USING gin(board_state_json);

-- ================================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================================

-- View for deck cards with card details
CREATE VIEW deck_cards_with_details AS
SELECT
    dc.deck_id,
    dc.card_id,
    dc.quantity,
    ac.name,
    ac.faction,
    ac.type,
    ac.cost,
    ac.attack,
    ac.hp,
    ac.range,
    ac.effects,
    ac.set_id
FROM deck_cards dc
JOIN active_cards ac ON dc.card_id = ac.id;

-- View for complete deck information
CREATE VIEW decks_with_stats AS
SELECT
    d.*,
    COALESCE(SUM(dc.quantity), 0) as total_cards,
    COUNT(dc.card_id) as unique_cards,
    AVG(ac.cost) as avg_cost
FROM decks d
LEFT JOIN deck_cards dc ON d.id = dc.deck_id
LEFT JOIN active_cards ac ON dc.card_id = ac.id
GROUP BY d.id, d.user_id, d.name, d.faction, d.is_valid, d.created_at, d.updated_at;

-- View for user statistics with win rates
CREATE VIEW user_stats_with_rates AS
SELECT
    us.*,
    CASE WHEN us.total_games > 0 THEN ROUND((us.total_wins::decimal / us.total_games) * 100, 2) ELSE 0 END as total_win_rate,
    CASE WHEN us.humans_games > 0 THEN ROUND((us.humans_wins::decimal / us.humans_games) * 100, 2) ELSE 0 END as humans_win_rate,
    CASE WHEN us.aliens_games > 0 THEN ROUND((us.aliens_wins::decimal / us.aliens_games) * 100, 2) ELSE 0 END as aliens_win_rate,
    CASE WHEN us.robots_games > 0 THEN ROUND((us.robots_wins::decimal / us.robots_games) * 100, 2) ELSE 0 END as robots_win_rate,
    CASE
        WHEN us.humans_games >= us.aliens_games AND us.humans_games >= us.robots_games THEN 'humans'
        WHEN us.aliens_games >= us.robots_games THEN 'aliens'
        ELSE 'robots'
    END as favorite_faction
FROM user_stats us;

-- ================================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================================

COMMENT ON TABLE users IS 'User accounts for authentication and profile management';
COMMENT ON TABLE active_cards IS 'Current card pool (240-360 cards) with monthly rotation system';
COMMENT ON TABLE decks IS 'User-created decks with exactly 40 cards per deck constraint';
COMMENT ON TABLE deck_cards IS 'Junction table for deck composition with max 4 copies per card';
COMMENT ON TABLE games IS 'Game session records with comprehensive tracking';
COMMENT ON TABLE game_states IS 'Real-time game state snapshots using JSONB for board state';
COMMENT ON TABLE user_stats IS 'User performance statistics by faction';

COMMENT ON COLUMN active_cards.effects IS 'Array of effect keywords for card abilities';
COMMENT ON COLUMN game_states.board_state_json IS 'Complete board state in JSONB format for real-time sync';
COMMENT ON COLUMN decks.is_valid IS 'True when deck has exactly 40 cards and passes validation';