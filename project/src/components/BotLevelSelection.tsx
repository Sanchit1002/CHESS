import React, { useState, useEffect } from 'react';
import { ChessPiece } from './ChessPiece';

const BOT_LEVELS = [
  {
    label: 'Beginner',
    difficulty: 4,
    bots: [
      { name: 'Tirtha', rating: 600, img: 'https://i.postimg.cc/qq9rvjBb/tirthaaa.jpg', locked: false, unlockCriteria: '', personality: 'Calm and Defensive', beaten: true },
      { name: 'Kabir', rating: 800, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Anna', locked: false, unlockCriteria: '', personality: 'Likes quick trades', beaten: false },
      { name: 'Madhur', rating: 1000, img: 'https://i.postimg.cc/mrhTgyNR/madhur.jpg', locked: false, unlockCriteria: '', personality: 'Aggressive Opener', beaten: false },
    ],
  },
  {
    label: 'Intermediate',
    difficulty: 8,
    bots: [
      { name: 'Nishant', rating: 1200, img: 'https://i.postimg.cc/dVTWQPMB/nishant.jpg', locked: false, unlockCriteria: '', personality: 'Tactical and Sharp', beaten: false },
      { name: 'Savi', rating: 1400, img: 'https://i.postimg.cc/XqGj17hF/savii.jpg', locked: false, unlockCriteria: '', personality: 'University Champion', beaten: false },
      { name: 'Adarsh', rating: 1600, img: 'https://i.postimg.cc/MKw3DZLj/adarsh.jpg', locked: false, unlockCriteria: '', personality: 'Solid and Positional', beaten: false },
    ],
  },
  {
    label: 'Master',
    difficulty: 15,
    bots: [
      { name: 'Sanchit', rating: 1800, img: 'https://i.postimg.cc/Ls550QWw/sanchitk.jpg', locked: false, unlockCriteria: '', personality: 'Tricky Tactician', beaten: false },
      { name: 'Sakshi', rating: 2000, img: 'https://i.postimg.cc/13C9SFQ6/sakshi.jpg', locked: false, unlockCriteria: '', personality: 'Endgame Expert', beaten: false },
      { name: 'Gukesh', rating: 2200, img: 'https://i.postimg.cc/8Ps4wFHc/gukesh.jpg', locked: false, unlockCriteria: '', personality: 'World Champion', beaten: false },
    ],
  },
];

interface BotLevelSelectionProps {
  onSelect: (bot: any) => void;
}

const STORAGE_KEY = 'botAchievements';

const BotLevelSelection: React.FC<BotLevelSelectionProps> = ({ onSelect }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [achievements, setAchievements] = useState<{ unlocked: string[]; beaten: string[] }>({ unlocked: [], beaten: [] });

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      setAchievements(JSON.parse(data));
    }
  }, []);

  const isUnlocked = (botName: string) => achievements.unlocked.includes(botName) || !BOT_LEVELS.flatMap(l => l.bots).find(b => b.name === botName)?.locked;
  const isBeaten = (botName: string) => achievements.beaten.includes(botName);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <h1 className="font-extrabold mb-8 lg:mb-16 text-center bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-clip-text text-transparent drop-shadow-lg text-2xl lg:text-4xl">Choose Your Bot Opponent</h1>
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 w-full max-w-4xl mx-auto items-center justify-between">
        {BOT_LEVELS.map(level => (
          <div key={level.label} className="bg-slate-800/90 rounded-3xl shadow-2xl border-2 border-amber-300 p-4 w-full max-w-xs mx-auto lg:w-72 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-amber-400/30 hover:border-amber-300">
            <h2 className="text-3xl font-extrabold mb-2 text-red-700 tracking-wide drop-shadow">{level.label}</h2>
            <div className="mb-6 text-xl font-bold text-amber-100 uppercase tracking-wider drop-shadow-lg">{level.label === 'Beginner' ? 'Easy' : level.label === 'Intermediate' ? 'Medium' : 'Hard'}</div>
            <div className="flex flex-row gap-2 lg:gap-4 mb-2 w-full items-center justify-center">
              {level.bots.map((bot) => {
                const unlocked = true;
                const beaten = isBeaten(bot.name);
                return (
                  <button
                    key={bot.name}
                    className="flex flex-col items-center focus:outline-none group"
                    onClick={() => onSelect({ ...bot, difficulty: level.difficulty, level: level.label })}
                    onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, text: bot.personality })}
                    onMouseLeave={() => setTooltip(null)}
                    disabled={false}
                  >
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full border-4 flex items-center justify-center mb-2 transition-all duration-200 border-amber-400 shadow-lg`}>
                      <img src={bot.img} alt={bot.name} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full" />
                    </div>
                    <span
                      className="font-extrabold text-base lg:text-lg mt-1"
                      style={{ color: '#fbbf24', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
                    >
                      {bot.name}
                    </span>
                    <span className="text-sm lg:text-base font-bold drop-shadow text-white">{bot.rating}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 12, top: tooltip.y + 12, zIndex: 1000 }} className="bg-slate-900 text-white text-base rounded-xl px-5 py-3 shadow-2xl pointer-events-none font-semibold">
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default BotLevelSelection; 