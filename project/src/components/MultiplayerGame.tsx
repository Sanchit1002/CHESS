import React, { useState, useEffect } from 'react';
import { ChessBoard } from './ChessBoard';
import { GameStatus } from './GameStatus';
import { MoveHistory } from './MoveHistory';
import { Chat } from './Chat';
import { ArrowLeft, Users, Crown, Trophy, Eye } from 'lucide-react';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Chess } from 'chess.js';
import { Modal } from './Modal'; // If you have a Modal component, otherwise use inline modal code

interface MultiplayerGameProps {
  roomId: string;
  username: string;
  isSpectator: boolean;
  onBack: () => void;
}

interface GameMove {
  from: string;
  to: string;
  promotion?: string;
  timestamp: any;
  player: string;
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
  onBack
}) => {
  const [game, setGame] = useState(new Chess());
  const [gameState, setGameState] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [gameStatus, setGameStatus] = useState<string>('waiting');
  const [loading, setLoading] = useState(true);
  const [drawOffer, setDrawOffer] = useState<null | { from: string; to: string; status: 'pending' | 'accepted' | 'declined' }>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [resigned, setResigned] = useState<null | string>(null); // username of player who resigned

  // Listen to real-time game updates
  useEffect(() => {
    const roomRef = doc(db, 'gameRooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setRoomData(data);
        
        if (data.gameState) {
          // Reconstruct the game using the full move list for accurate move history
          const newGame = new Chess();
          if (data.gameState.moves && Array.isArray(data.gameState.moves)) {
            data.gameState.moves.forEach((move: string) => {
              newGame.move(move);
            });
          } else if (data.gameState.fen) {
            // fallback: set FEN if no moves array
            newGame.load(data.gameState.fen);
          }
          setGame(newGame);
          setCurrentPlayer(data.gameState.currentPlayer || 'white');
          // Start game when 2 players join, or if moves have been made
          if (data.players && data.players.length >= 2 || (data.gameState.moves && data.gameState.moves.length > 0)) {
            setGameStatus('playing');
          } else {
            setGameStatus('waiting');
          }
        } else {
          // No game state yet, check if we should start the game
          if (data.players && data.players.length >= 2) {
            setGameStatus('playing');
            // Initialize the game state if it doesn't exist and we have 2 players
            if (!data.gameState) {
              const initialGame = new Chess();
              const gameState = {
                fen: initialGame.fen(),
                currentPlayer: 'white',
                status: 'playing',
                moves: [],
                lastMove: null
              };
              
              // Update the room with initial game state
              updateDoc(doc(db, 'gameRooms', roomId), {
                gameState,
                status: 'playing'
              });
            }
          } else {
            setGameStatus('waiting');
          }
        }
        
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Listen to real-time chat messages
  useEffect(() => {
    const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: ChatMessage[] = [];
      snapshot.forEach((docSnapshot) => {
        messagesData.push({ id: docSnapshot.id, ...docSnapshot.data() } as ChatMessage);
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Listen for draw offers and resigns in Firestore
  useEffect(() => {
    if (!roomData) return;
    if (roomData.gameState?.drawOffer) {
      setDrawOffer(roomData.gameState.drawOffer);
      if (roomData.gameState.drawOffer.to === username && roomData.gameState.drawOffer.status === 'pending') {
        setShowDrawModal(true);
      }
    } else {
      setDrawOffer(null);
      setShowDrawModal(false);
    }
    if (roomData.gameState?.resigned) {
      setResigned(roomData.gameState.resigned);
    } else {
      setResigned(null);
    }
  }, [roomData, username]);

  const handleMove = async (move: { from: string; to: string; promotion?: string }) => {
    if (isSpectator || !isMyTurn()) return;
    try {
      // Get the current moves array from Firestore
      const currentMoves = (roomData?.gameState?.moves && Array.isArray(roomData.gameState.moves))
        ? [...roomData.gameState.moves]
        : [];

      // Create a new Chess instance and play all previous moves
      const newGame = new Chess();
      currentMoves.forEach((m: string) => newGame.move(m));

      // Make the new move
      const chessMove = newGame.move(move);
      if (chessMove) {
        // Add the new move in SAN format to the moves array
        currentMoves.push(chessMove.san);

        const gameState = {
          fen: newGame.fen(),
          currentPlayer: newGame.turn() === 'w' ? 'white' : 'black',
          status: newGame.isGameOver() ? 'finished' : 'playing',
          moves: currentMoves,
          lastMove: { from: move.from, to: move.to }
        };
        await updateDoc(doc(db, 'gameRooms', roomId), {
          gameState,
          status: gameState.status
        });
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const messagesRef = collection(db, 'gameRooms', roomId, 'messages');
      await addDoc(messagesRef, {
        message: newMessage.trim(),
        player: username,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getPlayerColor = () => {
    if (!roomData) return 'white';
    const playerIndex = roomData.players.indexOf(username);
    return playerIndex === 0 ? 'white' : 'black';
  };

  const isMyTurn = () => {
    if (isSpectator) return false;
    return currentPlayer === getPlayerColor();
  };

  const getGameResult = () => {
    if (!game.isGameOver()) return null;
    
    if (game.isCheckmate()) {
      const winner = currentPlayer === 'white' ? 'black' : 'white';
      return `${winner} wins by checkmate!`;
    }
    if (game.isDraw()) return 'Game is a draw!';
    if (game.isStalemate()) return 'Game is a draw by stalemate!';
    return 'Game over!';
  };

  // Draw and resign handlers
  const offerDraw = async () => {
    if (!roomData || isSpectator || game.isGameOver()) return;
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer': {
        from: username,
        to: roomData.players.find((p: string) => p !== username),
        status: 'pending'
      }
    });
  };
  const acceptDraw = async () => {
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer.status': 'accepted',
      'gameState.status': 'finished',
      'gameState.result': 'draw'
    });
    setShowDrawModal(false);
  };
  const declineDraw = async () => {
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.drawOffer': null
    });
    setShowDrawModal(false);
  };
  const resignGame = async () => {
    if (!roomData || isSpectator || game.isGameOver()) return;
    await updateDoc(doc(db, 'gameRooms', roomId), {
      'gameState.resigned': username,
      'gameState.status': 'finished',
      'gameState.result': `${username} resigned`
    });
  };

  // Debug: log roomData and username to help diagnose move issues
  console.log('roomData:', roomData, 'username:', username);
  // Debug: log currentPlayer, getPlayerColor, and isMyTurn to help diagnose turn issues
  console.log('currentPlayer:', currentPlayer, 'getPlayerColor():', getPlayerColor(), 'isMyTurn:', isMyTurn());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Lobby</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Multiplayer Game</h1>
            <p className="text-gray-600 dark:text-white">
              Room: {roomData?.roomCode} | {isSpectator ? 'Spectating' : `Playing as ${getPlayerColor()}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {roomData?.players.length}/2 players
              </span>
            </div>
            {roomData?.spectators.length > 0 && (
              <div className="flex items-center space-x-2">
                <Eye size={20} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {roomData.spectators.length} spectators
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Game Status */}
        {gameStatus === 'waiting' && (
          <div className="text-center py-8">
            <div className="text-xl text-gray-600 dark:text-white mb-4">
              Waiting for opponent to join...
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Share room code: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                {roomData?.roomCode}
              </span>
            </div>
          </div>
        )}

        {gameStatus === 'playing' && (
          <div className="w-full max-w-screen-xl mx-auto flex flex-col md:flex-row md:justify-between md:items-start gap-8 px-2">
            {/* Left Column - Game Info */}
            <div className="space-y-4 max-h-[600px] overflow-auto md:w-[260px] flex-shrink-0 md:mr-1">
              <GameStatus 
                chess={game}
                onResetGame={() => {}} // No reset in multiplayer
              />
              <MoveHistory chess={game} />
            </div>

            {/* Center Column - Chess Board */}
            <div className="flex justify-center w-[480px] h-[480px] flex-shrink-0 md:ml-4">
              <div className="relative w-full h-full">
                <ChessBoard
                  chess={game}
                  onMove={handleMove}
                  isGameOver={game.isGameOver()}
                  boardTheme={roomData?.boardTheme || 'classic'}
                  isFlipped={getPlayerColor() === 'black'}
                  isMyTurn={isMyTurn()}
                  disableDragDrop={true}
                />
                {isSpectator && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <Eye size={48} className="mx-auto mb-2" />
                      <p>Spectator Mode</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Chat */}
            <div className="space-y-4 max-h-[600px] overflow-auto w-[350px] min-w-[320px] bg-white dark:bg-gray-800 rounded-lg shadow-lg px-2 flex-shrink-0 ml-auto">
              <Chat
                messages={messages}
                newMessage={newMessage}
                onMessageChange={setNewMessage}
                onSendMessage={sendMessage}
                disabled={isSpectator}
              />
            </div>
          </div>
        )}

        {/* Draw/Resign Buttons (only for players, not spectators, and only if game is not over) */}
        {!isSpectator && gameStatus === 'playing' && !game.isGameOver() && (
          <div className="flex gap-4 mb-4 justify-center">
            <button
              onClick={offerDraw}
              disabled={!!drawOffer || showDrawModal}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow disabled:opacity-50"
            >
              {drawOffer && drawOffer.from === username ? 'Draw Offered' : 'Offer Draw'}
            </button>
            <button
              onClick={resignGame}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow disabled:opacity-50"
            >
              Resign
            </button>
          </div>
        )}
        {/* Draw Offer Modal */}
        {showDrawModal && drawOffer && drawOffer.to === username && drawOffer.status === 'pending' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center border-4 border-blue-400 animate-pop">
              <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-300">Draw Offer</h2>
              <p className="mb-6 text-lg text-gray-700 dark:text-gray-200">{drawOffer.from} has offered a draw. Do you accept?</p>
              <div className="flex gap-4">
                <button onClick={acceptDraw} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow">Accept</button>
                <button onClick={declineDraw} className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg shadow">Decline</button>
              </div>
            </div>
          </div>
        )}
        {/* Game Over */}
        {gameStatus === 'finished' && (
          <div className="text-center py-8">
            <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Game Over!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {resigned ? `${resigned} resigned. ${roomData?.players.find((p: string) => p !== resigned)} wins!` : (roomData?.gameState?.result || getGameResult())}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 