import React, { useState, useEffect } from 'react';
import { Users, Eye, Clock, ArrowLeft, Copy, Check, Link, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, where, getDocs, serverTimestamp, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

// Interface with correct player fields
interface GameRoom {
  id: string;
  players: string[];
  whitePlayer: string | null;
  blackPlayer: string | null;
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
  username: string;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onBack,
  onJoinGame,
  username
}) => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState('10 + 5');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState('classic');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const roomsRef = collection(db, 'gameRooms');
    const q = query(roomsRef, where('status', 'in', ['waiting', 'playing']), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData: GameRoom[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameRoom));
      setRooms(roomsData);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateGame = async () => {
    setLoading(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const roomData = {
        players: [username],
        whitePlayer: username,
        blackPlayer: null,
        spectators: [],
        gameState: {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            moves: [],
            lastMove: null,
        },
        timeControl: selectedTimeControl,
        boardTheme: selectedBoardTheme,
        status: 'waiting' as const,
        createdAt: serverTimestamp(),
        createdBy: username,
        roomCode: newCode,
      };
      console.log("--- Creating Game ---");
      console.log("Payload being sent:", roomData);
      const docRef = await addDoc(collection(db, 'gameRooms'), roomData);
      setShowCreateModal(false);
      onJoinGame(docRef.id, false);
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    setJoinError('');

    const roomsRef = collection(db, 'gameRooms');
    const q = query(roomsRef, where('roomCode', '==', joinCode.trim().toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setJoinError('Room not found. Please check the code.');
      setLoading(false);
      return;
    }

    const roomDoc = querySnapshot.docs[0];
    const room = { id: roomDoc.id, ...roomDoc.data() } as GameRoom;

    if (room.players.includes(username)) {
      onJoinGame(room.id, false);
      return;
    }

    if (room.players.length < 2) {
      const updatePayload = {
        players: arrayUnion(username),
        blackPlayer: username,
        status: 'playing'
      };
      // <<< DEEPER DEBUGGING LOG >>>
      console.log("--- Joining by Code ---");
      console.log(`Attempting to update doc ${room.id} with payload:`, updatePayload);
      await updateDoc(doc(db, 'gameRooms', room.id), updatePayload);
      console.log("Update successful!");
      onJoinGame(room.id, false);
    } else {
      if (!room.spectators.includes(username)) {
        await updateDoc(doc(db, 'gameRooms', room.id), {
          spectators: arrayUnion(username)
        });
      }
      onJoinGame(room.id, true);
    }
    setLoading(false);
  };
  
  const handleJoinAsPlayer = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && room.players.length < 2 && !room.players.includes(username)) {
      const updatePayload = {
        players: arrayUnion(username),
        blackPlayer: username,
        status: 'playing',
      };
      // <<< DEEPER DEBUGGING LOG >>>
      console.log("--- Joining as Player ---");
      console.log(`Attempting to update doc ${roomId} with payload:`, updatePayload);
      await updateDoc(doc(db, 'gameRooms', roomId), updatePayload);
      console.log("Update successful!");
      onJoinGame(roomId, false);
    }
  };

  const handleJoinAsSpectator = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
        if (!room.spectators.includes(username)) {
            await updateDoc(doc(db, 'gameRooms', roomId), {
                spectators: arrayUnion(username)
            });
        }
        onJoinGame(roomId, true);
    }
  };

  const handleCopy = (code: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <>
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-slate-800 p-8 text-white">
        
        <button onClick={onBack} className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-10">
            <ArrowLeft size={20} />
            <span>Back</span>
        </button>

        <div className="w-full max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="font-extrabold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 bg-clip-text text-transparent drop-shadow-lg text-3xl lg:text-4xl">Play a Friend</h1>
            <p className="text-gray-400 mt-2 font-bold">Welcome, {username}</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 w-full max-w-4xl mx-auto mb-16">
              <div className="flex-1 bg-slate-800/80 rounded-2xl shadow-2xl border border-slate-700 p-8 flex flex-col items-center justify-between transition-all duration-300 hover:border-blue-500 hover:shadow-[0_0_20px_0px_rgba(59,130,246,0.3)] min-h-[260px] hover:-translate-y-1">
                  <div className="text-center">
                      <h2 className="text-2xl font-bold mb-2">Create a Private Game</h2>
                      <p className="text-gray-400">Start a new game and invite a friend.</p>
                  </div>
                  <button onClick={() => setShowCreateModal(true)} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                      <Link className="h-5 w-5" /><span>Create Game</span>
                  </button>
              </div>

              <div className="flex-1 bg-slate-800/80 rounded-2xl shadow-2xl border border-slate-700 p-8 flex flex-col items-center justify-between transition-all duration-300 hover:border-amber-500 hover:shadow-[0_0_20px_0px_rgba(245,158,11,0.3)] min-h-[260px] hover:-translate-y-1">
                  {isJoining ? (
                      <>
                          <div className="text-center w-full">
                              <h2 className="text-2xl font-bold mb-2">Join with a Code</h2>
                              <p className="text-gray-400">Enter a code to join a friend's game.</p>
                          </div>
                          <form onSubmit={handleJoinByCode} className="w-full flex flex-col gap-4 mt-6">
                              <input autoFocus type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ENTER GAME CODE" className="w-full bg-gray-900 border-2 border-slate-600 rounded-lg text-center font-mono text-lg tracking-widest p-3 focus:border-amber-500 focus:ring-amber-500 focus:outline-none transition-colors" />
                              {joinError && <p className="text-red-500 text-xs text-center">{joinError}</p>}
                              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200" disabled={!joinCode.trim() || loading}>
                                  {loading ? 'Joining...' : 'Confirm Join'}
                              </button>
                          </form>
                      </>
                  ) : (
                      <>
                          <div className="text-center">
                              <h2 className="text-2xl font-bold mb-2">Join with a Code</h2>
                              <p className="text-gray-400">Enter a code to join a friend's game.</p>
                          </div>
                          <button onClick={() => setIsJoining(true)} className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200">
                              Join Game
                          </button>
                      </>
                  )}
              </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-300 mb-6">Or Join an Available Game</h2>
            {rooms.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-lg">
                <p className="text-gray-400 text-lg">No public games available right now.</p>
                <p className="text-gray-500">Why not create one?</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-slate-700 flex flex-col hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 relative hover:-translate-y-1">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex-grow">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-300">
                                    <span className="font-semibold">{room.createdBy}'s</span> Game
                                </p>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${room.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {room.status}
                                </span>
                            </div>
                            <h3 className="text-2xl font-mono font-bold text-amber-400 tracking-widest mb-4">{room.roomCode}</h3>
                            <div className="text-sm text-gray-200 flex items-center justify-between border-t border-slate-700 pt-3">
                                <span className="flex items-center gap-1.5"><Clock size={14} /> {room.timeControl}</span>
                                <span className="flex items-center gap-1.5"><Users size={14} /> {room.players.length}/2</span>
                                {room.spectators.length > 0 && <span className="flex items-center gap-1.5"><Eye size={14} /> {room.spectators.length}</span>}
                            </div>
                        </div>
                        <div className="mt-5 flex items-center gap-2">
                            {room.players.length < 2 && !room.players.includes(username) ? (
                              <button onClick={() => handleJoinAsPlayer(room.id)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md transition-colors">Join Game</button>
                            ) : (
                              <button onClick={() => handleJoinAsSpectator(room.id)} className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold rounded-md transition-colors">Watch</button>
                            )}
                            <button onClick={() => handleCopy(room.roomCode)} title="Copy Code" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
                                {copiedCode === room.roomCode ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col border border-slate-700 relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Game Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time Control</label>
                <select value={selectedTimeControl} onChange={(e) => setSelectedTimeControl(e.target.value)} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option>Unlimited Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Board Theme</label>
                <select value={selectedBoardTheme} onChange={(e) => setSelectedBoardTheme(e.target.value)} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="classic">Classic</option>
                  
                </select>
              </div>
            </div>
            <button onClick={handleCreateGame} disabled={loading} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50">
              {loading ? 'Creating...' : 'Confirm and Create'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
