import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { ChessBoard } from './ChessBoard';
import { GameStatus } from './GameStatus';
import { MoveHistory } from './MoveHistory';
import { Chat } from './Chat';
import { ArrowLeft, Users, Trophy, Eye, Handshake, Flag } from 'lucide-react';

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

export const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  roomId,
  username,
  isSpectator,
  onBack,
}) => {
  const [roomData, setRoomData] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const game = useMemo(() => {
    const fen = roomData?.gameState?.fen || undefined;
    const newGame = new Chess(fen);
    const moves = roomData?.gameState?.moves || [];
    if (newGame.history().length === 0 && moves.length > 0) {
      newGame.loadPgn(moves.join('\n'));
    }
    return newGame;
  }, [roomData]);

  const gameStatus = roomData?.status || 'loading';

  const playerColor = useMemo(() => {
    if (!roomData?.players || !username) return null;
    return roomData.players[0] === username ? 'white' : 'black';
  }, [roomData?.players, username]);

  const isMyTurn = useMemo(() => {
    if (isSpectator || !playerColor) return false;
    return game.turn() === playerColor.charAt(0);
  }, [game, playerColor, isSpectator]);

  const drawOffer = roomData?.gameState?.drawOffer;
  const showDrawModal = drawOffer?.to === username && drawOffer?.status === 'pending';

  const whitePlayer = roomData?.players?.[0];
  const blackPlayer = roomData?.players?.[1];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'gameRooms', roomId), (docSnap) => {
      if (docSnap.exists()) setRoomData(docSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    const q = query(collection(db, 'gameRooms', roomId, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [roomId]);

  const handleMove = async (move: any) => {
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

  const offerDraw = async () => {
    if (isSpectator || game.isGameOver()) return;
    const opponent = roomData.players.find((p: string) => p !== username);
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer': {
        from: username,
        to: opponent,
        status: 'pending',
      },
    });
  };

  const resignGame = async () => {
    if (isSpectator || game.isGameOver()) return;
    const winner = roomData.players.find((p: string) => p !== username);
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'status': 'finished',
      'gameState.result': `${winner} wins by resignation`,
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSpectator) return;
    await addDoc(collection(db, 'gameRooms', roomId, 'messages'), {
      message: newMessage.trim(),
      player: username,
      timestamp: serverTimestamp(),
    });
    setNewMessage('');
  };

  const handleDrawResponse = async (accepted: boolean) => {
    const opponent = roomData.players.find((p: string) => p !== username);
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer': accepted
        ? { from: opponent, to: username, status: 'accepted' }
        : null,
      'status': accepted ? 'finished' : roomData.status,
      'gameState.result': accepted ? 'Draw by agreement' : null,
    });
  };

  const finalGameOverMessage = useMemo(() => {
    if (gameStatus !== 'finished') return null;
    if (roomData.gameState?.result) return roomData.gameState.result;
    if (game.isCheckmate()) return `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate!`;
    if (game.isStalemate()) return 'Draw by stalemate';
    if (game.isThreefoldRepetition()) return 'Draw by threefold repetition';
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material';
    if (game.isDraw()) return 'The game is a draw';
    return 'Game Over';
  }, [gameStatus, game, roomData?.gameState?.result]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading game...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-white p-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="text-gray-300 hover:text-white flex gap-2">
            <ArrowLeft size={20} /> Lobby
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-amber-400">Room: {roomData.roomCode}</h1>
            {isSpectator && (
              <p className="text-xs text-blue-400 flex items-center justify-center gap-2">
                <Eye size={14} /> Spectating
              </p>
            )}
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Users size={16} /> {roomData?.players?.length}/2</span>
            {roomData?.spectators?.length > 0 && (
              <span className="flex items-center gap-1"><Eye size={16} /> {roomData.spectators.length}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
          {/* Game Info */}
          <div className="w-full max-w-xs flex flex-col gap-4">
            <div className="bg-gray-800 rounded-xl p-4 shadow">
              <GameStatus chess={game} />
            </div>
            <div className="bg-gray-800 rounded-xl p-4 shadow h-full overflow-auto flex-1">
              <MoveHistory chess={game} />
            </div>
          </div>

          {/* Chess Board */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-white bg-slate-700 px-4 py-1 rounded-full font-bold">
              ♟️ {blackPlayer || 'Waiting...'}
            </div>
            <div className="relative w-[90vw] max-w-[36rem] aspect-square">
              <ChessBoard chess={game} onMove={handleMove} isFlipped={playerColor === 'black'} />
              {gameStatus === 'finished' && (
                <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col justify-center items-center">
                  <Trophy size={48} className="text-yellow-400 mb-4" />
                  <h2 className="text-2xl font-bold">Game Over</h2>
                  <p className="text-slate-300 my-2">{finalGameOverMessage}</p>
                  <button onClick={onBack} className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold">
                    Back to Lobby
                  </button>
                </div>
              )}
            </div>
            <div className="text-gray-900 bg-slate-300 px-4 py-1 rounded-full font-bold">
              ♔ {whitePlayer || 'Waiting...'}
            </div>
          </div>

          {/* Chat Box */}
          <div className="w-full max-w-xs flex flex-col gap-4">
            <div className="bg-gray-800 rounded-xl p-4 shadow h-full overflow-auto flex-1">
              <Chat
                messages={messages}
                newMessage={newMessage}
                onMessageChange={setNewMessage}
                onSendMessage={sendMessage}
                disabled={isSpectator}
              />
            </div>
            {!isSpectator && gameStatus === 'playing' && (
              <div className="flex gap-3">
                <button
                  onClick={offerDraw}
                  disabled={!!drawOffer}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 text-sm font-semibold"
                >
                  <Handshake size={16} /> Offer Draw
                </button>
                <button
                  onClick={resignGame}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                >
                  <Flag size={16} /> Resign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Draw Modal */}
      {showDrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-blue-500 shadow-lg">
            <Handshake size={48} className="text-blue-400 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold text-center mb-2">Draw Offer</h2>
            <p className="text-center text-slate-300 mb-6">{drawOffer.from} has offered a draw.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleDrawResponse(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg">Accept</button>
              <button onClick={() => handleDrawResponse(false)} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 font-bold rounded-lg">Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
