import React, { useState, useEffect } from 'react';
import { Users, Play, Eye, Clock, Settings, ArrowLeft, Copy, Check } from 'lucide-react';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface GameRoom {
  id: string;
  players: string[];
  spectators: string[];
  gameState: any;
  timeControl: string;
  boardTheme: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: any;
  createdBy: string;
  roomCode: string;
}

interface MultiplayerLobbyProps {
  onBack: () => void;
  onJoinGame: (roomId: string, isSpectator: boolean) => void;
  onCreateGame: (timeControl: string, boardTheme: string) => void;
  username: string;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onBack,
  onJoinGame,
  onCreateGame,
  username
}) => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState('blitz');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState('classic');
  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [roomCodeToJoin, setRoomCodeToJoin] = useState('');
  const [joinError, setJoinError] = useState('');

  // Generate a random room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Listen to real-time updates from Firestore
  useEffect(() => {
    const roomsRef = collection(db, 'gameRooms');
    // Temporarily load all rooms to debug
    const q = query(roomsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData: GameRoom[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out finished rooms in memory instead of query
        if (data.status !== 'finished') {
          roomsData.push({ id: doc.id, ...data } as GameRoom);
        }
      });
      console.log('Loaded rooms:', roomsData);
      setRooms(roomsData);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      const roomData = {
        players: [username],
        spectators: [],
        gameState: null,
        timeControl: selectedTimeControl,
        boardTheme: selectedBoardTheme,
        status: 'waiting' as const,
        createdAt: serverTimestamp(),
        createdBy: username,
        roomCode
      };

      const docRef = await addDoc(collection(db, 'gameRooms'), roomData);
      console.log('Room created with ID:', docRef.id);
      
      // Copy room code to clipboard
      navigator.clipboard.writeText(roomCode);
      setCopiedRoomCode(roomCode);
      setTimeout(() => setCopiedRoomCode(null), 2000);
      
      // Join the multiplayer game instead of creating a single-player game
      onJoinGame(docRef.id, false);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAsPlayer = async (roomId: string) => {
    try {
      const roomRef = doc(db, 'gameRooms', roomId);
      const room = rooms.find(r => r.id === roomId);
      
      if (room && room.players.length < 2 && !room.players.includes(username)) {
        await updateDoc(roomRef, {
          players: [...room.players, username]
        });
        onJoinGame(roomId, false);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleJoinAsSpectator = async (roomId: string) => {
    try {
      const roomRef = doc(db, 'gameRooms', roomId);
      const room = rooms.find(r => r.id === roomId);
      
      if (room && !room.spectators.includes(username)) {
        await updateDoc(roomRef, {
          spectators: [...room.spectators, username]
        });
        onJoinGame(roomId, true);
      }
    } catch (error) {
      console.error('Error joining as spectator:', error);
    }
  };

  const handleJoinByRoomCode = async () => {
    if (!roomCodeToJoin.trim()) {
      setJoinError('Please enter a room code');
      return;
    }

    setLoading(true);
    setJoinError('');

    try {
      console.log('Available rooms:', rooms);
      console.log('Looking for room code:', roomCodeToJoin.toUpperCase());
      
      // Find room by room code
      const room = rooms.find(r => r.roomCode.toUpperCase() === roomCodeToJoin.toUpperCase());
      
      if (!room) {
        setJoinError('Room not found. Please check the room code.');
        return;
      }

      if (room.players.includes(username)) {
        setJoinError('You are already in this room.');
        return;
      }

      if (room.players.length >= 2 && !room.spectators.includes(username)) {
        // Join as spectator if room is full
        await handleJoinAsSpectator(room.id);
      } else if (room.players.length < 2) {
        // Join as player if there's space
        await handleJoinAsPlayer(room.id);
      } else {
        setJoinError('Room is full.');
        return;
      }

      setRoomCodeToJoin('');
      setShowJoinByCode(false);
    } catch (error) {
      console.error('Error joining room:', error);
      setJoinError('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = (roomCode: string) => {
    navigator.clipboard.writeText(roomCode);
    setCopiedRoomCode(roomCode);
    setTimeout(() => setCopiedRoomCode(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-500';
      case 'playing': return 'text-green-500';
      case 'finished': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting for players';
      case 'playing': return 'Game in progress';
      case 'finished': return 'Game finished';
      default: return 'Unknown';
    }
  };

  const getTimeControlText = (timeControl: string) => {
    switch (timeControl) {
      case 'blitz': return 'Blitz (5 min)';
      case 'rapid': return 'Rapid (10 min)';
      case 'classical': return 'Classical (30 min)';
      default: return timeControl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-300">Multiplayer Lobby</h1>
            <p className="text-gray-600 dark:text-white">Welcome, {username}!</p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Create Game Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Play className="text-amber-600 dark:text-amber-400" size={24} />
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Create New Game</h2>
              </div>
              <button
                onClick={() => setShowCreateGame(!showCreateGame)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                {showCreateGame ? 'Cancel' : 'Create Game'}
              </button>
            </div>

            {showCreateGame && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Control
                    </label>
                    <select
                      value={selectedTimeControl}
                      onChange={(e) => setSelectedTimeControl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="blitz">Blitz (5 min)</option>
                      <option value="rapid">Rapid (10 min)</option>
                      <option value="classical">Classical (30 min)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Board Theme
                    </label>
                    <select
                      value={selectedBoardTheme}
                      onChange={(e) => setSelectedBoardTheme(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="classic">Classic</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="gray">Gray</option>
                      <option value="brown">Brown</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Game Room'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Join by Room Code */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="text-amber-600 dark:text-amber-400" size={24} />
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Join by Room Code</h2>
              </div>
              <button
                onClick={() => setShowJoinByCode(!showJoinByCode)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {showJoinByCode ? 'Cancel' : 'Join by Code'}
              </button>
            </div>

            {showJoinByCode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCodeToJoin}
                    onChange={(e) => setRoomCodeToJoin(e.target.value.toUpperCase())}
                    placeholder="Enter room code (e.g., XGS8AR)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    maxLength={6}
                  />
                </div>
                {joinError && (
                  <div className="text-red-500 text-sm">{joinError}</div>
                )}
                <button
                  onClick={handleJoinByRoomCode}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Available Games */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="text-amber-600 dark:text-amber-400" size={24} />
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Available Games</h2>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">No games available</div>
              <p className="text-gray-400 dark:text-gray-500">Create a new game or wait for others to join</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Room {room.roomCode}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created by {room.createdBy}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(room.status)}`}>
                      {getStatusText(room.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock size={16} />
                      <span>{getTimeControlText(room.timeControl)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Users size={16} />
                      <span>{room.players.length}/2 players</span>
                    </div>
                    {room.spectators.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Eye size={16} />
                        <span>{room.spectators.length} spectators</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Debug info - remove this later */}
                    <div className="text-xs text-gray-500">
                      Debug: status={room.status}, players={room.players.length}/2, includes={room.players.includes(username)}
                    </div>
                    
                    <div className="flex space-x-2">
                      {room.players.length < 2 && !room.players.includes(username) && (
                        <button
                          onClick={() => handleJoinAsPlayer(room.id)}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Join as Player
                        </button>
                      )}
                      {!room.spectators.includes(username) && (
                        <button
                          onClick={() => handleJoinAsSpectator(room.id)}
                          className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Watch Game
                        </button>
                      )}
                      <button
                        onClick={() => copyRoomCode(room.roomCode)}
                        className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
                        title="Copy room code"
                      >
                        {copiedRoomCode === room.roomCode ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 