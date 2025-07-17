export interface GameMessage {
  type: 'move' | 'join' | 'leave' | 'chat' | 'game_start' | 'game_end' | 'spectator_join';
  data: any;
  roomId?: string;
  userId?: string;
}

export interface GameRoom {
  id: string;
  players: string[];
  spectators: string[];
  gameState: any;
  timeControl: string;
  boardTheme: string;
  status: 'waiting' | 'playing' | 'finished';
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string) {}

  connect(userId: string, onConnect?: () => void, onError?: (error: Event) => void) {
    try {
      this.ws = new WebSocket(`${this.url}?userId=${userId}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: GameMessage = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(userId, onConnect, onError);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      onError?.(error as Event);
    }
  }

  private attemptReconnect(userId: string, onConnect?: () => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(userId, onConnect, onError);
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: GameMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  removeMessageHandler(type: string) {
    this.messageHandlers.delete(type);
  }
}

// Mock WebSocket manager for development (simulates multiplayer)
export class MockWebSocketManager extends WebSocketManager {
  private rooms: Map<string, GameRoom> = new Map();
  private connectedUsers: Set<string> = new Set();

  constructor() {
    super('mock://localhost');
  }

  connect(userId: string, onConnect?: () => void, onError?: (error: Event) => void) {
    this.connectedUsers.add(userId);
    console.log(`Mock WebSocket: User ${userId} connected`);
    onConnect?.();
  }

  send(message: GameMessage) {
    console.log('Mock WebSocket: Sending message', message);
    
    // Simulate message handling
    setTimeout(() => {
      this.handleMockMessage(message);
    }, 100);
  }

  private handleMockMessage(message: GameMessage) {
    switch (message.type) {
      case 'join':
        this.handleJoinRoom(message);
        break;
      case 'move':
        this.handleMove(message);
        break;
      case 'spectator_join':
        this.handleSpectatorJoin(message);
        break;
    }
  }

  private handleJoinRoom(message: GameMessage) {
    const { roomId, userId } = message;
    if (roomId && userId) {
      let room = this.rooms.get(roomId);
      if (!room) {
        room = {
          id: roomId,
          players: [],
          spectators: [],
          gameState: null,
          timeControl: 'blitz',
          boardTheme: 'classic',
          status: 'waiting'
        };
        this.rooms.set(roomId, room);
      }
      
      if (room.players.length < 2) {
        room.players.push(userId);
        if (room.players.length === 2) {
          room.status = 'playing';
        }
      }
    }
  }

  private handleMove(message: GameMessage) {
    const { roomId, data } = message;
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.gameState = data;
      }
    }
  }

  private handleSpectatorJoin(message: GameMessage) {
    const { roomId, userId } = message;
    if (roomId && userId) {
      const room = this.rooms.get(roomId);
      if (room && !room.spectators.includes(userId)) {
        room.spectators.push(userId);
      }
    }
  }

  getRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }
}