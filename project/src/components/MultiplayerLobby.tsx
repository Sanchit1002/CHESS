import React, { useState, useEffect } from 'react';
import { Users, Play, Eye, Clock, Settings, ArrowLeft } from 'lucide-react';
import { MockWebSocketManager, GameRoom } from '../WebSocketManager';

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
  const [wsManager] = useState(() => new MockWebSocketManager());
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState('blitz');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState('classic');

  useEffect(() => {
    // Connect to WebSocket
    wsManager.connect(username, () => {
      console.log('Connected to multiplayer lobby');
    });

    // Refresh rooms every 5 seconds
    const interval = setInterval(() => {
      setRooms(wsManager.getRooms());
    }, 5000);

    return () => {
      clearInterval(interval);
      wsManager.disconnect();
    };
  }, [wsManager, username]);

  const handleCreateRoom = () => {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    wsManager.send({
      type: 'join',
      roomId,
      userId: username,
      data: { timeControl: selectedTimeControl, boardTheme: selectedBoardTheme }
    });
    onCreateGame(selectedTimeControl, selectedBoardTheme);
  };

  const handleJoinAsPlayer = (roomId: string) => {
    wsManager.send({
      type: 'join',
      roomId,
      userId: username,
      data: {}
    });
    onJoinGame(roomId, false);
  };

  const handleJoinAsSpectator = (roomId: string) => {
    wsManager.send({
      type: 'spectator_join',
      roomId,
      userId: username,
      data: {}
    });
    onJoinGame(roomId, true);
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
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Create Game Room
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
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Room {room.id.slice(-6)}
                    </h3>
                    <span className={`text-sm font-medium ${getStatusColor(room.status)}`}>
                      {getStatusText(room.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock size={16} />
                      <span>{room.timeControl}</span>
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

                  <div className="flex space-x-2">
                    {room.status === 'waiting' && room.players.length < 2 && (
                      <button
                        onClick={() => handleJoinAsPlayer(room.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        Join as Player
                      </button>
                    )}
                    <button
                      onClick={() => handleJoinAsSpectator(room.id)}
                      className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Watch Game
                    </button>
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