import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { MoveHistory } from './MoveHistory';
import { GameStatus } from './GameStatus';
import { LogOut, RotateCcw, Download } from 'lucide-react';
import { DataService } from '../services/DataService';
import { GameResult } from '../types';

interface GameProps {
  timeControl: string;
  username: string;
  onLogout: () => void;
  onBackToMenu: () => void;
  boardTheme?: string;
  isSpectator?: boolean;
  roomId?: string;
  opponentName?: string;
  customTimeControl?: { minutes: number; seconds: number; increment: number; name: string };
  whitePlayerName: string;
  blackPlayerName: string;
  showSuggestions?: boolean;
}

export const Game: React.FC<GameProps> = ({ 
  timeControl, 
  username, 
  onLogout, 
  onBackToMenu,
  boardTheme = 'classic',
  isSpectator = false,
  roomId,
  opponentName,
  customTimeControl,
  whitePlayerName,
  blackPlayerName,
  showSuggestions = false
}) => {
  const [chess, setChess] = useState(() => new Chess());
  const [gameKey, setGameKey] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  // Timer state
  const getInitialTime = () => {
    console.log('getInitialTime called with:', { timeControl, customTimeControl });
    if (customTimeControl) {
      const totalSeconds = customTimeControl.minutes * 60 + customTimeControl.seconds;
      console.log('Using custom time control:', customTimeControl, 'Total seconds:', totalSeconds);
      return totalSeconds;
    }
    
    switch (timeControl) {
      case 'blitz': return 5 * 60;
      case 'rapid': return 10 * 60;
      case 'classical': return 30 * 60;
      default: return 5 * 60;
    }
  };
  const [whiteTime, setWhiteTime] = useState(getInitialTime());
  const [blackTime, setBlackTime] = useState(getInitialTime());

  // Update timer when custom time control changes
  useEffect(() => {
    console.log('Timer update effect triggered:', { customTimeControl, timeControl });
    const initialTime = getInitialTime();
    console.log('Setting timer to:', initialTime, 'seconds');
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setGameStartTime(Date.now()); // Reset game start time when time control changes
  }, [customTimeControl, timeControl]);
  const [activeColor, setActiveColor] = useState<'w' | 'b'>('w');
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [timeOut, setTimeOut] = useState<string | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [showGameOverPopup, setShowGameOverPopup] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const dataService = DataService.getInstance();

  // Reset game start time when component mounts
  useEffect(() => {
    setGameStartTime(Date.now());
  }, []);

  const saveGameResult = useCallback(async (winner: string | null, reason: string) => {
    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
    const moves = chess.history().length;
    const pgn = chess.pgn();
    
    // Determine opponent name
    const opponentPlayerName = opponentName || 'Computer';
    
    // Calculate ratings
    const ratings = await dataService.calculateGameRatings(username, opponentPlayerName, winner);
    
    const gameResult: GameResult = {
      id: `game_${Date.now()}`,
      player1: username,
      player2: opponentPlayerName,
      winner,
      result: winner === username ? 'win' : winner === opponentPlayerName ? 'loss' : 'draw',
      date: new Date(),
      duration: gameDuration,
      moves,
      timeControl: timeControl,
      pgn,
      player1Rating: ratings?.player1Rating ?? 1200,
      player2Rating: ratings?.player2Rating ?? 1200,
      player1RatingChange: ratings?.player1RatingChange ?? 0,
      player2RatingChange: ratings?.player2RatingChange ?? 0
    };
    
    try {
      await dataService.saveGameResult(gameResult);
      console.log('Game result saved to Firebase:', gameResult);
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  }, [username, opponentName, timeControl, chess, gameStartTime, dataService]);

  const handleMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    try {
      console.log('Attempting move:', move);
      const result = chess.move(move);
      if (result) {
        console.log('Move successful:', result);
        setLastMove({ from: move.from, to: move.to });
        setGameKey(prev => prev + 1);
        setSelectedSquare(null);
        setActiveColor(chess.turn());
      } else {
        console.error('Move failed - no result returned');
      }
    } catch (error) {
      console.error('Invalid move:', error);
      // Clear selection on invalid move
      setSelectedSquare(null);
    }
  }, [chess]);

  const handleResetGame = useCallback(() => {
    setChess(new Chess());
    setLastMove(null);
    setGameKey(prev => prev + 1);
    setSelectedSquare(null);
    setWhiteTime(getInitialTime());
    setBlackTime(getInitialTime());
    setActiveColor('w');
    setTimeOut(null);
    setGameOverReason(null);
    setShowGameOverPopup(false);
    setGameStartTime(Date.now()); // Reset game start time for new game
  }, [timeControl, customTimeControl]);

  // Timer effect
  useEffect(() => {
    if (timeOut) {
      if (timerInterval) clearInterval(timerInterval);
      const winner = timeOut === 'White' ? 'Black' : 'White';
      const winnerName = winner === 'White' ? username : (opponentName || 'Computer');
      setGameOverReason(`${timeOut} ran out of time! ${winner} wins!`);
      setShowGameOverPopup(true);
      saveGameResult(winnerName, 'timeout').catch(console.error);
      return;
    }
    if (chess.isGameOver()) {
      if (timerInterval) clearInterval(timerInterval);
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'Black' : 'White';
        const winnerName = winner === 'White' ? username : (opponentName || 'Computer');
        setGameOverReason(`Checkmate! ${winner} wins!`);
        setShowGameOverPopup(true);
        saveGameResult(winnerName, 'checkmate').catch(console.error);
      } else if (chess.isStalemate()) {
        setGameOverReason('Stalemate! Game is a draw.');
        setShowGameOverPopup(true);
        saveGameResult(null, 'stalemate').catch(console.error);
      } else if (chess.isDraw()) {
        setGameOverReason('Draw! Game ended in a draw.');
        setShowGameOverPopup(true);
        saveGameResult(null, 'draw').catch(console.error);
      }
      return;
    }
    if (timerInterval) clearInterval(timerInterval);
    const interval = window.setInterval(() => {
      if (activeColor === 'w') {
        setWhiteTime((t) => {
          if (t <= 1) {
            setTimeOut('White');
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            setTimeOut('Black');
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);
    setTimerInterval(interval);
    return () => clearInterval(interval);
  }, [activeColor, chess, timeOut]);

  // Format time as mm:ss
  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSquareSelect = useCallback((square: string) => {
    setSelectedSquare(square);
  }, []);

  const isGameOver = chess.isGameOver();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        handleResetGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleResetGame]);

  const getTimeControlDisplay = () => {
    if (customTimeControl) {
      const minutes = customTimeControl.minutes;
      const seconds = customTimeControl.seconds;
      const increment = customTimeControl.increment;
      return `${minutes}:${seconds.toString().padStart(2, '0')}${increment > 0 ? `+${increment}` : ''}`;
    }
    
    switch (timeControl) {
      case 'blitz': return '5 min';
      case 'rapid': return '10 min';
      case 'classical': return '30 min';
      default: return timeControl;
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBackToMenu}
                className="px-4 py-2 text-gray-200 hover:text-white transition-all duration-200 bg-gray-800/60 hover:bg-gray-700/80 rounded-lg border border-gray-600/40"
              >
                ← Back to Menu
              </button>
              <div className="h-8 w-px bg-gray-600"></div>
              <div>
                <h1 className="text-2xl font-bold text-amber-200">♔ Chess Game</h1>
                <p className="text-sm text-amber-200/70">
                  {username} • {getTimeControlDisplay()} • {chess.turn() === 'w' ? 'White' : 'Black'} to move
                  {isSpectator && ' • Spectator Mode'}
                  {roomId && ` • Room: ${roomId.slice(-6)}`}
                </p>
                {opponentName && (
                  <div className="mt-2 p-2 bg-amber-200/10 rounded-lg border border-amber-200/20">
                    <p className="text-xs text-amber-200/80 font-medium">Playing against:</p>
                    <p className="text-sm text-amber-200 font-semibold">{opponentName}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetGame}
                className="flex items-center space-x-2 px-4 py-2 text-amber-200 hover:text-amber-100 transition-all duration-200 bg-red-800/60 hover:bg-red-700/80 rounded-lg border border-amber-500/40"
                title="Reset Game (Ctrl+R)"
              >
                <RotateCcw size={18} className="animate-spin" />
                <span className="text-base font-medium">Reset</span>
              </button>
              <button
                onClick={exportPGN}
                className="flex items-center space-x-2 px-4 py-2 text-amber-200 hover:text-amber-100 transition-all duration-200 bg-red-800/60 hover:bg-red-700/80 rounded-lg border border-amber-500/40"
                title="Export PGN"
              >
                <Download size={18} />
                <span className="text-base font-medium">Export</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-300 hover:text-red-200 transition-all duration-200 bg-red-800/60 hover:bg-red-700/80 rounded-lg border border-amber-500/40"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="container mx-auto px-6 py-8 flex justify-center">
        <div className="relative w-full flex flex-col lg:flex-row-reverse items-start justify-center max-w-7xl">
          {/* Chess Board - always centered */}
          <div className="w-full flex flex-col items-center lg:w-auto lg:mx-8">
            <div className="flex flex-col items-center space-y-3">
              {/* Black timer above board */}
              <div className={`flex flex-col items-center px-4 py-1 rounded-lg shadow-lg text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                activeColor === 'b' 
                  ? 'bg-gradient-to-r from-white to-gray-200 text-gray-900 shadow-white/50' 
                  : 'bg-gray-200/40 text-gray-700 border border-gray-400/40'
              }`}>
                {/* Progress bar for time */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gray-600/50 rounded-b-lg" style={{
                  width: `${(blackTime / getInitialTime()) * 100}%`
                }}></div>
                <span className="uppercase text-xs tracking-wider">
                  {isFlipped ? whitePlayerName : blackPlayerName}
                </span>
                <span className="text-base font-mono">{formatTime(blackTime)}</span>
              </div>
              {/* Chess board */}
              <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                <ChessBoard
                  key={gameKey}
                  chess={chess}
                  onMove={handleMove}
                  onSquareSelect={handleSquareSelect}
                  isGameOver={isGameOver}
                  isFlipped={isFlipped}
                  selectedSquare={selectedSquare}
                  boardTheme={boardTheme}
                  showSuggestions={showSuggestions}
                />
              </div>
              {/* White timer below board */}
              <div className={`flex flex-col items-center px-4 py-1 rounded-lg shadow-lg text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                activeColor === 'w' 
                  ? 'bg-gradient-to-r from-white to-gray-200 text-gray-900 shadow-white/50' 
                  : 'bg-gray-200/40 text-gray-700 border border-gray-400/40'
              }`}>
                {/* Progress bar for time */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-gray-600/50 rounded-b-lg" style={{
                  width: `${(whiteTime / getInitialTime()) * 100}%`
                }}></div>
                <span className="uppercase text-xs tracking-wider">
                  {isFlipped ? blackPlayerName : whitePlayerName}
                </span>
                <span className="text-base font-mono">{formatTime(whiteTime)}</span>
              </div>
              {/* Timeout message */}
              {timeOut && (
                <div className="text-red-400 font-bold text-xl bg-red-500/20 px-6 py-3 rounded-xl border border-red-500/30">
                  {timeOut} ran out of time!
                </div>
              )}
              {/* Game Over Popup */}
              {showGameOverPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md mx-4">
                    <div className="text-center space-y-6">
                      <div className="text-4xl mb-4">🎉</div>
                      <h2 className="text-2xl font-bold text-white mb-4">Game Over!</h2>
                      <p className="text-lg text-white/90 mb-6">{gameOverReason}</p>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleResetGame}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105"
                        >
                          Play Again
                        </button>
                        <button
                          onClick={onBackToMenu}
                          className="flex-1 px-6 py-3 bg-gray-800/20 hover:bg-gray-700/30 rounded-xl text-gray-200 font-semibold transition-all duration-200 hover:scale-105 border border-gray-600/30"
                        >
                          Back to Menu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Flip Board button centered above the board */}
              <div className="w-full flex justify-center">
                <button
                  className={`px-6 py-3 rounded-full shadow-lg transition-all duration-300 text-white font-semibold ${
                    chess.history().length === 0 
                      ? 'bg-gray-500/50 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-purple-500/50 hover:scale-105'
                  }`}
                  onClick={() => setIsFlipped(f => !f)}
                  disabled={chess.history().length === 0}
                  title={chess.history().length === 0 ? 'Flip is disabled until after the first move' : 'Flip Board'}
                >
                  Flip Board
                </button>
              </div>
            </div>
          </div>
          {/* Moves Table - overlay/floating on desktop, below on mobile */}
          <div className="flex flex-col space-y-6 min-w-[320px] w-full mt-8 lg:mt-16 lg:w-[320px] lg:mr-8">
            <GameStatus
              chess={chess}
              onResetGame={handleResetGame}
            />
            <MoveHistory chess={chess} />
          </div>
        </div>
      </div>
    </div>
  );
}; 