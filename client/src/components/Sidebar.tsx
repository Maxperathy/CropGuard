import { 
  Home, 
  Camera, 
  MapPin, 
  BookOpen, 
  History, 
  CloudSun, 
  Settings,
  Wifi,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'diagnose', label: 'Diagnose & Ask AI', icon: Camera },
    { id: 'map', label: 'Map & Resources', icon: MapPin },
    { id: 'history', label: 'My History', icon: History },
    { id: 'library', label: 'Crop Library', icon: BookOpen },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 min-h-screen bg-white border-r border-zinc-200 flex-col justify-between p-4 flex-shrink-0">
      <div className="flex flex-col gap-6">
        {/* Logo Brand Title */}
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-zinc-900 leading-tight">CropGuard GH</h1>
            <p className="text-xs text-zinc-500 font-medium">AI Farm Assistant</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/10' 
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              KM
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">Kwame Mensah</p>
              <p className="text-xs text-zinc-500">Plant Protector</p>
            </div>
          </div>
        </div>

        {/* Offline notification status pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
          <span className="flex items-center gap-2 text-zinc-500 font-medium">
            <Wifi className="w-3.5 h-3.5 text-primary" />
            Working offline?
          </span>
          <span className="text-[10px] font-bold text-zinc-400">Syncs online</span>
        </div>
      </div>
    </aside>
  );
}
