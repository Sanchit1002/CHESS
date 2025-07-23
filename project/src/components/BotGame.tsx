import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard';

interface BotGameProps {
  boardTheme: string;
  color: 'white' | 'black' | 'random';
  onBack: () => void;
}

const DIFFICULTY_LEVELS = [
  { label: 'Easy', value: 4 },
  { label: 'Medium', value: 8 },
  { label: 'Hard', value: 15 },
];

export const BotGame: React.FC<BotGameProps> = ({ boardTheme, color, onBack }) => {
  const [chess, setChess] = useState(new Chess());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [difficulty, setDifficulty] = useState<number>(8); // Default: Medium
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedMove, setSuggestedMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null); // Stockfish eval
  const stockfishRef = useRef<Worker | null>(null);
  const suggestionStockfishRef = useRef<Worker | null>(null);
  const evalStockfishRef = useRef<Worker | null>(null);

  // Set player color on mount
  useEffect(() => {
    if (color === 'random') {
      setPlayerColor(Math.random() < 0.5 ? 'w' : 'b');
    } else {
      setPlayerColor(color === 'white' ? 'w' : 'b');
    }
    setChess(new Chess());
  }, [color]);

  // Initialize Stockfish workers
  useEffect(() => {
    stockfishRef.current = new Worker('/stockfish.js');
    suggestionStockfishRef.current = new Worker('/stockfish.js');
    evalStockfishRef.current = new Worker('/stockfish.js');
    return () => {
      stockfishRef.current?.terminate();
      suggestionStockfishRef.current?.terminate();
      evalStockfishRef.current?.terminate();
    };
  }, []);

  // If bot is white, make the first move
  useEffect(() => {
    if (playerColor === 'b' && chess.turn() === 'w') {
      makeBotMove();
    }
    // eslint-disable-next-line
  }, [playerColor]);

  // Handle user move
  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    const newChess = new Chess(chess.fen());
    const result = newChess.move(move);
    if (result) {
      setChess(newChess);
      setSuggestedMove(null); // Clear suggestion after move
      setTimeout(() => makeBotMove(), 300);
    }
  };

  // Ask Stockfish for the best move (bot)
  const makeBotMove = () => {
    if (!stockfishRef.current || chess.isGameOver()) return;
    setIsBotThinking(true);
    stockfishRef.current.postMessage('uci');
    stockfishRef.current.postMessage('ucinewgame');
    stockfishRef.current.postMessage(`position fen ${chess.fen()}`);
    stockfishRef.current.postMessage(`go depth ${difficulty}`);
    stockfishRef.current.onmessage = (event) => {
      const line = event.data;
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (move && move !== '(none)') {
          const from = move.substring(0, 2);
          const to = move.substring(2, 4);
          const promotion = move.length > 4 ? move[4] : undefined;
          const newChess = new Chess(chess.fen());
          newChess.move({ from, to, promotion });
          setChess(newChess);
        }
        setIsBotThinking(false);
      }
    };
  };

  // Ask Stockfish for the best move (suggestion for user)
  const getMoveSuggestion = () => {
    if (!suggestionStockfishRef.current || chess.isGameOver()) return;
    setSuggestedMove('...');
    suggestionStockfishRef.current.postMessage('uci');
    suggestionStockfishRef.current.postMessage('ucinewgame');
    suggestionStockfishRef.current.postMessage(`position fen ${chess.fen()}`);
    suggestionStockfishRef.current.postMessage(`go depth ${difficulty}`);
    suggestionStockfishRef.current.onmessage = (event) => {
      const line = event.data;
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        setSuggestedMove(move && move !== '(none)' ? move : null);
      }
    };
  };

  // Ask Stockfish for evaluation (score)
  const getEvaluation = () => {
    if (!evalStockfishRef.current || chess.isGameOver()) {
      setEvaluation(null);
      return;
    }
    evalStockfishRef.current.postMessage('uci');
    evalStockfishRef.current.postMessage('ucinewgame');
    evalStockfishRef.current.postMessage(`position fen ${chess.fen()}`);
    evalStockfishRef.current.postMessage('go depth 12');
    let lastEval: number | null = null;
    evalStockfishRef.current.onmessage = (event) => {
      const line = event.data;
      if (typeof line === 'string' && line.startsWith('info')) {
        const match = line.match(/score (cp|mate) (-?\d+)/);
        if (match) {
          if (match[1] === 'cp') {
            lastEval = parseInt(match[2], 10) / 100;
          } else if (match[1] === 'mate') {
            // Use a large value for mate, positive for white, negative for black
            lastEval = (parseInt(match[2], 10) > 0 ? 100 : -100);
          }
        }
      }
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        setEvaluation(lastEval);
      }
    };
  };

  const isMyTurn = chess.turn() === playerColor;

  useEffect(() => {
    if (showSuggestion && isMyTurn && !chess.isGameOver()) {
      getMoveSuggestion();
    } else {
      setSuggestedMove(null);
    }
    // eslint-disable-next-line
  }, [showSuggestion, chess.fen(), isMyTurn, difficulty]);

  // Update evaluation after every move
  useEffect(() => {
    getEvaluation();
    // eslint-disable-next-line
  }, [chess.fen()]);

  // Evaluation bar calculation
  let evalBarPercent = 50;
  if (evaluation !== null) {
    // Clamp evaluation to [-10, 10] for bar
    const cappedEval = Math.max(-10, Math.min(10, evaluation));
    evalBarPercent = 50 + (cappedEval * 5);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-3xl mx-auto p-4">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600">Back</button>
        <h2 className="text-2xl font-bold mb-2 text-center text-amber-900 dark:text-amber-300">Play vs Bot</h2>
        <p className="text-center mb-4 text-gray-700 dark:text-gray-200">You are playing as <span className="font-bold">{playerColor === 'w' ? 'White' : 'Black'}</span></p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
          <div>
            <label className="font-semibold mr-2">Bot Difficulty:</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(Number(e.target.value))}
              className="px-2 py-1 rounded border border-gray-300 dark:bg-gray-800 dark:text-white"
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold mr-2">Show Move Suggestion:</label>
            <input
              type="checkbox"
              checked={showSuggestion}
              onChange={e => setShowSuggestion(e.target.checked)}
              className="mr-1"
            />
            <span className="text-sm">(Best move for you)</span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-center gap-4">
          {/* Evaluation Bar */}
          <div className="flex flex-col items-center mr-2">
            <div className="h-72 w-6 bg-gradient-to-b from-white to-black rounded-lg border border-gray-400 overflow-hidden relative">
              <div
                className="absolute left-0 w-full bg-amber-400 transition-all duration-300"
                style={{ bottom: 0, height: `${evalBarPercent}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-center">
              {evaluation !== null ? (
                <span className={evaluation > 0 ? 'text-black' : evaluation < 0 ? 'text-white' : ''}>
                  {evaluation > 99 ? '#M' : evaluation < -99 ? '#M' : evaluation.toFixed(2)}
                </span>
              ) : (
                <span className="text-gray-400">--</span>
              )}
            </div>
          </div>
          {/* Chess Board */}
          <ChessBoard
            chess={chess}
            onMove={isMyTurn && !chess.isGameOver() ? handleMove : () => {}}
            isGameOver={chess.isGameOver()}
            boardTheme={boardTheme}
            isFlipped={playerColor === 'b'}
            isMyTurn={isMyTurn && !chess.isGameOver()}
          />
        </div>
        {showSuggestion && isMyTurn && suggestedMove && suggestedMove !== '...' && (
          <div className="mt-2 text-center text-green-700 dark:text-green-300">
            Suggested move: <span className="font-mono font-bold">{suggestedMove}</span>
          </div>
        )}
        {showSuggestion && isMyTurn && suggestedMove === '...' && (
          <div className="mt-2 text-center text-blue-600 dark:text-blue-300 animate-pulse">Calculating suggestion...</div>
        )}
        {isBotThinking && (
          <div className="mt-4 text-center text-blue-600 dark:text-blue-300 animate-pulse">Bot is thinking...</div>
        )}
        {chess.isGameOver() && (
          <div className="mt-4 text-center text-red-600 dark:text-red-400 font-bold">Game Over: {chess.isCheckmate() ? (isMyTurn ? 'Bot wins!' : 'You win!') : 'Draw'}</div>
        )}
      </div>
    </div>
  );
}; 