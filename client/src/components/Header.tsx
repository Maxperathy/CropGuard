import { Bell } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="relative z-30 flex justify-between items-center gap-4 mb-4 md:mb-6 bg-white/40 backdrop-blur-md border border-zinc-200/50 rounded-2xl p-3 md:p-4 shadow-sm">
      {/* Greeting and Tagline */}
      <div className="min-w-0 flex items-center gap-2.5">
        <img 
          src="/images/CG-logo.svg" 
          alt="CropGuard GH Icon Logo" 
          className="md:hidden block w-8 h-8 object-contain shrink-0 select-none animate-pulse"
        />
        <div className="min-w-0">
          <h2 className="text-xs md:text-lg font-extrabold text-zinc-950 font-sans truncate flex items-center gap-1">
            Kwame Mensah 👋
          </h2>
          <p className="text-[9px] md:text-xs font-semibold text-zinc-500 mt-0.5 truncate">AI Farm Protector</p>
        </div>
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center gap-3">
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

        {/* User Mini Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
          KM
        </div>
      </div>
    </header>
  );
}
