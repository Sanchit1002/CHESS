import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Pause, Play } from 'lucide-react';

interface MoveTimerProps {
  currentPlayer: 'w' | 'b';
  isGameActive: boolean;
  onTimeUp: (player: 'w' | 'b') => void;
}

type TimeControl = 'blitz' | 'rapid' | 'classical';

const TIME_CONTROLS = {
  blitz: { white: 300, black: 300, increment: 0 }, // 5 minutes
  rapid: { white: 600, black: 600, increment: 10 }, // 10 minutes + 10s increment
  classical: { white: 1800, black: 1800, increment: 0 } // 30 minutes
};

export const MoveTimer: React.FC<MoveTimerProps> = ({ 
  currentPlayer, 
  isGameActive, 
  onTimeUp 
}) => {
  const [timeControl, setTimeControl] = useState<TimeControl>('rapid');
  const [whiteTime, setWhiteTime] = useState(TIME_CONTROLS.rapid.white);
  const [blackTime, setBlackTime] = useState(TIME_CONTROLS.rapid.black);
  const [isPaused, setIsPaused] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = useCallback(() => {
    const control = TIME_CONTROLS[timeControl];
    setWhiteTime(control.white);
    setBlackTime(control.black);
    setIsPaused(false);
  }, [timeControl]);

  useEffect(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isGameActive || isPaused) return;

    const interval = setInterval(() => {
      if (currentPlayer === 'w') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            onTimeUp('w');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            onTimeUp('b');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayer, isGameActive, isPaused, onTimeUp]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="text-amber-600" size={20} />
          <h3 className="text-lg font-bold text-gray-800">Game Timer</h3>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Time Control:</span>
          <select
            value={timeControl}
            onChange={(e) => setTimeControl(e.target.value as TimeControl)}
            className="text-sm border rounded px-2 py-1"
            disabled={isGameActive}
          >
            <option value="blitz">Blitz (5 min)</option>
            <option value="rapid">Rapid (10 min + 10s)</option>
            <option value="classical">Classical (30 min)</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className={`flex justify-between items-center p-2 rounded ${
            currentPlayer === 'w' && isGameActive ? 'bg-amber-100' : 'bg-gray-50'
          }`}>
            <span className="text-sm font-medium">White</span>
            <span className={`font-mono text-lg ${
              whiteTime <= 30 ? 'text-red-600' : 'text-gray-800'
            }`}>
              {formatTime(whiteTime)}
            </span>
          </div>
          
          <div className={`flex justify-between items-center p-2 rounded ${
            currentPlayer === 'b' && isGameActive ? 'bg-amber-100' : 'bg-gray-50'
          }`}>
            <span className="text-sm font-medium">Black</span>
            <span className={`font-mono text-lg ${
              blackTime <= 30 ? 'text-red-600' : 'text-gray-800'
            }`}>
              {formatTime(blackTime)}
            </span>
          </div>
        </div>

        {!isGameActive && (
          <button
            onClick={resetTimer}
            className="w-full px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm"
          >
            Reset Timer
          </button>
        )}
      </div>
    </div>
  );
}; 