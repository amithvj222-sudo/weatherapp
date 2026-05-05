import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ClimateData } from '../services/weatherService';

export const ClimateTrendsChart = ({ data }: { data: ClimateData }) => {
  const chartData = data.years.map((year, i) => ({
    year,
    temp: data.avgTemp[i],
    precip: data.precipSum[i]
  }));

  return (
    <div className="space-y-8">
      <div className="h-[300px] w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="tech-label">Avg Yearly Temperature (°C)</h3>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
              labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="temp" 
              stroke="#f97316" 
              strokeWidth={2} 
              dot={{ r: 4, fill: '#f97316' }}
              activeDot={{ r: 6, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[200px] w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="tech-label">Total Annual Precipitation (mm)</h3>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
              labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="precip" 
              stroke="#38bdf8" 
              fill="url(#colorPrecip)" 
              fillOpacity={0.2}
            />
            <defs>
              <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
