import { Server, Socket } from 'socket.io';
import http from 'http';

class GameServer {
    private port: number;
    private server: http.Server;
    private io: Server;
    private clients: Map<string, string>; // To keep track of connected clients

    constructor(port: number) {
        this.port = port;
        this.server = http.createServer();
        this.io = new Server(this.server);
        this.clients = new Map(); // Initialize the clients map

        this.io.on('connection', (socket) => this.onConnection(socket));

        this.server.listen(this.port, () => {
            console.log(`Socket.IO server is running on http://localhost:${this.port}`);
        });
    }

    private onConnection(socket: Socket): void {
        const clientId = socket.id; // Use socket ID as the client ID
        this.clients.set(clientId, ''); // Initialize the client entry
        console.log('Client connected:', clientId);

        // Access query parameters if needed
        const params = socket.handshake.query;
        console.log('Client connected with parameters:', params);

        // Send the client their assigned ID
        socket.emit('clientId', clientId);

        socket.on('message', (message: string) => this.onMessage(socket, message));
        socket.on('disconnect', () => this.onDisconnect(socket));
    }

    private onMessage(socket: Socket, message: string): void {
        console.log(`Received message from ${socket.id}: ${message}`);
        socket.emit('message', `Echo: ${message}`); // Send a message back to the client
    }

    private onDisconnect(socket: Socket): void {
        console.log('Client disconnected:', socket.id);
        this.clients.delete(socket.id); // Remove the client from the tracking map
    }
}

// Instantiate the GameServer
const gameServer = new GameServer(8080);
