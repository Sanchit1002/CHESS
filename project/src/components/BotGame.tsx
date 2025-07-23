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

// MoveHistoryBox component
const MoveHistoryBox: React.FC<{ chess: Chess }> = ({ chess }) => {
  const history = chess.history();
  const groupedMoves = [];
  for (let i = 0; i < history.length; i += 2) {
    groupedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }
  return (
    <div className="bg-green-50 dark:bg-green-900 rounded-2xl shadow-lg border border-green-300 dark:border-green-700 p-4 w-56 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2 text-center">Move History</h3>
      {groupedMoves.length === 0 ? (
        <div className="text-center text-green-400 py-6">No moves yet</div>
      ) : (
        <div className="space-y-1">
          {groupedMoves.map((group, idx) => (
            <div key={group.moveNumber} className={`flex items-center justify-between px-2 py-1 rounded-lg ${idx === groupedMoves.length - 1 ? 'bg-green-100 dark:bg-green-800 font-bold' : ''}`}> 
              <span className="w-6 text-green-700 dark:text-green-200">{group.moveNumber}.</span>
              <span className="w-14 text-green-900 dark:text-green-100 text-center">{group.white}</span>
              <span className="w-14 text-green-900 dark:text-green-100 text-center">{group.black || ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

  useEffect(() => {
    if (color === 'random') {
      setPlayerColor(Math.random() < 0.5 ? 'w' : 'b');
    } else {
      setPlayerColor(color === 'white' ? 'w' : 'b');
    }
    setChess(new Chess());
  }, [color]);

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

  useEffect(() => {
    if (playerColor === 'b' && chess.turn() === 'w') {
      makeBotMove();
    }
    // eslint-disable-next-line
  }, [playerColor]);

  const isMyTurn = chess.turn() === playerColor;

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!isMyTurn || chess.isGameOver()) return;
    const newChess = new Chess(chess.fen());
    const result = newChess.move(move);
    if (result) {
      setChess(newChess);
      setSuggestedMove(null);
    }
  };

  useEffect(() => {
    if (!isMyTurn && !chess.isGameOver()) {
      makeBotMove();
    }
    // eslint-disable-next-line
  }, [chess.fen(), isMyTurn]);

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
            lastEval = (parseInt(match[2], 10) > 0 ? 100 : -100);
          }
        }
      }
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        setEvaluation(lastEval);
      }
    };
  };

  useEffect(() => {
    if (showSuggestion && isMyTurn && !chess.isGameOver()) {
      getMoveSuggestion();
    } else {
      setSuggestedMove(null);
    }
    // eslint-disable-next-line
  }, [showSuggestion, chess.fen(), isMyTurn, difficulty]);

  useEffect(() => {
    getEvaluation();
    // eslint-disable-next-line
  }, [chess.fen()]);

  let evalBarPercent = 50;
  if (evaluation !== null) {
    const cappedEval = Math.max(-10, Math.min(10, evaluation));
    evalBarPercent = 50 + (cappedEval * 5);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-200 dark:from-green-900 dark:to-green-800 transition-colors duration-300">
      <div className="w-full max-w-5xl mx-auto p-4">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">Back</button>
        <h2 className="text-2xl font-bold mb-2 text-center text-green-900 dark:text-green-200">Play vs Bot</h2>
        <p className="text-center mb-4 text-green-800 dark:text-green-100">You are playing as <span className="font-bold">{playerColor === 'w' ? 'White' : 'Black'}</span></p>
        {/* Controls Card */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          <div className="bg-green-100 dark:bg-green-800 rounded-xl shadow-md px-6 py-4 flex flex-col md:flex-row items-center gap-4 border border-green-300 dark:border-green-700">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-green-900 dark:text-green-200">Bot Difficulty:</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="px-3 py-1 rounded-lg border-2 border-green-400 bg-white dark:bg-green-900 text-green-900 dark:text-green-100 focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-green-900 dark:text-green-200">Show Move Suggestion:</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSuggestion}
                  onChange={e => setShowSuggestion(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-green-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 dark:bg-green-700 rounded-full peer dark:peer-focus:ring-green-800 transition-all duration-200 peer-checked:bg-green-500"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-200 peer-checked:translate-x-5"></div>
              </label>
              <span className="text-sm text-green-700 dark:text-green-300">(Best move for you)</span>
            </div>
          </div>
        </div>
        {/* Main Layout: Eval bar, Board, Move History */}
        <div className="flex flex-row items-start justify-center gap-6">
          {/* Evaluation Bar */}
          <div className="flex flex-col items-center mr-2">
            <div className="h-80 w-7 bg-gradient-to-b from-white to-green-900 rounded-lg border-2 border-green-400 overflow-hidden relative">
              <div
                className="absolute left-0 w-full bg-green-400 transition-all duration-300"
                style={{ bottom: 0, height: `${evalBarPercent}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-center">
              {evaluation !== null ? (
                <span className={evaluation > 0 ? 'text-green-900' : evaluation < 0 ? 'text-green-100' : ''}>
                  {evaluation > 99 ? '#M' : evaluation < -99 ? '#M' : evaluation.toFixed(2)}
                </span>
              ) : (
                <span className="text-green-400">--</span>
              )}
            </div>
          </div>
          {/* Chess Board */}
          <div className="flex flex-col items-center">
            <ChessBoard
              chess={chess}
              onMove={isMyTurn && !chess.isGameOver() ? handleMove : () => {}}
              isGameOver={chess.isGameOver()}
              boardTheme={boardTheme}
              isFlipped={playerColor === 'b'}
              isMyTurn={isMyTurn && !chess.isGameOver()}
            />
            {showSuggestion && isMyTurn && suggestedMove && suggestedMove !== '...' && (
              <div className="mt-2 text-center">
                <span className="inline-block bg-green-500 text-white font-mono font-bold px-4 py-2 rounded-lg shadow-lg animate-pulse">
                  Suggested move: {suggestedMove}
                </span>
              </div>
            )}
            {showSuggestion && isMyTurn && suggestedMove === '...' && (
              <div className="mt-2 text-center text-green-600 dark:text-green-300 animate-pulse">Calculating suggestion...</div>
            )}
            {isBotThinking && (
              <div className="mt-4 text-center text-green-600 dark:text-green-300 animate-pulse">Bot is thinking...</div>
            )}
            {chess.isGameOver() && (
              <div className="mt-4 text-center text-red-600 dark:text-red-400 font-bold">Game Over: {chess.isCheckmate() ? (isMyTurn ? 'Bot wins!' : 'You win!') : 'Draw'}</div>
            )}
          </div>
          {/* Move History */}
          <MoveHistoryBox chess={chess} />
        </div>
      </div>
    </div>
  );
}; 