/**
 * Socket.io Integration Tests
 * Basic tests to verify Socket.io server functionality
 */
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { app } from '../app';
import { SocketServer } from '../socket/socketServer';
import { env } from '../config/environment';

describe('Socket.io Integration', () => {
  let httpServer: any;
  let socketServer: SocketServer;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeAll((done) => {
    // Create test server
    httpServer = createServer(app);
    socketServer = new SocketServer(httpServer);

    httpServer.listen(0, () => {
      serverPort = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket) {
      clientSocket.disconnect();
    }

    socketServer.shutdown().then(() => {
      httpServer.close(done);
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should reject connection without authentication token', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        autoConnect: false
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication');
        done();
      });

      clientSocket.connect();
    });

    it('should accept connection with valid JWT token', (done) => {
      const testUser = {
        userId: 'test-user-123',
        username: 'TestUser',
        sessionId: 'test-session-123'
      };

      const token = jwt.sign(testUser, env.JWT_SECRET, { expiresIn: '1h' });

      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        autoConnect: false
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(new Error(`Connection failed: ${error.message}`));
      });

      clientSocket.connect();
    });

    it('should receive connection established event', (done) => {
      const testUser = {
        userId: 'test-user-456',
        username: 'TestUser2',
        sessionId: 'test-session-456'
      };

      const token = jwt.sign(testUser, env.JWT_SECRET, { expiresIn: '1h' });

      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token },
        autoConnect: false
      });

      clientSocket.on('connection:established', (sessionId) => {
        expect(sessionId).toBe(testUser.sessionId);
        done();
      });

      clientSocket.connect();
    });
  });

  describe('Health Monitoring', () => {
    it('should provide health status', () => {
      const healthStatus = socketServer.getHealthStatus();

      expect(healthStatus.connected).toBe(true);
      expect(healthStatus.activeConnections).toBeGreaterThanOrEqual(0);
      expect(healthStatus.totalRooms).toBeGreaterThanOrEqual(0);
      expect(healthStatus.uptime).toBeGreaterThan(0);
    });

    it('should provide connection statistics', () => {
      const stats = socketServer.getStats();

      expect(stats.totalConnections).toBeGreaterThanOrEqual(0);
      expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
      expect(stats.authenticatedConnections).toBeGreaterThanOrEqual(0);
      expect(stats.uptime).toBeGreaterThan(0);
    });
  });

  describe('Event Handling', () => {
    beforeEach((done) => {
      const testUser = {
        userId: 'test-user-events',
        username: 'EventTestUser',
        sessionId: 'test-session-events'
      };

      const token = jwt.sign(testUser, env.JWT_SECRET, { expiresIn: '1h' });

      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        auth: { token }
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should handle ping/pong correctly', (done) => {
      clientSocket.emit('connection:ping', (response: any) => {
        expect(response.pong).toBe(true);
        expect(response.timestamp).toBeGreaterThan(0);
        done();
      });
    });

    it('should handle game creation with proper validation', (done) => {
      const gameConfig = {
        timeLimit: 60,
        ranked: false,
        spectatorMode: true,
        faction: 'humans' as const,
        deck: new Array(40).fill('card-id-123') // Mock 40-card deck
      };

      clientSocket.emit('game:create', gameConfig, (response: any) => {
        expect(response.success).toBe(true);
        expect(response.gameId).toBeDefined();
        expect(response.gameState).toBeDefined();
        expect(response.playerId).toBe('test-user-events');
        done();
      });
    });

    it('should handle matchmaking join with validation', (done) => {
      const matchmakingData = {
        faction: 'aliens' as const,
        deck: new Array(40).fill('card-id-456'),
        preferences: {
          timeLimit: 30,
          ranked: false
        }
      };

      clientSocket.emit('matchmaking:join', matchmakingData, (response: any) => {
        expect(response.success).toBe(true);
        expect(response.queuePosition).toBeGreaterThan(0);
        expect(response.estimatedWait).toBeGreaterThanOrEqual(0);
        done();
      });
    });
  });
});