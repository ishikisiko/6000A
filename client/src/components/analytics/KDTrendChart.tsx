import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
  Legend,
} from "recharts";

type Match = {
  id: number;
  createdAt: string;
  kills?: number;
  deaths?: number;
};

interface KDTrendChartProps {
  matches: Match[];
}

export function KDTrendChart({ matches }: KDTrendChartProps) {
  const { t } = useLanguage();

  // Get last 10 matches and calculate K/D ratio
  const chartData = matches
    .slice(0, 10)
    .reverse() // Show oldest to newest
    .map((match, index) => {
      const kills = match.kills || 0;
      const deaths = match.deaths || 1; // Avoid division by zero
      const kdRatio = Number((kills / deaths).toFixed(2));
      
      return {
        match: `#${index + 1}`,
        matchId: match.id,
        kd: kdRatio,
        kills,
        deaths,
        date: new Date(match.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
      };
    });

  const empty = chartData.length === 0;

  // Calculate average K/D
  const avgKD = empty 
    ? 0 
    : Number((chartData.reduce((sum, d) => sum + d.kd, 0) / chartData.length).toFixed(2));

  return (
    <Card className="relative overflow-hidden bg-[#1A1B2E] border-white/5 h-full">
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' 
        }} 
      />
      {/* Top highlight border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">K/D Trend</CardTitle>
            <CardDescription>Last 10 matches performance</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Average K/D</p>
            <p className="text-2xl font-black bg-gradient-to-br from-purple-300 via-pink-300 to-rose-300 bg-clip-text text-transparent">
              {avgKD}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[280px] flex items-center justify-center relative z-10">
        {empty ? (
          <p className="text-sm text-muted-foreground">No match data available</p>
        ) : (
          <div className="w-full h-full relative">
            {/* Outer glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent rounded-lg blur-xl" />
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                {/* Radar-style grid lines */}
                <CartesianGrid 
                  strokeDasharray="2 4" 
                  stroke="rgba(168, 85, 247, 0.15)" 
                  strokeWidth={0.5} 
                />
                
                <XAxis 
                  dataKey="match" 
                  stroke="rgba(168, 85, 247, 0.5)" 
                  tick={{ fill: 'rgba(168, 85, 247, 0.7)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(168, 85, 247, 0.3)' }}
                />
                
                <YAxis 
                  stroke="rgba(168, 85, 247, 0.5)" 
                  tick={{ fill: 'rgba(168, 85, 247, 0.7)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(168, 85, 247, 0.3)' }}
                  domain={[0, 'auto']}
                />
                
                <Tooltip 
                  contentStyle={{ 
                    background: "rgba(15, 23, 42, 0.95)", 
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'kd') return [value, 'K/D Ratio'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `Match ${label} - ${payload[0].payload.date}`;
                    }
                    return label;
                  }}
                />
                
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="kdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="kdLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e9d5ff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={1} />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <Area
                  type="monotone"
                  dataKey="kd"
                  stroke="none"
                  fill="url(#kdGradient)"
                  fillOpacity={1}
                />
                
                {/* Line with glow */}
                <Line
                  type="monotone"
                  dataKey="kd"
                  stroke="url(#kdLineGradient)"
                  strokeWidth={3}
                  dot={{ 
                    fill: '#e9d5ff', 
                    r: 4,
                    strokeWidth: 2,
                    stroke: '#a855f7',
                  }}
                  activeDot={{ 
                    r: 6,
                    fill: '#e9d5ff',
                    stroke: '#a855f7',
                    strokeWidth: 3,
                    style: { 
                      filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))' 
                    }
                  }}
                  style={{ 
                    filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.5))' 
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
