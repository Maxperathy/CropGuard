import { Bell, Search, Globe, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [lang, setLang] = useState('EN');
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex justify-between items-center gap-4 mb-4 md:mb-6 bg-white/40 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-3 md:p-4 shadow-sm">
      {/* Greeting and Tagline */}
      <div className="min-w-0">
        <h2 className="text-sm md:text-xl font-bold text-zinc-950 font-sans truncate flex items-center gap-1.5">
          Good morning, Kwame! 🌿
        </h2>
        <p className="text-[10px] md:text-xs font-medium text-zinc-500 mt-0.5 truncate">Let's protect your crops today.</p>
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-4">
        {/* Search Input bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search farm records, diseases..."
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-2xl p-4 shadow-xl z-50">
              <h4 className="text-xs font-bold text-zinc-900 mb-3 flex items-center justify-between">
                Notifications
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">3 New</span>
              </h4>
              <div className="flex flex-col gap-3">
                <div className="text-xs border-b border-zinc-100 pb-2">
                  <p className="font-semibold text-zinc-800">🌤️ Disease Outbreak Risk</p>
                  <p className="text-zinc-500 mt-0.5">High humidity forecasted in Kumasi. Inspect cocoa for pod rot.</p>
                </div>
                <div className="text-xs border-b border-zinc-100 pb-2">
                  <p className="font-semibold text-zinc-800">👩‍🌾 Extension Officer Visit</p>
                  <p className="text-zinc-500 mt-0.5">Officer Boateng is visiting nearby farms today at 2:00 PM.</p>
                </div>
                <div className="text-xs pb-1">
                  <p className="font-semibold text-zinc-800">🏆 Level Up Achieved</p>
                  <p className="text-zinc-500 mt-0.5">You earned 15 reputation points for completing the demo lesson!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Language selector dropdown */}
        <div className="relative">
          <button 
            onClick={() => setLang(lang === 'EN' ? 'TWI' : 'EN')}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>{lang}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>

        {/* User Mini Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
          KM
        </div>
      </div>
    </header>
  );
}
