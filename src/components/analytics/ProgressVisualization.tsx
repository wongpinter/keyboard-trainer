import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedContainer, AnimatedProgressBar, AnimatedCounter } from '@/components/ui/animated-components';
import { useTypingSessions, useAuth } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown,
  Target, 
  Clock, 
  Award, 
  BarChart3, 
  Calendar,
  Zap,
  CheckCircle,
  AlertCircle,
  Trophy,
  Activity,
  LineChart,
  PieChart,
  BarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressVisualizationProps {
  className?: string;
}

interface ChartDataPoint {
  date: string;
  wpm: number;
  accuracy: number;
  sessions: number;
  practice_time: number;
}

interface PerformanceDistribution {
  range: string;
  count: number;
  percentage: number;
}

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({ className }) => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [wpmDistribution, setWpmDistribution] = useState<PerformanceDistribution[]>([]);
  const [accuracyDistribution, setAccuracyDistribution] = useState<PerformanceDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  const { sessions, loading: sessionsLoading } = useTypingSessions(user?.id || '', { 
    limit: 200,
    orderBy: 'created_at',
    ascending: false
  });

  // Process sessions into chart data
  useEffect(() => {
    if (!sessions.length) return;

    const processChartData = () => {
      // Group sessions by date
      const dailyData = new Map<string, {
        wpm: number[];
        accuracy: number[];
        sessions: number;
        practice_time: number;
      }>();

      sessions.forEach(session => {
        const date = session.created_at.split('T')[0];
        const existing = dailyData.get(date) || { wpm: [], accuracy: [], sessions: 0, practice_time: 0 };
        
        existing.wpm.push(parseFloat(session.wpm.toString()));
        existing.accuracy.push(parseFloat(session.accuracy.toString()));
        existing.sessions += 1;
        existing.practice_time += session.practice_time || 0;
        
        dailyData.set(date, existing);
      });

      // Convert to chart data
      const chartPoints: ChartDataPoint[] = Array.from(dailyData.entries())
        .map(([date, data]) => ({
          date,
          wpm: data.wpm.reduce((sum, val) => sum + val, 0) / data.wpm.length,
          accuracy: data.accuracy.reduce((sum, val) => sum + val, 0) / data.accuracy.length,
          sessions: data.sessions,
          practice_time: data.practice_time
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setChartData(chartPoints);
    };

    processChartData();
  }, [sessions]);

  // Calculate performance distributions
  useEffect(() => {
    if (!sessions.length) return;

    const calculateDistributions = () => {
      // WPM Distribution
      const wpmRanges = [
        { min: 0, max: 20, label: '0-20 WPM' },
        { min: 20, max: 30, label: '20-30 WPM' },
        { min: 30, max: 40, label: '30-40 WPM' },
        { min: 40, max: 50, label: '40-50 WPM' },
        { min: 50, max: 100, label: '50+ WPM' }
      ];

      const wpmCounts = wpmRanges.map(range => {
        const count = sessions.filter(s => {
          const wpm = parseFloat(s.wpm.toString());
          return wpm >= range.min && wpm < range.max;
        }).length;
        
        return {
          range: range.label,
          count,
          percentage: (count / sessions.length) * 100
        };
      });

      setWpmDistribution(wpmCounts);

      // Accuracy Distribution
      const accuracyRanges = [
        { min: 0, max: 70, label: '< 70%' },
        { min: 70, max: 80, label: '70-80%' },
        { min: 80, max: 90, label: '80-90%' },
        { min: 90, max: 95, label: '90-95%' },
        { min: 95, max: 100, label: '95%+' }
      ];

      const accuracyCounts = accuracyRanges.map(range => {
        const count = sessions.filter(s => {
          const accuracy = parseFloat(s.accuracy.toString());
          return accuracy >= range.min && accuracy < range.max;
        }).length;
        
        return {
          range: range.label,
          count,
          percentage: (count / sessions.length) * 100
        };
      });

      setAccuracyDistribution(accuracyCounts);
    };

    calculateDistributions();
  }, [sessions]);

  // Simple chart component (since we don't have a chart library)
  const SimpleLineChart: React.FC<{ data: ChartDataPoint[]; metric: 'wpm' | 'accuracy' }> = ({ data, metric }) => {
    if (!data.length) return <div className="h-64 flex items-center justify-center text-muted-foreground">No data available</div>;

    const values = data.map(d => d[metric]);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    return (
      <div className="h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 40}
              x2="400"
              y2={i * 40}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((point[metric] - minValue) / range) * 200;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 400;
            const y = 200 - ((point[metric] - minValue) / range) * 200;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#3b82f6"
                className="hover:r-4 transition-all"
              />
            );
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
          <span>{maxValue.toFixed(0)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
          <span>{minValue.toFixed(0)}</span>
        </div>
      </div>
    );
  };

  if (loading || sessionsLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading progress data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Progress Visualization</h2>
          <p className="text-muted-foreground">Visual analysis of your typing improvement</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="area">Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="distribution">Performance Distribution</TabsTrigger>
          <TabsTrigger value="sessions">Session Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  WPM Progress
                </CardTitle>
                <CardDescription>
                  Words per minute over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart data={chartData} metric="wpm" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Accuracy Progress
                </CardTitle>
                <CardDescription>
                  Typing accuracy over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart data={chartData} metric="accuracy" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  WPM Distribution
                </CardTitle>
                <CardDescription>
                  How often you achieve different WPM ranges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {wpmDistribution.map((dist, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{dist.range}</span>
                      <span>{dist.count} sessions ({dist.percentage.toFixed(1)}%)</span>
                    </div>
                    <AnimatedProgressBar 
                      value={dist.percentage} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Accuracy Distribution
                </CardTitle>
                <CardDescription>
                  How often you achieve different accuracy ranges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {accuracyDistribution.map((dist, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{dist.range}</span>
                      <span>{dist.count} sessions ({dist.percentage.toFixed(1)}%)</span>
                    </div>
                    <AnimatedProgressBar 
                      value={dist.percentage} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Session Activity
              </CardTitle>
              <CardDescription>
                Daily practice sessions and time spent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.slice(-14).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-20">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{day.sessions} sessions</Badge>
                        <Badge variant="outline">{Math.round(day.practice_time / 60)}min</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{day.wpm.toFixed(1)} WPM</div>
                      <div className="text-xs text-muted-foreground">{day.accuracy.toFixed(1)}% accuracy</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
