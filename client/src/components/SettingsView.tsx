import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Bell, User, Info } from 'lucide-react';

interface SettingsViewProps {
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
  onSave: (
    updatedProfile: { name: string; role: string; location: string },
    updatedAlerts: { weather: boolean; outbreak: boolean; visits: boolean }
  ) => void;
}

export function SettingsView({ profile, alerts: initialAlerts, onSave }: SettingsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    role: profile.role,
    location: profile.location,
  });
  const [alertsState, setAlertsState] = useState(initialAlerts);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if props change (e.g. initial load)
  useEffect(() => {
    setAlertsState(initialAlerts);
  }, [initialAlerts]);

  useEffect(() => {
    setEditForm({
      name: profile.name,
      role: profile.role,
      location: profile.location,
    });
  }, [profile]);

  const handleAlertToggle = (key: keyof typeof alertsState) => {
    setAlertsState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSave = () => {
    onSave(editForm, alertsState);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    setEditForm({
      name: profile.name,
      role: profile.role,
      location: profile.location,
    });
    setAlertsState(initialAlerts);
    setIsEditing(false);
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

          {!isEditing ? (
            <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {getInitials(profile.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900">{profile.name}</p>
                <p className="text-xs text-zinc-400 font-medium">{profile.role} · {profile.location}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {getInitials(editForm.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Live Preview</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{editForm.name || 'Anonymous Farmer'}</p>
                  <p className="text-xs text-zinc-400 font-medium truncate">{editForm.role} · {editForm.location}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Kwame Mensah"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Role / Tagline</label>
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Plant Protector"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="px-3 py-1.5 border border-zinc-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Kumasi, Ashanti Region"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <Button variant="secondary" size="sm" onClick={handleCancel}>Discard</Button>
                <Button variant="primary" size="sm" onClick={() => setIsEditing(false)}>Done Editing</Button>
              </div>
            </div>
          )}
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
                checked={alertsState.weather}
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
                checked={alertsState.outbreak}
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
                checked={alertsState.visits}
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
      <div className="flex justify-end items-center gap-3">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-600 animate-pulse mr-2">
            ✓ Settings saved successfully!
          </span>
        )}
        <Button variant="secondary" size="md" onClick={handleCancel}>Cancel</Button>
        <Button variant="primary" size="md" onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
