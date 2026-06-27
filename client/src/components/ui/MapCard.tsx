import { useEffect, useRef, useState } from 'react';
import { Card } from './Card';
import { MapPin, Phone, Compass, Star } from 'lucide-react';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapLocation {
  id: string;
  name: string;
  type: 'shop' | 'officer' | 'hotspot';
  coords: [number, number];
  distance: string;
  rating?: number;
  phone?: string;
  details: string;
}

const SAMPLE_LOCATIONS: MapLocation[] = [
  {
    id: 'l1',
    name: 'AgroShop Ghana',
    type: 'shop',
    coords: [6.6920, -1.6250],
    distance: '2.1 km',
    rating: 4.8,
    phone: '+233 24 123 4567',
    details: 'Mancozeb 80 WP in stock',
  },
  {
    id: 'l2',
    name: 'Asante Farm Supplies',
    type: 'shop',
    coords: [6.6880, -1.6210],
    distance: '3.4 km',
    rating: 4.5,
    phone: '+233 20 987 6543',
    details: 'Mancozeb 80 WP in stock',
  },
  {
    id: 'l3',
    name: 'Kumasi Extension Office',
    type: 'officer',
    coords: [6.6950, -1.6270],
    distance: '2.7 km',
    phone: '+233 50 333 4444',
    details: 'Officer: Mr. K. Boateng · Available today',
  },
];

interface MapCardProps {
  locations?: MapLocation[];
  height?: string;
  showHeaderAction?: boolean;
}

export function MapCard({ locations = SAMPLE_LOCATIONS, height = 'h-40', showHeaderAction = true }: MapCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const [filter, setFilter] = useState<'all' | 'shop' | 'officer' | 'hotspot'>('all');
  const [activeLocs, setActiveLocs] = useState<MapLocation[]>(locations);

  useEffect(() => {
    if (filter === 'all') {
      setActiveLocs(locations);
    } else {
      setActiveLocs(locations.filter((l) => l.type === filter));
    }
  }, [filter, locations]);

  // Leaflet map initialization
  useEffect(() => {
    if (!mapRef.current) return;

    // Centered around Kumasi coordinates
    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([6.6906, -1.6244], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Add a circle range highlight to match visual mockup
      L.circle([6.6906, -1.6244], {
        color: '#2E7D32',
        fillColor: '#66BB6A',
        fillOpacity: 0.1,
        radius: 1200
      }).addTo(map);

      mapInstance.current = map;
    }

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Render active locations on Leaflet map
    activeLocs.forEach((loc) => {
      const marker = L.marker(loc.coords)
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:sans-serif;font-size:11px;">
            <strong style="color:#2E7D32;">${loc.name}</strong><br/>
            <span>${loc.details}</span>
          </div>
        `);
      markersRef.current[loc.id] = marker;
    });

    // Invalidate size after a short delay to solve rendering issues in dynamic layouts
    const timer = setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
    };

  }, [activeLocs]);

  const handleLocationClick = (loc: MapLocation) => {
    if (mapInstance.current) {
      mapInstance.current.setView(loc.coords, 14);
      const marker = markersRef.current[loc.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <Card className="p-5 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Map & Resources</h3>
        </div>
        {showHeaderAction && (
          <a
            href="#"
            className="text-[10px] font-bold text-primary hover:text-primary-light flex items-center gap-0.5 transition-colors"
          >
            View full map →
          </a>
        )}
      </div>

      {/* Embedded Map Visualizer */}
      <div className={`w-full ${height} rounded-2xl overflow-hidden border border-zinc-100 mb-3 z-10 shrink-0`}>
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto shrink-0 pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
            filter === 'all'
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
              : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('shop')}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
            filter === 'shop'
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
              : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Agro Shops
        </button>
        <button
          onClick={() => setFilter('officer')}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
            filter === 'officer'
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
              : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          Extension Officers
        </button>
      </div>

      {/* List items scrollbar */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-56 scrollbar-none">
        {activeLocs.map((loc) => (
          <div
            key={loc.id}
            onClick={() => handleLocationClick(loc)}
            className="flex items-center justify-between p-2 rounded-2xl border border-zinc-100 hover:bg-zinc-50/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[11px] font-bold text-zinc-800 truncate leading-none">{loc.name}</h4>
                  <span className="text-[9px] text-zinc-400 font-medium">{loc.distance}</span>
                </div>
                <p className="text-[9px] text-zinc-500 font-medium mt-0.5 truncate">{loc.details}</p>
                {loc.rating && (
                  <div className="flex items-center gap-0.5 mt-0.5 text-zinc-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-2 h-2 ${
                          i < Math.floor(loc.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'
                        }`}
                      />
                    ))}
                    <span className="text-[8px] font-bold text-zinc-500 ml-1">({loc.rating})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0">
              {loc.type === 'officer' ? (
                <a
                  href={`tel:${loc.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-[9px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-2.5 h-2.5" />
                  Call
                </a>
              ) : (
                <button
                  type="button"
                  className="px-2.5 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-[9px] font-bold flex items-center gap-1 transition-colors"
                >
                  Directions <Compass className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {activeLocs.length === 0 && (
          <p className="text-xs text-zinc-400 text-center py-4 font-medium">No nearby resources found.</p>
        )}
      </div>

      <div className="text-center mt-3 shrink-0 pt-2 border-t border-zinc-100">
        <a href="#" className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800">
          View more locations →
        </a>
      </div>
    </Card>
  );
}
