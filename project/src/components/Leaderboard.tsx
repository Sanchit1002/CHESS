import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Users, TrendingUp, ArrowLeft } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface PlayerStats {
  id: string;
  username: string;
  email: string;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    elo: number;
  };
  achievements: {
    createdAt: any;
    elo: number;
  };
}

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'elo' | 'wins' | 'winrate'>('elo');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let q;
      
      switch (activeTab) {
        case 'elo':
          q = query(usersRef, orderBy('achievements.elo', 'desc'), limit(10));
          break;
        case 'wins':
          q = query(usersRef, orderBy('stats.wins', 'desc'), limit(10));
          break;
        case 'winrate':
          // We'll calculate winrate in the component
          q = query(usersRef, limit(50));
          break;
        default:
          q = query(usersRef, orderBy('achievements.elo', 'desc'), limit(10));
      }

      const snapshot = await getDocs(q);
      const playersData: PlayerStats[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.stats && data.achievements) {
          playersData.push({ id: doc.id, ...data } as PlayerStats);
        }
      });

      // Calculate winrate and sort if needed
      if (activeTab === 'winrate') {
        playersData.sort((a, b) => {
          const aTotal = a.stats.wins + a.stats.losses + a.stats.draws;
          const bTotal = b.stats.wins + b.stats.losses + b.stats.draws;
          const aWinrate = aTotal > 0 ? a.stats.wins / aTotal : 0;
          const bWinrate = bTotal > 0 ? b.stats.wins / bTotal : 0;
          return bWinrate - aWinrate;
        });
        playersData.splice(10); // Keep top 10
      }

      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinrate = (stats: PlayerStats['stats']) => {
    const total = stats.wins + stats.losses + stats.draws;
    return total > 0 ? ((stats.wins / total) * 100).toFixed(1) : '0.0';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={20} />;
      case 2:
        return <Medal className="text-gray-400" size={20} />;
      case 3:
        return <Medal className="text-amber-600" size={20} />;
      default:
        return <span className="text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'elo': return 'ELO Rating';
      case 'wins': return 'Total Wins';
      case 'winrate': return 'Win Rate';
      default: return tab;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
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
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Trophy className="text-yellow-500" size={32} />
              <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-300">Leaderboard</h1>
            </div>
            <p className="text-gray-600 dark:text-white">Top players in the chess community</p>
          </div>
          
          <div className="w-24"></div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            {(['elo', 'wins', 'winrate'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-white">Loading leaderboard...</p>
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No players yet</p>
                <p className="text-gray-400 dark:text-gray-500">Start playing to appear on the leaderboard!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {players.map((player, index) => (
                  <div key={player.id} className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {player.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {player.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {activeTab === 'elo' && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {player.stats.elo}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ELO</div>
                        </div>
                      )}
                      
                      {activeTab === 'wins' && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {player.stats.wins}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Wins</div>
                        </div>
                      )}
                      
                      {activeTab === 'winrate' && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {getWinrate(player.stats)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
                        </div>
                      )}
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {player.stats.wins}W / {player.stats.losses}L / {player.stats.draws}D
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Record</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 