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
  ChevronDown
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

interface LeaderboardEntry {
  rank: number;
  player: Player;
  change: number; // rating change
  seasonalRank?: number;
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
  const dataService = DataService.getInstance();

  // Load real data
  useEffect(() => {
    // Get all player stats
    const allPlayerStats = dataService.getPlayerStats();
    const leaderboard = dataService.getLeaderboard();
    
    // Convert to Player format
    const realPlayers: Player[] = allPlayerStats.map((stats, index) => ({
      id: stats.username,
      username: stats.username,
      rating: stats.rating,
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winRate: stats.winRate,
      rank: index + 1,
      seasonalPoints: Math.floor(stats.rating * 0.8), // Mock seasonal points
      isOnline: Math.random() > 0.3, // Mock online status
      lastSeen: stats.lastGameDate
    }));
    
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
      seasonalPoints: 0,
      isOnline: true
    };
    setCurrentPlayer(currentPlayerData);

    // Mock seasons data (keeping this as mock for now)
    const mockSeasons: Season[] = [
      {
        id: '1',
        name: 'Winter Championship 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        isActive: true,
        rewards: ['🏆 Champion Trophy', '🎖️ Gold Medal', '💰 1000 Points']
      },
      {
        id: '2',
        name: 'Spring Masters 2024',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        isActive: false,
        rewards: ['🥈 Silver Medal', '🎖️ Bronze Medal', '💰 500 Points']
      },
      {
        id: '3',
        name: 'Summer Grand Prix 2024',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-09-30'),
        isActive: false,
        rewards: ['🥉 Bronze Medal', '💰 250 Points']
      }
    ];
    setSeasons(mockSeasons);
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
                      <p className="text-gray-600 dark:text-gray-400">Winter Championship 2024</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">45 days left</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ends March 31, 2024</div>
                  </div>
                </div>

                {/* Season Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Season Progress</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">2,450 / 5,000 points</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: '49%' }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    49% complete • 49 days remaining
                  </div>
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
    </div>
  );
}; 