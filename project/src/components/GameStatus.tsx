import React from 'react';
import { Chess } from 'chess.js';
import { Crown, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

interface GameStatusProps {
  chess: Chess;
  onResetGame: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({ chess, onResetGame }) => {
  const getStatusMessage = (): string => {
    if (chess.isCheckmate()) {
      return `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
    }
    if (chess.isStalemate()) {
      return 'Stalemate! Game is a draw.';
    }
    if (chess.isDraw()) {
      return 'Draw! Game ended in a draw.';
    }
    if (chess.isCheck()) {
      return `${chess.turn() === 'w' ? 'White' : 'Black'} king is in check!`;
    }
    return `${chess.turn() === 'w' ? 'White' : 'Black'} to move`;
  };

  const getStatusColor = (): string => {
    if (chess.isCheckmate()) return 'text-red-400';
    if (chess.isStalemate() || chess.isDraw()) return 'text-yellow-400';
    if (chess.isCheck()) return 'text-orange-400';
    return 'text-white';
  };

  const getStatusIcon = () => {
    if (chess.isCheckmate()) return <AlertTriangle className="text-red-400" size={24} />;
    if (chess.isStalemate() || chess.isDraw()) return <AlertTriangle className="text-yellow-400" size={24} />;
    if (chess.isCheck()) return <AlertTriangle className="text-orange-400" size={24} />;
    return <Crown className="text-amber-400" size={24} />;
  };

  const isGameOver = chess.isGameOver();
  const moveCount = Math.ceil(chess.history().length / 2);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 space-y-4 max-w-md transition-all duration-300 hover:scale-105 hover:bg-white/15">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="text-amber-400 animate-pulse" size={28} />
          <h2 className="text-xl font-bold text-white">Chess Game</h2>
        </div>
        <button
          onClick={onResetGame}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 text-white/80 hover:text-white hover:scale-105"
          title="Reset Game"
        >
          <RotateCcw size={18} className="animate-spin" />
          <span className="text-sm font-medium">Reset</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div className="text-lg font-semibold text-white bg-white/5 px-3 py-1 rounded-lg">{getStatusMessage()}</div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded-full shadow-lg hover:scale-110 transition-transform"></div>
            <span className="text-sm font-medium text-white/90">White</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-gray-800 border-2 border-gray-600 rounded-full shadow-lg hover:scale-110 transition-transform"></div>
            <span className="text-sm font-medium text-white/90">Black</span>
          </div>
        </div>
      </div>
    </div>
  );
};