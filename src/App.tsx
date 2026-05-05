/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  fetchWeather, 
  fetchClimateTrends, 
  WeatherData, 
  ClimateData, 
  getWeatherDescription 
} from './services/weatherService';
import { 
  generateWeatherBriefing, 
  analyzeClimateTrends,
  chatWithWeatherAI
} from './services/geminiService';
import { WeatherIcon, ConditionDetails } from './components/WeatherUI';
import { ClimateTrendsChart } from './components/ClimateTrendsChart';
import { 
  Calendar, 
  Info, 
  LayoutDashboard, 
  LineChart as ChartIcon, 
  MapPin, 
  RefreshCcw, 
  AlertTriangle,
  Loader2,
  ChevronRight,
  Settings,
  Bell,
  Check,
  Sparkles,
  Cloud,
  MessageSquare,
  Send,
  User,
  Map as MapIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { WeatherMap } from './components/WeatherMap';

type Tab = 'dashboard' | 'trends' | 'ai' | 'chat' | 'map' | 'settings';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [briefing, setBriefing] = useState<string>('');
  const [climateAnalysis, setClimateAnalysis] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('Your Location');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // Notification States
  const [notifs, setNotifs] = useState({
    severe: true,
    daily: true,
    climate: false
  });

  const init = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords([latitude, longitude]);
        
        // Parallel fetch for weather and climate
        const [weatherData, climateData] = await Promise.all([
          fetchWeather(latitude, longitude),
          fetchClimateTrends(latitude, longitude)
        ]);

        setWeather(weatherData);
        setClimate(climateData);
        setLoading(false);

        // Generate AI insights in background
        generateWeatherBriefing(weatherData, "your local area").then(setBriefing);
        analyzeClimateTrends(climateData, "your local area").then(setClimateAnalysis);

        // Reverse geocoding for city name (optional but nice)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setLocationName(data.address.city || data.address.town || data.address.village || 'Your Location');
        } catch (e) {
          console.warn("Could not fetch city name");
        }
      }, (err) => {
        setError("Location access denied. Please enable location permissions to use Nimbus AI Weather.");
        setLoading(false);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Initialization failed");
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting || !weather) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatting(true);

    const history = chatMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await chatWithWeatherAI(userMessage, history, weather, locationName);
    setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsChatting(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  };

  const severityAlert = useMemo(() => {
    if (!weather) return null;
    const code = weather.current.weatherCode;
    if (code >= 95) return "Severe Thunderstorm Warning: Seek shelter if conditions worsen.";
    if (code === 82) return "Extreme Rainfall Alert: Potential for localized flooding.";
    return null;
  }, [weather]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-slate-950">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full border-4 border-sky-500/20 border-t-sky-500" />
          <Cloud className="absolute inset-0 m-auto w-6 h-6 text-sky-400" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-medium tracking-tight">Syncing with Satellites</h2>
          <p className="text-sm text-slate-500 font-mono tracking-widest uppercase animate-pulse">Retrieving meteorological telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center gap-4 bg-slate-950">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">System Error</h2>
        <p className="text-slate-400 max-w-sm">{error}</p>
        <button 
          onClick={init}
          className="px-6 py-2 bg-sky-600 hover:bg-sky-500 rounded-full transition-colors font-medium"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="p-6 md:p-8 flex items-center justify-between sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Nimbus AI</h1>
            <div className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3 h-3" />
              <span className="text-[10px] font-mono uppercase tracking-wider">{locationName}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={cn("w-5 h-5", refreshing && "animate-spin")} />
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-8 space-y-6">
        {/* Severe Weather Alert Bar */}
        <AnimatePresence>
          {severityAlert && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-4"
            >
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-500 uppercase tracking-wider">Meteorological Alert</h4>
                <p className="text-sm text-rose-200/80">{severityAlert}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && weather && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Hero Section */}
              <div className="glass-card flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <WeatherIcon code={weather.current.weatherCode} isDay={weather.current.isDay} className="w-48 h-48" />
                </div>
                
                <div className="flex-1 space-y-4 relative z-10 text-center md:text-left">
                  <div className="space-y-1">
                    <span className="tech-label">Current Condition</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                      {getWeatherDescription(weather.current.weatherCode)}
                    </h2>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <span className="text-7xl md:text-8xl font-bold tracking-tighter font-mono">
                      {Math.round(weather.current.temp)}°
                    </span>
                    <div className="space-y-1 text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-mono">Max:</span>
                        <span className="text-sm font-bold text-white">{Math.round(weather.daily.tempMax[0])}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-mono">Min:</span>
                        <span className="text-sm font-bold text-white">{Math.round(weather.daily.tempMin[0])}°</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto h-px md:h-24 bg-slate-800" />

                <div className="flex-1 w-full space-y-6">
                  <ConditionDetails 
                    wind={weather.current.windSpeed}
                    humidity={weather.current.humidity}
                    feelsLike={weather.current.apparentTemp}
                  />
                </div>
              </div>

              {/* Hourly Forecast */}
              <div className="glass-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="tech-label">24-Hour Trajectory</h3>
                  <div className="flex items-center gap-1.5 text-sky-400">
                    <RefreshCcw className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-mono">Near-Real-Time</span>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {weather.hourly.time.slice(0, 24).map((time, i) => (
                    <div key={time} className="flex flex-col items-center gap-3 shrink-0 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-mono text-slate-500">
                        {format(new Date(time), 'HH:mm')}
                      </span>
                      <WeatherIcon 
                        code={weather.current.weatherCode} // Simplified for demo
                        isDay={new Date(time).getHours() > 6 && new Date(time).getHours() < 19}
                        className="w-5 h-5 text-sky-400" 
                      />
                      <span className="font-mono text-sm font-bold">
                        {Math.round(weather.hourly.temp[i])}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Forecast */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card space-y-6">
                  <h3 className="tech-label">7-Day Synthesis</h3>
                  <div className="space-y-4">
                    {weather.daily.time.slice(1).map((time, i) => (
                      <div key={time} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 w-24">
                          <span className="text-sm font-medium text-slate-400">
                            {format(new Date(time), 'EEE')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-center">
                          <WeatherIcon code={weather.daily.weatherCode[i+1]} isDay={true} className="w-5 h-5 text-sky-400" />
                          <span className="text-xs text-slate-500 w-32 hidden md:block">
                            {getWeatherDescription(weather.daily.weatherCode[i+1])}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 w-24 justify-end">
                          <span className="text-sm font-bold">{Math.round(weather.daily.tempMax[i+1])}°</span>
                          <span className="text-sm text-slate-500">{Math.round(weather.daily.tempMin[i+1])}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card space-y-6">
                   <div className="flex items-center justify-between">
                     <h3 className="tech-label">AI Weather Briefing</h3>
                     <Sparkles className="w-4 h-4 text-sky-400" />
                   </div>
                   <div className="prose prose-invert prose-xs max-w-none text-slate-400 leading-relaxed overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                     {briefing ? (
                       <ReactMarkdown>{briefing}</ReactMarkdown>
                     ) : (
                       <div className="flex flex-col items-center justify-center py-12 gap-4">
                         <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                         <span className="text-xs font-mono tracking-widest text-slate-600 animate-pulse uppercase">Synthesizing intelligence...</span>
                       </div>
                     )}
                   </div>
                   <button 
                    onClick={() => setActiveTab('ai')}
                    className="w-full py-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all flex items-center justify-center gap-2"
                   >
                     Read Detailed Insights <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'trends' && climate && (
            <motion.div 
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6 pb-12"
            >
              <div className="glass-card">
                <div className="flex items-center gap-3 mb-8">
                  <ChartIcon className="w-6 h-6 text-orange-500" />
                  <div>
                    <h2 className="text-xl font-bold">Climate Trajectory</h2>
                    <p className="text-sm text-slate-500 font-mono uppercase tracking-wider">10-Year Historical Analysis</p>
                  </div>
                </div>
                <ClimateTrendsChart data={climate} />
              </div>

              <div className="glass-card space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <h3 className="tech-label">Environmental Analysis</h3>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                  {climateAnalysis ? (
                    <ReactMarkdown>{climateAnalysis}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-3 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-slate-500 italic">Core processing unit evaluating trends...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 pb-12"
            >
              <div className="glass-card space-y-8 min-h-[60vh]">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your AI Meteorologist</h2>
                    <p className="text-sm text-slate-500 font-mono uppercase tracking-wider">Proprietary Forecasting Model</p>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none leading-relaxed text-slate-300">
                  {briefing ? (
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 gap-6">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-sky-400" />
                      </div>
                      <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em]">Engaging neural network nodes...</p>
                    </div>
                  )}
                </div>
                
                {briefing && (
                  <div className="p-6 rounded-3xl bg-slate-800/30 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-400" />
                      <span className="tech-label">Recommendation System</span>
                    </div>
                    <p className="text-sm text-slate-400 italic">
                      This briefing is generated using real-time atmospheric data and processed through advanced planetary models. Consult official government channels for emergency directives.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-18rem)] flex flex-col gap-4"
            >
              <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-sky-400" />
                    <h3 className="tech-label text-slate-300">Weather Oracle v2.4</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-500 uppercase">Live Connection</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                        <Sparkles className="w-8 h-8 text-sky-500/50" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200">How can I assist your day?</h4>
                        <p className="text-sm text-slate-500 max-w-xs">Ask about clothing recommendations, travel safety, or specific weather phenomena.</p>
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-3",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border",
                        msg.role === 'user' ? "bg-slate-800 border-slate-700" : "bg-sky-500/10 border-sky-500/20"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-sky-400" />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed",
                        msg.role === 'user' ? "bg-slate-800 text-slate-100" : "bg-white/5 border border-white/5 text-slate-300"
                      )}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ))}
                  {isChatting && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-1">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 relative">
                  <input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Inquire about the atmosphere..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-600"
                  />
                  <button 
                    type="submit"
                    disabled={isChatting || !chatInput.trim()}
                    className="absolute right-2 top-2 p-2 bg-sky-600 hover:bg-sky-500 rounded-xl transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'map' && coords && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[60vh] space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <MapIcon className="w-5 h-5 text-sky-400" />
                  <h3 className="tech-label text-slate-300">Global Precipitation Scan</h3>
                </div>
              </div>
              <WeatherMap center={coords} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6 pb-12"
            >
              <div className="glass-card space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                   <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Preferences</h2>
                    <p className="text-sm text-slate-500 font-mono uppercase tracking-wider">Configure System Alerts</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <NotificationToggle 
                    title="Severe Weather Alerts"
                    desc="Real-time warnings for lightning, flood, and extreme conditions."
                    enabled={notifs.severe}
                    onClick={() => setNotifs(prev => ({ ...prev, severe: !prev.severe }))}
                  />
                  <NotificationToggle 
                    title="Daily AI Briefing"
                    desc="Receive a summary of today's weather every morning."
                    enabled={notifs.daily}
                    onClick={() => setNotifs(prev => ({ ...prev, daily: !prev.daily }))}
                  />
                  <NotificationToggle 
                    title="Climate Anomaly Reports"
                    desc="Monthly insights on long-term climate changes in your area."
                    enabled={notifs.climate}
                    onClick={() => setNotifs(prev => ({ ...prev, climate: !prev.climate }))}
                  />
                </div>

                <div className="p-6 rounded-3xl bg-sky-500/5 border border-sky-500/10 flex items-start gap-4">
                   <Bell className="w-5 h-5 text-sky-500 mt-1" />
                   <div>
                     <h4 className="text-sm font-bold text-sky-400 uppercase tracking-widest mb-1">Push Notifications</h4>
                     <p className="text-sm text-slate-400 leading-relaxed">Notifications are currently simulated in this preview. In the production environment, these will link to your browser or mobile device's system alerts.</p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-50">
        <div className="max-w-md mx-auto h-16 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800 shadow-3xl flex items-center justify-around px-2">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Now"
          />
          <NavButton 
            active={activeTab === 'trends'} 
            onClick={() => setActiveTab('trends')}
            icon={<ChartIcon className="w-5 h-5" />}
            label="Trends"
          />
          <NavButton 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')}
            icon={<Sparkles className="w-5 h-5" />}
            label="Insight"
          />
          <NavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare className="w-5 h-5" />}
            label="Oracle"
          />
          <NavButton 
            active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')}
            icon={<MapIcon className="w-5 h-5" />}
            label="Radar"
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-5 h-5" />}
            label="Setup"
          />
        </div>
      </nav>
    </div>
  );
}

function NotificationToggle({ title, desc, enabled, onClick }: { title: string, desc: string, enabled: boolean, onClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={onClick}>
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <div className={cn(
        "w-12 h-6 rounded-full transition-all flex items-center px-1",
        enabled ? "bg-sky-500" : "bg-slate-700"
      )}>
        <motion.div 
          animate={{ x: enabled ? 24 : 0 }}
          className="w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-2xl transition-all relative overflow-hidden",
        active ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute inset-0 bg-sky-500/10"
        />
      )}
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
