import React from 'react';
import wK from '../assets/pieces/wK.svg';
import wQ from '../assets/pieces/wQ.svg';
import wR from '../assets/pieces/wR.svg';
import wB from '../assets/pieces/wB.svg';
import wN from '../assets/pieces/wN.svg';
import wP from '../assets/pieces/wP.svg';
import bK from '../assets/pieces/bK.svg';
import bQ from '../assets/pieces/bQ.svg';
import bR from '../assets/pieces/bR.svg';
import bB from '../assets/pieces/bB.svg';
import bN from '../assets/pieces/bN.svg';
import bP from '../assets/pieces/bP.svg';

interface ChessPieceProps {
  piece: string; // e.g., 'wK', 'bQ', etc.
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isAnimating?: boolean;
  className?: string;
}

const pieceImages: Record<string, string> = {
  wK, wQ, wR, wB, wN, wP,
  bK, bQ, bR, bB, bN, bP,
};

export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  isSelected,
  onMouseDown,
  draggable = false,
  onDragStart,
  onDragEnd,
  isAnimating = false,
  className = ''
}) => {
  const imgSrc = pieceImages[piece];

  return (
    <img
      src={imgSrc}
      alt={piece}
      className={`
        w-full h-full object-contain select-none
        transition-all duration-150 ease-out
        ${isSelected ? 'scale-110 drop-shadow-lg z-10' : ''}
        ${isAnimating ? 'scale-105 drop-shadow-xl z-20' : ''}
        hover:scale-105 hover:drop-shadow-md
        ${className}
      `}
      draggable={draggable}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  );
};