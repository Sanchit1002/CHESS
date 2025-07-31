import React, { useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { History, Download } from 'lucide-react';

interface MoveHistoryProps {
  chess: Chess;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ chess }) => {
  const history = chess.history();
  const movesEndRef = useRef<null | HTMLDivElement>(null);

  const groupedMoves = [];
  for (let i = 0; i < history.length; i += 2) {
    groupedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1]
    });
  }

  // This effect will automatically scroll to the latest move
  useEffect(() => {
    // New, corrected code
  movesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [groupedMoves]);


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
    // <<< UPDATED: Changed padding from p-6 to p-4 for a more compact look >>>
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-4 max-w-md transition-all duration-300 hover:scale-105 hover:bg-white/15 flex flex-col">
      {/* <<< UPDATED: Reduced margin-bottom from mb-4 to mb-2 >>> */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <History className="text-amber-400" size={24} />
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
      
      {/* <<< UPDATED: Shortened max-height from max-h-96 to max-h-80 >>> */}
      <div className="overflow-y-auto max-h-80 pr-2 -mr-2">
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
            {/* This empty div is a target for the auto-scroll */}
            <div ref={movesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
