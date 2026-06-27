import { 
  Home, 
  Camera, 
  MapPin, 
  BookOpen, 
  History, 
  CloudSun, 
  Settings,
  Wifi
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
    <aside className="hidden md:flex w-64 min-h-screen bg-[#001e2b] border-r border-[#1c2d38] flex-col justify-between p-4 flex-shrink-0">
      <div className="flex flex-col gap-6">
        {/* Logo Brand Title */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-[#1c2d38]/50 pb-4">
          <img 
            src="/images/Crop_Guard_logo_tech_shield_202606270752.svg" 
            alt="CropGuard GH Logo" 
            className="w-10 h-10 object-contain hover:scale-105 transition-transform duration-300 select-none"
          />
          <div>
            <h1 className="font-sans font-bold text-sm text-white tracking-tight leading-tight">CropGuard GH</h1>
            <p className="text-[10px] text-[#a8b3bc] font-semibold">AI Farm Assistant</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full font-bold text-xs transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-[#001e2b] shadow-[0_4px_12px_rgba(0,237,100,0.18)]' 
                    : 'text-[#a8b3bc] hover:bg-[#003d4f] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#001e2b]' : 'text-[#a8b3bc]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="bg-[#003d4f] border border-[#00684a]/50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-[#001e2b] flex items-center justify-center font-extrabold text-xs shadow-md">
              KM
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Kwame Mensah</p>
              <p className="text-[10px] text-[#a8b3bc] font-semibold">Plant Protector</p>
            </div>
          </div>
        </div>

        {/* Offline notification status pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#003d4f] border border-[#00684a]/50 text-[10px] font-bold text-[#a8b3bc]">
          <span className="flex items-center gap-2 font-medium">
            <Wifi className="w-3.5 h-3.5 text-primary" />
            Working offline?
          </span>
          <span className="text-[9px] text-[#a8b3bc]/70">Syncs online</span>
        </div>
      </div>
    </aside>
  );
}
