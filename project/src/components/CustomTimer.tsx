import React, { useState } from 'react';
import { Clock, Plus, Minus, Save, X, RotateCcw } from 'lucide-react';

interface CustomTimerProps {
  onSave: (timeControl: { minutes: number; seconds: number; increment: number; name: string }) => void;
  onCancel: () => void;
}

export const CustomTimer: React.FC<CustomTimerProps> = ({ onSave, onCancel }) => {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [increment, setIncrement] = useState(0);
  const [name, setName] = useState('Custom');

  const handleMinutesChange = (value: number) => {
    const newMinutes = Math.max(0, Math.min(60, minutes + value));
    setMinutes(newMinutes);
  };

  const handleSecondsChange = (value: number) => {
    const newSeconds = Math.max(0, Math.min(59, seconds + value));
    setSeconds(newSeconds);
  };

  const handleIncrementChange = (value: number) => {
    const newIncrement = Math.max(0, Math.min(30, increment + value));
    setIncrement(newIncrement);
  };

  const handleSave = () => {
    if (minutes === 0 && seconds === 0) {
      alert('Please set a time greater than 0');
      return;
    }
    
    const timeControl = {
      minutes,
      seconds,
      increment,
      name: name.trim() || 'Custom'
    };
    
    onSave(timeControl);
  };

  const totalSeconds = minutes * 60 + seconds;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="text-amber-600 dark:text-amber-400" size={24} />
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">Custom Timer</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Timer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timer Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter timer name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Time Display */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Total Time</p>
              <p className="text-4xl font-mono font-bold text-amber-900 dark:text-amber-200">
                {formattedTime}
              </p>
              {increment > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  +{increment}s increment
                </p>
              )}
            </div>
          </div>

          {/* Minutes Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Minutes
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handleMinutesChange(-1)}
                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                disabled={minutes === 0}
              >
                <Minus size={20} />
              </button>
              <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 min-w-[60px] text-center">
                {minutes}
              </div>
              <button
                onClick={() => handleMinutesChange(1)}
                className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                disabled={minutes === 60}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Seconds Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Seconds
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handleSecondsChange(-5)}
                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                disabled={seconds === 0}
              >
                <Minus size={20} />
              </button>
              <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 min-w-[60px] text-center">
                {seconds.toString().padStart(2, '0')}
              </div>
              <button
                onClick={() => handleSecondsChange(5)}
                className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                disabled={seconds === 55}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Increment Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Increment (seconds added per move)
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handleIncrementChange(-1)}
                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                disabled={increment === 0}
              >
                <Minus size={20} />
              </button>
              <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 min-w-[60px] text-center">
                {increment}
              </div>
              <button
                onClick={() => handleIncrementChange(1)}
                className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                disabled={increment === 30}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setMinutes(1); setSeconds(0); setIncrement(0); setName('Bullet'); }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                1 min
              </button>
              <button
                onClick={() => { setMinutes(3); setSeconds(0); setIncrement(2); setName('Blitz'); }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                3+2
              </button>
              <button
                onClick={() => { setMinutes(5); setSeconds(0); setIncrement(0); setName('Rapid'); }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                5 min
              </button>
              <button
                onClick={() => { setMinutes(10); setSeconds(0); setIncrement(0); setName('Classical'); }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                10 min
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Save size={18} />
              <span>Save Timer</span>
            </button>
            <button
              onClick={() => { setMinutes(5); setSeconds(0); setIncrement(0); setName('Custom'); }}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Reset to default"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 