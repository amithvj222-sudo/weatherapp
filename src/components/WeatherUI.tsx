import { 
  Cloud, 
  CloudDrizzle, 
  CloudFog, 
  CloudLightning, 
  CloudRain, 
  CloudSnow, 
  CloudSun, 
  Sun, 
  Wind,
  Droplets,
  Thermometer,
  Cloudy
} from 'lucide-react';

export const WeatherIcon = ({ code, isDay, className }: { code: number; isDay: boolean; className?: string }) => {
  // Mapping WMO Weather interpretation codes
  if (code === 0) return <Sun className={className} />;
  if (code >= 1 && code <= 3) return <CloudSun className={className} />;
  if (code >= 45 && code <= 48) return <CloudFog className={className} />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className={className} />;
  if (code >= 61 && code <= 65) return <CloudRain className={className} />;
  if (code >= 71 && code <= 75) return <CloudSnow className={className} />;
  if (code >= 80 && code <= 82) return <CloudRain className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  
  return <Cloudy className={className} />;
};

export const ConditionDetails = ({ 
  wind, 
  humidity, 
  feelsLike 
}: { 
  wind: number; 
  humidity: number; 
  feelsLike: number 
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center gap-2">
        <Wind className="w-5 h-5 text-blue-400" />
        <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Wind</span>
        <span className="font-mono text-lg">{wind} <small className="text-[10px]">km/h</small></span>
      </div>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center gap-2">
        <Droplets className="w-5 h-5 text-cyan-400" />
        <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Humidity</span>
        <span className="font-mono text-lg">{humidity}%</span>
      </div>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center gap-2">
        <Thermometer className="w-5 h-5 text-orange-400" />
        <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Feels Like</span>
        <span className="font-mono text-lg">{feelsLike}°</span>
      </div>
    </div>
  );
};
