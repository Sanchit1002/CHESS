import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Download, Upload, BarChart3, Save } from 'lucide-react';

interface GameExportProps {
  chess: Chess;
  onLoadGame: (pgn: string) => void;
}

interface GameStats {
  totalGames: number;
  wins: { white: number; black: number };
  draws: number;
  averageMoves: number;
}

export const GameExport: React.FC<GameExportProps> = ({ chess, onLoadGame }) => {
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('chessStats');
    return saved ? JSON.parse(saved) : {
      totalGames: 0,
      wins: { white: 0, black: 0 },
      draws: 0,
      averageMoves: 0
    };
  });

  const exportPGN = () => {
    const pgn = chess.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${new Date().toISOString().split('T')[0]}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportFEN = () => {
    const fen = chess.fen();
    const blob = new Blob([fen], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-position-${new Date().toISOString().split('T')[0]}.fen`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importPGN = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const pgn = e.target?.result as string;
        try {
          onLoadGame(pgn);
        } catch (error) {
          alert('Invalid PGN file');
        }
      };
      reader.readAsText(file);
    }
  };

  const saveGame = () => {
    const gameData = {
      pgn: chess.pgn(),
      fen: chess.fen(),
      timestamp: new Date().toISOString(),
      moves: chess.history().length
    };
    
    const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
    savedGames.push(gameData);
    localStorage.setItem('savedGames', JSON.stringify(savedGames));
    
    alert('Game saved successfully!');
  };

  const loadSavedGames = () => {
    const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
    return savedGames;
  };

  const loadGame = (pgn: string) => {
    try {
      onLoadGame(pgn);
    } catch (error) {
      alert('Error loading game');
    }
  };

  const updateStats = (result: 'white' | 'black' | 'draw') => {
    const newStats = { ...stats };
    newStats.totalGames++;
    
    if (result === 'draw') {
      newStats.draws++;
    } else {
      newStats.wins[result]++;
    }
    
    newStats.averageMoves = Math.round(
      (newStats.averageMoves * (newStats.totalGames - 1) + chess.history().length) / newStats.totalGames
    );
    
    setStats(newStats);
    localStorage.setItem('chessStats', JSON.stringify(newStats));
  };

  const resetStats = () => {
    const newStats = {
      totalGames: 0,
      wins: { white: 0, black: 0 },
      draws: 0,
      averageMoves: 0
    };
    setStats(newStats);
    localStorage.setItem('chessStats', JSON.stringify(newStats));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center space-x-2 mb-4">
        <Save className="text-amber-600" size={20} />
        <h3 className="text-lg font-bold text-gray-800">Game Export/Import</h3>
      </div>

      <div className="space-y-4">
        {/* Export Options */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Export</h4>
          <div className="space-y-2">
            <button
              onClick={exportPGN}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Export PGN</span>
            </button>
            <button
              onClick={exportFEN}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              <Download size={16} />
              <span>Export FEN</span>
            </button>
            <button
              onClick={saveGame}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm"
            >
              <Save size={16} />
              <span>Save Game</span>
            </button>
          </div>
        </div>

        {/* Import Options */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Import</h4>
          <div className="space-y-2">
            <label className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm cursor-pointer">
              <Upload size={16} />
              <span>Import PGN</span>
              <input
                type="file"
                accept=".pgn,.txt"
                onChange={importPGN}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Saved Games */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Saved Games</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {loadSavedGames().map((game: any, index: number) => (
              <button
                key={index}
                onClick={() => loadGame(game.pgn)}
                className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded transition-colors"
              >
                <div className="flex justify-between">
                  <span>Game {index + 1}</span>
                  <span>{game.moves} moves</span>
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(game.timestamp).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
              <BarChart3 size={14} />
              <span>Statistics</span>
            </h4>
            <button
              onClick={resetStats}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Total Games:</span>
              <span className="font-medium">{stats.totalGames}</span>
            </div>
            <div className="flex justify-between">
              <span>White Wins:</span>
              <span className="font-medium">{stats.wins.white}</span>
            </div>
            <div className="flex justify-between">
              <span>Black Wins:</span>
              <span className="font-medium">{stats.wins.black}</span>
            </div>
            <div className="flex justify-between">
              <span>Draws:</span>
              <span className="font-medium">{stats.draws}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Moves:</span>
              <span className="font-medium">{stats.averageMoves}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 