import React, { useState, useEffect } from 'react';

const BOT_LEVELS = [
  {
    label: 'Beginner',
    difficulty: 4,
    bots: [
      { name: 'Martin', rating: 600, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Martin', locked: false, unlockCriteria: '', personality: 'Calm and defensive', beaten: true },
      { name: 'Anna', rating: 800, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Anna', locked: false, unlockCriteria: '', personality: 'Likes quick trades', beaten: false },
      { name: 'John', rating: 1000, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=John', locked: true, unlockCriteria: 'Win 1 game vs Martin', personality: 'Aggressive opener', beaten: false },
    ],
  },
  {
    label: 'Intermediate',
    difficulty: 8,
    bots: [
      { name: 'Maria', rating: 1200, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maria', locked: false, unlockCriteria: '', personality: 'Tactical and sharp', beaten: false },
      { name: 'T-Rex', rating: 1400, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=TRex', locked: true, unlockCriteria: 'Reach 1000 rating', personality: 'Relentless attacker', beaten: false },
      { name: 'Kate', rating: 1600, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kate', locked: true, unlockCriteria: 'Beat Maria', personality: 'Solid and positional', beaten: false },
    ],
  },
  {
    label: 'Master',
    difficulty: 15,
    bots: [
      { name: 'Pablo', rating: 1800, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Pablo', locked: true, unlockCriteria: 'Reach 1500 rating', personality: 'Endgame expert', beaten: false },
      { name: 'Sophia', rating: 2000, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophia', locked: true, unlockCriteria: 'Beat Pablo', personality: 'Tricky tactician', beaten: false },
      { name: 'Alex', rating: 2200, img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex', locked: true, unlockCriteria: 'Win 10 games vs bots', personality: 'Universal style', beaten: false },
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
      <h1 className="text-5xl font-extrabold mb-12 text-center text-amber-200 tracking-wide drop-shadow-lg">Choose Your Bot Opponent</h1>
      <div className="flex flex-row gap-16">
        {BOT_LEVELS.map(level => (
          <div key={level.label} className="bg-slate-800/90 rounded-3xl shadow-2xl border-2 border-amber-300 p-10 w-96 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-extrabold mb-2 text-amber-300 tracking-wide drop-shadow">{level.label}</h2>
            <div className="mb-8 text-2xl font-bold text-amber-100 uppercase tracking-wider drop-shadow-lg">{level.label === 'Beginner' ? 'Easy' : level.label === 'Intermediate' ? 'Medium' : 'Hard'}</div>
            <div className="grid grid-cols-3 gap-10 mb-2 w-full items-center justify-center -ml-8">
              {level.bots.map((bot) => {
                const unlocked = isUnlocked(bot.name);
                const beaten = isBeaten(bot.name);
                return (
                  <div key={bot.name} className={`relative group transition-all duration-300 ${unlocked && achievements.unlocked.includes(bot.name) ? 'animate-bot-unlock' : ''}`}>
                    <button
                      className={`flex flex-col items-center p-2 rounded-2xl transition border-2 border-transparent focus:outline-none w-28 h-40 ${!unlocked ? 'cursor-not-allowed opacity-60 grayscale' : 'hover:bg-amber-100/10 hover:border-amber-400'}`}
                      onClick={() => unlocked && onSelect({ ...bot, difficulty: level.difficulty, level: level.label })}
                      onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, text: !unlocked ? `Locked: ${bot.unlockCriteria}` : `${bot.personality}` })}
                      onMouseLeave={() => setTooltip(null)}
                      disabled={!unlocked}
                    >
                      <div className="relative mb-2">
                        <img src={bot.img} alt={bot.name} className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-xl bg-slate-700" />
                        {beaten && unlocked && (
                          <span className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full px-3 py-2 text-xl font-extrabold shadow-lg animate-badge-glow">✔</span>
                        )}
                      </div>
                      <span className="font-extrabold text-2xl text-amber-100 drop-shadow-lg mt-1">{bot.name}</span>
                      <span className="text-lg text-amber-300 font-bold mt-1">{bot.rating}</span>
                    </button>
                  </div>
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