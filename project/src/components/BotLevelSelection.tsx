import React, { useState, useEffect } from 'react';
import { ChessPiece } from './ChessPiece';

const BOT_LEVELS = [
  {
    label: 'Beginner',
    difficulty: 4,
    bots: [
      { name: 'Tirtha', rating: 600, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Martin', locked: false, unlockCriteria: '', personality: 'Calm and defensive', beaten: true },
      { name: 'Kabir', rating: 800, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Anna', locked: false, unlockCriteria: '', personality: 'Likes quick trades', beaten: false },
      { name: 'Madhur', rating: 1000, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=John', locked: false, unlockCriteria: '', personality: 'Aggressive opener', beaten: false },
    ],
  },
  {
    label: 'Intermediate',
    difficulty: 8,
    bots: [
      { name: 'Nishant', rating: 1200, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maria', locked: false, unlockCriteria: '', personality: 'Tactical and sharp', beaten: false },
      { name: 'Savi', rating: 1400, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=TRex', locked: false, unlockCriteria: '', personality: 'Relentless attacker', beaten: false },
      { name: 'Adarsh', rating: 1600, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kate', locked: false, unlockCriteria: '', personality: 'Solid and positional', beaten: false },
    ],
  },
  {
    label: 'Master',
    difficulty: 15,
    bots: [
      { name: 'Sakshi', rating: 1800, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Pablo', locked: false, unlockCriteria: '', personality: 'Endgame expert', beaten: false },
      { name: 'Sanchit', rating: 2000, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia', locked: false, unlockCriteria: '', personality: 'Tricky tactician', beaten: false },
      { name: 'Gukesh', rating: 2200, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex', locked: false, unlockCriteria: '', personality: 'Universal style', beaten: false },
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
      <h1 className="text-4xl font-extrabold mb-16 text-center bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent drop-shadow-lg">Choose Your Bot Opponent</h1>
      <div className="flex flex-row gap-6">
        {BOT_LEVELS.map(level => (
          <div key={level.label} className="bg-slate-800/90 rounded-3xl shadow-2xl border-2 border-amber-300 p-4 w-72 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-amber-400/30 hover:border-amber-300">
            <h2 className="text-3xl font-extrabold mb-2 text-amber-300 tracking-wide drop-shadow">{level.label}</h2>
            <div className="mb-6 text-xl font-bold text-amber-100 uppercase tracking-wider drop-shadow-lg">{level.label === 'Beginner' ? 'Easy' : level.label === 'Intermediate' ? 'Medium' : 'Hard'}</div>
            <div className="flex flex-row gap-4 mb-2 w-full items-center justify-center">
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
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mb-2 transition-all duration-200 border-amber-400 shadow-lg group-hover:shadow-amber-400/50 group-hover:animate-avatar-pulse`}>
                      <img src={bot.img} alt={bot.name} className="w-12 h-12 rounded-full" />
                    </div>
                    <span
                      className="font-extrabold text-lg mt-1"
                      style={{ color: '#fbbf24', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
                    >
                      {bot.name}
                    </span>
                    <span className="text-base font-bold drop-shadow text-amber-300">{bot.rating}</span>
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