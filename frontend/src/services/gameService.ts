// TCG Tactique - Game Service Layer
import type { GameState, Deck, Card } from '@/types';
import api from './api';

class GameService {
  // Deck management
  async getDecks() {
    return api.get<Deck[]>('/api/decks');
  }

  async createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) {
    return api.post<Deck>('/api/decks', deck);
  }

  async updateDeck(deckId: string, deck: Partial<Deck>) {
    return api.put<Deck>(`/api/decks/${deckId}`, deck);
  }

  async deleteDeck(deckId: string) {
    return api.delete(`/api/decks/${deckId}`);
  }

  // Card collection
  async getCards() {
    return api.get<Card[]>('/api/cards');
  }

  async getCardsByFaction(faction: string) {
    return api.get<Card[]>(`/api/cards?faction=${faction}`);
  }

  // Game session management (REST endpoints for game data)
  async getGameHistory() {
    return api.get<GameState[]>('/api/games/history');
  }

  async getGameStats() {
    return api.get('/api/games/stats');
  }

  // Socket.io events will be handled in components using useSocket hook
  // This service handles HTTP API calls only

  // User profile
  async getUserProfile() {
    return api.get('/api/user/profile');
  }

  async updateUserProfile(profile: any) {
    return api.put('/api/user/profile', profile);
  }

  // Matchmaking (HTTP endpoints for lobby/queue management)
  async joinMatchmaking(deckId: string) {
    return api.post('/api/matchmaking/join', { deckId });
  }

  async leaveMatchmaking() {
    return api.post('/api/matchmaking/leave');
  }

  async getMatchmakingStatus() {
    return api.get('/api/matchmaking/status');
  }
}

// Export singleton instance
const gameService = new GameService();
export default gameService;