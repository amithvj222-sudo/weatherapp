import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Use CDN for marker icons to avoid asset resolution issues in sandboxed environments
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface WeatherMapProps {
  center: [number, number];
  zoom?: number;
}

const RainRadar = () => {
  const [radarUrl, setRadarUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch latest radar data from RainViewer
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data.radar?.past && data.radar.past.length > 0) {
          const latest = data.radar.past[data.radar.past.length - 1];
          const url = `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
          setRadarUrl(url);
        }
      })
      .catch(err => console.error('Radar Fetch Error:', err));
  }, []);

  if (!radarUrl) return null;

  return (
    <TileLayer
      url={radarUrl}
      opacity={0.6}
      zIndex={100}
    />
  );
};

// Component to handle map centering when coordinates change
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export const WeatherMap = ({ center, zoom = 6 }: WeatherMapProps) => {
  return (
    <div className="w-full h-full min-h-[400px] relative overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <RainRadar />
        <MapUpdater center={center} />
      </MapContainer>
      
      {/* Legend / Info Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300">Live Rain Radar</span>
        </div>
      </div>
      
      {/* Zoom Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
         {/* Custom zoom buttons if needed, but for now we rely on the container being interactive */}
      </div>
    </div>
  );
};
