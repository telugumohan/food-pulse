import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressFound?: (address: string, city: string) => void;
  height?: string;
  disabled?: boolean;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14));
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  onAddressFound,
  height = '280px',
  disabled = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const hasPin = latitude != null && !Number.isNaN(latitude) && longitude != null && !Number.isNaN(longitude);
  const center: [number, number] = hasPin ? [latitude!, longitude!] : [19.076, 72.8777]; // Default Mumbai center
  const zoom = hasPin ? 14 : 5;

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setInfo('Geolocation is not supported by your browser. Place a pin manually.');
      return;
    }
    setGeolocating(true);
    setInfo(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6)),
        );
        setGeolocating(false);
      },
      () => {
        setInfo('Location access denied. Please place a pin manually on the map.');
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setInfo(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setInfo('No address found. Try a different query or place a pin on the map.');
        return;
      }
      const item = data[0];
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      onLocationChange(Number(lat.toFixed(6)), Number(lon.toFixed(6)));

      if (onAddressFound) {
        const parts = item.display_name.split(',').map((s: string) => s.trim());
        const cityCandidate = parts.length >= 3 ? parts[parts.length - 3] : parts[0];
        onAddressFound(item.display_name, cityCandidate);
      }
    } catch {
      setInfo('Search service unavailable. Please click on the map to place a pin.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address using OpenStreetMap Nominatim…"
            disabled={disabled || searching}
            className="flex-1 min-w-0 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={disabled || searching || !query.trim()}
          >
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGeo}
          disabled={disabled || geolocating}
        >
          {geolocating ? 'Locating…' : '📍 Use My Location'}
        </Button>
      </div>

      {info && <p className="text-xs text-destructive">{info}</p>}

      <div
        style={{ height }}
        className="relative z-0 rounded-[var(--radius)] border border-border overflow-hidden"
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!disabled && <ClickHandler onClick={onLocationChange} />}
          {hasPin && (
            <>
              <Marker position={[latitude!, longitude!]} />
              <RecenterMap lat={latitude!} lng={longitude!} />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Click anywhere on the map to place/adjust your location pin.
      </p>
    </div>
  );
}
