import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { Trophy, XCircle, Handshake } from 'lucide-react';

interface BotGameProps {
  boardTheme: string;
  color: 'white' | 'black' | 'random';
  onBack: () => void;
  difficulty?: number;
  botAvatar?: string;
  botName?: string;
  botRating?: number;
  botFlag?: string;
}

const DIFFICULTY_LEVELS = [
  { label: 'Easy', value: 4 },
  { label: 'Medium', value: 8 },
  { label: 'Hard', value: 15 },
];

const STORAGE_KEY = 'botAchievements';

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
    <div className="bg-white/80 dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 w-60 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-slate-800 dark:text-amber-200 mb-2 text-center">Move History</h3>
      {groupedMoves.length === 0 ? (
        <div className="text-center text-slate-400 py-6">No moves yet</div>
      ) : (
        <div className="space-y-1">
          {groupedMoves.map((group, idx) => (
            <div key={group.moveNumber} className={`flex items-center justify-between px-2 py-1 rounded-lg ${idx === groupedMoves.length - 1 ? 'bg-amber-100 dark:bg-amber-900 font-bold' : ''}`}> 
              <span className="w-6 text-slate-700 dark:text-amber-200">{group.moveNumber}.</span>
              <span className="w-14 text-slate-900 dark:text-white text-center">{group.white}</span>
              <span className="w-14 text-slate-900 dark:text-white text-center">{group.black || ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BotGame: React.FC<BotGameProps> = ({ boardTheme, color, onBack, difficulty: initialDifficulty, botAvatar, botName, botRating, botFlag }) => {
  const [chess, setChess] = useState(new Chess());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty ?? 8); // Use prop if provided
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedMove, setSuggestedMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null); // Stockfish eval
  const [topMoves, setTopMoves] = useState<Array<{ move: string; eval: number | null }> | null>(null);
  const stockfishRef = useRef<Worker | null>(null);
  const suggestionStockfishRef = useRef<Worker | null>(null);
  const evalStockfishRef = useRef<Worker | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [manualGameOver, setManualGameOver] = useState<null | 'draw' | 'resign'>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'info' }[]>([]);
  const toastId = useRef(0);

  // Helper to show toast
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

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
    setChess(prev => {
      const updated = new Chess();
      prev.history().forEach(m => updated.move(m));
      updated.move(move);
      return updated;
    });
    setSuggestedMove(null);
  };

  useEffect(() => {
    if (!isMyTurn && !chess.isGameOver()) {
      makeBotMove();
    }
    // eslint-disable-next-line
  }, [chess.fen(), isMyTurn]);

  // Helper to get bot depth and randomness based on rating
  const getBotSettings = (botRating: number) => {
    if (botRating <= 800) return { depth: 1, randomness: 2 }; // pick randomly from top 2 moves
    if (botRating <= 1000) return { depth: 2, randomness: 2 }; // pick randomly from top 2 moves
    if (botRating <= 1200) return { depth: 3, randomness: 1 }; // sometimes pick 2nd best
    if (botRating <= 1400) return { depth: 4, randomness: 0 }; // always best
    if (botRating <= 1600) return { depth: 6, randomness: 0 };
    if (botRating <= 1800) return { depth: 8, randomness: 0 };
    if (botRating <= 2000) return { depth: 10, randomness: 0 };
    return { depth: 12, randomness: 0 };
  };

  // Replace all uses of 'difficulty' with the new settings
  const botSettings = getBotSettings(botRating || 800);

  // Update makeBotMove to use randomness
  const makeBotMove = () => {
    if (!stockfishRef.current || chess.isGameOver()) return;
    setIsBotThinking(true);
    stockfishRef.current.postMessage('uci');
    stockfishRef.current.postMessage('ucinewgame');
    stockfishRef.current.postMessage(`position fen ${chess.fen()}`);
    if (botSettings.randomness > 0) {
      stockfishRef.current.postMessage('setoption name MultiPV value 3');
    }
    stockfishRef.current.postMessage(`go depth ${botSettings.depth}`);
    let moves: string[] = [];
    stockfishRef.current.onmessage = (event) => {
      const line = event.data;
      if (typeof line === 'string' && line.startsWith('info') && botSettings.randomness > 0) {
        const moveMatch = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
        const multipvMatch = line.match(/multipv (\d+)/);
        if (moveMatch && multipvMatch) {
          const idx = parseInt(multipvMatch[1], 10) - 1;
          moves[idx] = moveMatch[1];
        }
      }
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        let move = line.split(' ')[1];
        // For low-rated bots, pick randomly from top moves
        if (botSettings.randomness > 0 && moves.length > 1) {
          const pick = Math.floor(Math.random() * Math.min(botSettings.randomness, moves.length));
          move = moves[pick] || move;
        }
        if (move && move !== '(none)') {
          setChess(prev => {
            const updated = new Chess();
            prev.history().forEach(m => updated.move(m));
            updated.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: move.length > 4 ? move[4] : undefined });
            return updated;
          });
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

  const getTopMoveSuggestions = () => {
    if (!suggestionStockfishRef.current || chess.isGameOver()) return;
    setTopMoves(null);
    suggestionStockfishRef.current.postMessage('uci');
    suggestionStockfishRef.current.postMessage('ucinewgame');
    suggestionStockfishRef.current.postMessage(`position fen ${chess.fen()}`);
    suggestionStockfishRef.current.postMessage('setoption name MultiPV value 3');
    suggestionStockfishRef.current.postMessage(`go depth ${difficulty}`);
    let moves: Array<{ move: string; eval: number | null }> = [];
    suggestionStockfishRef.current.onmessage = (event) => {
      const line = event.data;
      if (typeof line === 'string' && line.startsWith('info')) {
        // Parse multipv info lines
        const multipvMatch = line.match(/multipv (\d+)/);
        const moveMatch = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
        const evalMatch = line.match(/score (cp|mate) (-?\d+)/);
        if (multipvMatch && moveMatch && evalMatch) {
          let evalValue: number | null = null;
          if (evalMatch[1] === 'cp') {
            evalValue = parseInt(evalMatch[2], 10) / 100;
          } else if (evalMatch[1] === 'mate') {
            evalValue = (parseInt(evalMatch[2], 10) > 0 ? 100 : -100);
          }
          const move = moveMatch[1];
          const idx = parseInt(multipvMatch[1], 10) - 1;
          moves[idx] = { move, eval: evalValue };
        }
      }
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        // Only keep up to 3 moves
        setTopMoves(moves.slice(0, 3));
      }
    };
  };

  useEffect(() => {
    if (showSuggestion && isMyTurn && !chess.isGameOver()) {
      getMoveSuggestion();
      getTopMoveSuggestions();
    } else {
      setSuggestedMove(null);
      setTopMoves(null);
    }
    // eslint-disable-next-line
  }, [showSuggestion, chess.fen(), isMyTurn, difficulty]);

  useEffect(() => {
    getEvaluation();
    // eslint-disable-next-line
  }, [chess.fen()]);

  // Show modal when game is over
  useEffect(() => {
    console.log('Checking game over:', chess.isGameOver(), chess.fen());
    if (chess.isGameOver()) {
      setShowGameOverModal(true);
      console.log('Game over modal should show!');
    }
  }, [chess.fen()]);

  let evalBarPercent = 50;
  if (evaluation !== null) {
    const cappedEval = Math.max(-10, Math.min(10, evaluation));
    evalBarPercent = 50 + (cappedEval * 5);
  }

  // Add handlers for draw and resign
  const handleDraw = () => {
    setManualGameOver('draw');
    setShowGameOverModal(true);
  };
  const handleResign = () => {
    setManualGameOver('resign');
    setShowGameOverModal(true);
  };

  // Update getGameOverMessage to handle manualGameOver
  const getGameOverMessage = () => {
    if (manualGameOver === 'draw') {
      return { msg: 'Draw!', icon: <Handshake size={48} className="text-blue-400 mb-2" />, color: 'text-blue-500' };
    }
    if (manualGameOver === 'resign') {
      return { msg: 'You resigned. Bot wins!', icon: <XCircle size={48} className="text-red-500 mb-2" />, color: 'text-red-600' };
    }
    if (chess.isCheckmate()) {
      return isMyTurn ? { msg: 'Bot wins!', icon: <XCircle size={48} className="text-red-500 mb-2" />, color: 'text-red-600' } : { msg: 'You win!', icon: <Trophy size={48} className="text-amber-400 mb-2" />, color: 'text-amber-500' };
    }
    if (chess.isStalemate() || chess.isDraw()) {
      return { msg: 'Draw!', icon: <Handshake size={48} className="text-blue-400 mb-2" />, color: 'text-blue-500' };
    }
    return { msg: 'Game Over', icon: <Trophy size={48} className="text-amber-400 mb-2" />, color: 'text-amber-500' };
  };

  const handlePlayAgain = () => {
    setChess(new Chess());
    setShowGameOverModal(false);
    setManualGameOver(null);
  };

  // Helper to convert UCI move to SAN
  const uciToSan = (uciMove: string) => {
    const tempChess = new Chess(chess.fen());
    const moveObj = {
      from: uciMove.substring(0, 2),
      to: uciMove.substring(2, 4),
      promotion: uciMove.length > 4 ? uciMove[4] : undefined
    };
    const move = tempChess.move(moveObj);
    return move ? move.san : uciMove;
  };

  // Helper to update achievements in localStorage
  const updateAchievements = () => {
    if (!botName) return;
    let achievements: Record<string, string[]> = { unlocked: [], beaten: [] };
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) achievements = JSON.parse(data) as Record<string, string[]>;
    let updated = false;

    // Track rating and total wins
    let rating = Number(localStorage.getItem('userRating') || '800');
    let totalWins = Number(localStorage.getItem('totalWins') || '0');
    // Mark as beaten if user wins
    if (!achievements.beaten.includes(botName) && chess.isCheckmate() && !isMyTurn) {
      achievements.beaten.push(botName);
      updated = true;
      showToast(`You beat ${botName}!`, 'success');
      // Increase rating and total wins
      rating += 50;
      totalWins += 1;
      localStorage.setItem('userRating', rating.toString());
      localStorage.setItem('totalWins', totalWins.toString());
    }
    // Unlock bots based on criteria
    if (!achievements.unlocked.includes('John') && achievements.beaten.includes('Martin')) {
      achievements.unlocked.push('John');
      updated = true;
      showToast('Unlocked John!', 'info');
    }
    if (!achievements.unlocked.includes('Kate') && achievements.beaten.includes('Maria')) {
      achievements.unlocked.push('Kate');
      updated = true;
      showToast('Unlocked Kate!', 'info');
    }
    // Unlock T-Rex at 1000 rating
    if (!achievements.unlocked.includes('T-Rex') && rating >= 1000) {
      achievements.unlocked.push('T-Rex');
      updated = true;
      showToast('Unlocked T-Rex (1000 rating)!', 'info');
    }
    // Unlock Pablo at 1500 rating
    if (!achievements.unlocked.includes('Pablo') && rating >= 1500) {
      achievements.unlocked.push('Pablo');
      updated = true;
      showToast('Unlocked Pablo (1500 rating)!', 'info');
    }
    // Unlock Alex at 10 total wins
    if (!achievements.unlocked.includes('Alex') && totalWins >= 10) {
      achievements.unlocked.push('Alex');
      updated = true;
      showToast('Unlocked Alex (10 total wins)!', 'info');
    }
    // Add more unlock logic as needed...
    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
    }
  };

  // Call updateAchievements when game is over
  useEffect(() => {
    if (chess.isGameOver()) {
      updateAchievements();
    }
    // eslint-disable-next-line
  }, [chess.fen()]);

  // Place debug log here, outside of JSX
  console.log('showGameOverModal:', showGameOverModal);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 transition-colors duration-300">
      {/* Toast Notifications */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-3 rounded-xl shadow-lg font-semibold text-white animate-fade-in-out ${toast.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ minWidth: 220, textAlign: 'center' }}
          >
            {toast.message}
          </div>
        ))}
      </div>
      {/* Bot Info */}
      {botAvatar && (
        <div className="flex flex-col items-center mb-4">
          <img src={botAvatar} alt={botName} className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-lg mb-2" />
          <div className="text-lg font-bold text-slate-900 dark:text-amber-200">{botName} {botFlag && <span className="ml-1">{botFlag}</span>}</div>
          {botRating && <div className="text-sm text-slate-500 dark:text-amber-100">Rating: {botRating}</div>}
        </div>
      )}
      {/* Draw and Resign Buttons */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleDraw}
          disabled={chess.isGameOver() || showGameOverModal}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow disabled:opacity-50"
        >
          Offer Draw
        </button>
        <button
          onClick={handleResign}
          disabled={chess.isGameOver() || showGameOverModal}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow disabled:opacity-50"
        >
          Resign
        </button>
      </div>
      {/* Main Layout: Controls, Eval bar, Board, Move History */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-6 w-full max-w-5xl px-2">
        {/* Controls Column (left of board) */}
        <div className="flex flex-col items-center w-full max-w-xs lg:w-[20rem] lg:h-[36rem] mb-4 justify-center">
          <div className="w-full flex flex-col gap-4 bg-white/90 dark:bg-slate-800 rounded-xl shadow-md px-6 py-4 border border-slate-200 dark:border-slate-700 mb-4">
            <div className="flex items-center gap-2 justify-between w-full">
              <label className="font-semibold text-slate-900 dark:text-amber-200">Bot Difficulty:</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="px-3 py-1 rounded-lg border-2 border-amber-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-900 dark:text-amber-200">Show Move Suggestion:</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSuggestion}
                  onChange={e => setShowSuggestion(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 dark:bg-slate-700 rounded-full peer dark:peer-focus:ring-amber-800 transition-all duration-200 peer-checked:bg-amber-500"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-200 peer-checked:translate-x-5"></div>
              </label>
              <span className="text-sm text-slate-700 dark:text-amber-200">(Best move for you)</span>
            </div>
          </div>
          {/* Evaluation Bar - add margin to move downward */}
          <div className="flex flex-col items-center mt-8">
            <div className="h-80 w-7 bg-gradient-to-b from-white to-slate-400 dark:from-slate-200 dark:to-slate-900 rounded-lg border-2 border-amber-400 overflow-hidden relative">
              <div
                className="absolute left-0 w-full bg-amber-400 transition-all duration-300"
                style={{ bottom: 0, height: `${evalBarPercent}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-center">
              {evaluation !== null ? (
                <span className={evaluation > 0 ? 'text-amber-700' : evaluation < 0 ? 'text-slate-900 dark:text-amber-200' : ''}>
                  {evaluation > 99 ? '#M' : evaluation < -99 ? '#M' : evaluation.toFixed(2)}
                </span>
              ) : (
                <span className="text-slate-400">--</span>
              )}
            </div>
          </div>
        </div>
        {/* Chess Board and Suggestions */}
        <div className="flex flex-col items-center justify-center w-full">
          <div className="shadow-2xl rounded-lg w-full max-w-[95vw] aspect-square lg:w-[36rem] lg:h-[36rem]">
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
            <div className="mt-2 text-center w-[480px]">
              <span className="inline-block bg-amber-500 text-white font-mono font-bold px-4 py-2 rounded-lg shadow-lg animate-pulse w-full">
                Suggested move: {uciToSan(suggestedMove)}
              </span>
            </div>
          )}
          {showSuggestion && isMyTurn && suggestedMove === '...' && (
            <div className="mt-2 text-center text-amber-600 dark:text-amber-300 animate-pulse w-[480px]">Calculating suggestion...</div>
          )}
          {isBotThinking && (
            <div className="mt-4 text-center text-amber-600 dark:text-amber-300 animate-pulse w-[480px]">Bot is thinking...</div>
          )}
          {chess.isGameOver() && !showGameOverModal && (
            <div className="mt-4 text-center text-red-600 dark:text-red-400 font-bold w-[480px]">Game Over: {chess.isCheckmate() ? (isMyTurn ? 'Bot wins!' : 'You win!') : 'Draw'}</div>
          )}
          {showSuggestion && isMyTurn && topMoves && topMoves.length > 0 && (
            <div className="mt-2 text-center w-72 mx-auto">
              <div className="inline-block bg-white/90 dark:bg-slate-800 rounded-lg shadow px-2 py-1 w-full">
                <span className="font-semibold text-slate-700 dark:text-amber-200 mr-2 text-sm">Top 3 moves:</span>
                <ul className="flex flex-row gap-2 justify-center items-center">
                  {topMoves.map((m, i) => (
                    <li key={i} className="flex flex-col items-center">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${i === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-amber-100'} text-sm`}>{uciToSan(m.move)}</span>
                      <span className="text-xs text-slate-500 dark:text-amber-200">{m.eval !== null ? (m.eval > 99 ? '#M' : m.eval < -99 ? '#M' : m.eval.toFixed(2)) : '--'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        {/* Move History - same width as controls/board */}
        <div className="flex flex-col items-center w-full max-w-xs lg:w-[20rem] lg:h-[36rem] mx-auto">
          <MoveHistoryBox chess={chess} />
        </div>
      </div>
      {/* Game Over Modal (always rendered at top level) */}
      {showGameOverModal && (
        (() => { console.log('Rendering modal!'); return null; })(),
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center border-4 border-amber-400 animate-pop">
            {getGameOverMessage().icon}
            <h2 className={`text-3xl font-extrabold mb-2 ${getGameOverMessage().color}`}>{getGameOverMessage().msg}</h2>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-6">{chess.isCheckmate() ? 'Checkmate' : chess.isStalemate() ? 'Stalemate' : chess.isDraw() ? 'Draw' : 'Game Over'}</p>
            <div className="flex gap-4">
              <button
                onClick={handlePlayAgain}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow transition-all text-lg"
              >
                Play Again
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg shadow transition-all text-lg"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 