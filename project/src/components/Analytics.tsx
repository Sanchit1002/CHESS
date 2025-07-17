import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  ArrowLeft, 
  Calendar,
  Users,
  Zap,
  Crown,
  Star,
  Medal,
  Flame,
  Brain,
  Gamepad2
} from 'lucide-react';
import { DataService } from '../services/DataService';
import { GameResult, PlayerStats, Achievement } from '../types';

interface GameRecord {
  id: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  date: Date;
  duration: number; // in seconds
  moves: number;
  rating: number;
  timeControl: string;
}

interface AnalyticsProps {
  onBack: () => void;
  username: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onBack, username }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements'>('overview');
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const dataService = DataService.getInstance();

  // Load real data
  useEffect(() => {
    // Get player stats
    const stats = dataService.getPlayerStatsByUsername(username);
    setPlayerStats(stats);

    // Get game history for this player
    const playerGameResults = dataService.getPlayerGameResults(username);
    const gameRecords: GameRecord[] = playerGameResults.map(result => ({
      id: result.id,
      opponent: result.player1 === username ? result.player2 : result.player1,
      result: result.result,
      date: result.date,
      duration: result.duration,
      moves: result.moves,
      rating: result.player1 === username ? result.player1Rating : result.player2Rating,
      timeControl: result.timeControl
    }));
    setGameHistory(gameRecords);

    // Get achievements
    const playerAchievements = dataService.getPlayerAchievements(username);
    const achievementsWithIcons: Achievement[] = playerAchievements.map(achievement => ({
      ...achievement,
      iconComponent: getAchievementIcon(achievement.icon)
    }));
    setAchievements(achievementsWithIcons);
  }, [username, dataService]);

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case '🏆': return Trophy;
      case '🔥': return Flame;
      case '📈': return TrendingUp;
      case '👑': return Crown;
      case '⚡': return Zap;
      case '⏰': return Clock;
      default: return Trophy;
    }
  };

  const clearAllData = () => {
    dataService.clearAllData();
    // Reload data
    const stats = dataService.getPlayerStatsByUsername(username);
    setPlayerStats(stats);
    setGameHistory([]);
    setAchievements([]);
  };

  // Calculate statistics from real data
  const totalGames = gameHistory.length;
  const wins = gameHistory.filter(game => game.result === 'win').length;
  const losses = gameHistory.filter(game => game.result === 'loss').length;
  const draws = gameHistory.filter(game => game.result === 'draw').length;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const averageGameTime = totalGames > 0 ? gameHistory.reduce((sum, game) => sum + game.duration, 0) / totalGames : 0;
  const currentRating = playerStats?.rating || 1200;
  const averageMoves = totalGames > 0 ? gameHistory.reduce((sum, game) => sum + game.moves, 0) / totalGames : 0;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'loss': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'draw': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win': return '🏆';
      case 'loss': return '💔';
      case 'draw': return '🤝';
      default: return '❓';
    }
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
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-300">📊 Analytics & Learning</h1>
            <p className="text-gray-600 dark:text-white">Track your progress and achievements</p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 size={18} />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar size={18} />
                <span>History</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'achievements'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Trophy size={18} />
                <span>Achievements</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</p>
                      <p className="text-3xl font-bold text-green-600">{winRate.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Trophy className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Rating</p>
                      <p className="text-3xl font-bold text-blue-600">{currentRating}</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <TrendingUp className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Game Time</p>
                      <p className="text-3xl font-bold text-purple-600">{formatDuration(averageGameTime)}</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <Clock className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Games</p>
                      <p className="text-3xl font-bold text-amber-600">{totalGames}</p>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                      <Gamepad2 className="text-amber-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Performance Trend</h3>
                <div className="h-64 flex items-end justify-center space-x-4">
                  {gameHistory.slice(0, 10).reverse().map((game, index) => (
                    <div key={game.id} className="flex flex-col items-center">
                      <div 
                        className="w-8 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t"
                        style={{ height: `${(game.rating / 1500) * 200}px` }}
                      ></div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{game.rating}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">Rating progression over last 10 games</p>
              </div>

              {/* Game Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Game Results</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-medium">Wins</span>
                      <span className="text-2xl font-bold text-green-600">{wins}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600 font-medium">Losses</span>
                      <span className="text-2xl font-bold text-red-600">{losses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-600 font-medium">Draws</span>
                      <span className="text-2xl font-bold text-yellow-600">{draws}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Average Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Moves per Game</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{averageMoves.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Game Duration</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(averageGameTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rating Change</span>
                      <span className="text-xl font-bold text-green-600">+{currentRating - 1200}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Game History</h3>
                <p className="text-gray-600 dark:text-gray-400">Detailed analysis of your recent games</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opponent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Result</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Moves</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time Control</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {gameHistory.map((game) => (
                      <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(game.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {game.opponent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultColor(game.result)}`}>
                            <span className="mr-1">{getResultIcon(game.result)}</span>
                            {game.result.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDuration(game.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {game.moves}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {game.rating}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {game.timeControl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Achievements</h3>
                <p className="text-gray-600 dark:text-gray-400">Unlock badges by reaching milestones</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => {
                  const IconComponent = achievement.iconComponent;
                  return (
                    <div
                      key={achievement.id}
                      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 transition-all duration-200 ${
                        achievement.unlocked
                          ? 'border-amber-300 dark:border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full ${
                          achievement.unlocked 
                            ? 'bg-amber-100 dark:bg-amber-900/30' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {IconComponent ? (
                            <IconComponent 
                              size={24} 
                              className={achievement.unlocked ? 'text-amber-600' : 'text-gray-400'} 
                            />
                          ) : (
                            <span className="text-2xl">{achievement.icon}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-lg ${
                            achievement.unlocked 
                              ? 'text-amber-900 dark:text-amber-300' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {achievement.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {achievement.description}
                          </p>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                achievement.unlocked 
                                  ? 'bg-amber-500' 
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Progress: {achievement.progress}/{achievement.maxProgress}</span>
                            {achievement.unlocked && achievement.unlockedDate && (
                              <span>Unlocked {achievement.unlockedDate.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        {achievement.unlocked && (
                          <div className="absolute top-2 right-2">
                            <Award className="text-amber-500" size={20} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 