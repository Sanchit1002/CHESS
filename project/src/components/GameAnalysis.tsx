import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Brain, Target, Zap } from 'lucide-react';

interface GameAnalysisProps {
  chess: Chess;
  selectedSquare: string | null;
}

interface PieceValue {
  piece: string;
  value: number;
  symbol: string;
}

const PIECE_VALUES: PieceValue[] = [
  { piece: 'p', value: 1, symbol: '♙' },
  { piece: 'n', value: 3, symbol: '♘' },
  { piece: 'b', value: 3, symbol: '♗' },
  { piece: 'r', value: 5, symbol: '♖' },
  { piece: 'q', value: 9, symbol: '♕' },
  { piece: 'k', value: 0, symbol: '♔' }
];

export const GameAnalysis: React.FC<GameAnalysisProps> = ({ chess, selectedSquare }) => {
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [materialCount, setMaterialCount] = useState({ white: 0, black: 0 });
  const [suggestedMoves, setSuggestedMoves] = useState<string[]>([]);

  useEffect(() => {
    if (selectedSquare) {
      const moves = chess.moves({ square: selectedSquare as any, verbose: true });
      setLegalMoves(moves.map(move => move.to));
    } else {
      setLegalMoves([]);
    }
  }, [selectedSquare, chess]);

  useEffect(() => {
    // Calculate material count
    let whiteMaterial = 0;
    let blackMaterial = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = String.fromCharCode(97 + col) + (8 - row);
        const piece = chess.get(square as any);
        if (piece) {
          const pieceValue = PIECE_VALUES.find(p => p.piece === piece.type)?.value || 0;
          if (piece.color === 'w') {
            whiteMaterial += pieceValue;
          } else {
            blackMaterial += pieceValue;
          }
        }
      }
    }
    
    setMaterialCount({ white: whiteMaterial, black: blackMaterial });
  }, [chess]);

  useEffect(() => {
    // Generate suggested moves (simple heuristic)
    if (selectedSquare) {
      const moves = chess.moves({ square: selectedSquare as any, verbose: true });
      const captures = moves.filter(move => move.captured);
      const suggested = captures.length > 0 ? captures.slice(0, 3).map(m => m.to) : moves.slice(0, 3).map(m => m.to);
      setSuggestedMoves(suggested);
    } else {
      setSuggestedMoves([]);
    }
  }, [selectedSquare, chess]);

  const getPieceSymbol = (piece: string): string => {
    const pieceInfo = PIECE_VALUES.find(p => p.piece === piece);
    return pieceInfo?.symbol || piece;
  };

  const getSquareName = (square: string): string => {
    return square.toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="text-amber-600" size={20} />
        <h3 className="text-lg font-bold text-gray-800">Game Analysis</h3>
      </div>

      <div className="space-y-4">
        {/* Material Count */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Material Count</h4>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-800 rounded-full"></div>
              <span className="text-sm">White: {materialCount.white}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
              <span className="text-sm">Black: {materialCount.black}</span>
            </div>
          </div>
        </div>

        {/* Legal Moves */}
        {selectedSquare && legalMoves.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Legal Moves</h4>
            <div className="grid grid-cols-4 gap-1">
              {legalMoves.map((move, index) => (
                <button
                  key={index}
                  className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 rounded transition-colors"
                >
                  {getSquareName(move)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Moves */}
        {selectedSquare && suggestedMoves.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-1">
              <Target className="text-green-600" size={14} />
              <span>Suggested Moves</span>
            </h4>
            <div className="grid grid-cols-3 gap-1">
              {suggestedMoves.map((move, index) => (
                <button
                  key={index}
                  className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
                >
                  {getSquareName(move)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Piece Values */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Piece Values</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {PIECE_VALUES.map((piece) => (
              <div key={piece.piece} className="flex items-center space-x-2">
                <span className="text-lg">{piece.symbol}</span>
                <span className="text-gray-600">{piece.value} points</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Status */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Game Status</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>In Check:</span>
              <span className={chess.isCheck() ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                {chess.isCheck() ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Checkmate:</span>
              <span className={chess.isCheckmate() ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                {chess.isCheckmate() ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Stalemate:</span>
              <span className={chess.isStalemate() ? 'text-yellow-600 font-semibold' : 'text-gray-600'}>
                {chess.isStalemate() ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Draw:</span>
              <span className={chess.isDraw() ? 'text-yellow-600 font-semibold' : 'text-gray-600'}>
                {chess.isDraw() ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 