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
}

const pieceImages: Record<string, string> = {
  wK, wQ, wR, wB, wN, wP,
  bK, bQ, bR, bB, bN, bP,
};

export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  isSelected,
  onMouseDown
}) => {
  const imgSrc = pieceImages[piece];

  return (
    <img
      src={imgSrc}
      alt={piece}
      className={`
        absolute inset-0 w-full h-full object-contain select-none pointer-events-none
        ${isSelected ? 'scale-110 drop-shadow-lg z-10' : ''}
        hover:scale-105 hover:drop-shadow-md
      `}
      draggable={false}
      onMouseDown={onMouseDown}
    />
  );
};