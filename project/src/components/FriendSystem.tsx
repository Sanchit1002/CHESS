import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageSquare, Sword, ArrowLeft, Search } from 'lucide-react';
import { Friend, FriendRequest } from '../types';
import { FirebaseService } from '../services/FirebaseService';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface FriendSystemProps {
  onBack: () => void;
  onChallengeFriend: (friendId: string, friendName: string, timeControl: string, boardTheme: string) => void;
  username: string;
  // Add UID prop for current user
  uid: string;
}

export const FriendSystem: React.FC<FriendSystemProps> = ({
  onBack,
  onChallengeFriend,
  username,
  uid
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTimeControl, setChallengeTimeControl] = useState('blitz');
  const [challengeBoardTheme, setChallengeBoardTheme] = useState('classic');
  const [loading, setLoading] = useState(false);
  const firebaseService = FirebaseService.getInstance();
  const navigate = useNavigate();

  // Fetch friends and requests from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [friendsList, requestsList] = await Promise.all([
          firebaseService.getFriends(uid),
          firebaseService.getFriendRequests(uid)
        ]);
        setFriends(friendsList);
        setFriendRequests(requestsList.filter((r: FriendRequest) => r.status === 'pending'));
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid]);

  // Add friend by username or email
  const handleAddFriend = async () => {
    if (newFriendUsername.trim()) {
      setLoading(true);
      try {
        // Search by username or email
        const found = await firebaseService.findUserByUsernameOrEmail(newFriendUsername.trim());
        if (!found) {
          alert('User not found');
        } else if (found.uid === uid) {
          alert('You cannot add yourself as a friend.');
        } else {
          await firebaseService.sendFriendRequest(uid, found.uid);
          alert('Friend request sent!');
        }
      } catch (error) {
        alert('Error sending friend request.');
      } finally {
        setNewFriendUsername('');
        setShowAddFriend(false);
        setLoading(false);
      }
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (request: FriendRequest) => {
    setLoading(true);
    try {
      await firebaseService.acceptFriendRequest(uid, request.from);
      setFriendRequests(prev => prev.filter(r => r.from !== request.from));
      // Optionally refresh friends
      const friendsList = await firebaseService.getFriends(uid);
      setFriends(friendsList);
    } catch (error) {
      alert('Error accepting friend request.');
    } finally {
      setLoading(false);
    }
  };

  // Reject friend request
  const handleRejectRequest = async (request: FriendRequest) => {
    setLoading(true);
    try {
      await firebaseService.rejectFriendRequest(uid, request.from);
      setFriendRequests(prev => prev.filter(r => r.from !== request.from));
    } catch (error) {
      alert('Error rejecting friend request.');
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowChallengeModal(true);
  };

  const sendChallenge = () => {
    if (selectedFriend) {
      onChallengeFriend(selectedFriend.uid, selectedFriend.username, challengeTimeControl, challengeBoardTheme);
      setShowChallengeModal(false);
      setSelectedFriend(null);
    }
  };

  const handleMessageFriend = (friend: Friend) => {
    navigate(`/chat/${friend.uid}`);
  };

  // Defensive: always use an array for friends
  const safeFriends = Array.isArray(friends) ? friends : [];
  const filteredFriends = safeFriends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If no friends, show dummy data for demo
  const displayFriends = friends.length === 0 ? [
    { uid: '1', username: 'Tirtha', status: 'online' as 'online' },
    { uid: '2', username: 'Kabir', status: 'playing' as 'playing' },
    { uid: '3', username: 'Sanchit', status: 'playing' as 'playing' },
    { uid: '4', username: 'Savi', status: 'online' as 'online' },
    { uid: '5', username: 'Adarsh', status: 'playing' as 'playing' },
    { uid: '6', username: 'Nishant', status: 'playing' as 'playing' },
    { uid: '7', username: 'Madhur', status: 'online' as 'online' }
  ] : friends;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'playing': return 'text-yellow-500';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'playing': return 'In Game';
      case 'offline': return 'Offline';
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
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-300">Friends</h1>
            <p className="text-gray-600 dark:text-white">Manage your chess friends</p>
          </div>
          <div className="w-24"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Add Friend Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserPlus className="text-amber-600 dark:text-amber-400" size={24} />
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Add Friend</h2>
              </div>
              <button
                onClick={() => setShowAddFriend(!showAddFriend)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                {showAddFriend ? 'Cancel' : 'Add Friend'}
              </button>
            </div>

            {showAddFriend && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newFriendUsername}
                      onChange={(e) => setNewFriendUsername(e.target.value)}
                      placeholder="Enter username"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleAddFriend}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300 mb-4">Friend Requests</h3>
              <div className="space-y-3">
                {friendRequests.map((request: FriendRequest) => (
                  <div key={request.from + request.to} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{request.from}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Users className="text-amber-600 dark:text-amber-400" size={24} />
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Friends</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {displayFriends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No friends found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayFriends.map((friend: Friend) => (
                  <div key={friend.uid} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(friend.status)}`}></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{friend.username}</p>
                        <p className={`text-sm ${getStatusColor(friend.status)}`}>
                          {getStatusText(friend.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleChallenge(friend)}
                        disabled={friend.status === 'offline'}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
                      >
                        <Sword size={14} />
                        <span>Challenge</span>
                      </button>
                      <button
                        onClick={() => handleMessageFriend(friend)}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                      >
                        <MessageSquare size={14} />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Challenge Modal */}
        {showChallengeModal && selectedFriend && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-300 mb-4">
                Challenge {selectedFriend.username}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Control
                  </label>
                  <select
                    value={challengeTimeControl}
                    onChange={(e) => setChallengeTimeControl(e.target.value)}
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
                    value={challengeBoardTheme}
                    onChange={(e) => setChallengeBoardTheme(e.target.value)}
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

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={sendChallenge}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors"
                >
                  Send Challenge
                </button>
                <button
                  onClick={() => setShowChallengeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 