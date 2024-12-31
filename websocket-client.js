const io = require('socket.io-client');

// Connect to WebSocket server
const socket = io('http://localhost:5000', {
    timeout: 10000 // 10 seconds in milliseconds
});

// Handle 'connect' event
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

// Handle 'message' event
socket.on('message', (data) => {
    console.log('Received message:', data);
});

// Handle custom events
socket.on('customEvent', (data) => {
    console.log('Received custom event:', data);
});

// Handle 'error' event
socket.on('error', (error) => {
    console.error('WebSocket error:', error);
});

// Handle 'disconnect' event
socket.on('disconnect', (reason) => {
    console.log(`Disconnected from WebSocket server: ${reason}`);
});

// Attempt reconnection handling
socket.on('reconnect_attempt', () => {
    console.log('Attempting to reconnect...');
});
socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`);
});
