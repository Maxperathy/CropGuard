import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Loader2, Star, Phone, Navigation } from 'lucide-react';

interface Dealer {
  id: string;
  name: string;
  coords: [number, number];
  phone: string;
  addr: string;
  region: 'accra' | 'ashanti' | 'northern' | 'eastern' | 'western';
  specialty: string[];
  distance?: string;
  distanceVal?: number;
  rating?: number;
}

const REGION_CENTERS: { [key: string]: { center: [number, number]; zoom: number } } = {
  all: { center: [7.5, -1.2], zoom: 7 },
  accra: { center: [5.6037, -0.1870], zoom: 11 },
  ashanti: { center: [6.6906, -1.6244], zoom: 10 },
  northern: { center: [9.4008, -0.8393], zoom: 9 },
  eastern: { center: [6.0782, -0.2713], zoom: 10 },
  western: { center: [4.9016, -1.7748], zoom: 10 },
};

const DEALERS: Dealer[] = [
  {
    id: 'd1',
    name: 'Accra Agro-Chemicals Ltd',
    coords: [5.6037, -0.1870],
    phone: '+233 24 123 4567',
    addr: 'Ring Road Central, Accra',
    region: 'accra',
    specialty: ['NPK Fertilizers', 'Spraying Machines', 'Insecticides'],
    rating: 4.6
  },
  {
    id: 'd2',
    name: 'Tema Seed & Equipment Hub',
    coords: [5.6698, -0.0169],
    phone: '+233 24 555 8899',
    addr: 'Tema Community 1, Greater Accra',
    region: 'accra',
    specialty: ['Hybrid Maize Seeds', 'Drip Irrigation Kits', 'Pruning Tools'],
    rating: 4.2
  },
  {
    id: 'd3',
    name: 'Kumasi Farmers Co-op',
    coords: [6.6906, -1.6244],
    phone: '+233 20 987 6543',
    addr: 'Kejetia Market, Kumasi',
    region: 'ashanti',
    specialty: ['Cocoa Pruners', 'Knapsack Sprayers', 'Organic Compost'],
    rating: 4.8
  },
  {
    id: 'd4',
    name: 'Obuasi Agro Depot',
    coords: [6.2058, -1.6706],
    phone: '+233 50 333 4444',
    addr: 'Main Station Road, Obuasi',
    region: 'ashanti',
    specialty: ['Soil pH Test Kits', 'Agricultural Lime', 'Safety Boots'],
    rating: 4.4
  },
  {
    id: 'd5',
    name: 'Tamale Agro Supply',
    coords: [9.4008, -0.8393],
    phone: '+233 27 777 9999',
    addr: 'Bolgatanga Road, Tamale',
    region: 'northern',
    specialty: ['Tractor Attachments', 'Water Pumps', 'Sorghum Seeds'],
    rating: 4.5
  },
  {
    id: 'd6',
    name: 'Yendi Seed Center',
    coords: [9.4439, -0.0097],
    phone: '+233 54 888 1122',
    addr: 'Market Square, Yendi',
    region: 'northern',
    specialty: ['Drought-Resistant Maize Seeds', 'Yam Tubers', 'Hand Hoes'],
    rating: 4.0
  },
  {
    id: 'd7',
    name: 'Koforidua Seed & Fertilizer Store',
    coords: [6.0782, -0.2713],
    phone: '+233 55 555 1234',
    addr: 'Main Station, Koforidua',
    region: 'eastern',
    specialty: ['Cassava Stems', 'NPK 15-15-15', 'Bio-Pesticides'],
    rating: 4.7
  },
];

export function AgroDealerMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const userMarkerRef = useRef<any>(null);

  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Geolocation Haversine Distance helper
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Map dealers with dynamically calculated distances
  const dealersWithDistance = DEALERS.map((d) => {
    if (!userCoords) return d;
    const dist = getDistance(userCoords[0], userCoords[1], d.coords[0], d.coords[1]);
    return {
      ...d,
      distance: `${dist.toFixed(1)} km away`,
      distanceVal: dist,
    };
  });

  // Sort dealers by distance if user coords are present, else default
  const sortedDealers = [...dealersWithDistance].sort((a, b) => {
    if (a.distanceVal !== undefined && b.distanceVal !== undefined) {
      return a.distanceVal - b.distanceVal;
    }
    return 0;
  });

  const filteredDealers = sortedDealers.filter((d) => {
    const matchesRegion = selectedRegion === 'all' || d.region === selectedRegion;
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchesRegion && matchesSearch;
  });

  // Setup Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const L_Instance = (window as any).L;
    if (!L_Instance) return;

    // Centered Ghana [7.5, -1.2]
    const map = L_Instance.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([7.5, -1.2], 7);
    mapInstance.current = map;

    L_Instance.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Try to auto detect location at map open
    detectUserLocation(false);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update dealer markers on map
  useEffect(() => {
    const L_Instance = (window as any).L;
    if (!L_Instance || !mapInstance.current) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    filteredDealers.forEach((d) => {
      const specialtiesHtml = d.specialty
        .map(
          (s) =>
            `<span style="display:inline-block;background:#f5f0e8;font-size:10px;padding:2px 6px;margin:2px;border-radius:4px;border:1px solid #e6dfd8">${s}</span>`
        )
        .join('');

      const distHtml = d.distance ? `<span style="color:#10b981;font-weight:700;">🟢 ${d.distance}</span><br/>` : '';

      const popupContent = `
        <div style="font-family:sans-serif;font-size:12px;line-height:1.4;padding:4px;">
          <strong style="font-size:13px;color:#141413;">${d.name}</strong><br/>
          ${distHtml}
          <span style="color:#6c6a64;">📍 ${d.addr}</span><br/>
          <div style="margin:5px 0;">${specialtiesHtml}</div>
          📞 <a href="tel:${d.phone}" style="color:#2E7D32;text-decoration:none;font-weight:700;">${d.phone}</a>
        </div>
      `;

      const marker = L_Instance.marker(d.coords)
        .addTo(mapInstance.current)
        .bindPopup(popupContent);

      markersRef.current[d.id] = marker;
    });
  }, [filteredDealers]);

  // Handle region filter pan action
  useEffect(() => {
    if (mapInstance.current && selectedRegion !== 'all') {
      const config = REGION_CENTERS[selectedRegion];
      if (config) {
        mapInstance.current.setView(config.center, config.zoom);
      }
    }
  }, [selectedRegion]);

  function detectUserLocation(pan = true) {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords([lat, lon]);
        setDetecting(false);

        if (mapInstance.current) {
          if (pan) {
            mapInstance.current.setView([lat, lon], 12);
          }

          // Place User Marker Dot
          const L_Instance = (window as any).L;
          if (L_Instance) {
            if (userMarkerRef.current) userMarkerRef.current.remove();

            const userIcon = L_Instance.divIcon({
              className: 'custom-user-marker',
              html: `<div style="background:#2563eb;width:12px;height:12px;border-radius:50%;border:2px white solid;box-shadow:0 0 10px rgba(37,99,235,0.7);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });

            userMarkerRef.current = L_Instance.marker([lat, lon], { icon: userIcon })
              .addTo(mapInstance.current)
              .bindPopup('<strong>You Are Here</strong>');
            
            if (pan) {
              userMarkerRef.current.openPopup();
            }
          }
        }
      },
      (err) => {
        console.warn('Geolocation mapping error:', err);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function centerOnDealer(d: Dealer) {
    if (mapInstance.current) {
      mapInstance.current.setView(d.coords, 14);
      const marker = markersRef.current[d.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950 font-sans tracking-tight flex items-center gap-2">
            <span>📍 Local Agro-Dealers & Map</span>
          </h2>
          <p className="text-xs text-zinc-400 font-medium">Find certified local crop supplies, fertilizers, and extension services near you.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* User Location Trigger Button */}
          <button
            onClick={() => detectUserLocation(true)}
            disabled={detecting}
            className="flex items-center gap-1.5 border border-primary/20 rounded-xl px-3 py-2 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-bold text-xs disabled:opacity-50"
          >
            {detecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{userCoords ? 'Sync Geolocation' : 'Suggest Nearest'}</span>
          </button>

          <input
            type="text"
            placeholder="Search specialties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3 pr-4 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-primary focus:bg-white transition-all w-44"
          />

          <div className="flex items-center gap-1.5 border border-zinc-200 rounded-xl px-2.5 py-2 bg-zinc-50/50">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-xs font-semibold text-zinc-600 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Regions</option>
              <option value="accra">Greater Accra</option>
              <option value="ashanti">Ashanti Region</option>
              <option value="eastern">Eastern Region</option>
              <option value="western">Western Region</option>
              <option value="northern">Northern Region</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map box */}
      <div ref={mapRef} className="w-full h-80 rounded-2xl border border-zinc-150 shadow-inner z-10 mb-6" />

      {/* Dealer Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto pr-1">
        {filteredDealers.map((d) => (
          <div
            key={d.id}
            className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl flex flex-col justify-between hover:border-primary/30 transition-all hover:bg-zinc-100/40"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-1">
                <h4 className="text-xs font-bold text-zinc-950 leading-tight">{d.name}</h4>
                {d.rating && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500 shrink-0">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {d.rating}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-1 mb-3">
                <p className="text-[10px] text-zinc-400 font-medium">📍 {d.addr}</p>
                {d.distance && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    🟢 Nearest: {d.distance}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {d.specialty.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-bold bg-white text-zinc-500 border border-zinc-100 rounded px-2 py-0.5"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-200/30 pt-3 mt-auto">
              <a href={`tel:${d.phone}`} className="text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => centerOnDealer(d)}
                className="py-1 px-3 h-7 text-[10px] rounded-lg"
              >
                Show on Map
              </Button>
            </div>
          </div>
        ))}
        {filteredDealers.length === 0 && (
          <div className="col-span-full py-8 text-center text-zinc-400 text-xs font-medium">
            No matching agro-dealers found.
          </div>
        )}
      </div>
    </Card>
  );
}
