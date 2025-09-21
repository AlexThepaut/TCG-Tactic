-- CreateEnum
CREATE TYPE "GamePhase" AS ENUM ('resources', 'draw', 'actions');

-- CreateTable
CREATE TABLE "game_actions" (
    "id" TEXT NOT NULL,
    "game_id" INTEGER NOT NULL,
    "game_state_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "action_type" VARCHAR(30) NOT NULL,
    "action_data" JSONB NOT NULL,
    "game_state_before" JSONB,
    "game_state_after" JSONB,
    "turn" INTEGER NOT NULL DEFAULT 1,
    "phase" "GamePhase" NOT NULL DEFAULT 'actions',
    "resource_cost" INTEGER NOT NULL DEFAULT 0,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validation_errors" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_actions_pkey" PRIMARY KEY ("id")
);

-- Update game_states table to add updated_at column
ALTER TABLE "game_states"
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "game_actions_game_id_turn_idx" ON "game_actions"("game_id", "turn");
CREATE INDEX "game_actions_player_id_idx" ON "game_actions"("player_id");
CREATE INDEX "game_actions_action_type_idx" ON "game_actions"("action_type");
CREATE INDEX "game_actions_timestamp_idx" ON "game_actions"("timestamp");
CREATE INDEX "game_states_game_id_turn_idx" ON "game_states"("game_id", "turn");

-- AddForeignKey
ALTER TABLE "game_actions" ADD CONSTRAINT "game_actions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_actions" ADD CONSTRAINT "game_actions_game_state_id_fkey" FOREIGN KEY ("game_state_id") REFERENCES "game_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_actions" ADD CONSTRAINT "game_actions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;