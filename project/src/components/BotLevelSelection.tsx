import React, { useState, useEffect } from 'react';

const BOT_LEVELS = [
  {
    label: 'Beginner',
    bots: [
      { name: 'Tirtha', rating: 600, img: 'https://i.postimg.cc/nL3bs9yB/tirthaaaa.jpg', personality: 'Calm and Defensive' },
      { name: 'Kabir', rating: 800, img: 'https://i.postimg.cc/qBwDpYwW/kabir-photo.jpg', personality: 'Likes quick trades' },
      { name: 'Madhur', rating: 1000, img: 'https://i.postimg.cc/mrhTgyNR/madhur.jpg', personality: 'Aggressive Opener' },
    ],
  },
  {
    label: 'Intermediate',
    bots: [
      { name: 'Nishant', rating: 1200, img: 'https://i.postimg.cc/dVTWQPMB/nishant.jpg', personality: 'Tactical and Sharp' },
      { name: 'Savi', rating: 1400, img: 'https://i.postimg.cc/524r4GjP/Whats-App-Image-2025-07-31-at-03-07-36-45fb4ae3.jpg', personality: 'University Champion' },
      { name: 'Adarsh', rating: 1600, img: 'https://i.postimg.cc/MKw3DZLj/adarsh.jpg', personality: 'Solid and Positional' },
    ],
  },
  {
    label: 'Master',
    bots: [
      { name: 'Sanchit', rating: 1800, img: 'https://i.postimg.cc/Ls550QWw/sanchitk.jpg', personality: 'Tricky Tactician' },
      { name: 'Sakshi', rating: 2000, img: 'https://i.postimg.cc/13C9SFQ6/sakshi.jpg', personality: 'Endgame Expert' },
      { name: 'Gukesh', rating: 2200, img: 'https://i.postimg.cc/8Ps4wFHc/gukesh.jpg', personality: 'World Champion' },
    ],
  },
];

const LEVEL_THEMES = {
  Beginner: {
    glow: 'shadow-[0_0_30px_5px_rgba(202,138,4,0.4)]',
    cardBorder: 'border-yellow-600/50',
    avatarBorder: 'border-yellow-600',
  },
  Intermediate: {
    glow: 'shadow-[0_0_30px_5px_rgba(156,163,175,0.4)]',
    cardBorder: 'border-gray-400/50',
    avatarBorder: 'border-gray-400',
  },
  Master: {
    glow: 'shadow-[0_0_30px_5px_rgba(252,211,77,0.4)]',
    cardBorder: 'border-amber-400/50',
    avatarBorder: 'border-amber-400',
  },
};

interface BotLevelSelectionProps {
  onSelect: (bot: any) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'botAchievements';

const BotLevelSelection: React.FC<BotLevelSelectionProps> = ({ onSelect, onBack }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [achievements, setAchievements] = useState<{ beaten: string[] }>({ beaten: [] });

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        setAchievements({ beaten: Array.isArray(parsedData.beaten) ? parsedData.beaten : [] });
      }
    } catch (error) {
      console.error("Failed to parse bot achievements from localStorage", error);
      setAchievements({ beaten: [] });
    }
  }, []);
  
  const isBeaten = (botName: string) => achievements.beaten.includes(botName);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-8 relative">
      {/* Back Button Position Updated Here */}
      <div className="absolute top-4 left-6 z-10">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
        >
          Back to Menu
        </button>
      </div>
      
      <h1 className="font-extrabold mb-12 text-center bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 bg-clip-text text-transparent drop-shadow-lg text-4xl lg:text-5xl">Choose Your Opponent</h1>
      <div className="flex flex-col lg:flex-row gap-12 w-full max-w-6xl mx-auto items-center justify-center">
        {BOT_LEVELS.map(level => {
          const theme = LEVEL_THEMES[level.label as keyof typeof LEVEL_THEMES];
          return (
            <div key={level.label} className={`relative transition-all duration-300 hover:scale-105 ${theme.glow} rounded-2xl`}>
              <div
                className={`group relative bg-slate-800/80 rounded-2xl shadow-2xl border p-6 w-full max-w-sm lg:w-80 flex flex-col items-center justify-start transition-all duration-300 overflow-hidden ${theme.cardBorder}`}
              >
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_infinite]" />
                
                <h2 className={`text-3xl font-extrabold mb-8 tracking-wide drop-shadow-md bg-gradient-to-r bg-clip-text text-transparent 
                  ${level.label === 'Beginner' ? 'from-yellow-600 via-amber-400 to-yellow-600' :
                    level.label === 'Intermediate' ? 'from-gray-400 via-gray-200 to-gray-400' :
                    'from-amber-400 via-yellow-300 to-amber-400'
                  }`}
                >
                  {level.label}
                </h2>
                
                <div className="flex flex-row gap-6 mb-2 w-full items-start justify-center">
                  {level.bots.map((bot) => {
                    const beaten = isBeaten(bot.name);
                    return (
                      <button
                        key={bot.name}
                        className="flex flex-col items-center focus:outline-none transition-transform duration-200 hover:scale-110"
                        onClick={() => onSelect({ ...bot, difficulty: 4, level: level.label })}
                        onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, text: `${bot.personality}${beaten ? ' (Beaten ✅)' : ''}` })}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <div className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-200 shadow-lg ${theme.avatarBorder}`}>
                          <img src={bot.img} alt={bot.name} className="w-full h-full p-1 rounded-full grayscale-0" />
                          {beaten && (
                             <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-slate-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                             </div>
                          )}
                        </div>
                        <span className="font-bold text-lg mt-1 text-slate-100" >
                          {bot.name}
                        </span>
                        <span className="text-base font-semibold drop-shadow text-white/70">{bot.rating}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 15, top: tooltip.y + 15, zIndex: 1000 }} className="bg-slate-900 text-white text-sm rounded-lg px-3 py-1 shadow-2xl pointer-events-none font-semibold border border-slate-700 animate-fade-in-fast">
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default BotLevelSelection;