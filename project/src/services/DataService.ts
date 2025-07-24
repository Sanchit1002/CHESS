import { GameResult, PlayerStats, LeaderboardEntry, Achievement } from '../types';
import { FirebaseService } from './FirebaseService';

// ELO Rating System Constants
const K_FACTOR = 32; // Rating change factor
const INITIAL_RATING = 1200;

export class DataService {
  private static instance: DataService;
  private firebaseService: FirebaseService;
  
  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
  }
  
  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Save game result
  async saveGameResult(result: GameResult): Promise<void> {
    try {
      // If opponent is 'Computer', ensure type is 'singleplayer' and opponent is set
      if (result.player2 === 'Computer') {
        (result as any).type = 'singleplayer';
        (result as any).opponent = 'Computer';
      }
      // Save to Firebase
      await this.firebaseService.saveGameResult(result);
      
      // Also save to localStorage as backup
      const gameResults = await this.getGameResults();
    gameResults.push(result);
    localStorage.setItem('chessGameResults', JSON.stringify(gameResults));
    
      // Update player stats in localStorage as backup
      await this.updatePlayerStats(result);
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  }

  // Get all game results
  async getGameResults(): Promise<GameResult[]> {
    try {
      // Try to get from Firebase first
      const firebaseResults = await this.firebaseService.getAllGameResults();
      if (firebaseResults.length > 0) {
        return firebaseResults;
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('chessGameResults');
      if (!stored) return [];
      
      const results = JSON.parse(stored);
      return results.map((result: any) => ({
        ...result,
        date: new Date(result.date)
      }));
    } catch (error) {
      console.error('Error getting game results:', error);
      // Fallback to localStorage
    const stored = localStorage.getItem('chessGameResults');
    if (!stored) return [];
    
    const results = JSON.parse(stored);
    return results.map((result: any) => ({
      ...result,
      date: new Date(result.date)
    }));
    }
  }

  // Get game results for a specific player
  async getPlayerGameResults(username: string): Promise<GameResult[]> {
    try {
      // Try to get from Firebase first
      const firebaseResults = await this.firebaseService.getPlayerGameResults(username);
      if (firebaseResults.length > 0) {
        return firebaseResults;
      }
      
      // Fallback to localStorage
      const allResults = await this.getGameResults();
      return allResults.filter((result: GameResult) => 
        result.player1 === username || result.player2 === username
      );
    } catch (error) {
      console.error('Error getting player game results:', error);
      // Fallback to localStorage
      const allResults = await this.getGameResults();
      return allResults.filter((result: GameResult) => 
      result.player1 === username || result.player2 === username
    );
    }
  }

  // Calculate ELO rating change
  private calculateRatingChange(playerRating: number, opponentRating: number, result: number): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return Math.round(K_FACTOR * (result - expectedScore));
  }

  // Update player stats after a game
  private async updatePlayerStats(gameResult: GameResult): Promise<void> {
    const playerStats = await this.getPlayerStats();
    // Update player 1 stats (always the human user)
    const player1Stats = this.getOrCreatePlayerStats(gameResult.player1, playerStats);
    this.updatePlayerStatsFromGame(player1Stats, gameResult, gameResult.player1);
    // Only update player 2 stats if not 'Computer'
    if (gameResult.player2 !== 'Computer') {
    const player2Stats = this.getOrCreatePlayerStats(gameResult.player2, playerStats);
    this.updatePlayerStatsFromGame(player2Stats, gameResult, gameResult.player2);
    }
    // Save updated stats to localStorage as backup
    localStorage.setItem('chessPlayerStats', JSON.stringify(playerStats));
  }

  private getOrCreatePlayerStats(username: string, playerStats: PlayerStats[]): PlayerStats {
    let stats = playerStats.find(p => p.username === username);
    if (!stats) {
      stats = {
        username,
        rating: INITIAL_RATING,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        averageGameTime: 0,
        averageMoves: 0,
        currentStreak: 0,
        bestStreak: 0
      };
      playerStats.push(stats);
    }
    return stats;
  }

  private updatePlayerStatsFromGame(stats: PlayerStats, gameResult: GameResult, playerUsername: string): void {
    const isPlayer1 = gameResult.player1 === playerUsername;
    const ratingChange = isPlayer1 ? gameResult.player1RatingChange : gameResult.player2RatingChange;
    
    // Update rating
    stats.rating += ratingChange;
    
    // Update game counts
    stats.gamesPlayed++;
    
    // Determine result for this player
    let result: 'win' | 'loss' | 'draw';
    if (gameResult.winner === null) {
      result = 'draw';
      stats.draws++;
    } else if (gameResult.winner === playerUsername) {
      result = 'win';
      stats.wins++;
      stats.currentStreak = Math.max(0, stats.currentStreak) + 1;
    } else {
      result = 'loss';
      stats.losses++;
      stats.currentStreak = Math.min(0, stats.currentStreak) - 1;
    }
    
    // Update win rate
    stats.winRate = (stats.wins / stats.gamesPlayed) * 100;
    
    // Update average game time
    const totalTime = stats.averageGameTime * (stats.gamesPlayed - 1) + gameResult.duration;
    stats.averageGameTime = totalTime / stats.gamesPlayed;
    
    // Update average moves
    const totalMoves = stats.averageMoves * (stats.gamesPlayed - 1) + gameResult.moves;
    stats.averageMoves = totalMoves / stats.gamesPlayed;
    
    // Update best streak
    if (result === 'win') {
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    }
    
    // Update last game date
    stats.lastGameDate = gameResult.date;
  }

  // Get player stats
  async getPlayerStats(): Promise<PlayerStats[]> {
    try {
      // Try to get from Firebase first
      const firebaseStats = await this.firebaseService.getPlayerStats();
      if (firebaseStats.length > 0) {
        return firebaseStats;
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('chessPlayerStats');
      if (!stored) return [];
      
      const stats = JSON.parse(stored);
      return stats.map((stat: any) => ({
        ...stat,
        lastGameDate: stat.lastGameDate ? new Date(stat.lastGameDate) : undefined
      }));
    } catch (error) {
      console.error('Error getting player stats:', error);
      // Fallback to localStorage
    const stored = localStorage.getItem('chessPlayerStats');
    if (!stored) return [];
    
    const stats = JSON.parse(stored);
    return stats.map((stat: any) => ({
      ...stat,
      lastGameDate: stat.lastGameDate ? new Date(stat.lastGameDate) : undefined
    }));
    }
  }

  // Get stats for a specific player
  async getPlayerStatsByUsername(username: string): Promise<PlayerStats | null> {
    try {
      // Try to get from Firebase first
      const firebaseStats = await this.firebaseService.getPlayerStatsByUsername(username);
      if (firebaseStats) {
        return firebaseStats;
      }
      
      // Fallback to localStorage
      const allStats = await this.getPlayerStats();
      return allStats.find((stats: PlayerStats) => stats.username === username) || null;
    } catch (error) {
      console.error('Error getting player stats by username:', error);
      // Fallback to localStorage
      const allStats = await this.getPlayerStats();
      return allStats.find((stats: PlayerStats) => stats.username === username) || null;
    }
  }

  // Get leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      // Try to get from Firebase first
      const firebaseLeaderboard = await this.firebaseService.getLeaderboard();
      if (firebaseLeaderboard.length > 0) {
        return firebaseLeaderboard;
      }
      
      // Fallback to localStorage
      const playerStats = await this.getPlayerStats();
    const sortedStats = playerStats
        .sort((a: PlayerStats, b: PlayerStats) => b.rating - a.rating)
        .map((player: PlayerStats, index: number) => ({
        rank: index + 1,
        player,
        change: 0 // This would be calculated from recent games
      }));
    
    return sortedStats;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      // Fallback to localStorage
      const playerStats = await this.getPlayerStats();
      const sortedStats = playerStats
        .sort((a: PlayerStats, b: PlayerStats) => b.rating - a.rating)
        .map((player: PlayerStats, index: number) => ({
          rank: index + 1,
          player,
          change: 0
        }));
      
      return sortedStats;
    }
  }

  // Calculate rating for a new game
  async calculateGameRatings(player1Username: string, player2Username: string, winner: string | null): Promise<{
    player1Rating: number;
    player2Rating: number;
    player1RatingChange: number;
    player2RatingChange: number;
  }> {
    const playerStats = await this.getPlayerStats();
    const player1Stats = this.getOrCreatePlayerStats(player1Username, playerStats);
    const player2Stats = this.getOrCreatePlayerStats(player2Username, playerStats);
    
    let player1Result: number;
    let player2Result: number;
    
    if (winner === null) {
      // Draw
      player1Result = 0.5;
      player2Result = 0.5;
    } else if (winner === player1Username) {
      // Player 1 wins
      player1Result = 1;
      player2Result = 0;
    } else {
      // Player 2 wins
      player1Result = 0;
      player2Result = 1;
    }
    
    const player1RatingChange = this.calculateRatingChange(player1Stats.rating, player2Stats.rating, player1Result);
    const player2RatingChange = this.calculateRatingChange(player2Stats.rating, player1Stats.rating, player2Result);
    
    return {
      player1Rating: player1Stats.rating,
      player2Rating: player2Stats.rating,
      player1RatingChange,
      player2RatingChange
    };
  }

  // Create or update user in Firebase
  async createOrUpdateUser(username: string, email: string): Promise<void> {
    try {
      await this.firebaseService.createOrUpdateUser(username, email);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  // Get achievements (keeping as mock for now)
  getPlayerAchievements(username: string): Achievement[] {
    // Mock achievements - can be expanded later
    return [
      {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first game',
        icon: '🏆',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        unlockedDate: new Date()
      },
      {
        id: 'winning_streak',
        name: 'Winning Streak',
        description: 'Win 5 games in a row',
        icon: '🔥',
        progress: 2,
        maxProgress: 5,
        unlocked: false
      }
    ];
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem('chessGameResults');
    localStorage.removeItem('chessPlayerStats');
    console.log('All local data cleared');
  }
} 