import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { GameResult, PlayerStats } from '../types';

export interface FirebaseGameResult {
  id?: string;
  player1: string;
  player2: string;
  winner: string | null;
  result: 'win' | 'loss' | 'draw';
  date: Timestamp;
  duration: number; // in seconds
  moves: number;
  timeControl: string;
  pgn: string;
  player1Rating: number;
  player2Rating: number;
  player1RatingChange: number;
  player2RatingChange: number;
  gameType: 'local' | 'ai' | 'multiplayer';
  roomId?: string;
}

export interface FirebasePlayerStats {
  username: string;
  email: string;
  elo: number;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
    winRate: number;
    averageGameTime: number;
    averageMoves: number;
    currentStreak: number;
    bestStreak: number;
  };
  createdAt: Timestamp;
  lastGameDate?: Timestamp;
}

export class FirebaseService {
  private static instance: FirebaseService;
  
  private constructor() {}
  
  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Save game result to Firebase
  async saveGameResult(gameResult: GameResult): Promise<void> {
    try {
      console.log('Attempting to save game result to Firebase:', gameResult);
      
      const firebaseGameResult: FirebaseGameResult = {
        player1: gameResult.player1,
        player2: gameResult.player2,
        winner: gameResult.winner,
        result: gameResult.result,
        date: serverTimestamp() as Timestamp,
        duration: gameResult.duration,
        moves: gameResult.moves,
        timeControl: gameResult.timeControl,
        pgn: gameResult.pgn,
        player1Rating: gameResult.player1Rating,
        player2Rating: gameResult.player2Rating,
        player1RatingChange: gameResult.player1RatingChange,
        player2RatingChange: gameResult.player2RatingChange,
        gameType: 'local' // Default to local, can be updated based on game mode
      };

      console.log('Firebase game result object:', firebaseGameResult);

      // Add to games collection
      const gamesRef = collection(db, 'games');
      console.log('Adding document to games collection...');
      const docRef = await addDoc(gamesRef, firebaseGameResult);
      console.log('Document added with ID:', docRef.id);

      // Update player stats
      console.log('Updating player stats...');
      await this.updatePlayerStats(gameResult);
      
      console.log('✅ Game result successfully saved to Firebase:', gameResult);
    } catch (error) {
      console.error('❌ Error saving game result to Firebase:', error);
      throw error;
    }
  }

  // Get game results for a specific player
  async getPlayerGameResults(username: string): Promise<GameResult[]> {
    try {
      const gamesRef = collection(db, 'games');
      const q = query(
        gamesRef,
        where('player1', '==', username),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const gameResults: GameResult[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseGameResult;
        gameResults.push({
          id: doc.id,
          player1: data.player1,
          player2: data.player2,
          winner: data.winner,
          result: data.result,
          date: data.date.toDate(),
          duration: data.duration,
          moves: data.moves,
          timeControl: data.timeControl,
          pgn: data.pgn,
          player1Rating: data.player1Rating,
          player2Rating: data.player2Rating,
          player1RatingChange: data.player1RatingChange,
          player2RatingChange: data.player2RatingChange
        });
      });

      // Also get games where player is player2
      const q2 = query(
        gamesRef,
        where('player2', '==', username),
        orderBy('date', 'desc')
      );
      
      const querySnapshot2 = await getDocs(q2);
      querySnapshot2.forEach((doc) => {
        const data = doc.data() as FirebaseGameResult;
        gameResults.push({
          id: doc.id,
          player1: data.player1,
          player2: data.player2,
          winner: data.winner,
          result: data.result,
          date: data.date.toDate(),
          duration: data.duration,
          moves: data.moves,
          timeControl: data.timeControl,
          pgn: data.pgn,
          player1Rating: data.player1Rating,
          player2Rating: data.player2Rating,
          player1RatingChange: data.player1RatingChange,
          player2RatingChange: data.player2RatingChange
        });
      });

      // Sort by date descending
      return gameResults.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting player game results from Firebase:', error);
      return [];
    }
  }

  // Get all game results
  async getAllGameResults(): Promise<GameResult[]> {
    try {
      const gamesRef = collection(db, 'games');
      const q = query(gamesRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const gameResults: GameResult[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseGameResult;
        gameResults.push({
          id: doc.id,
          player1: data.player1,
          player2: data.player2,
          winner: data.winner,
          result: data.result,
          date: data.date.toDate(),
          duration: data.duration,
          moves: data.moves,
          timeControl: data.timeControl,
          pgn: data.pgn,
          player1Rating: data.player1Rating,
          player2Rating: data.player2Rating,
          player1RatingChange: data.player1RatingChange,
          player2RatingChange: data.player2RatingChange
        });
      });
      
      return gameResults;
    } catch (error) {
      console.error('Error getting all game results from Firebase:', error);
      return [];
    }
  }

  // Update player stats after a game
  private async updatePlayerStats(gameResult: GameResult): Promise<void> {
    try {
      // Update player 1 stats
      await this.updatePlayerStatsFromGame(gameResult.player1, gameResult);
      
      // Update player 2 stats
      await this.updatePlayerStatsFromGame(gameResult.player2, gameResult);
    } catch (error) {
      console.error('Error updating player stats in Firebase:', error);
      throw error;
    }
  }

  // Update individual player stats
  private async updatePlayerStatsFromGame(username: string, gameResult: GameResult): Promise<void> {
    try {
      const userRef = doc(db, 'users', username);
      const userDoc = await getDoc(userRef);
      
      let currentStats: FirebasePlayerStats;
      
      if (userDoc.exists()) {
        // Update existing user
        const userData = userDoc.data();
        currentStats = {
          username: userData.username,
          email: userData.email,
          elo: userData.elo,
          stats: userData.stats,
          createdAt: userData.createdAt,
          lastGameDate: userData.lastGameDate
        };
      } else {
        // Create new user
        currentStats = {
          username,
          email: '', // Will be set when user signs up
          elo: 1200,
          stats: {
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            winRate: 0,
            averageGameTime: 0,
            averageMoves: 0,
            currentStreak: 0,
            bestStreak: 0
          },
          createdAt: serverTimestamp() as Timestamp
        };
      }

      // Update stats based on game result
      const isPlayer1 = gameResult.player1 === username;
      const ratingChange = isPlayer1 ? gameResult.player1RatingChange : gameResult.player2RatingChange;
      
      // Update rating
      currentStats.elo += ratingChange;
      
      // Update game counts
      currentStats.stats.gamesPlayed++;
      
      // Determine result for this player
      let result: 'win' | 'loss' | 'draw';
      if (gameResult.winner === null) {
        result = 'draw';
        currentStats.stats.draws++;
      } else if (gameResult.winner === username) {
        result = 'win';
        currentStats.stats.wins++;
        currentStats.stats.currentStreak = Math.max(0, currentStats.stats.currentStreak) + 1;
      } else {
        result = 'loss';
        currentStats.stats.losses++;
        currentStats.stats.currentStreak = Math.min(0, currentStats.stats.currentStreak) - 1;
      }
      
      // Update win rate
      currentStats.stats.winRate = (currentStats.stats.wins / currentStats.stats.gamesPlayed) * 100;
      
      // Update average game time
      const totalTime = currentStats.stats.averageGameTime * (currentStats.stats.gamesPlayed - 1) + gameResult.duration;
      currentStats.stats.averageGameTime = totalTime / currentStats.stats.gamesPlayed;
      
      // Update average moves
      const totalMoves = currentStats.stats.averageMoves * (currentStats.stats.gamesPlayed - 1) + gameResult.moves;
      currentStats.stats.averageMoves = totalMoves / currentStats.stats.gamesPlayed;
      
      // Update best streak
      if (result === 'win') {
        currentStats.stats.bestStreak = Math.max(currentStats.stats.bestStreak, currentStats.stats.currentStreak);
      }
      
      // Update last game date
      currentStats.lastGameDate = serverTimestamp() as Timestamp;
      
      // Save updated stats
      await setDoc(userRef, currentStats);
      
    } catch (error) {
      console.error('Error updating player stats from game:', error);
      throw error;
    }
  }

  // Get player stats from Firebase
  async getPlayerStats(): Promise<PlayerStats[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const playerStats: PlayerStats[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebasePlayerStats;
        playerStats.push({
          username: data.username,
          rating: data.elo,
          gamesPlayed: data.stats.gamesPlayed,
          wins: data.stats.wins,
          losses: data.stats.losses,
          draws: data.stats.draws,
          winRate: data.stats.winRate,
          averageGameTime: data.stats.averageGameTime,
          averageMoves: data.stats.averageMoves,
          currentStreak: data.stats.currentStreak,
          bestStreak: data.stats.bestStreak,
          lastGameDate: data.lastGameDate?.toDate()
        });
      });
      
      return playerStats;
    } catch (error) {
      console.error('Error getting player stats from Firebase:', error);
      return [];
    }
  }

  // Get stats for a specific player
  async getPlayerStatsByUsername(username: string): Promise<PlayerStats | null> {
    try {
      const userRef = doc(db, 'users', username);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as FirebasePlayerStats;
        return {
          username: data.username,
          rating: data.elo,
          gamesPlayed: data.stats.gamesPlayed,
          wins: data.stats.wins,
          losses: data.stats.losses,
          draws: data.stats.draws,
          winRate: data.stats.winRate,
          averageGameTime: data.stats.averageGameTime,
          averageMoves: data.stats.averageMoves,
          currentStreak: data.stats.currentStreak,
          bestStreak: data.stats.bestStreak,
          lastGameDate: data.lastGameDate?.toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting player stats by username from Firebase:', error);
      return null;
    }
  }

  // Get leaderboard from Firebase
  async getLeaderboard(): Promise<any[]> {
    try {
      const playerStats = await this.getPlayerStats();
      return playerStats
        .sort((a, b) => b.rating - a.rating)
        .map((player, index) => ({
          rank: index + 1,
          player,
          change: 0 // This would be calculated from recent games
        }));
    } catch (error) {
      console.error('Error getting leaderboard from Firebase:', error);
      return [];
    }
  }

  // Create or update user profile
  async createOrUpdateUser(username: string, email: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', username);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user
        const newUser: FirebasePlayerStats = {
          username,
          email,
          elo: 1200,
          stats: {
            wins: 0,
            losses: 0,
            draws: 0,
            gamesPlayed: 0,
            winRate: 0,
            averageGameTime: 0,
            averageMoves: 0,
            currentStreak: 0,
            bestStreak: 0
          },
          createdAt: serverTimestamp() as Timestamp
        };
        
        await setDoc(userRef, newUser);
        console.log('New user created in Firebase:', username);
      } else {
        // Update existing user's email if needed
        const userData = userDoc.data() as FirebasePlayerStats;
        if (userData.email !== email) {
          await updateDoc(userRef, { email });
          console.log('User email updated in Firebase:', username);
        }
      }
    } catch (error) {
      console.error('Error creating/updating user in Firebase:', error);
      throw error;
    }
  }
} 