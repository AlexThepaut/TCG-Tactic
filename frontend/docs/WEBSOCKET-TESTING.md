# 🧪 WebSocket Testing Guide

Complete guide to test and validate the WebSocket implementation on the frontend.

## 🚀 Quick Testing Methods

### 1. **Browser Console Testing**

Start the frontend development server:
```bash
cd frontend
npm run dev
```

Open browser console and use these commands:

```javascript
// Basic connection test
window.socketTester.testConnection()

// Test authentication (replace with real token)
window.socketTester.testAuthentication('your-jwt-token-here')

// Test game actions
window.socketTester.testGameActions()

// Test matchmaking
window.socketTester.testMatchmaking()

// Test reconnection
window.socketTester.testReconnection()

// Get current connection state
window.socketTester.getConnectionState()

// Clean up
window.socketTester.cleanup()
```

### 2. **Visual Testing Component**

Add the SocketTester component to any page:

```typescript
import SocketTester from '@/components/SocketTester';

// In your component JSX
<SocketTester />
```

### 3. **Network Tab Monitoring**

1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket) or "Socket.io"
3. Look for WebSocket connection establishment
4. Monitor message exchanges

### 4. **React DevTools**

Install React DevTools and monitor:
- useSocket hook state changes
- useGameSocket hook state changes
- Component re-renders triggered by socket events

## 🔧 Detailed Testing Scenarios

### **Connection Testing**

1. **Basic Connection**
   ```javascript
   // Should show successful connection
   window.socketTester.testConnection()
   ```
   ✅ **Expected**: Connection established, no errors

2. **Connection with Invalid URL**
   ```javascript
   // Test with wrong URL to verify error handling
   const service = createSocketService({ url: 'http://invalid-url:9999' });
   ```
   ✅ **Expected**: Connection timeout error, retry attempts

3. **Connection Recovery**
   ```javascript
   // Test reconnection after disconnect
   window.socketTester.testReconnection()
   ```
   ✅ **Expected**: Successful reconnection with exponential backoff

### **Authentication Testing**

1. **Valid Token Authentication**
   ```javascript
   window.socketTester.testAuthentication('valid-jwt-token')
   ```
   ✅ **Expected**: Authentication success event

2. **Invalid Token Authentication**
   ```javascript
   window.socketTester.testAuthentication('invalid-token')
   ```
   ✅ **Expected**: Authentication error event

3. **Token Expiration**
   ```javascript
   // Use expired token
   window.socketTester.testAuthentication('expired-jwt-token')
   ```
   ✅ **Expected**: Authentication failure, proper error handling

### **Game Actions Testing**

1. **Game Creation**
   ```javascript
   window.socketTester.testGameActions()
   ```
   ✅ **Expected**: Game creation request, proper response handling

2. **Game Actions Without Authentication**
   ```javascript
   // Try game actions before authentication
   window.socketTester.testGameActions()
   ```
   ✅ **Expected**: Authentication error, proper error handling

### **Event Handling Testing**

Monitor these events in console or component:

```javascript
// Game state updates
socket.on('game:state_update', (gameState) => {
  console.log('Game state updated:', gameState);
});

// Turn changes
socket.on('game:turn_changed', (currentPlayer, timeRemaining) => {
  console.log('Turn changed:', currentPlayer, timeRemaining);
});

// Game over
socket.on('game:game_over', (result) => {
  console.log('Game over:', result);
});
```

## 🎯 Expected Behaviors

### **Connection States**

| State | Description | Expected Behavior |
|-------|-------------|-------------------|
| **Disconnected** | No socket connection | Should show connection error, retry attempts |
| **Connecting** | Connection in progress | Should show loading state, timeout after 10s |
| **Connected** | Socket connected but not authenticated | Should allow authentication attempts |
| **Authenticated** | Connected and authenticated | Should allow all game operations |

### **Error Scenarios**

| Error Type | Trigger | Expected Response |
|------------|---------|-------------------|
| **Connection Failed** | Backend offline | Toast notification, retry attempts |
| **Authentication Failed** | Invalid token | Auth error event, clear auth state |
| **Game Action Failed** | Invalid game state | Action-specific error message |
| **Network Timeout** | Slow connection | Timeout error, retry mechanism |

### **Toast Notifications**

Monitor for these toast messages:
- ✅ "Connected successfully"
- ✅ "Authentication successful"
- ✅ "Game created successfully"
- ❌ "Connection failed: [reason]"
- ❌ "Authentication failed: [reason]"
- ℹ️ "Player left the game"

## 🔍 Advanced Testing

### **1. Network Simulation**

Test with Chrome DevTools Network throttling:
1. DevTools → Network → Throttling dropdown
2. Select "Slow 3G" or "Offline"
3. Test connection recovery

### **2. WebSocket Frame Inspection**

In Network tab → WebSocket connection:
1. Click on WebSocket connection
2. Go to "Messages" tab
3. Monitor real-time message exchanges

### **3. Performance Testing**

```javascript
// Measure connection time
const start = performance.now();
await window.socketTester.testConnection();
const connectionTime = performance.now() - start;
console.log(`Connection took ${connectionTime}ms`);

// Test rapid event emission
for (let i = 0; i < 10; i++) {
  window.socketTester.getConnectionState();
}
```

### **4. Memory Leak Testing**

```javascript
// Test multiple connect/disconnect cycles
for (let i = 0; i < 5; i++) {
  await window.socketTester.testConnection();
  window.socketTester.cleanup();
}

// Check for memory leaks in DevTools → Memory tab
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Connection Refused**
   - Check if backend is running on port 5001
   - Verify WebSocket URL in environment variables

2. **CORS Errors**
   - Check backend CORS configuration
   - Ensure frontend URL is allowed

3. **Authentication Failures**
   - Verify JWT token format and expiration
   - Check backend auth middleware

4. **Event Not Received**
   - Check event listener registration
   - Verify event names match backend

### **Debug Commands**

```javascript
// Enable socket.io debug logs
localStorage.debug = 'socket.io-client:*';

// Check connection state
window.socketTester.getConnectionState();

// Monitor all socket events
const socket = window.socketTester.socketService;
const originalEmit = socket.emit;
socket.emit = function(event, ...args) {
  console.log('Emitting:', event, args);
  return originalEmit.apply(this, arguments);
};
```

## ✅ Success Criteria

Your WebSocket implementation is working correctly if:

- [x] Connection establishes successfully to backend
- [x] Authentication works with valid JWT tokens
- [x] All game actions (create, join, place, attack, endTurn) function
- [x] Real-time events are received and handled
- [x] Connection recovery works after disconnection
- [x] Error handling provides meaningful feedback
- [x] No memory leaks after multiple connections
- [x] TypeScript compilation passes without errors
- [x] Toast notifications appear for all major events

## 🎯 Next Steps

After successful testing:

1. **Remove testing components** from production builds
2. **Add proper authentication** with real JWT tokens
3. **Integrate with game UI** components
4. **Add unit tests** for socket functionality
5. **Set up E2E tests** with real backend integration

---

**Happy Testing! 🧪✨**