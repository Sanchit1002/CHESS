import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  showSuggestions?: boolean;
  isMyTurn?: boolean;
  disableDragDrop?: boolean;
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
    // cool blue tones ocean
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
  boardTheme = 'classic',
  showSuggestions = false,
  isMyTurn = true,
  disableDragDrop = false
}) => {
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [promotionSquare, setPromotionSquare] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [animatingMove, setAnimatingMove] = useState<{ from: string; to: string } | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  
  // Drag and drop state
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- IMPROVED CLICK-TO-MOVE AND DRAG-AND-DROP LOGIC ---
  // Always allow click-to-move as a fallback, even if drag-and-drop fails
  // Drag-and-drop is robust for both white and black (flipped) boards
  // Visual feedback for selected piece and valid moves is clear

  // Memoize board and theme to prevent unnecessary recalculations
  const board = useMemo(() => chess.board(), [chess]);
  const theme = useMemo(() => BOARD_THEMES[boardTheme as keyof typeof BOARD_THEMES] || BOARD_THEMES.classic, [boardTheme]);

  // Clear selection and valid moves whenever the board (FEN) changes
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, [chess.fen()]);

  // --- CLICK-TO-MOVE LOGIC ---
  const handleSquareClick = useCallback((square: string) => {
    if (isGameOver || !isMyTurn) return;
    const piece = chess.get(square as any);
    const currentTurn = chess.turn();
    // If we're in promotion mode, ignore
    if (promotionSquare) return;
    // Call the square select callback
    if (onSquareSelect) onSquareSelect(square);
    if (selectedSquare) {
      // If clicking on the same square, deselect
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      // Try to make a move
      if (validMoves.includes(square)) {
        const move = { from: selectedSquare, to: square };
        setAnimatingMove(move);
        // Check for pawn promotion
        const movingPiece = chess.get(selectedSquare as any);
          const toRank = parseInt(square[1]);
        if (movingPiece?.type === 'p' && ((movingPiece.color === 'w' && toRank === 8) || (movingPiece.color === 'b' && toRank === 1))) {
            setPromotionSquare(square);
            setAnimatingMove(null);
            return;
          }
        setTimeout(() => {
        onMove(move);
          setSelectedSquare(null);
          setValidMoves([]);
        setLastMove({ from: selectedSquare, to: square });
          setAnimatingMove(null);
        }, 150);
      } else {
        // If clicking on a different piece of the same color, select that piece
        if (piece && piece.color === currentTurn) {
          setSelectedSquare(square);
          const moves = chess.moves({ square: square as any, verbose: true });
          setValidMoves(moves.map(move => move.to));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else if (piece && piece.color === currentTurn) {
      // Select a piece (for the correct turn, regardless of orientation)
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as any, verbose: true });
      setValidMoves(moves.map(move => move.to));
    }
  }, [selectedSquare, validMoves, chess, onMove, isGameOver, promotionSquare, onSquareSelect, isMyTurn]);

  // --- DRAG-AND-DROP LOGIC (ROBUST) ---
  const handleDragStart = useCallback((e: React.DragEvent, square: string) => {
    if (disableDragDrop || !isMyTurn) { e.preventDefault(); return; }
    const piece = chess.get(square as any);
    if (!piece) { e.preventDefault(); return; }
    const currentTurn = chess.turn();
    if (piece.color !== currentTurn) { e.preventDefault(); return; }
    setDraggedPiece(square);
    setIsDragging(true);
    setValidMoves([]);
    // Set drag image
    const dragImage = e.currentTarget.querySelector('img');
    if (dragImage) e.dataTransfer.setDragImage(dragImage, 25, 25);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', square);
  }, [chess, isGameOver, disableDragDrop, isMyTurn]);

  const handleDragOver = useCallback((e: React.DragEvent, square: string) => {
    if (disableDragDrop || !isMyTurn || !draggedPiece || isGameOver) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSquare(square);
    // Show valid moves for the dragged piece
    const moves = chess.moves({ square: draggedPiece as any, verbose: true });
    setValidMoves(moves.map(move => move.to));
  }, [draggedPiece, chess, isGameOver, disableDragDrop, isMyTurn]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSquare(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, square: string) => {
    if (disableDragDrop || !isMyTurn) return;
    e.preventDefault();
    if (!draggedPiece || isGameOver) return;
    const moves = chess.moves({ square: draggedPiece as any, verbose: true });
    const validTargets = moves.map(move => move.to);
    if (validTargets.includes(square)) {
      const move = { from: draggedPiece, to: square };
      setAnimatingMove(move);
      const movingPiece = chess.get(draggedPiece as any);
        const toRank = parseInt(square[1]);
      if (movingPiece?.type === 'p' && ((movingPiece.color === 'w' && toRank === 8) || (movingPiece.color === 'b' && toRank === 1))) {
          setPromotionSquare(square);
          setAnimatingMove(null);
      } else {
        setTimeout(() => {
          onMove(move);
          setLastMove({ from: draggedPiece, to: square });
          setAnimatingMove(null);
        }, 150);
      }
    }
    setDraggedPiece(null);
    setDragOverSquare(null);
    setIsDragging(false);
    setValidMoves([]);
  }, [draggedPiece, chess, isGameOver, onMove, disableDragDrop, isMyTurn]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedPiece(null);
    setDragOverSquare(null);
    setIsDragging(false);
    setValidMoves([]);
  }, []);

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
    const isHovered = square === hoveredSquare;
    const isAnimatingFrom = animatingMove && square === animatingMove.from;
    const isAnimatingTo = animatingMove && square === animatingMove.to;
    const canSelect = piece && !isGameOver && piece.color === chess.turn();
    const isDragOver = square === dragOverSquare;
    const isDraggedFrom = square === draggedPiece;

    // Always use normal board color
    const isLight = (row + col) % 2 === 0;
    const baseColor = isLight ? theme.lightSquare : theme.darkSquare;

    // Determine box shadow for highlight
    let boxShadow = '';
    if (isDraggedFrom) {
      // Dragged piece gets a subtle glow
      boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.3)';
    } else if (isDragOver && !piece) {
      // Valid drop target gets a clear green border like chess.com
      boxShadow = '0 0 0 4px #10b981, 0 0 12px rgba(16, 185, 129, 0.6)';
    } else if (isSelected) {
      boxShadow = '0 0 0 4px #c084fc, 0 0 16px 4px #a855f7'; // purple glow
    } else if (isValidMove && showSuggestions) {
      boxShadow = '0 0 0 4px #60a5fa, 0 0 16px 4px #3b82f6'; // blue glow
    } else if (isLastMove) {
      boxShadow = '0 0 0 4px #a855f7, 0 0 12px 2px #c084fc'; // soft purple glow
    } else if (isHovered && canSelect) {
      boxShadow = '0 0 0 3px #10b981, 0 0 8px rgba(16, 185, 129, 0.4)'; // green hover
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`relative w-full h-full flex items-center justify-center transition-all duration-150 ease-out ${
          canSelect ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: baseColor,
          boxShadow,
          zIndex: isDraggedFrom ? 10 : (isSelected || isValidMove || isLastMove || isHovered || isDragOver ? 2 : 1),
          opacity: isDraggedFrom ? 0.6 : 1,
          transform: isAnimatingFrom ? 'scale(0.8)' : isAnimatingTo ? 'scale(1.1)' : 'scale(1)',
        }}
        onClick={() => handleSquareClick(square)}
        onMouseEnter={() => setHoveredSquare(square)}
        onMouseLeave={() => setHoveredSquare(null)}
        onDragOver={(e) => handleDragOver(e, square)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, square)}
        draggable={Boolean(disableDragDrop || !isMyTurn ? false : canSelect)}
        onDragStart={disableDragDrop || !isMyTurn ? undefined : (canSelect ? (e) => handleDragStart(e, square) : undefined)}
        onDragEnd={disableDragDrop || !isMyTurn ? undefined : (canSelect ? handleDragEnd : undefined)}
      >
        {piece && !isDraggedFrom && !isAnimatingFrom && (
          <ChessPiece
            piece={`${piece.color}${piece.type.toUpperCase()}`}
            isSelected={isSelected}
            onMouseDown={() => {}}
            draggable={false}
            isAnimating={!!isAnimatingTo}
          />
        )}
        {/* Valid move indicator - only show if suggestions enabled */}
        {isValidMove && !piece && !isDragOver && showSuggestions && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full opacity-60 animate-pulse"></div>
          </div>
        )}
        {/* Capture indicator - only show if suggestions enabled */}
        {isValidMove && piece && !isDragOver && showSuggestions && (
          <div className="absolute inset-0 border-4 border-red-500 border-dashed rounded-sm opacity-70"></div>
        )}
        {/* Drag overlay for valid drop targets - chess.com style */}
        {isDragOver && !piece && (
          <div className="absolute inset-0 border-4 border-green-500 border-solid bg-green-500 bg-opacity-30 rounded-sm"></div>
        )}
        {/* Drag overlay for captures */}
        {isDragOver && piece && (
          <div className="absolute inset-0 border-4 border-red-500 border-solid bg-red-500 bg-opacity-30 rounded-sm"></div>
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
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
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
  }, [board, selectedSquare, validMoves, lastMove, theme, handleSquareClick, promotionSquare, handlePromotion, chess, hoveredSquare, animatingMove, isGameOver, handleDragOver, handleDragLeave, handleDrop, handleDragStart, handleDragEnd, draggedPiece, dragOverSquare, disableDragDrop, isMyTurn]);

  const renderBoard = useCallback(() => {
    const rows = isFlipped ? Array.from({ length: 8 }, (_, i) => 7 - i) : Array.from({ length: 8 }, (_, i) => i);
    const cols = isFlipped ? Array.from({ length: 8 }, (_, i) => 7 - i) : Array.from({ length: 8 }, (_, i) => i);

    return (
      <div className="grid grid-cols-8 grid-rows-8 w-[36rem] h-[36rem] rounded-lg shadow-2xl overflow-hidden">
        {rows.map((row) =>
          cols.map((col) => (
            <div key={`${row}-${col}`} className="w-full h-full aspect-square">
              {renderSquare(row, col)}
            </div>
          ))
        )}
      </div>
    );
  }, [isFlipped, renderSquare]);

  return (
    <div className="w-[36rem] h-[36rem] mx-auto p-0 m-0 relative">
      {renderBoard()}
      {/* Modern Promotion Modal */}
      {promotionSquare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center border-4 border-amber-400 animate-pop">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-amber-200">Choose promotion piece</h2>
            <div className="flex flex-row gap-6 justify-center items-center w-full max-w-md">
              {[
                { type: 'q', label: 'Queen' },
                { type: 'r', label: 'Rook' },
                { type: 'b', label: 'Bishop' },
                { type: 'n', label: 'Knight' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handlePromotion(type)}
                  className="flex flex-col items-center w-20 px-2 py-2 bg-amber-100 dark:bg-slate-700 rounded-xl shadow hover:bg-amber-200 dark:hover:bg-slate-600 transition-all border-2 border-amber-400 focus:outline-none"
                >
                  <ChessPiece
                    piece={`${chess.turn()}${type.toUpperCase()}`}
                    isSelected={false}
                    onMouseDown={() => {}}
                    className="relative w-12 h-12"
                  />
                  <span className="mt-2 text-lg font-semibold text-slate-900 dark:text-amber-200">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};