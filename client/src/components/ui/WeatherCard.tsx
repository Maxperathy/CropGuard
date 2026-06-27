import { useState, useEffect } from 'react';
import { Card } from './Card';
import { CloudRain, Sun, Droplets, Thermometer, ArrowRight, MapPin, Loader2, Cloud } from 'lucide-react';
import { Badge } from './Badge';

interface WeatherCardProps {
  temperature?: number;
  humidity?: number;
  condition?: 'rain' | 'sun' | 'cloudy';
  location?: string;
  region?: string;
  diseaseRisk?: 'LOW' | 'MODERATE' | 'HIGH';
  riskLabel?: string;
  riskDescription?: string;
  recommendation?: string;
  onViewForecast?: () => void;
}

export function WeatherCard({
  temperature = 26,
  humidity = 84,
  condition = 'rain',
  location = 'Kumasi',
  region = 'Ashanti Region',
  onViewForecast,
}: WeatherCardProps) {
  const [localCoords, setLocalCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [localLoc, setLocalLoc] = useState<string>(location);
  const [localReg, setLocalReg] = useState<string>(region);
  const [localTemp, setLocalTemp] = useState<number>(temperature);
  const [localHum, setLocalHum] = useState<number>(humidity);
  const [localCond, setLocalCond] = useState<'rain' | 'sun' | 'cloudy'>(condition);
  const [loadingLoc, setLoadingLoc] = useState(false);

  // Load user geolocation and weather at startup if available
  useEffect(() => {
    // Try to auto-detect if permission was previously given
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeatherAndLoc(pos.coords.latitude, pos.coords.longitude);
        },
        null,
        { enableHighAccuracy: false, timeout: 3000 }
      );
    }
  }, []);

  async function fetchWeatherAndLoc(lat: number, lon: number) {
    setLocalCoords({ lat, lon });
    setLoadingLoc(true);

    // Fetch real weather from Open-Meteo
    try {
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`
      );
      const wData = await wRes.json();
      if (wData.current) {
        setLocalTemp(Math.round(wData.current.temperature_2m));
        setLocalHum(Math.round(wData.current.relative_humidity_2m));

        const code = wData.current.weather_code;
        if (code <= 1) setLocalCond('sun');
        else if (code <= 3) setLocalCond('cloudy');
        else setLocalCond('rain');
      }
    } catch (e) {
      console.warn('Failed to load real weather:', e);
    }

    // Fetch location details from OSM Nominatim
    try {
      const lRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      const lData = await lRes.json();
      if (lData.address) {
        const city =
          lData.address.city ||
          lData.address.town ||
          lData.address.suburb ||
          lData.address.village ||
          'Your Farm';
        const reg =
          lData.address.state ||
          lData.address.region ||
          lData.address.county ||
          'Local Area';
        setLocalLoc(city);
        setLocalReg(reg);
      }
    } catch (e) {
      console.warn('Failed to resolve location name:', e);
    }
    setLoadingLoc(false);
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherAndLoc(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Location detection failed:', err);
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Compute dynamic disease risk based on actual humidity
  const getRiskInfo = () => {
    if (localHum > 80) {
      return {
        level: 'HIGH' as const,
        label: 'High Humidity Outbreak Risk',
        desc: 'Elevated humidity level increases pathogen germination rates.',
        rec: 'Avoid overhead irrigation, apply preventative copper fungicides.',
        color: 'bg-red-50 text-red-700 border-red-200/50',
        badge: 'danger' as const,
      };
    } else if (localHum > 60) {
      return {
        level: 'MODERATE' as const,
        label: 'Moderate Spore Risk',
        desc: 'Humidity levels are favorable for moderate fungus spread.',
        rec: 'Ensure proper row spacings for air ventilation and weed regularly.',
        color: 'bg-amber-50 text-amber-700 border-amber-200/50',
        badge: 'warning' as const,
      };
    } else {
      return {
        level: 'LOW' as const,
        label: 'Low Dry-Climate Risk',
        desc: 'Favorable low humidity suppresses active spore germination.',
        rec: 'Regular monitoring recommended; standard field practices apply.',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
        badge: 'success' as const,
      };
    }
  };

  const risk = getRiskInfo();

  return (
    <Card className="p-5 flex flex-col justify-between relative overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Weather & Disease Risk</h3>
          <p className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">
            {localLoc}, {localReg}
          </p>
        </div>

        <button
          onClick={detectLocation}
          disabled={loadingLoc}
          className="text-[10px] font-bold text-primary hover:text-primary-light flex items-center gap-1 transition-all bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-lg border border-primary/10 disabled:opacity-50"
        >
          {loadingLoc ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-primary" />
          )}
          <span>{localCoords ? 'Sync' : 'Use My Location'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 pb-3 mb-3">
        {/* Left Side: Weather Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
            {localCond === 'rain' ? (
              <CloudRain className="w-6 h-6 animate-pulse" />
            ) : localCond === 'cloudy' ? (
              <Cloud className="w-6 h-6 text-zinc-400 animate-pulse" />
            ) : (
              <Sun className="w-6 h-6 text-amber-500 animate-spin-slow" />
            )}
          </div>
          <div>
            <h4 className="text-xl font-bold text-zinc-800 tracking-tight">{localTemp}°C</h4>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5 font-medium">
              <Droplets className="w-3 h-3 text-sky-400" />
              <span>Humidity {localHum}%</span>
            </div>
          </div>
        </div>

        {/* Right Side: Disease Risk */}
        <div className={`p-2.5 rounded-2xl border ${risk.color}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">Disease Risk</span>
            <Badge variant={risk.badge} className="py-0 px-1.5 text-[9px]">
              {risk.level}
            </Badge>
          </div>
          <h5 className="text-[12px] font-bold tracking-tight">{risk.label}</h5>
          <p className="text-[10px] opacity-80 mt-0.5 leading-normal">{risk.desc}</p>
        </div>
      </div>

      {/* Recommended Action Alert Box */}
      <div className="bg-emerald-50/50 border border-emerald-100/75 rounded-2xl p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Thermometer className="w-3 h-3" />
          </div>
          <span className="font-bold text-emerald-800 text-[13px]">Recommendation</span>
        </div>
        <p className="text-xs text-zinc-700 font-medium leading-normal">{risk.rec}</p>
      </div>

      {onViewForecast && (
        <button
          onClick={onViewForecast}
          className="text-[10px] font-bold text-primary hover:text-primary-light flex items-center gap-0.5 mt-3 self-end transition-colors"
        >
          View detailed regional forecast <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </Card>
  );
}
