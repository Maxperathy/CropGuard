import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Bell, User, Info } from 'lucide-react';

export function SettingsView() {
  const [alerts, setAlerts] = useState({
    weather: true,
    outbreak: true,
    visits: false,
  });

  const handleAlertToggle = (key: keyof typeof alerts) => {
    setAlerts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-2xl flex flex-col gap-5">

      {/* Profile Section */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-zinc-950 font-sans tracking-tight mb-1">Settings</h2>
        <p className="text-xs text-zinc-400 font-medium mb-6">Manage your CropGuard GH preferences.</p>

        {/* Farmer Profile */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-zinc-400" />
            <span>Farmer Profile</span>
          </h3>
          <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              KM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900">Kwame Mensah</p>
              <p className="text-xs text-zinc-400 font-medium">Plant Protector · Kumasi, Ashanti Region</p>
            </div>
            <Button variant="secondary" size="sm">Edit</Button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-zinc-400" />
            <span>Alerts &amp; Notifications</span>
          </h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100/60 transition-colors">
              <div>
                <p className="text-xs font-bold text-zinc-700">🌤️ Weather Alerts</p>
                <p className="text-[10px] text-zinc-400 font-medium">High humidity and rainfall warnings for your region</p>
              </div>
              <input
                type="checkbox"
                checked={alerts.weather}
                onChange={() => handleAlertToggle('weather')}
                className="rounded border-zinc-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100/60 transition-colors">
              <div>
                <p className="text-xs font-bold text-zinc-700">🔬 Disease Outbreak Bulletins</p>
                <p className="text-[10px] text-zinc-400 font-medium">High disease occurrence alerts in your area</p>
              </div>
              <input
                type="checkbox"
                checked={alerts.outbreak}
                onChange={() => handleAlertToggle('outbreak')}
                className="rounded border-zinc-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100/60 transition-colors">
              <div>
                <p className="text-xs font-bold text-zinc-700">👩‍🌾 Extension Officer Visits</p>
                <p className="text-[10px] text-zinc-400 font-medium">Notify me about nearby agri officer schedules</p>
              </div>
              <input
                type="checkbox"
                checked={alerts.visits}
                onChange={() => handleAlertToggle('visits')}
                className="rounded border-zinc-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* About card */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-zinc-400" />
          <span>About CropGuard GH</span>
        </h3>
        <div className="flex flex-col gap-2 text-xs text-zinc-500 font-medium">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-bold text-zinc-700">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>AI Engine</span>
            <span className="font-bold text-zinc-700">Groq · Llama 4 Scout + 3.3 70B</span>
          </div>
          <div className="flex justify-between">
            <span>Region</span>
            <span className="font-bold text-zinc-700">Ghana (West Africa)</span>
          </div>
          <div className="flex justify-between">
            <span>Built for</span>
            <span className="font-bold text-zinc-700">Smallholder Farmers</span>
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" size="md">Cancel</Button>
        <Button variant="primary" size="md">Save Settings</Button>
      </div>
    </div>
  );
}
