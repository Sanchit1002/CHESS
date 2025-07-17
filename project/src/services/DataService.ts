import { GameResult, PlayerStats, LeaderboardEntry, Achievement } from '../types';

// ELO Rating System Constants
const K_FACTOR = 32; // Rating change factor
const INITIAL_RATING = 1200;

export class DataService {
  private static instance: DataService;
  
  private constructor() {}
  
  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Save game result
  saveGameResult(result: GameResult): void {
    const gameResults = this.getGameResults();
    gameResults.push(result);
    localStorage.setItem('chessGameResults', JSON.stringify(gameResults));
    
    // Update player stats
    this.updatePlayerStats(result);
  }

  // Get all game results
  getGameResults(): GameResult[] {
    const stored = localStorage.getItem('chessGameResults');
    if (!stored) return [];
    
    const results = JSON.parse(stored);
    return results.map((result: any) => ({
      ...result,
      date: new Date(result.date)
    }));
  }

  // Get game results for a specific player
  getPlayerGameResults(username: string): GameResult[] {
    const allResults = this.getGameResults();
    return allResults.filter(result => 
      result.player1 === username || result.player2 === username
    );
  }

  // Calculate ELO rating change
  private calculateRatingChange(playerRating: number, opponentRating: number, result: number): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return Math.round(K_FACTOR * (result - expectedScore));
  }

  // Update player stats after a game
  private updatePlayerStats(gameResult: GameResult): void {
    const playerStats = this.getPlayerStats();
    
    // Update player 1 stats
    const player1Stats = this.getOrCreatePlayerStats(gameResult.player1, playerStats);
    this.updatePlayerStatsFromGame(player1Stats, gameResult, gameResult.player1);
    
    // Update player 2 stats
    const player2Stats = this.getOrCreatePlayerStats(gameResult.player2, playerStats);
    this.updatePlayerStatsFromGame(player2Stats, gameResult, gameResult.player2);
    
    // Save updated stats
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
  getPlayerStats(): PlayerStats[] {
    const stored = localStorage.getItem('chessPlayerStats');
    if (!stored) return [];
    
    const stats = JSON.parse(stored);
    return stats.map((stat: any) => ({
      ...stat,
      lastGameDate: stat.lastGameDate ? new Date(stat.lastGameDate) : undefined
    }));
  }

  // Get stats for a specific player
  getPlayerStatsByUsername(username: string): PlayerStats | null {
    const allStats = this.getPlayerStats();
    return allStats.find(stats => stats.username === username) || null;
  }

  // Get leaderboard
  getLeaderboard(): LeaderboardEntry[] {
    const playerStats = this.getPlayerStats();
    const sortedStats = playerStats
      .sort((a, b) => b.rating - a.rating)
      .map((player, index) => ({
        rank: index + 1,
        player,
        change: 0 // This would be calculated from recent games
      }));
    
    return sortedStats;
  }

  // Calculate rating for a new game
  calculateGameRatings(player1Username: string, player2Username: string, winner: string | null): {
    player1Rating: number;
    player2Rating: number;
    player1RatingChange: number;
    player2RatingChange: number;
  } {
    const playerStats = this.getPlayerStats();
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

  // Get achievements for a player
  getPlayerAchievements(username: string): Achievement[] {
    const playerStats = this.getPlayerStatsByUsername(username);
    if (!playerStats) return [];
    
    const achievements: Achievement[] = [
      {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first game',
        icon: '🏆',
        unlocked: playerStats.wins >= 1,
        unlockedDate: playerStats.wins >= 1 ? playerStats.lastGameDate : undefined,
        progress: Math.min(playerStats.wins, 1),
        maxProgress: 1
      },
      {
        id: 'winning_streak',
        name: 'Winning Streak',
        description: 'Win 5 games in a row',
        icon: '🔥',
        unlocked: playerStats.bestStreak >= 5,
        unlockedDate: playerStats.bestStreak >= 5 ? playerStats.lastGameDate : undefined,
        progress: Math.min(playerStats.bestStreak, 5),
        maxProgress: 5
      },
      {
        id: 'rating_climber',
        name: 'Rating Climber',
        description: 'Reach a rating of 1500',
        icon: '📈',
        unlocked: playerStats.rating >= 1500,
        unlockedDate: playerStats.rating >= 1500 ? playerStats.lastGameDate : undefined,
        progress: Math.min(playerStats.rating, 1500),
        maxProgress: 1500
      },
      {
        id: 'grandmaster',
        name: 'Grandmaster',
        description: 'Win 100 games',
        icon: '👑',
        unlocked: playerStats.wins >= 100,
        unlockedDate: playerStats.wins >= 100 ? playerStats.lastGameDate : undefined,
        progress: Math.min(playerStats.wins, 100),
        maxProgress: 100
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Win a blitz game in under 3 minutes',
        icon: '⚡',
        unlocked: false, // Would need to check specific game results
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'endurance',
        name: 'Endurance Master',
        description: 'Play a classical game lasting over 2 hours',
        icon: '⏰',
        unlocked: false, // Would need to check specific game results
        progress: 0,
        maxProgress: 1
      }
    ];
    
    return achievements;
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem('chessGameResults');
    localStorage.removeItem('chessPlayerStats');
  }
} 