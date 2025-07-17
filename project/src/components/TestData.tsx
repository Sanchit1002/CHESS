import React from 'react';
import { DataService } from '../services/DataService';
import { GameResult } from '../types';

interface TestDataProps {
  username: string;
  onBack: () => void;
}

export const TestData: React.FC<TestDataProps> = ({ username, onBack }) => {
  const dataService = DataService.getInstance();

  const addTestGame = (result: 'win' | 'loss' | 'draw') => {
    const opponent = 'TestOpponent';
    const winner = result === 'win' ? username : result === 'loss' ? opponent : null;
    
    const ratings = dataService.calculateGameRatings(username, opponent, winner);
    
    const gameResult: GameResult = {
      id: `test_${Date.now()}`,
      player1: username,
      player2: opponent,
      winner,
      result,
      date: new Date(),
      duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
      moves: Math.floor(Math.random() * 50) + 20,
      timeControl: 'rapid',
      pgn: '1. e4 e5 2. Nf3 Nc6',
      player1Rating: ratings.player1Rating,
      player2Rating: ratings.player2Rating,
      player1RatingChange: ratings.player1RatingChange,
      player2RatingChange: ratings.player2RatingChange
    };
    
    dataService.saveGameResult(gameResult);
    alert(`Test game added: ${result.toUpperCase()}`);
  };

  const clearAllData = () => {
    dataService.clearAllData();
    alert('All data cleared!');
  };

  const showStats = () => {
    const stats = dataService.getPlayerStatsByUsername(username);
    const games = dataService.getPlayerGameResults(username);
    alert(`Stats for ${username}:\nRating: ${stats?.rating || 1200}\nGames: ${games.length}\nWins: ${stats?.wins || 0}\nLosses: ${stats?.losses || 0}\nDraws: ${stats?.draws || 0}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-300">🧪 Test Real Data Tracking</h1>
            <div className="w-24"></div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Testing Real Data for: {username}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Test Games</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => addTestGame('win')}
                    className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Add Win
                  </button>
                  <button
                    onClick={() => addTestGame('loss')}
                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Add Loss
                  </button>
                  <button
                    onClick={() => addTestGame('draw')}
                    className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Add Draw
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Management</h3>
                <div className="space-y-2">
                  <button
                    onClick={showStats}
                    className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Show Current Stats
                  </button>
                  <button
                    onClick={clearAllData}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">How it works:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Click "Add Win/Loss/Draw" to simulate game results</li>
                <li>• Each game updates your rating using ELO system</li>
                <li>• Check Analytics & Competitive pages to see real data</li>
                <li>• Data is stored in localStorage and persists between sessions</li>
                <li>• Use "Clear All Data" to reset everything</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 