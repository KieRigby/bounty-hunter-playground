import { io, Socket } from 'socket.io-client';

class GameClient {
    private socket: Socket;

    constructor(url: string, params: Record<string, string>) {
        this.socket = io(url, { query: params });

        this.socket.on('connect', () => this.onConnect());
        this.socket.on('clientId', (clientId) => this.onClientId(clientId)); // Listen for client ID
        this.socket.on('message', (message) => this.onMessage(message));
        this.socket.on('disconnect', () => this.onDisconnect());
        this.socket.on('error', (error) => this.onError(error));
    }

    private onConnect(): void {
        console.log('Connected to server:', this.socket.id);
        this.sendMessage('Hello, Server!');
    }

    private onClientId(clientId: string): void {
        console.log(`Assigned Client ID: ${clientId}`);
    }

    private onMessage(message: string): void {
        console.log(`Received message: ${message}`);
    }

    private onDisconnect(): void {
        console.log('Disconnected from server');
    }

    private onError(error: Error): void {
        console.error(`Socket.IO error: ${error.message}`);
    }

    public sendMessage(message: string): void {
        this.socket.emit('message', message); // Send a message to the server
    }
}

// Instantiate the GameClient with additional data
const gameClient = new GameClient('http://localhost:8080', { userId: '12345', sessionId: 'abcde' });
