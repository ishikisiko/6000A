import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart, Radar } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data for Radar Chart
const radarData = [
  { subject: 'Strategy', A: 120, fullMark: 150 },
  { subject: 'Aim', A: 98, fullMark: 150 },
  { subject: 'Utility', A: 86, fullMark: 150 },
  { subject: 'Teamwork', A: 99, fullMark: 150 },
  { subject: 'Economy', A: 85, fullMark: 150 },
  { subject: 'Clutch', A: 65, fullMark: 150 },
];

// Mock data for Neon Line Chart
const lineData = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 500 },
  { name: 'Thu', value: 280 },
  { name: 'Fri', value: 590 },
  { name: 'Sat', value: 320 },
  { name: 'Sun', value: 450 },
];

export function AbilityRadarChart() {
  const { t } = useLanguage();

  return (
    <Card className="border-t-4 border-t-amber-500 h-full bg-[#1A1B2E] border-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium">Ability Analysis</CardTitle>
        <Radar className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent className="p-4 relative z-10">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <RechartsRadar
                name="Player"
                dataKey="A"
                stroke="#f59e0b"
                strokeWidth={3}
                fill="#f59e0b"
                fillOpacity={0.3}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                itemStyle={{ color: '#f59e0b' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityLineChart() {
  return (
    <Card className="border-t-4 border-t-cyan-500 h-full bg-[#1A1B2E] border-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Activity Trend</CardTitle>
        <LineChart className="h-4 w-4 text-cyan-500" />
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <defs>
                <filter id="glow" height="300%" width="300%" x="-75%" y="-75%">
                  <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="thicken" />
                  <feGaussianBlur in="thicken" stdDeviation="10" result="blurred" />
                  <feFlood floodColor="#06b6d4" result="glowColor" />
                  <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow_colored" />
                  <feMerge>
                    <feMergeNode in="softGlow_colored" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#06b6d4" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#06b6d4", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#fff", stroke: "#06b6d4" }}
                filter="url(#glow)"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
