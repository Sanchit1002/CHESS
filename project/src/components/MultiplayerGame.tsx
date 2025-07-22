import React, { useState, useEffect } from 'react';
import { ChessBoard } from './ChessBoard';
import { GameStatus } from './GameStatus';
import { MoveHistory } from './MoveHistory';
import { Chat } from './Chat';
import { ArrowLeft, Users, Crown, Trophy, Eye } from 'lucide-react';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Chess } from 'chess.js';

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

  const handleMove = async (move: { from: string; to: string; promotion?: string }) => {
    console.log('handleMove called', move, 'isSpectator:', isSpectator, 'isMyTurn:', isMyTurn());
    if (isSpectator || !isMyTurn()) return;
    try {
      const newGame = new Chess(game.fen());
      const chessMove = newGame.move(move);
      console.log('Attempting move:', move, 'Result:', chessMove);
      console.log('New FEN:', newGame.fen(), 'Turn:', newGame.turn());
      if (chessMove) {
        const gameState = {
          fen: newGame.fen(),
          currentPlayer: newGame.turn() === 'w' ? 'white' : 'black',
          status: newGame.isGameOver() ? 'finished' : 'playing',
          moves: newGame.history(),
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

        {/* Game Over */}
        {gameStatus === 'finished' && (
          <div className="text-center py-8">
            <Trophy size={64} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Game Over!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {getGameResult()}
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