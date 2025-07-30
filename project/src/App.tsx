import React, { useState, useEffect } from 'react';
import { SignIn } from './components/Auth/SignIn';
import { SignUp } from './components/Auth/SignUp';
import { GameModeSelection } from './components/GameModeSelection';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGame } from './components/MultiplayerGame';
import { Leaderboard } from './components/Leaderboard';
import { FriendSystem } from './components/FriendSystem';
import { Game } from './components/Game';
import { Analytics } from './components/Analytics';
import { Competitive } from './components/Competitive';
import { TestData } from './components/TestData';
import { Moon, Sun } from 'lucide-react';
import { BotGame } from './components/BotGame';
import BotLevelSelection from './components/BotLevelSelection';
import { db, auth } from './firebase';

type AppState = 'signin' | 'signup' | 'gameMode' | 'multiplayer' | 'multiplayerGame' | 'friends' | 'game' | 'analytics' | 'competitive' | 'testData' | 'leaderboard' | 'testEnv' | 'botGame' | 'botLevelSelection';

interface User {
  username: string;
  email: string;
}

function App() {
  const [currentState, setCurrentState] = useState<AppState>('signin');
  const [user, setUser] = useState<User | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState<string>('');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState<string>('classic');
  const [isSpectator, setIsSpectator] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const [multiplayerRoomId, setMultiplayerRoomId] = useState<string>('');
  const [isMultiplayerSpectator, setIsMultiplayerSpectator] = useState(false);
  const [customTimeControl, setCustomTimeControl] = useState<{ minutes: number; seconds: number; increment: number; name: string } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | 'random'>('white');
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [wantsHelp, setWantsHelp] = useState<boolean | null>(null);
  const [selectedBot, setSelectedBot] = useState<any>(null);

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('chessUser');
    console.log('Loading saved user:', savedUser);
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setCurrentState('gameMode');
    }
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, accept any email/password
    const mockUser: User = {
      username: email.split('@')[0], // Use email prefix as username
      email: email
    };
    
    setUser(mockUser);
    localStorage.setItem('chessUser', JSON.stringify(mockUser));
    setCurrentState('gameMode');
    setIsLoading(false);
  };

  const handleSignUp = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      username: username,
      email: email
    };
    
    setUser(newUser);
    localStorage.setItem('chessUser', JSON.stringify(newUser));
    setCurrentState('gameMode');
    setIsLoading(false);
  };

  // Update handleStartGame to accept opponentName
  const handleStartGame = (
    timeControl: string | { minutes: number; seconds: number; increment: number; name: string },
    boardTheme: string = 'classic',
    color: 'white' | 'black' | 'random' = 'white',
    opponent: string = ''
  ) => {
    if (timeControl === 'bot') {
      setSelectedBoardTheme(boardTheme);
      setSelectedColor(color);
      setCurrentState('botLevelSelection');
      return;
    }
    if (typeof timeControl === 'string') {
      setSelectedTimeControl(timeControl);
      setCustomTimeControl(undefined);
    } else {
      setSelectedTimeControl('custom');
      setCustomTimeControl(timeControl);
    }
    setSelectedBoardTheme(boardTheme);
    setSelectedColor(color);
    setOpponentName(opponent);
    setIsSpectator(false);
    setRoomId(`room_${Date.now()}`);
    
    // Show help dialog for new games
    if (wantsHelp === null) {
      setShowHelpDialog(true);
    } else {
    setCurrentState('game');
    }
  };

  const handleJoinGame = (roomId: string, isSpectator: boolean) => {
    // In a real app, this would join the specific game room
    console.log(`Joining game room ${roomId} as ${isSpectator ? 'spectator' : 'player'}`);
    setRoomId(roomId);
    setIsSpectator(isSpectator);
    setCurrentState('game');
  };

  const handleJoinMultiplayerGame = (roomId: string, isSpectator: boolean) => {
    console.log(`Joining multiplayer game room ${roomId} as ${isSpectator ? 'spectator' : 'player'}`);
    setMultiplayerRoomId(roomId);
    setIsMultiplayerSpectator(isSpectator);
    setCurrentState('multiplayerGame');
  };

  const handleCreateGame = (timeControl: string, boardTheme: string) => {
    setSelectedTimeControl(timeControl);
    setSelectedBoardTheme(boardTheme);
    setIsSpectator(false);
    setRoomId(`room_${Date.now()}`);
    setCurrentState('game');
  };

  // Update handleChallengeFriend to use handleStartGame
  const handleChallengeFriend = (friendId: string, friendName: string, timeControl: string, boardTheme: string) => {
    // For now, let user pick color in GameModeSelection before challenging
    handleStartGame(timeControl, boardTheme, selectedColor, friendName);
  };

  const handleBotSelected = (bot: any) => {
    setSelectedBot(bot);
    setCurrentState('botGame');
  };

  const handleLogout = () => {
    localStorage.removeItem('chessUser');
    setUser(null);
    setCurrentState('signin');
  };

  const handleHelpPreference = (wantsHelp: boolean) => {
    setWantsHelp(wantsHelp);
    setShowHelpDialog(false);
    setCurrentState('game');
  };

  const handleBackToMenu = () => {
    setCurrentState('gameMode');
  };

  const switchToSignUp = () => {
    setCurrentState('signup');
  };

  const switchToSignIn = () => {
    setCurrentState('signin');
  };

  const switchToGameMode = () => {
    setCurrentState('gameMode');
  };

  const switchToMultiplayer = () => {
    setCurrentState('multiplayer');
  };

  const switchToFriends = () => {
    setCurrentState('friends');
  };

  const switchToAnalytics = () => {
    console.log('Switching to analytics, user:', user);
    setCurrentState('analytics');
  };

  const switchToCompetitive = () => {
    setCurrentState('competitive');
  };

  const switchToTestData = () => {
    setCurrentState('testData');
  };

  const switchToLeaderboard = () => {
    setCurrentState('leaderboard');
  };

  const toggleDarkMode = () => setDarkMode((d) => !d);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const isAuthPage = currentState === 'signin' || currentState === 'signup';
    if (isAuthPage) {
      document.body.classList.add('bg-gray-900');
      document.body.classList.remove('bg-amber-50');
    } else {
      document.body.classList.remove('bg-gray-900');
      document.body.classList.add('bg-amber-50');
    }
  }, [currentState]);

  const renderContent = () => {
    console.log('Current state:', currentState, 'User:', user);
    
    // Show help dialog if needed
    if (showHelpDialog) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">♔</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Chess!</h2>
              <p className="text-gray-600 mb-6">
                Would you like move suggestions to help you learn?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleHelpPreference(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Yes, show suggestions
                </button>
                <button
                  onClick={() => handleHelpPreference(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  No, I know chess
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    switch (currentState) {
      case 'signin':
        return (
          <div className="dark">
            <SignIn
              onSignIn={handleSignIn}
              onSwitchToSignUp={switchToSignUp}
              isLoading={isLoading}
            />
          </div>
        );
      case 'signup':
        return (
          <div className="dark">
            <SignUp
              onSignUp={handleSignUp}
              onSwitchToSignIn={switchToSignIn}
              isLoading={isLoading}
            />
          </div>
        );
      case 'gameMode':
        return user ? (
          <GameModeSelection
            onStartGame={handleStartGame}
            onBack={switchToSignIn}
            onMultiplayer={switchToMultiplayer}
            onFriends={switchToFriends}
            onAnalytics={switchToAnalytics}
            onCompetitive={switchToCompetitive}
            onTestData={switchToTestData}
            username={user.username}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'multiplayer':
        return user ? (
          <MultiplayerLobby
            onBack={switchToGameMode}
            onJoinGame={handleJoinMultiplayerGame}
            onCreateGame={handleCreateGame}
            username={user.username}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'multiplayerGame':
        return user ? (
          <MultiplayerGame
            roomId={multiplayerRoomId}
            username={user.username}
            isSpectator={isMultiplayerSpectator}
            onBack={switchToMultiplayer}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'friends':
        return user ? (
          <FriendSystem
            onBack={switchToGameMode}
            onChallengeFriend={handleChallengeFriend}
            username={user.username}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'analytics':
        console.log('Rendering analytics, user:', user);
        // Double-check if user exists in localStorage
        const savedUser = localStorage.getItem('chessUser');
        const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);
        
        return currentUser ? (
          <Analytics
            onBack={switchToGameMode}
            username={currentUser.username}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'competitive':
        return user ? (
          <Competitive
            onBack={switchToGameMode}
            username={user.username}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'testData':
        return user ? (
          <TestData
            onBack={switchToGameMode}
            username={user.username}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'leaderboard':
        return user ? (
          <Leaderboard
            onBack={switchToGameMode}
          />
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      case 'testEnv':
        // Assuming TestEnv is defined elsewhere
        // return <TestEnv />; 
        return <div>Test Environment</div>; // Placeholder
      case 'botLevelSelection':
        // ✅ FIX: Added onBack={handleBackToMenu} to connect the button
        return <BotLevelSelection onSelect={handleBotSelected} onBack={handleBackToMenu} />;
      case 'botGame':
        return (
          <BotGame
            boardTheme={selectedBoardTheme}
            color={selectedColor}
            onBack={switchToGameMode}
            difficulty={selectedBot?.difficulty || 8}
            botAvatar={selectedBot?.img}
            botName={selectedBot?.name}
            botRating={selectedBot?.rating}
            botFlag={selectedBot?.flag}
          />
        );
      case 'game':
        return user ? (
          (() => {
            let whitePlayerName = user.username;
            let blackPlayerName = opponentName || 'Computer';
            if (selectedColor === 'black') {
              whitePlayerName = opponentName || 'Computer';
              blackPlayerName = user.username;
            } else if (selectedColor === 'random') {
              if (Math.random() < 0.5) {
                whitePlayerName = user.username;
                blackPlayerName = opponentName || 'Computer';
              } else {
                whitePlayerName = opponentName || 'Computer';
                blackPlayerName = user.username;
              }
            }
            return (
              <Game
                timeControl={selectedTimeControl}
                username={user.username}
                onLogout={handleLogout}
                onBackToMenu={handleBackToMenu}
                boardTheme={selectedBoardTheme}
                isSpectator={isSpectator}
                roomId={roomId}
                opponentName={opponentName}
                customTimeControl={customTimeControl}
                whitePlayerName={whitePlayerName}
                blackPlayerName={blackPlayerName}
                showSuggestions={wantsHelp || false}
              />
            );
          })()
        ) : (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
      default:
        return (
          <SignIn
            onSignIn={handleSignIn}
            onSwitchToSignUp={switchToSignUp}
            isLoading={isLoading}
          />
        );
    }
  };

  const isAuthPage = currentState === 'signin' || currentState === 'signup';

  return (
    <div className={isAuthPage ? 'min-h-screen' : ''}>
      {/* Header with dark mode toggle */}
      <div className="flex items-center justify-end px-4 py-2">
        <button
          onClick={toggleDarkMode}
          className="flex items-center space-x-2 px-3 py-2 rounded focus:outline-none bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'} Mode</span>
        </button>
      </div>
      {renderContent()}
    </div>
  );
}

export default App;