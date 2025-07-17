export interface Position {
  row: number;
  col: number;
}

export interface GameMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'gameState' | 'move' | 'chat';
  data: any;
}

// Real data tracking types
export interface GameResult {
  id: string;
  player1: string;
  player2: string;
  winner: string | null; // null for draw
  result: 'win' | 'loss' | 'draw';
  date: Date;
  duration: number; // in seconds
  moves: number;
  timeControl: string;
  pgn: string;
  player1Rating: number;
  player2Rating: number;
  player1RatingChange: number;
  player2RatingChange: number;
}

export interface PlayerStats {
  username: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  averageGameTime: number;
  averageMoves: number;
  currentStreak: number;
  bestStreak: number;
  lastGameDate?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  player: PlayerStats;
  change: number; // rating change
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconComponent?: React.ComponentType<any>;
  unlocked: boolean;
  unlockedDate?: Date;
  progress: number;
  maxProgress: number;
}