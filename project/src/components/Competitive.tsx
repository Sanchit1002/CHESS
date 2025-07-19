import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Crown, 
  Shield, 
  Star, 
  Medal, 
  ArrowLeft, 
  Calendar,
  Target,
  Award,
  Zap,
  Flame,
  Brain,
  Gamepad2,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { DataService } from '../services/DataService';
import { PlayerStats, LeaderboardEntry } from '../types';

interface Player {
  id: string;
  username: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  rank: number;
  seasonalPoints: number;
  isOnline: boolean;
  lastSeen?: Date;
}

interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  rewards: string[];
}



interface CompetitiveProps {
  onBack: () => void;
  username: string;
}

export const Competitive: React.FC<CompetitiveProps> = ({ onBack, username }) => {
  const [activeTab, setActiveTab] = useState<'rating' | 'leaderboards' | 'seasons' | 'protection'>('rating');
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [ratingProtection, setRatingProtection] = useState(false);
  const [showTierSystem, setShowTierSystem] = useState(false);
  const dataService = DataService.getInstance();

  // Load real data
  useEffect(() => {
    const loadData = async () => {
      try {
    // Get all player stats
        const allPlayerStats = await dataService.getPlayerStats();
        const leaderboard = await dataService.getLeaderboard();
    
        // Convert to Player format and sort by rating (highest first)
        const realPlayers: Player[] = allPlayerStats
          .sort((a, b) => b.rating - a.rating) // Sort by rating descending
          .map((stats, index) => {
            // Calculate seasonal points for each player
            const seasonalPoints = stats.gamesPlayed * 10 + stats.wins * 50 + Math.floor(stats.winRate * 2) + Math.floor(stats.rating / 10);
            
            return {
      id: stats.username,
      username: stats.username,
      rating: stats.rating,
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winRate: stats.winRate,
      rank: index + 1,
              seasonalPoints: seasonalPoints,
      isOnline: Math.random() > 0.3, // Mock online status
      lastSeen: stats.lastGameDate
            };
          });
    
    setPlayers(realPlayers);
    
    // Set current player
    const currentPlayerData = realPlayers.find(p => p.username === username) || {
      id: 'current',
      username: username,
      rating: 1200,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      rank: realPlayers.length + 1,
          seasonalPoints: 0, // Will be calculated by calculateSeasonalPoints function
      isOnline: true
    };
    setCurrentPlayer(currentPlayerData);

    // Mock seasons data (keeping this as mock for now)
    const mockSeasons: Season[] = [
      {
        id: '1',
            name: 'Monsoon Special Championship 2025',
            startDate: new Date('2025-07-01'),
            endDate: new Date('2025-08-30'),
        isActive: true,
        rewards: ['🏆 Champion Trophy', '🎖️ Gold Medal', '💰 1000 Points']
      },
      {
        id: '2',
            name: 'Spring Masters 2025',
            startDate: new Date('2025-04-01'),
            endDate: new Date('2025-06-30'),
        isActive: false,
        rewards: ['🥈 Silver Medal', '🎖️ Bronze Medal', '💰 500 Points']
      },
      {
        id: '3',
            name: 'Winter Masters 2024',
            startDate: new Date('2024-10-01'),
            endDate: new Date('2024-12-31'),
        isActive: false,
        rewards: ['🥉 Bronze Medal', '💰 250 Points']
      }
    ];
    setSeasons(mockSeasons);
      } catch (error) {
        console.error('Error loading competitive data:', error);
      }
    };

    loadData();
  }, [username, dataService]);

  const getRatingColor = (rating: number) => {
    if (rating >= 1800) return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    if (rating >= 1600) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (rating >= 1400) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (rating >= 1200) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  };

  const getRatingTitle = (rating: number) => {
    if (rating >= 1800) return 'Grandmaster';
    if (rating >= 1600) return 'Master';
    if (rating >= 1400) return 'Expert';
    if (rating >= 1200) return 'Advanced';
    return 'Beginner';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  // Calculate seasonal points based on player performance
  const calculateSeasonalPoints = (player: Player | null): number => {
    if (!player) return 0;
    
    // Base points for games played
    const basePoints = player.gamesPlayed * 10;
    
    // Bonus points for wins (more points for wins)
    const winPoints = player.wins * 50;
    
    // Bonus points for win rate (higher win rate = more points)
    const winRateBonus = Math.floor(player.winRate * 2);
    
    // Rating bonus (higher rating = more points)
    const ratingBonus = Math.floor(player.rating / 10);
    
    return basePoints + winPoints + winRateBonus + ratingBonus;
  };

  // Check if player has reached 5000 points
  const hasReached5000Points = (player: Player | null): boolean => {
    return calculateSeasonalPoints(player) >= 5000;
  };

  // Get season tier based on points
  const getSeasonTier = (points: number): string => {
    if (points >= 10000) return 'Legendary';
    if (points >= 7500) return 'Master';
    if (points >= 5000) return 'Champion';
    if (points >= 2500) return 'Veteran';
    if (points >= 1000) return 'Rookie';
    return 'Beginner';
  };

  // Tier system data
  const tierSystem = [
    { name: 'Beginner', minPoints: 0, maxPoints: 999, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200', icon: '🌱' },
    { name: 'Rookie', minPoints: 1000, maxPoints: 2499, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200', icon: '⭐' },
    { name: 'Veteran', minPoints: 2500, maxPoints: 4999, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', icon: '🎖️' },
    { name: 'Champion', minPoints: 5000, maxPoints: 7499, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200', icon: '🏆' },
    { name: 'Master', minPoints: 7500, maxPoints: 9999, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200', icon: '👑' },
    { name: 'Legendary', minPoints: 10000, maxPoints: Infinity, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', icon: '🔥' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-300">🏆 Competitive</h1>
            <p className="text-gray-600 dark:text-white">Track your progress and compete</p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('rating')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'rating'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Target size={18} />
                <span>Rating</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('leaderboards')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'leaderboards'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Trophy size={18} />
                <span>Leaderboards</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('seasons')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'seasons'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar size={18} />
                <span>Seasons</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('protection')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'protection'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield size={18} />
                <span>Protection</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'rating' && currentPlayer && (
            <div className="space-y-8">
              {/* Current Player Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                      <Crown className="text-amber-600 dark:text-amber-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentPlayer.username}</h2>
                      <p className="text-gray-600 dark:text-gray-400">{getRatingTitle(currentPlayer.rating)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(currentPlayer.rating)}`}>
                      <Target size={16} className="mr-1" />
                      {currentPlayer.rating} ELO
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{currentPlayer.wins}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{currentPlayer.losses}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{currentPlayer.draws}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Draws</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{currentPlayer.winRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
                  </div>
                </div>

                {/* Rating Progress */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Rating Progress</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Next Level (1600)</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {currentPlayer.rating}/1600
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(currentPlayer.rating, 1600)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating History Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Rating History</h3>
                <div className="h-64 flex items-end justify-center space-x-2">
                  {[1100, 1150, 1180, 1200, 1220, 1250, 1230, 1200, 1180, 1200].map((rating, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-6 bg-gradient-to-t from-amber-500 to-orange-500 rounded-t"
                        style={{ height: `${((rating - 1100) / 200) * 200}px` }}
                      ></div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{rating}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">Last 10 games rating progression</p>
              </div>
            </div>
          )}

          {activeTab === 'leaderboards' && (
            <div className="space-y-6">
              {/* Global Leaderboard */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Global Leaderboard</h3>
                  <p className="text-gray-600 dark:text-gray-400">Top players worldwide</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Player</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Games</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Win Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {players.slice(0, 10).map((player, index) => (
                        <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-lg font-bold text-amber-600">{getRankIcon(player.rank)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'} mr-3`}></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{player.username}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{getRatingTitle(player.rating)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(player.rating)}`}>
                              {player.rating}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {player.gamesPlayed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {player.winRate.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index % 3 === 0 ? (
                                <ChevronUp className="text-green-500" size={16} />
                              ) : index % 3 === 1 ? (
                                <ChevronDown className="text-red-500" size={16} />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                              <span className={`text-sm font-medium ml-1 ${
                                index % 3 === 0 ? 'text-green-600' : 
                                index % 3 === 1 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {index % 3 === 0 ? '+12' : index % 3 === 1 ? '-8' : '0'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Friends Leaderboard */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Friends Leaderboard</h3>
                  <p className="text-gray-600 dark:text-gray-400">Your friends' rankings</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Friend</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {players.slice(0, 5).map((player, index) => (
                        <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-amber-600">#{index + 1}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{player.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(player.rating)}`}>
                              {player.rating}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {player.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seasons' && (
            <div className="space-y-6">
              {/* Current Season */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Trophy className="text-amber-600 dark:text-amber-400" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Current Season</h3>
                      <p className="text-gray-600 dark:text-gray-400">Monsoon Special Championship 2025</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">
                      {Math.max(0, Math.ceil((new Date('2025-08-30').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ends August 30, 2025</div>
                  </div>
                </div>

                {/* Season Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Season Progress</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {calculateSeasonalPoints(currentPlayer).toLocaleString()} / 5,000 points
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(calculateSeasonalPoints(currentPlayer), 5000)}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {calculateProgress(calculateSeasonalPoints(currentPlayer), 5000).toFixed(0)}% complete • {Math.max(0, Math.ceil((new Date('2025-08-30').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days remaining
                  </div>
                  
                  {/* Season Tier Display */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Crown className="text-amber-600 dark:text-amber-400" size={20} />
                        <span className="font-semibold text-amber-800 dark:text-amber-200">Current Tier:</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        getSeasonTier(calculateSeasonalPoints(currentPlayer)) === 'Champion' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
                        getSeasonTier(calculateSeasonalPoints(currentPlayer)) === 'Master' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                        getSeasonTier(calculateSeasonalPoints(currentPlayer)) === 'Veteran' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                      }`}>
                        {getSeasonTier(calculateSeasonalPoints(currentPlayer))}
                      </div>
                    </div>
                  </div>

                  {/* 5000 Points Achievement */}
                  {hasReached5000Points(currentPlayer) && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-600">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">🏆</div>
                        <div>
                          <div className="font-bold text-purple-800 dark:text-purple-200">Champion Achievement Unlocked!</div>
                          <div className="text-sm text-purple-600 dark:text-purple-300">You've reached 5,000+ seasonal points!</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next Tier Progress */}
                  {!hasReached5000Points(currentPlayer) && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-semibold">Next Tier:</span> Champion (5,000 points)
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        {5000 - calculateSeasonalPoints(currentPlayer)} points needed
                      </div>
                    </div>
                  )}
                </div>

                {/* Season Rewards */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Season Rewards</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                      <div className="text-2xl mb-2">🏆</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Champion Trophy</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Top 1 player</div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                      <div className="text-2xl mb-2">🎖️</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Gold Medal</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Top 3 players</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">1000 Points</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Top 10 players</div>
                    </div>
                  </div>
                </div>

                {/* Tier System Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowTierSystem(true)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Crown size={20} />
                      <span>View Tier System</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Past Seasons */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Past Seasons</h3>
                  <p className="text-gray-600 dark:text-gray-400">Previous competitions</p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {seasons.filter(s => !s.isActive).map((season) => (
                    <div key={season.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{season.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(season.startDate)} - {formatDate(season.endDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Rewards</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {season.rewards.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'protection' && (
            <div className="space-y-6">
              {/* Rating Protection Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="text-amber-600 dark:text-amber-400" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Rating Protection</h3>
                    <p className="text-gray-600 dark:text-gray-400">Protect your rating in casual games</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Casual Game Protection</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Rating changes won't affect your competitive rating in casual games
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ratingProtection}
                        onChange={(e) => setRatingProtection(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-800 dark:text-green-200">Protected Games</span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Games with friends, practice matches, and casual play won't affect your competitive rating
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-semibold text-blue-800 dark:text-blue-200">Competitive Games</span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Ranked matches, tournaments, and ladder games will still affect your rating
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="text-amber-600 dark:text-amber-400" size={20} />
                      <span className="font-semibold text-amber-800 dark:text-amber-200">Protection Benefits</span>
                    </div>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Practice without fear of losing rating</li>
                      <li>• Try new strategies risk-free</li>
                      <li>• Play with friends casually</li>
                      <li>• Maintain competitive rating integrity</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tier System Modal */}
      {showTierSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Season Tier System</h2>
                <button
                  onClick={() => setShowTierSystem(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Complete tier system with point requirements</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {tierSystem.map((tier, index) => {
                  const isCurrentTier = calculateSeasonalPoints(currentPlayer) >= tier.minPoints && calculateSeasonalPoints(currentPlayer) <= tier.maxPoints;
                  const isCompleted = calculateSeasonalPoints(currentPlayer) > tier.maxPoints;
                  
                  return (
                    <div key={tier.name} className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isCurrentTier 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{tier.icon}</div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">{tier.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {tier.minPoints.toLocaleString()} - {tier.maxPoints === Infinity ? '∞' : tier.maxPoints.toLocaleString()} points
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCurrentTier && (
                            <div className="px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-full">
                              Current
                            </div>
                          )}
                          {isCompleted && (
                            <div className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                              ✓ Completed
                            </div>
                          )}
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${tier.color}`}>
                            {tier.name}
                          </div>
                        </div>
                      </div>
                      
                      {isCurrentTier && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress to next tier</span>
                            <span>{calculateSeasonalPoints(currentPlayer)} / {tier.maxPoints + 1}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${calculateProgress(calculateSeasonalPoints(currentPlayer), tier.maxPoints + 1)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">How to Earn Points:</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>Play games:</strong> 10 points per game</li>
                  <li>• <strong>Win games:</strong> 50 points per win</li>
                  <li>• <strong>Win rate bonus:</strong> 2 points per 1% win rate</li>
                  <li>• <strong>Rating bonus:</strong> 1 point per 10 rating points</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 