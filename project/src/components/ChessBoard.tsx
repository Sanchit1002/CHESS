import React, { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChessPiece } from './ChessPiece';

interface ChessBoardProps {
  chess: Chess;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  onSquareSelect?: (square: string) => void;
  isGameOver: boolean;
  isFlipped?: boolean;
  selectedSquare?: string | null;
  boardTheme?: string;
}

const BOARD_THEMES = {
  classic: {
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
    selectedSquare: '#7b61ff',
    validMove: '#f7f769',
    lastMove: '#f7f769'
  },
  blue: {
    lightSquare: '#e8f4fd',
    darkSquare: '#7fa6d1',
    selectedSquare: '#4a90e2',
    validMove: '#7ed321',
    lastMove: '#f5a623'
  },
  green: {
    lightSquare: '#f0f8f0',
    darkSquare: '#769656',
    selectedSquare: '#4caf50',
    validMove: '#8bc34a',
    lastMove: '#ff9800'
  },
  brown: {
    lightSquare: '#f4e4bc',
    darkSquare: '#8b4513',
    selectedSquare: '#d2691e',
    validMove: '#daa520',
    lastMove: '#ff6347'
  },
  gray: {
    lightSquare: '#f5f5f5',
    darkSquare: '#808080',
    selectedSquare: '#696969',
    validMove: '#32cd32',
    lastMove: '#ff4500'
  },
  purple: {
    lightSquare: '#f8f4ff',
    darkSquare: '#9b59b6',
    selectedSquare: '#8e44ad',
    validMove: '#2ecc71',
    lastMove: '#e74c3c'
  }
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  onMove,
  onSquareSelect,
  isGameOver,
  isFlipped = false,
  selectedSquare = null,
  boardTheme = 'classic'
}) => {
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [promotionSquare, setPromotionSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Memoize board and theme to prevent unnecessary recalculations
  const board = useMemo(() => chess.board(), [chess]);
  const theme = useMemo(() => BOARD_THEMES[boardTheme as keyof typeof BOARD_THEMES] || BOARD_THEMES.classic, [boardTheme]);

  const handleSquareClick = useCallback((square: string) => {
    if (isGameOver) return;

    const piece = chess.get(square as any);
    const currentTurn = chess.turn();
    
    // If we're in promotion mode
    if (promotionSquare) {
      return;
    }

    // Call the square select callback
    if (onSquareSelect) {
      onSquareSelect(square);
    }

    if (selectedSquare) {
      // If clicking on the same square, deselect it
      if (square === selectedSquare) {
        setValidMoves([]);
        return;
      }
      
      // Try to make a move
      if (validMoves.includes(square)) {
        const move = { from: selectedSquare, to: square };
        
        // Check if this is a pawn promotion
        const movingPiece = chess.get(selectedSquare as any);
        if (movingPiece?.type === 'p') {
          const toRank = parseInt(square[1]);
          if ((movingPiece.color === 'w' && toRank === 8) || 
              (movingPiece.color === 'b' && toRank === 1)) {
            setPromotionSquare(square);
            return;
          }
        }
        
        onMove(move);
        setLastMove({ from: selectedSquare, to: square });
        setValidMoves([]);
      } else {
        // If clicking on a different piece of the same color, select that piece instead
        if (piece && piece.color === currentTurn) {
          const moves = chess.moves({ square: square as any, verbose: true });
          setValidMoves(moves.map(move => move.to));
        } else {
          // If clicking on an empty square or opponent piece, deselect current piece
          setValidMoves([]);
        }
      }
    } else if (piece && piece.color === currentTurn) {
      // Select a piece (for the correct turn, regardless of orientation)
      const moves = chess.moves({ square: square as any, verbose: true });
      setValidMoves(moves.map(move => move.to));
    }
  }, [selectedSquare, validMoves, chess, onMove, isGameOver, promotionSquare, onSquareSelect]);

  const handlePromotion = useCallback((pieceType: string) => {
    if (promotionSquare && selectedSquare) {
      const move = { 
        from: selectedSquare,
        to: promotionSquare,
        promotion: pieceType 
      };
      onMove(move);
      setLastMove({ from: selectedSquare, to: promotionSquare });
      setPromotionSquare(null);
      setValidMoves([]);
    }
  }, [promotionSquare, selectedSquare, onMove]);

  const getSquareColor = useCallback((row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0;
    const square = String.fromCharCode(97 + col) + (8 - row);
    
    if (square === selectedSquare) {
      return theme.selectedSquare;
    }
    
    if (validMoves.includes(square)) {
      return theme.validMove;
    }
    
    if (lastMove && (square === lastMove.from || square === lastMove.to)) {
      return theme.lastMove;
    }
    
    return isLight ? theme.lightSquare : theme.darkSquare;
  }, [selectedSquare, validMoves, lastMove, theme]);

  const renderSquare = useCallback((row: number, col: number) => {
    const piece = board[row][col];
    const square = String.fromCharCode(97 + col) + (8 - row);
    const isSelected = square === selectedSquare;
    const isValidMove = validMoves.includes(square);
    const isLastMove = lastMove && (square === lastMove.from || square === lastMove.to);

    // Always use normal board color
    const isLight = (row + col) % 2 === 0;
    const baseColor = isLight ? theme.lightSquare : theme.darkSquare;

    // Determine box shadow for highlight
    let boxShadow = '';
    if (isSelected) {
      boxShadow = '0 0 0 4px #c084fc, 0 0 16px 4px #a855f7'; // purple glow
    } else if (isValidMove) {
      boxShadow = '0 0 0 4px #60a5fa, 0 0 16px 4px #3b82f6'; // blue glow
    } else if (isLastMove) {
      boxShadow = '0 0 0 4px #a855f7, 0 0 12px 2px #c084fc'; // soft purple glow
    }

    return (
      <div
        key={`${row}-${col}`}
        className="relative w-full h-full flex items-center justify-center cursor-pointer"
        style={{
          backgroundColor: baseColor,
          boxShadow,
          zIndex: isSelected || isValidMove || isLastMove ? 2 : 1,
        }}
        onClick={() => handleSquareClick(square)}
      >
        {piece && (
          <ChessPiece
            piece={`${piece.color}${piece.type.toUpperCase()}`}
            isSelected={false}
            onMouseDown={() => {}}
          />
        )}
        {/* Promotion overlay */}
        {promotionSquare === square && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-2 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 gap-2">
                {['q', 'r', 'b', 'n'].map((pieceType) => (
                  <button
                    key={pieceType}
                    onClick={() => handlePromotion(pieceType)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChessPiece 
                      piece={`${chess.turn()}${pieceType.toUpperCase()}`}
                      isSelected={false}
                      onMouseDown={() => {}}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [board, selectedSquare, validMoves, lastMove, theme, handleSquareClick, promotionSquare, handlePromotion, chess]);

  const renderBoard = useCallback(() => {
    const rows = isFlipped ? Array.from({ length: 8 }, (_, i) => 7 - i) : Array.from({ length: 8 }, (_, i) => i);
    const cols = isFlipped ? Array.from({ length: 8 }, (_, i) => 7 - i) : Array.from({ length: 8 }, (_, i) => i);

    return (
      <div className="grid grid-cols-8 w-[36rem] h-[36rem] rounded-lg overflow-hidden">
        {rows.map((row) =>
          cols.map((col) => renderSquare(row, col))
        )}
      </div>
    );
  }, [isFlipped, renderSquare]);

  return (
    <div className="w-[36rem] h-[36rem] mx-auto p-0 m-0">
      {renderBoard()}
      
      {/* Promotion instructions */}
      {promotionSquare && (
        <div className="text-sm text-gray-600 text-center mt-2">
          Choose promotion piece
        </div>
      )}
    </div>
  );
};