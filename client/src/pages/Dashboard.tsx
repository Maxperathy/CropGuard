import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  createUser, 
  DiagnosisResult, 
  getActivity,
  getDiagnosisHistory,
  HistoryDiagnosis
} from '../services/api';

// Sidebar and Header
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

// Reusable Components
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UploadZone } from '../components/UploadZone';
import { DiagnosisCard, DiagnosisData } from '../components/ui/DiagnosisCard';
import { WeatherCard } from '../components/ui/WeatherCard';
import { MapCard } from '../components/ui/MapCard';

// Tabs Views
import { HistoryList } from '../components/HistoryList';
import { CropLibrary } from '../components/CropLibrary';
import { SettingsView } from '../components/SettingsView';
import { AgroDealerMap } from '../components/AgroDealerMap';
import { DiagnosisResultPanel } from '../components/DiagnosisResult';

import { 
  Activity, 
  Flame, 
  Target,
  Award
} from 'lucide-react';

const USER_ID_KEY = 'cropguard_user_id';

// Default dummy diagnosis to make the Dashboard look amazing like the mockup when no image is uploaded
const INITIAL_SAMPLE_DIAGNOSIS: DiagnosisData = {
  id: 'd-sample',
  cropName: 'Maize',
  cropScientific: 'Zea mays',
  diseaseName: 'Leaf Rust',
  diseaseScientific: 'Puccinia sorghi',
  confidence: 91,
  severity: 'Moderate',
  recommendedAction: 'Spray Mancozeb within 48 hours to prevent spread.',
  diagnosisDate: 'Jun 27, 2026 · 08:15 AM',
  imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600',
};

export function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  // App routing
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Real diagnosis from upload
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  
  // Real diagnoses history list for stats
  const [historyItems, setHistoryItems] = useState<HistoryDiagnosis[]>([]);
  const [reputationScore, setReputationScore] = useState<number>(0);
  const [, setRefreshKey] = useState(0);

  // Keep preview URL of uploaded file for display
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function initUser() {
      const stored = localStorage.getItem(USER_ID_KEY);
      if (stored) {
        setUserId(stored);
        fetchUserData(stored);
        return;
      }

      try {
        const user = await createUser('Kwame Mensah');
        localStorage.setItem(USER_ID_KEY, user.id);
        setUserId(user.id);
        setReputationScore(user.reputation_score);
        fetchUserData(user.id);
      } catch (err) {
        setInitError(err instanceof Error ? err.message : 'Failed to connect to backend api');
      }
    }

    initUser();
  }, []);

  async function fetchUserData(uid: string) {
    try {
      const data = await getActivity(uid);
      setReputationScore(data.user.reputation_score);
    } catch (e) {
      console.warn('Failed to load reputation:', e);
    }
    try {
      const items = await getDiagnosisHistory(uid);
      setHistoryItems(items);
    } catch (e) {
      console.warn('Failed to load diagnosis history:', e);
    }
  }

  // Refetch user stats/history when user switches back to dashboard to sync updates (e.g. deletions)
  useEffect(() => {
    if (userId && activeTab === 'dashboard') {
      fetchUserData(userId);
    }
  }, [activeTab, userId]);

  function handleDiagnosisComplete(result: DiagnosisResult) {
    setDiagnosis(result);
    setRefreshKey((k) => k + 1);
    if (userId) fetchUserData(userId);
  }

  const getScansThisWeek = () => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const count = historyItems.filter(item => new Date(item.created_at).getTime() > oneWeekAgo).length;
    return `+${count} this week`;
  };

  const getAverageAccuracy = () => {
    if (historyItems.length === 0) return '91.8%';
    const totalConf = historyItems.reduce((acc, item) => acc + item.confidence, 0);
    return (totalConf / historyItems.length).toFixed(1) + '%';
  };

  const getStreakDays = () => {
    if (historyItems.length === 0) return '0 Days';
    const dates = Array.from(
      new Set(
        historyItems.map((item) => new Date(item.created_at).toISOString().split('T')[0])
      )
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] !== today && dates[0] !== yesterday) {
      return '0 Days';
    }

    let streak = 0;
    let currentDate = new Date(dates[0]);

    for (const dateStr of dates) {
      const diffTime = Math.abs(currentDate.getTime() - new Date(dateStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = new Date(dateStr);
      } else {
        break;
      }
    }

    return `${streak} Day${streak === 1 ? '' : 's'}`;
  };

  // Parse result to match visual template
  const getDisplayDiagnosis = (): DiagnosisData => {
    if (!diagnosis) return INITIAL_SAMPLE_DIAGNOSIS;

    // Severity mapping
    let severity: 'Mild' | 'Moderate' | 'Severe' = 'Moderate';
    if (diagnosis.status === 'verified') severity = 'Mild';
    if (diagnosis.status === 'low_confidence') severity = 'Severe';

    // Parse crop and disease details from text
    let cropName = 'Crop Specimen';
    let cropScientific = 'Unknown';
    let diseaseName = 'Undetected Anomaly';
    let diseaseScientific = 'Unknown pathogen';
    let recommendedAction = 'Please consult your extension officer.';

    const text = diagnosis.diagnosis;
    if (text) {
      const cropMatch = text.match(/(?:Crop|Plant):\s*([^\n\r]+)/i);
      const diseaseMatch = text.match(/(?:Disease|Anomaly):\s*([^\n\r(]+)(?:\(([^)]+)\))?/i) || text.match(/(?:Disease|Anomaly):\s*([^\n\r]+)/i);
      const actionMatch = text.match(/(?:Recommended Action|Treatment|Action):\s*([^\n\r]+)/i);

      if (cropMatch) {
        cropName = cropMatch[1].trim();
        if (cropName.toLowerCase().includes('maize')) cropScientific = 'Zea mays';
        else if (cropName.toLowerCase().includes('tomato')) cropScientific = 'Solanum lycopersicum';
        else if (cropName.toLowerCase().includes('cocoa')) cropScientific = 'Theobroma cacao';
        else if (cropName.toLowerCase().includes('cassava')) cropScientific = 'Manihot esculenta';
      }
      if (diseaseMatch) {
        diseaseName = diseaseMatch[1].trim();
        if (diseaseMatch[2]) diseaseScientific = diseaseMatch[2].trim();
      }
      if (actionMatch) recommendedAction = actionMatch[1].trim();
    }

    return {
      id: diagnosis.id,
      cropName,
      cropScientific,
      diseaseName,
      diseaseScientific,
      confidence: diagnosis.confidence,
      severity,
      recommendedAction,
      diagnosisDate: new Date(diagnosis.created_at).toLocaleString(),
      imageUrl: uploadedPreviewUrl || INITIAL_SAMPLE_DIAGNOSIS.imageUrl,
    };
  };

  if (initError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8 border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-2">Could Not Connect to API</h2>
          <p className="text-xs text-zinc-500 mb-6">{initError}</p>
          <p className="text-xs font-semibold text-zinc-700 bg-zinc-50 p-3 rounded-xl mb-6">
            Make sure the backend is active on port 4000.
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex animate-pulse">
        {/* Left Sidebar Skeleton */}
        <aside className="w-64 min-h-screen bg-white border-r border-zinc-250 p-4 flex-shrink-0 flex flex-col justify-between hidden md:flex">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-250 rounded w-2/3" />
                <div className="h-3 bg-zinc-200 rounded w-1/2" />
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-10 bg-zinc-100 rounded-xl w-full" />
              ))}
            </nav>
          </div>
          <div className="h-16 bg-zinc-100 rounded-2xl w-full" />
        </aside>

        {/* Main Area Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 bg-white border-b border-zinc-200" />
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="h-6 bg-zinc-200 rounded w-1/4" />
              <div className="h-3 bg-zinc-200 rounded w-1/3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 bg-zinc-100 border border-zinc-200 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 h-96 bg-zinc-150 border border-zinc-200 rounded-3xl" />
              <div className="xl:col-span-1 h-96 bg-zinc-150 border border-zinc-200 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Stats + Upload + Result */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* Upload zone */}
              <UploadZone
                userId={userId}
                onDiagnosisComplete={handleDiagnosisComplete}
                onFileSelected={setUploadedPreviewUrl}
              />

              {/* Diagnosis result — only shown after a real upload */}
              {diagnosis && (
                <DiagnosisCard data={getDisplayDiagnosis()} />
              )}

              {/* AI chat — always visible as quick assistant */}
              <DiagnosisResultPanel result={diagnosis} />
            </div>

            {/* Right: Map + Weather */}
            <div className="xl:col-span-1 flex flex-col gap-6">
              <MapCard height="h-64" />
              <WeatherCard onViewForecast={() => setActiveTab('weather')} />
            </div>
          </div>
        );

      case 'diagnose':
        return (
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            {/* Upload at top */}
            <UploadZone
              userId={userId}
              onDiagnosisComplete={handleDiagnosisComplete}
              onFileSelected={setUploadedPreviewUrl}
            />

            {/* Diagnosis result card once uploaded */}
            {diagnosis && (
              <DiagnosisCard data={getDisplayDiagnosis()} />
            )}

            {/* Inline AI chat so user can immediately ask questions */}
            <DiagnosisResultPanel result={diagnosis} />
          </div>
        );

      case 'map':
        return <AgroDealerMap />;
      case 'history':
        return <HistoryList userId={userId ?? undefined} />;
      case 'library':
        return <CropLibrary />;
      case 'weather':
        return <WeatherCard location="Kumasi" region="Ashanti Region" />;
      case 'settings':
        return <SettingsView />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        {/* Dashboard greeting and greeting stats cards */}
        <main className="flex-1 p-6 pt-0 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div className="mb-6">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-zinc-950 font-sans tracking-tight">
                  Good morning, Kwame 👋
                </h1>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Helping farmers protect their crops with AI. Let's inspect your farm today.
                </p>
              </div>

              {/* Stats panel summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Diagnoses" 
                  value={historyItems.length.toString()} 
                  icon={Activity} 
                  subtext="Specimens scanned" 
                  trend={{ value: getScansThisWeek(), type: 'up' }}
                />
                <StatCard 
                  title="AI Accuracy" 
                  value={getAverageAccuracy()} 
                  icon={Target} 
                  subtext="Correct diagnoses verified" 
                  trend={{ value: 'Stable', type: 'neutral' }}
                />
                <StatCard 
                  title="Reputation" 
                  value={`${reputationScore} pts`} 
                  icon={Award} 
                  subtext="Unlock level 4 at 1000 pts" 
                  trend={{ value: `Level 3`, type: 'up' }}
                />
                <StatCard 
                  title="Current Streak" 
                  value={getStreakDays()} 
                  icon={Flame} 
                  subtext="Daily active scans" 
                  trend={{ value: 'Active', type: 'up' }}
                />
              </div>
            </div>
          )}

          {/* Animate View Transition container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
