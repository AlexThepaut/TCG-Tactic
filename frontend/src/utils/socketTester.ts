/**
 * WebSocket Testing Utilities
 * Use these functions in browser console to test socket functionality
 */

import { createSocketService } from '@/services/socketService';
import type { GameCreateConfig, MatchmakingJoinData } from '@/types';

// Global socket tester for browser console
declare global {
  interface Window {
    socketTester: {
      testConnection: () => Promise<void>;
      testAuthentication: (token: string) => Promise<void>;
      testGameActions: () => Promise<void>;
      testMatchmaking: () => Promise<void>;
      testReconnection: () => Promise<void>;
      getConnectionState: () => any;
      cleanup: () => void;
    };
  }
}

class SocketTester {
  private socketService: any = null;
  private testToken = 'test-jwt-token-here'; // Replace with actual token

  async testConnection() {
    console.log('🔌 Testing WebSocket Connection...');

    try {
      this.socketService = createSocketService({
        url: 'http://localhost:5001',
        transports: ['websocket', 'polling'],
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
      });

      const connected = await this.socketService.connect();

      if (connected) {
        console.log('✅ Connection successful!');
        console.log('📊 Connection state:', this.socketService.getConnectionState());
      } else {
        console.log('❌ Connection failed');
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
    }
  }

  async testAuthentication(token?: string) {
    console.log('🔐 Testing Authentication...');

    if (!this.socketService) {
      console.log('⚠️ Connect first using testConnection()');
      return;
    }

    try {
      const authToken = token || this.testToken;
      const response = await this.socketService.authenticate(authToken);

      console.log('✅ Authentication response:', response);
      console.log('📊 Updated connection state:', this.socketService.getConnectionState());
    } catch (error) {
      console.error('❌ Authentication error:', error);
    }
  }

  async testGameActions() {
    console.log('🎮 Testing Game Actions...');

    if (!this.socketService) {
      console.log('⚠️ Connect first using testConnection()');
      return;
    }

    try {
      // Test game creation
      console.log('📝 Testing game creation...');
      const gameConfig: GameCreateConfig = {
        timeLimit: 120,
        ranked: false,
        spectatorMode: false,
        faction: 'humans',
        deck: ['card1', 'card2', 'card3'] // Replace with real card IDs
      };

      const createResponse = await this.socketService.createGame(gameConfig);
      console.log('✅ Game creation response:', createResponse);

      // Test other game actions
      if (createResponse.success && createResponse.gameId) {
        console.log('🎯 Testing game actions...');

        // Test place unit
        try {
          const placeResponse = await this.socketService.placeUnit({
            cardId: 'card1',
            position: { x: 1, y: 1 },
            handIndex: 0
          });
          console.log('✅ Place unit response:', placeResponse);
        } catch (error) {
          console.log('ℹ️ Place unit expected to fail (no real game):', error.message);
        }

        // Test end turn
        try {
          const endTurnResponse = await this.socketService.endTurn();
          console.log('✅ End turn response:', endTurnResponse);
        } catch (error) {
          console.log('ℹ️ End turn expected to fail (no real game):', error.message);
        }
      }
    } catch (error) {
      console.error('❌ Game actions error:', error);
    }
  }

  async testMatchmaking() {
    console.log('🎯 Testing Matchmaking...');

    if (!this.socketService) {
      console.log('⚠️ Connect first using testConnection()');
      return;
    }

    try {
      const matchmakingData: MatchmakingJoinData = {
        faction: 'humans',
        deck: ['card1', 'card2', 'card3'],
        preferences: {
          timeLimit: 120,
          ranked: false
        }
      };

      const response = await this.socketService.joinMatchmaking(matchmakingData);
      console.log('✅ Matchmaking response:', response);

      // Test leaving matchmaking
      setTimeout(async () => {
        try {
          const leaveResponse = await this.socketService.leaveMatchmaking();
          console.log('✅ Leave matchmaking response:', leaveResponse);
        } catch (error) {
          console.log('ℹ️ Leave matchmaking response:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Matchmaking error:', error);
    }
  }

  async testReconnection() {
    console.log('🔄 Testing Reconnection...');

    if (!this.socketService) {
      console.log('⚠️ Connect first using testConnection()');
      return;
    }

    try {
      // Disconnect and reconnect
      console.log('📡 Disconnecting...');
      this.socketService.disconnect();

      setTimeout(async () => {
        console.log('🔌 Reconnecting...');
        const reconnected = await this.socketService.connect();
        console.log(reconnected ? '✅ Reconnection successful!' : '❌ Reconnection failed');
        console.log('📊 Connection state:', this.socketService.getConnectionState());
      }, 2000);
    } catch (error) {
      console.error('❌ Reconnection error:', error);
    }
  }

  getConnectionState() {
    if (!this.socketService) {
      return 'No socket service initialized';
    }
    return this.socketService.getConnectionState();
  }

  cleanup() {
    console.log('🧹 Cleaning up socket connections...');
    if (this.socketService) {
      this.socketService.disconnect();
      this.socketService = null;
    }
    console.log('✅ Cleanup complete');
  }
}

// Initialize global socket tester
const tester = new SocketTester();

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  window.socketTester = {
    testConnection: () => tester.testConnection(),
    testAuthentication: (token: string) => tester.testAuthentication(token),
    testGameActions: () => tester.testGameActions(),
    testMatchmaking: () => tester.testMatchmaking(),
    testReconnection: () => tester.testReconnection(),
    getConnectionState: () => tester.getConnectionState(),
    cleanup: () => tester.cleanup(),
  };

  console.log(`
🧪 Socket Tester Ready!
Use these commands in browser console:

window.socketTester.testConnection()     // Test basic connection
window.socketTester.testAuthentication() // Test auth (needs token)
window.socketTester.testGameActions()    // Test game actions
window.socketTester.testMatchmaking()    // Test matchmaking
window.socketTester.testReconnection()   // Test reconnection
window.socketTester.getConnectionState() // Get current state
window.socketTester.cleanup()            // Clean up connections
  `);
}

export default tester;