import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import {
  doc, onSnapshot, updateDoc, collection, addDoc,
  serverTimestamp, query, orderBy, arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChessBoard } from './ChessBoard';
import { GameStatus } from './GameStatus';
import { MoveHistory } from './MoveHistory';
import { Chat } from './Chat';
import { ArrowLeft, Users, Trophy, Eye, Handshake, Flag, XCircle } from 'lucide-react';

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
      try {
        newGame.loadPgn(moves.join('\n'));
      } catch (e) {
        console.error("Invalid PGN detected:", moves, e);
      }
    }
    return newGame;
  }, [roomData]);

  const gameStatus = roomData?.status || 'loading';

  const playerColor = useMemo(() => {
    if (!roomData || !username) return null;
    if (roomData.whitePlayer === username) return 'white';
    if (roomData.blackPlayer === username) return 'black';
    return null;
  }, [roomData]);

  const isMyTurn = useMemo(() => {
    if (isSpectator || !playerColor) return false;
    return game.turn() === playerColor.charAt(0);
  }, [game, playerColor, isSpectator]);

  const drawOffer = roomData?.gameState?.drawOffer;
  const showDrawModal = drawOffer?.to === username && drawOffer?.status === 'pending';

  // <<< UPDATED: Replaced useMemo with simple constants for robust re-rendering >>>
  const whitePlayer = roomData?.whitePlayer;
  const blackPlayer = roomData?.blackPlayer;

  useEffect(() => {
    if (!roomId) {
        setLoading(false);
        return;
    }
    const unsub = onSnapshot(doc(db, 'gameRooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
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
    const opponent = playerColor === 'white' ? blackPlayer : whitePlayer;
    if (!opponent) return;

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
    const winner = playerColor === 'white' ? blackPlayer : whitePlayer;
    if (!winner) return;
    
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
    const opponent = playerColor === 'white' ? blackPlayer : whitePlayer;
    if (!opponent) return;

    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer': accepted
        ? { from: opponent, to: username, status: 'accepted' }
        : null,
      'status': accepted ? 'finished' : roomData.status,
      'gameState.result': accepted ? 'Draw by agreement' : roomData.gameState?.result || null,
    });
  };

  const getGameOverMessage = () => {
    if (roomData?.gameState?.result?.includes('Draw')) {
      return {
        msg: roomData.gameState.result || 'Draw!',
        icon: <Handshake size={48} className="text-blue-400 mb-2" />,
        color: 'text-blue-500',
      };
    }

    if (roomData?.gameState?.result?.includes('resignation')) {
      return {
        msg: roomData.gameState.result || 'Player resigned.',
        icon: <XCircle size={48} className="text-red-500 mb-2" />,
        color: 'text-red-600',
      };
    }

    if (game.isCheckmate()) {
      const winnerName = game.turn() === 'w' ? blackPlayer : whitePlayer;
      return {
        msg: `${winnerName} wins by checkmate!`,
        icon: <Trophy size={48} className="text-amber-400 mb-2" />,
        color: 'text-amber-500',
      };
    }

    if (game.isStalemate() || game.isDraw()) {
      return {
        msg: 'Draw!',
        icon: <Handshake size={48} className="text-blue-400 mb-2" />,
        color: 'text-blue-500',
      };
    }

    return {
      msg: 'Game Over',
      icon: <Trophy size={48} className="text-amber-400 mb-2" />,
      color: 'text-amber-500',
    };
  };

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
            <h1 className="text-xl font-bold text-amber-400">Room: {roomData?.roomCode || '...'}</h1>
            {isSpectator && (
              <p className="text-l text-blue-400 flex items-center justify-center gap-2">
                <Eye size={14} /> Spectating
              </p>
            )}
          </div>
          <div className="flex gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Users size={16} /> {roomData?.players?.length || 0}/2</span>
            {roomData?.spectators?.length > 0 && (
              <span className="flex items-center gap-1"><Eye size={16} /> {roomData.spectators.length}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
          <div className="w-full max-w-xs flex flex-col gap-4 mt-[2.4rem]">
            <GameStatus chess={game} />
            <MoveHistory chess={game} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-gray-900 bg-slate-300 px-4 py-1 rounded-full font-bold">
              ♔ {blackPlayer || 'Waiting...'}
            </div>

            <div className="relative w-[90vw] max-w-[36rem] aspect-square">
              <ChessBoard chess={game} onMove={handleMove} isFlipped={playerColor === 'black'} />
              {gameStatus === 'finished' && (() => {
                const { msg, icon, color } = getGameOverMessage();
                return (
                  <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col justify-center items-center">
                    {icon}
                    <h2 className={`text-2xl font-bold mb-2 ${color}`}>{msg}</h2>
                    <button
                      onClick={onBack}
                      className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold"
                    >
                      Back to Lobby
                    </button>
                  </div>
                );
              })()}

            </div>
            <div className="text-gray-900 bg-slate-300 px-4 py-1 rounded-full font-bold">
              ♔ {whitePlayer || 'Waiting...'}
            </div>
          </div>

          <div className="w-full max-w-xs flex flex-col gap-4 mt-[2.4rem]">
            <div>
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