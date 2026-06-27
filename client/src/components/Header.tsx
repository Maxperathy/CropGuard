import { Bell, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  profile: {
    name: string;
    role: string;
    location: string;
  };
  alerts: {
    weather: boolean;
    outbreak: boolean;
    visits: boolean;
  };
  dismissedNotificationIds: string[];
  onDismissNotification: (id: string) => void;
}

export function Header({
  profile,
  alerts,
  dismissedNotificationIds,
  onDismissNotification,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const city = profile.location.split(',')[0].trim() || 'your region';

  const defaultNotifications = [
    {
      id: 'notif-1',
      category: 'outbreak',
      title: '🌤️ Disease Outbreak Risk',
      body: `High humidity forecasted in ${city}. Inspect cocoa for pod rot.`,
    },
    {
      id: 'notif-2',
      category: 'visits',
      title: '👩‍🌾 Extension Officer Visit',
      body: 'Officer Boateng is visiting nearby farms today at 2:00 PM.',
    },
    {
      id: 'notif-3',
      category: 'general',
      title: '🏆 Level Up Achieved',
      body: 'You earned 15 reputation points for completing the demo lesson!',
    },
  ];

  // Filter notifications based on preferences & dismissed state
  const visibleNotifications = defaultNotifications.filter((n) => {
    // Check if dismissed
    if (dismissedNotificationIds.includes(n.id)) return false;

    // Check category preferences
    if (n.category === 'outbreak' && !alerts.outbreak) return false;
    if (n.category === 'visits' && !alerts.visits) return false;
    if (n.category === 'weather' && !alerts.weather) return false;

    return true;
  });

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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
            {profile.name} 👋
          </h2>
          <p className="text-[9px] md:text-xs font-semibold text-zinc-500 mt-0.5 truncate">{profile.role}</p>
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
            {visibleNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                {visibleNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-2xl p-4 shadow-xl z-50">
              <h4 className="text-xs font-bold text-zinc-900 mb-3 flex items-center justify-between">
                Notifications
                {visibleNotifications.length > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                    {visibleNotifications.length} New
                  </span>
                )}
              </h4>
              <div className="flex flex-col gap-3">
                {visibleNotifications.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`text-xs pb-2 relative flex items-start justify-between gap-2 ${
                      idx !== visibleNotifications.length - 1 ? 'border-b border-zinc-100' : ''
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-zinc-800">{item.title}</p>
                      <p className="text-zinc-500 mt-0.5">{item.body}</p>
                    </div>
                    <button 
                      onClick={() => onDismissNotification(item.id)}
                      className="text-zinc-400 hover:text-red-500 hover:bg-zinc-50 p-1 rounded transition-colors shrink-0"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {visibleNotifications.length === 0 && (
                  <p className="text-xs text-zinc-400 font-medium text-center py-4">
                    No new notifications
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs select-none">
          {getInitials(profile.name)}
        </div>
      </div>
    </header>
  );
}
