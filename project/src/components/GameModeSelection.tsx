import React, { useState } from 'react';
import { Clock, Zap, Users, Play, ArrowLeft, Palette, UserCheck, BarChart3, Settings, Trophy } from 'lucide-react';
import { CustomTimer } from './CustomTimer';

interface GameModeSelectionProps {
  onStartGame: (timeControl: string | { minutes: number; seconds: number; increment: number; name: string }, boardTheme: string, color: 'white' | 'black' | 'random') => void;
  onBack: () => void;
  onMultiplayer: () => void;
  onFriends: () => void;
  onAnalytics: () => void;
  onCompetitive: () => void;
  onTestData: () => void;
  username: string;
}

const TIME_CONTROLS = [
  {
    id: 'blitz',
    name: 'Blitz',
    time: '5 min',
    description: 'Fast-paced games for quick thinking',
    icon: Zap,
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    id: 'rapid',
    name: 'Rapid',
    time: '10 min',
    description: 'Balanced games with time to think',
    icon: Clock,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'classical',
    name: 'Classical',
    time: '30 min',
    description: 'Traditional chess with deep thinking',
    icon: Clock,
    color: 'bg-green-500 hover:bg-green-600'
  }
];

const BOARD_THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional brown and beige',
    preview: 'bg-gradient-to-br from-amber-200 to-amber-800'
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Cool blue tones',
    preview: 'bg-gradient-to-br from-blue-200 to-blue-800'
  },
  {
    id: 'green',
    name: 'Green',
    description: 'Natural green theme',
    preview: 'bg-gradient-to-br from-green-200 to-green-800'
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'Royal purple theme',
    preview: 'bg-gradient-to-br from-purple-200 to-purple-800'
  },
  {
    id: 'gray',
    name: 'Gray',
    description: 'Modern gray theme',
    preview: 'bg-gradient-to-br from-gray-200 to-gray-800'
  },
  {
    id: 'brown',
    name: 'Brown',
    description: 'Warm brown theme',
    preview: 'bg-gradient-to-br from-amber-600 to-amber-900'
  }
];

export const GameModeSelection: React.FC<GameModeSelectionProps> = ({ 
  onStartGame, 
  onBack, 
  onMultiplayer, 
  onFriends, 
  onAnalytics, 
  onCompetitive, 
  onTestData, 
  username 
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState<string>('classic');
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customTimeControl, setCustomTimeControl] = useState<{ minutes: number; seconds: number; increment: number; name: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | 'random'>('white');

  const handleStartGame = () => {
    if (selectedMode) {
      if (selectedMode === 'custom' && customTimeControl) {
        onStartGame(customTimeControl, selectedBoardTheme, selectedColor);
      } else {
        onStartGame(selectedMode, selectedBoardTheme, selectedColor);
      }
    }
  };

  const handleCustomTimerSave = (timeControl: { minutes: number; seconds: number; increment: number; name: string }) => {
    setCustomTimeControl(timeControl);
    setSelectedMode('custom');
    setShowCustomTimer(false);
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
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-300">Choose Game Mode</h1>
            <p className="text-gray-600 dark:text-white">Welcome back, {username}!</p>
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Game Mode Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {TIME_CONTROLS.map((mode) => {
              const IconComponent = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <div
                  key={mode.id}
                  className="relative cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors ${isSelected ? 'border-4 border-amber-500' : 'border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${mode.color} text-white`}>
                          <IconComponent size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{mode.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{mode.time}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{mode.description}</p>
                  </div>
                </div>
              );
            })}
            {/* Custom Timer Card */}
            <div
              className="relative cursor-pointer transition-all duration-200"
              onClick={() => setShowCustomTimer(true)}
            >
              <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors ${selectedMode === 'custom' ? 'border-4 border-amber-500' : 'border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-full bg-purple-500 hover:bg-purple-600 text-white">
                      <Settings size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {customTimeControl ? customTimeControl.name : 'Custom'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {customTimeControl 
                          ? `${customTimeControl.minutes}:${customTimeControl.seconds.toString().padStart(2, '0')}${customTimeControl.increment > 0 ? `+${customTimeControl.increment}` : ''}`
                          : 'Set your own time'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Create your own time control</p>
              </div>
            </div>
          </div>

          {/* Board Theme Selection */}
          <div className="mb-8 flex flex-col items-center">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="text-amber-600 dark:text-amber-400" size={24} />
              <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Choose Board Theme</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl">
              {BOARD_THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className="relative cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedBoardTheme(theme.id)}
                >
                  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-colors ${selectedBoardTheme === theme.id ? 'border-4 border-amber-500' : 'border-2 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400'}`}>
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-16 h-16 rounded-lg ${theme.preview} border-2 border-gray-300 dark:border-gray-600`}></div>
                      <div className="text-center">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{theme.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{theme.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <button
              className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 border-2 focus:outline-none ${selectedColor === 'white' ? 'bg-amber-400 text-white border-amber-600' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700'}`}
              onClick={() => setSelectedColor('white')}
            >
              Play as White
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 border-2 focus:outline-none ${selectedColor === 'black' ? 'bg-amber-400 text-white border-amber-600' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700'}`}
              onClick={() => setSelectedColor('black')}
            >
              Play as Black
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 border-2 focus:outline-none ${selectedColor === 'random' ? 'bg-amber-400 text-white border-amber-600' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700'}`}
              onClick={() => setSelectedColor('random')}
            >
              Random
            </button>
          </div>

          {/* Start Game Button */}
          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={!selectedMode}
              className={`px-8 py-4 text-lg font-semibold rounded-lg text-white transition-all duration-200 ${
                selectedMode
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Play size={24} />
                <span>Start Game</span>
              </div>
            </button>
          </div>

          {/* Additional Options */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
            <button onClick={onMultiplayer} className="flex items-center justify-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400">
              <Users size={20} className="text-gray-600" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Multiplayer</span>
            </button>
            <button onClick={onFriends} className="flex items-center justify-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400">
              <UserCheck size={20} className="text-gray-600" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Friends</span>
            </button>
            <button onClick={onAnalytics} className="flex items-center justify-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400">
              <BarChart3 size={20} className="text-gray-600" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Analytics</span>
            </button>
            <button onClick={onCompetitive} className="flex items-center justify-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400">
              <Trophy size={20} className="text-gray-600" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Competitive</span>
            </button>
            <button onClick={onTestData} className="flex items-center justify-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-400">
              <Settings size={20} className="text-gray-600" />
              <span className="text-gray-700 dark:text-gray-200 font-medium">Test Data</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Custom Timer Modal */}
      {showCustomTimer && (
        <CustomTimer
          onSave={handleCustomTimerSave}
          onCancel={() => setShowCustomTimer(false)}
        />
      )}
    </div>
  );
}; 