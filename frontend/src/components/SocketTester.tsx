/**
 * Visual Socket Tester Component
 * Add this component to test WebSocket functionality in the UI
 */

import React, { useState, useEffect } from 'react';
import useSocket from '@/hooks/useSocket';
import useGameSocket from '@/hooks/useGameSocket';
import type { GameState, GameResult, PlayerData } from '@/types';

const SocketTester: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [testToken, setTestToken] = useState('test-jwt-token');

  // Socket hooks
  const {
    socketService,
    isConnected,
    isAuthenticated,
    error,
    connect,
    disconnect,
    authenticate,
  } = useSocket({
    autoConnect: false, // Manual control for testing
    onConnect: () => addLog('✅ Socket connected'),
    onDisconnect: (reason) => addLog(`📡 Socket disconnected: ${reason}`),
    onError: (error) => addLog(`❌ Socket error: ${error}`),
    onAuthSuccess: (userData) => addLog(`🔐 Auth success: ${userData.username}`),
    onAuthError: (error) => addLog(`🚫 Auth failed: ${error}`),
  });

  const {
    createGame,
    joinGame,
    leaveGame,
    placeUnit,
    attack,
    endTurn,
    surrender,
    joinMatchmaking,
    leaveMatchmaking,
    isInGame,
    getCurrentPlayer,
    getOpponent,
    isMyTurn,
  } = useGameSocket({
    callbacks: {
      onGameStateUpdate: (newGameState) => {
        setGameState(newGameState);
        addLog(`🎮 Game state updated: Turn ${newGameState.turn}, Phase: ${newGameState.phase}`);
      },
      onPlayerJoined: (player) => addLog(`👤 Player joined: ${player.username}`),
      onPlayerLeft: (playerId) => addLog(`👋 Player left: ${playerId}`),
      onTurnChanged: (currentPlayer, timeRemaining) =>
        addLog(`⏰ Turn changed: ${currentPlayer}, Time: ${timeRemaining}s`),
      onGameOver: (result) => addLog(`🏁 Game over: ${result.winner} won!`),
      onMatchFound: (gameId, opponent) =>
        addLog(`🎯 Match found! GameID: ${gameId}, Opponent: ${opponent.username}`),
      onQueueUpdate: (position, wait) =>
        addLog(`⏳ Queue position: ${position}, Est. wait: ${wait}s`),
    },
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => setLogs([]);

  // Test functions
  const testConnection = async () => {
    addLog('🔌 Testing connection...');
    try {
      const success = await connect();
      addLog(success ? '✅ Connection successful' : '❌ Connection failed');
    } catch (error) {
      addLog(`❌ Connection error: ${error}`);
    }
  };

  const testAuthentication = async () => {
    addLog('🔐 Testing authentication...');
    try {
      const response = await authenticate(testToken);
      addLog(`✅ Auth response: ${JSON.stringify(response)}`);
    } catch (error) {
      addLog(`❌ Auth error: ${error}`);
    }
  };

  const testGameCreation = async () => {
    addLog('🎮 Testing game creation...');
    try {
      const response = await createGame({
        timeLimit: 120,
        ranked: false,
        spectatorMode: false,
        faction: 'humans',
        deck: ['card1', 'card2', 'card3'],
      });
      addLog(`✅ Game created: ${JSON.stringify(response)}`);
    } catch (error) {
      addLog(`❌ Game creation error: ${error}`);
    }
  };

  const testMatchmaking = async () => {
    addLog('🎯 Testing matchmaking...');
    try {
      const response = await joinMatchmaking({
        faction: 'humans',
        deck: ['card1', 'card2', 'card3'],
        preferences: {
          timeLimit: 120,
          ranked: false,
        },
      });
      addLog(`✅ Joined queue: ${JSON.stringify(response)}`);
    } catch (error) {
      addLog(`❌ Matchmaking error: ${error}`);
    }
  };

  const testGameActions = async () => {
    if (!isInGame) {
      addLog('⚠️ Not in game - create or join a game first');
      return;
    }

    addLog('🎯 Testing game actions...');
    try {
      // Test place unit
      const placeResponse = await placeUnit('card1', { x: 1, y: 1 }, 0);
      addLog(`✅ Place unit: ${JSON.stringify(placeResponse)}`);

      // Test attack
      const attackResponse = await attack({ x: 1, y: 1 }, { x: 2, y: 1 });
      addLog(`✅ Attack: ${JSON.stringify(attackResponse)}`);

      // Test end turn
      const endTurnResponse = await endTurn();
      addLog(`✅ End turn: ${JSON.stringify(endTurnResponse)}`);
    } catch (error) {
      addLog(`❌ Game action error: ${error}`);
    }
  };

  // Status indicators
  const getStatusColor = (status: boolean) => status ? 'text-green-600' : 'text-red-600';
  const getStatusIcon = (status: boolean) => status ? '✅' : '❌';

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 WebSocket Tester</h2>

      {/* Connection Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className={`text-center ${getStatusColor(isConnected)}`}>
          <div className="text-2xl">{getStatusIcon(isConnected)}</div>
          <div className="text-sm font-medium">Connected</div>
        </div>
        <div className={`text-center ${getStatusColor(isAuthenticated)}`}>
          <div className="text-2xl">{getStatusIcon(isAuthenticated)}</div>
          <div className="text-sm font-medium">Authenticated</div>
        </div>
        <div className={`text-center ${getStatusColor(isInGame)}`}>
          <div className="text-2xl">{getStatusIcon(isInGame)}</div>
          <div className="text-sm font-medium">In Game</div>
        </div>
        <div className={`text-center ${getStatusColor(!error)}`}>
          <div className="text-2xl">{getStatusIcon(!error)}</div>
          <div className="text-sm font-medium">No Errors</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
          ❌ Error: {error}
        </div>
      )}

      {/* Game State Display */}
      {gameState && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🎮 Game State</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Turn:</strong> {gameState.turn}
            </div>
            <div>
              <strong>Phase:</strong> {gameState.phase}
            </div>
            <div>
              <strong>Current Player:</strong> {gameState.currentPlayer}
            </div>
            <div>
              <strong>Time Remaining:</strong> {gameState.timeRemaining}s
            </div>
          </div>
          {isMyTurn() && (
            <div className="mt-2 text-green-600 font-medium">🎯 It's your turn!</div>
          )}
        </div>
      )}

      {/* Test Token Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Token (for authentication):
        </label>
        <input
          type="text"
          value={testToken}
          onChange={(e) => setTestToken(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter JWT token for testing"
        />
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🔌 Test Connection
        </button>

        <button
          onClick={testAuthentication}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          disabled={!isConnected}
        >
          🔐 Test Auth
        </button>

        <button
          onClick={testGameCreation}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          disabled={!isAuthenticated}
        >
          🎮 Create Game
        </button>

        <button
          onClick={testMatchmaking}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          disabled={!isAuthenticated}
        >
          🎯 Join Queue
        </button>

        <button
          onClick={testGameActions}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          disabled={!isInGame}
        >
          🎯 Test Actions
        </button>

        <button
          onClick={disconnect}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          📡 Disconnect
        </button>
      </div>

      {/* Logs Display */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-green-300">📝 Connection Logs</span>
          <button
            onClick={clearLogs}
            className="text-gray-400 hover:text-white text-xs"
          >
            Clear
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Start testing to see connection activity.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SocketTester;