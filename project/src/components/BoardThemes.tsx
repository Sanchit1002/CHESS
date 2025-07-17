import React from 'react';
import { Palette } from 'lucide-react';

interface BoardTheme {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  validMove: string;
  lastMove: string;
}

interface BoardThemesProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    selectedSquare: '#7b61ff',
    validMove: '#f7f769',
    lastMove: '#f7f769'
  },
  {
    id: 'blue',
    name: 'Blue',
    lightSquare: '#e8f4fd',
    darkSquare: '#7fa6d1',
    selectedSquare: '#4a90e2',
    validMove: '#7ed321',
    lastMove: '#f5a623'
  },
  {
    id: 'green',
    name: 'Green',
    lightSquare: '#f0f8f0',
    darkSquare: '#769656',
    selectedSquare: '#4caf50',
    validMove: '#8bc34a',
    lastMove: '#ff9800'
  },
  {
    id: 'brown',
    name: 'Brown',
    lightSquare: '#f4e4bc',
    darkSquare: '#8b4513',
    selectedSquare: '#d2691e',
    validMove: '#daa520',
    lastMove: '#ff6347'
  },
  {
    id: 'gray',
    name: 'Gray',
    lightSquare: '#f5f5f5',
    darkSquare: '#808080',
    selectedSquare: '#696969',
    validMove: '#32cd32',
    lastMove: '#ff4500'
  },
  {
    id: 'purple',
    name: 'Purple',
    lightSquare: '#f8f4ff',
    darkSquare: '#9b59b6',
    selectedSquare: '#8e44ad',
    validMove: '#2ecc71',
    lastMove: '#e74c3c'
  }
];

export const BoardThemes: React.FC<BoardThemesProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center space-x-2 mb-4">
        <Palette className="text-amber-600" size={20} />
        <h3 className="text-lg font-bold text-gray-800">Board Themes</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BOARD_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentTheme === theme.id
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.lightSquare }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.darkSquare }}></div>
              <span className="text-sm font-medium">{theme.name}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.lightSquare }}></div>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.darkSquare }}></div>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.lightSquare }}></div>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.darkSquare }}></div>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.darkSquare }}></div>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.lightSquare }}></div>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.darkSquare }}></div>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.lightSquare }}></div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Selected Square</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Valid Move</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span>Last Move</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Check</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 