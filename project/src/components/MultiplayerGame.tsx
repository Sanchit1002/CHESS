import React, { useState, useEffect, useMemo } from 'react';
import { ChessBoard } from './ChessBoard';
import { GameStatus } from './GameStatus';
import { MoveHistory } from './MoveHistory';
import { Chat } from './Chat';
import { ArrowLeft, Users, Trophy, Eye, Handshake, Flag, Sword, Shield } from 'lucide-react';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Chess, Move } from 'chess.js';

// --- Interfaces ---
interface MultiplayerGameProps {
  roomId: string;
  username: string;
  isSpectator: boolean;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  message: string;
  player: string;
  timestamp: any;
}

// --- Player Info Component ---
const PlayerInfo: React.FC<{ name: string; isWhite: boolean }> = ({ name, isWhite }) => (
    <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg w-full max-w-xs mx-auto">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isWhite ? 'bg-gray-200' : 'bg-gray-800 border-2 border-gray-600'}`}>
            {isWhite ? <Sword size={20} className="text-gray-800" /> : <Shield size={20} className="text-gray-200" />}
        </div>
        <div>
            <p className="font-bold text-white text-sm">{name || 'Waiting...'}</p>
        </div>
    </div>
);

// --- Main Game Component ---
export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  roomId,
  username,
  isSpectator,
  onBack
}) => {
  const [roomData, setRoomData] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Derived State (from roomData) ---
  const game = useMemo(() => {
    const fen = roomData?.gameState?.fen;
    const newGame = new Chess(fen);
    const moves = roomData?.gameState?.moves || [];
    if (newGame.history().length === 0 && moves.length > 0) {
        newGame.loadPgn(moves.join('\n'));
    }
    return newGame;
  }, [roomData?.gameState?.fen, roomData?.gameState?.moves]);

  const gameStatus = useMemo(() => roomData?.status || 'loading', [roomData?.status]);
  const playerColor = useMemo(() => {
    if (!roomData?.players || !username) return null;
    return roomData.players[0] === username ? 'white' : 'black';
  }, [roomData?.players, username]);

  const isMyTurn = useMemo(() => {
    if (isSpectator || !playerColor) return false;
    return game.turn() === playerColor.charAt(0);
  }, [game, playerColor, isSpectator]);
  
  const drawOffer = useMemo(() => roomData?.gameState?.drawOffer, [roomData?.gameState?.drawOffer]);

  const showDrawModal = useMemo(() => {
      return drawOffer?.to === username && drawOffer?.status === 'pending';
  }, [drawOffer, username]);

  const whitePlayer = useMemo(() => roomData?.players?.[0], [roomData?.players]);
  const blackPlayer = useMemo(() => roomData?.players?.[1], [roomData?.players]);
  
  // --- Firestore Listeners ---
  useEffect(() => {
    const roomRef = doc(db, 'gameRooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setRoomData(docSnapshot.data());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    });
    return () => unsubscribe();
  }, [roomId]);

  // --- Game Actions ---
  const handleMove = async (move: Move) => {
    if (!isMyTurn) return;
    const tempGame = new Chess(game.fen());
    const result = tempGame.move(move);
    if (!result) return;
    const newStatus = tempGame.isGameOver() ? 'finished' : 'playing';
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.fen': tempGame.fen(),
      'gameState.lastMove': { from: move.from, to: move.to },
      'status': newStatus,
      'gameState.moves': arrayUnion(result.san),
    });
  };

  const handleDrawResponse = async (accepted: boolean) => {
    if (isSpectator) return;
    const opponent = roomData.players.find((p: string) => p !== username);
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer': accepted ? { from: opponent, to: username, status: 'accepted' } : null,
      'status': accepted ? 'finished' : roomData.status,
      'gameState.result': accepted ? 'Draw by agreement' : null
    });
  };

  const offerDraw = async () => {
    if (isSpectator || game.isGameOver()) return;
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer': {
        from: username,
        to: roomData.players.find((p: string) => p !== username),
        status: 'pending'
      }
    });
  };

  const resignGame = async () => {
    if (isSpectator || game.isGameOver()) return;
    const winner = roomData.players.find((p: string) => p !== username);
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'status': 'finished',
      'gameState.result': `${winner} wins by resignation`
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSpectator) return;
    await addDoc(collection(db, 'gameRooms', roomId, 'messages'), {
      message: newMessage.trim(),
      player: username,
      timestamp: serverTimestamp()
    });
    setNewMessage('');
  };

  const finalGameOverMessage = useMemo(() => {
    if (gameStatus !== 'finished') return null;
    if (roomData.gameState?.result) return roomData.gameState.result;
    if (game.isCheckmate()) return `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate!`;
    if (game.isStalemate()) return 'Draw by stalemate';
    if (game.isThreefoldRepetition()) return 'Draw by threefold repetition';
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material';
    if (game.isDraw()) return 'The game is a draw';
    return "Game Over";
  }, [gameStatus, game, roomData?.gameState?.result]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading game...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-white p-4 lg:p-6 flex flex-col">
        {/* Header Section */}
        <div className="max-w-screen-2xl w-full mx-auto">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><ArrowLeft size={20} /><span>Lobby</span></button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-200">Room: <span className="text-amber-400 font-mono">{roomData?.roomCode}</span></h1>
                    {isSpectator && <p className="text-xs text-blue-400 flex items-center justify-center gap-2"><Eye size={14} /> Spectating</p>}
                </div>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-2"><Users size={16} /> {roomData?.players?.length ?? 0}/2</span>
                    {roomData?.spectators?.length > 0 && <span className="flex items-center gap-2"><Eye size={16} /> {roomData.spectators.length}</span>}
                </div>
            </div>
        </div>

        {/* Waiting Screen */}
        {gameStatus === 'waiting' && (
            <div className="flex-grow flex items-center justify-center">
                <div className="text-center py-20 bg-slate-800/50 rounded-lg w-full max-w-md">
                    <h2 className="text-2xl font-bold text-slate-200 mb-2">Waiting for opponent...</h2>
                    <p className="text-gray-400">Share room code: <span className="text-amber-400 font-mono">{roomData?.roomCode}</span></p>
                </div>
            </div>
        )}

        {/* Main Game Layout */}
        {gameStatus !== 'waiting' && (
            <div className="flex-grow flex items-center justify-center">
                {/* MODIFIED: This layout now exactly mirrors the structure of BotGame.tsx */}
                <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full max-w-7xl px-4">
                    
                    {/* Left Column (Game Info) */}
                    <div className="w-full lg:w-[300px] flex-shrink-0 bg-slate-800/60 rounded-xl p-4 space-y-4 backdrop-blur-sm border border-slate-700/50">
                        <h3 className="font-bold text-lg text-slate-300 px-2">Game Info</h3>
                        <GameStatus chess={game} />
                        <h3 className="font-bold text-lg text-slate-300 px-2 pt-2 border-t border-slate-700/50">Move History</h3>
                        <MoveHistory chess={game} />
                    </div>

                    {/* Center Column (Chessboard) */}
                    <div className="flex flex-col items-center justify-center w-full">
                        <PlayerInfo name={blackPlayer} isWhite={false} />
                        <div className="w-full max-w-[75vh] lg:max-w-[calc(100vh-220px)] aspect-square relative shadow-2xl my-3">
                            <ChessBoard chess={game} onMove={handleMove} isFlipped={playerColor === 'black'} />
                            {gameStatus === 'finished' && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                                    <Trophy size={56} className="text-amber-400 mb-4 drop-shadow-lg" />
                                    <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                                    <p className="text-lg text-slate-300 mb-6">{finalGameOverMessage}</p>
                                    <button onClick={onBack} className="py-2 px-6 bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold">Back to Lobby</button>
                                </div>
                            )}
                        </div>
                        <PlayerInfo name={whitePlayer} isWhite={true} />
                    </div>

                    {/* Right Column (Chat & Actions) */}
                    <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col gap-4">
                        <div className="bg-slate-800/60 rounded-xl flex flex-col border border-slate-700/50 backdrop-blur-sm">
                            <h3 className="font-bold text-lg text-slate-300 p-4 border-b border-slate-700/50">Chat</h3>
                            <Chat messages={messages} newMessage={newMessage} onMessageChange={setNewMessage} onSendMessage={sendMessage} disabled={isSpectator} />
                        </div>
                        {!isSpectator && gameStatus === 'playing' && (
                            <div className="flex gap-3">
                                <button onClick={offerDraw} disabled={!!drawOffer} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors text-sm font-semibold"><Handshake size={16} /> Offer Draw</button>
                                <button onClick={resignGame} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-semibold"><Flag size={16} /> Resign</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Draw Offer Modal */}
        {showDrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center border border-blue-500">
              <Handshake size={48} className="text-blue-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Draw Offer</h2>
              <p className="mb-6 text-lg text-slate-300">{drawOffer.from} has offered a draw.</p>
              <div className="flex gap-4">
                <button onClick={() => handleDrawResponse(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg">Accept</button>
                <button onClick={() => handleDrawResponse(false)} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 font-bold rounded-lg">Decline</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
