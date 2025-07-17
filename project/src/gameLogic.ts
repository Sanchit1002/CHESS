import { ChessPiece, Position, Move, GameState, PieceType, PieceColor } from './types';

export class ChessGame {
  private board: (ChessPiece | null)[][];
  private currentPlayer: PieceColor;
  private moveHistory: Move[];
  private isCheck: boolean;
  private isCheckmate: boolean;
  private isStalemate: boolean;
  private enPassantTarget?: Position;
  private canCastleKingside: { white: boolean; black: boolean };
  private canCastleQueenside: { white: boolean; black: boolean };

  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.moveHistory = [];
    this.isCheck = false;
    this.isCheckmate = false;
    this.isStalemate = false;
    this.canCastleKingside = { white: true, black: true };
    this.canCastleQueenside = { white: true, black: true };
  }

  private initializeBoard(): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place pawns
    for (let col = 0; col < 8; col++) {
      board[1][col] = { type: 'pawn', color: 'black' };
      board[6][col] = { type: 'pawn', color: 'white' };
    }
    
    // Place other pieces
    const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: pieceOrder[col], color: 'black' };
      board[7][col] = { type: pieceOrder[col], color: 'white' };
    }
    
    return board;
  }

  public getGameState(): GameState {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      isCheck: this.isCheck,
      isCheckmate: this.isCheckmate,
      isStalemate: this.isStalemate,
      moveHistory: this.moveHistory,
      enPassantTarget: this.enPassantTarget,
      canCastleKingside: this.canCastleKingside,
      canCastleQueenside: this.canCastleQueenside
    };
  }

  public isValidMove(from: Position, to: Position): boolean {
    const piece = this.board[from.row][from.col];
    if (!piece || piece.color !== this.currentPlayer) return false;

    const targetPiece = this.board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) return false;

    if (!this.isPieceMovementValid(piece, from, to)) return false;

    // Check if move would leave king in check
    return !this.wouldMoveLeaveKingInCheck(from, to);
  }

  private isPieceMovementValid(piece: ChessPiece, from: Position, to: Position): boolean {
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(piece, from, to, rowDiff, colDiff);
      case 'rook':
        return (rowDiff === 0 || colDiff === 0) && this.isPathClear(from, to);
      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
      case 'bishop':
        return absRowDiff === absColDiff && this.isPathClear(from, to);
      case 'queen':
        return (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) && this.isPathClear(from, to);
      case 'king':
        return this.isValidKingMove(piece, from, to, absRowDiff, absColDiff);
      default:
        return false;
    }
  }

  private isValidPawnMove(piece: ChessPiece, from: Position, to: Position, rowDiff: number, colDiff: number): boolean {
    const direction = piece.color === 'white' ? -1 : 1;
    const targetPiece = this.board[to.row][to.col];
    const startRow = piece.color === 'white' ? 6 : 1;

    // Forward move
    if (colDiff === 0) {
      if (targetPiece) return false;
      if (rowDiff === direction) return true;
      if (rowDiff === 2 * direction && from.row === startRow) return true;
    }

    // Diagonal capture
    if (Math.abs(colDiff) === 1 && rowDiff === direction) {
      if (targetPiece && targetPiece.color !== piece.color) return true;
      
      // En passant
      if (this.enPassantTarget && 
          this.enPassantTarget.row === to.row && 
          this.enPassantTarget.col === to.col) {
        return true;
      }
    }

    return false;
  }

  private isValidKingMove(piece: ChessPiece, from: Position, to: Position, absRowDiff: number, absColDiff: number): boolean {
    // Normal king move
    if (absRowDiff <= 1 && absColDiff <= 1) return true;

    // Castling
    if (absRowDiff === 0 && absColDiff === 2) {
      return this.canCastle(piece.color, to.col > from.col);
    }

    return false;
  }

  private canCastle(color: PieceColor, kingside: boolean): boolean {
    const row = color === 'white' ? 7 : 0;
    const king = this.board[row][4];
    
    if (!king || king.type !== 'king' || king.hasMoved) return false;
    if (this.isKingInCheck(color)) return false;

    if (kingside) {
      if (!this.canCastleKingside[color]) return false;
      const rook = this.board[row][7];
      if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
      
      // Check if squares are empty and not under attack
      for (let col = 5; col <= 6; col++) {
        if (this.board[row][col] !== null) return false;
        if (this.isSquareUnderAttack({ row, col }, color)) return false;
      }
    } else {
      if (!this.canCastleQueenside[color]) return false;
      const rook = this.board[row][0];
      if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
      
      // Check if squares are empty and not under attack
      for (let col = 1; col <= 3; col++) {
        if (this.board[row][col] !== null) return false;
        if (col >= 2 && this.isSquareUnderAttack({ row, col }, color)) return false;
      }
    }

    return true;
  }

  private isPathClear(from: Position, to: Position): boolean {
    const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
    const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;
    
    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;
    
    while (currentRow !== to.row || currentCol !== to.col) {
      if (this.board[currentRow][currentCol] !== null) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  }

  private wouldMoveLeaveKingInCheck(from: Position, to: Position): boolean {
    const piece = this.board[from.row][from.col]!;
    const captured = this.board[to.row][to.col];
    
    // Make temporary move
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    
    const inCheck = this.isKingInCheck(piece.color);
    
    // Undo move
    this.board[from.row][from.col] = piece;
    this.board[to.row][to.col] = captured;
    
    return inCheck;
  }

  public makeMove(from: Position, to: Position, promotionPiece?: PieceType): boolean {
    if (!this.isValidMove(from, to)) return false;

    const piece = this.board[from.row][from.col]!;
    const captured = this.board[to.row][to.col];
    let isEnPassant = false;
    let isCastling = false;

    // Handle en passant
    if (piece.type === 'pawn' && this.enPassantTarget && 
        this.enPassantTarget.row === to.row && this.enPassantTarget.col === to.col) {
      isEnPassant = true;
      const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
      this.board[capturedPawnRow][to.col] = null;
    }

    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      isCastling = true;
      const row = from.row;
      const rookFromCol = to.col > from.col ? 7 : 0;
      const rookToCol = to.col > from.col ? 5 : 3;
      
      const rook = this.board[row][rookFromCol]!;
      this.board[row][rookToCol] = rook;
      this.board[row][rookFromCol] = null;
      rook.hasMoved = true;
    }

    // Make the move
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    piece.hasMoved = true;

    // Handle pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      piece.type = promotionPiece || 'queen';
    }

    // Update castling rights
    if (piece.type === 'king') {
      this.canCastleKingside[piece.color] = false;
      this.canCastleQueenside[piece.color] = false;
    } else if (piece.type === 'rook') {
      if (from.col === 0) this.canCastleQueenside[piece.color] = false;
      if (from.col === 7) this.canCastleKingside[piece.color] = false;
    }

    // Set en passant target
    this.enPassantTarget = undefined;
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      this.enPassantTarget = {
        row: (from.row + to.row) / 2,
        col: from.col
      };
    }

    // Add to move history
    this.moveHistory.push({
      from,
      to,
      piece: { ...piece },
      captured: captured || undefined,
      isEnPassant,
      isCastling,
      promotion: piece.type !== 'pawn' ? undefined : promotionPiece
    });

    // Switch players
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    // Update game status
    this.updateGameStatus();

    return true;
  }

  private updateGameStatus(): void {
    this.isCheck = this.isKingInCheck(this.currentPlayer);
    this.isCheckmate = this.isCheck && !this.hasValidMoves(this.currentPlayer);
    this.isStalemate = !this.isCheck && !this.hasValidMoves(this.currentPlayer);
  }

  private isKingInCheck(color: PieceColor): boolean {
    const kingPosition = this.findKing(color);
    if (!kingPosition) return false;
    return this.isSquareUnderAttack(kingPosition, color);
  }

  private isSquareUnderAttack(position: Position, defendingColor: PieceColor): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color !== defendingColor) {
          if (this.isPieceMovementValid(piece, { row, col }, position)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private findKing(color: PieceColor): Position | null {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private hasValidMoves(color: PieceColor): boolean {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = this.board[fromRow][fromCol];
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (this.isValidMove({ row: fromRow, col: fromCol }, { row: toRow, col: toCol })) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  public getValidMoves(from: Position): Position[] {
    const moves: Position[] = [];
    const piece = this.board[from.row][from.col];
    
    if (!piece || piece.color !== this.currentPlayer) return moves;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(from, { row, col })) {
          moves.push({ row, col });
        }
      }
    }

    return moves;
  }

  public resetGame(): void {
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.moveHistory = [];
    this.isCheck = false;
    this.isCheckmate = false;
    this.isStalemate = false;
    this.enPassantTarget = undefined;
    this.canCastleKingside = { white: true, black: true };
    this.canCastleQueenside = { white: true, black: true };
  }
}