import React from 'react';
import { Chess } from 'chess.js';
import { History, Download } from 'lucide-react';

interface MoveHistoryProps {
  chess: Chess;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ chess }) => {
  const history = chess.history();
  
  const groupedMoves = [];
  for (let i = 0; i < history.length; i += 2) {
    groupedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1]
    });
  }

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

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 max-w-md transition-all duration-300 hover:scale-105 hover:bg-white/15">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <History className="text-amber-400 animate-pulse" size={24} />
          <h3 className="text-lg font-bold text-white">Move History</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={exportPGN}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 text-white/80 hover:text-white hover:scale-105"
            title="Export PGN"
          >
            <Download size={16} />
            <span className="font-medium">PGN</span>
          </button>
        )}
      </div>
      
      <div className="overflow-visible">
        {groupedMoves.length === 0 ? (
          <div className="text-center text-white/60 text-sm py-6 bg-white/5 rounded-lg">
            No moves yet
          </div>
        ) : (
          <div className="space-y-2">
            {groupedMoves.map((group) => (
              <div key={group.moveNumber} className="flex items-center space-x-4 text-base hover:bg-white/10 hover:scale-102 px-3 py-2 rounded-xl transition-all duration-200 border border-transparent hover:border-white/10">
                <span className="w-8 text-white/70 font-semibold">
                  {group.moveNumber}.
                </span>
                <span className="w-24 font-mono text-white font-bold text-lg">
                  {group.white}
                </span>
                <span className="w-24 font-mono text-white/80 font-bold text-lg">
                  {group.black || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};