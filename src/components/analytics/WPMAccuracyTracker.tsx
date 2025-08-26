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
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WPMAccuracyTrackerProps {
  className?: string;
}

interface DailyStats {
  date: string;
  average_wpm: number;
  best_wpm: number;
  average_accuracy: number;
  best_accuracy: number;
  total_sessions: number;
  total_practice_time: number;
  consistency_score: number;
}

interface PerformanceGoal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  deadline?: string;
  achieved: boolean;
  description?: string;
}

interface MetricTrend {
  date: string;
  wpm: number;
  accuracy: number;
  session_id: string;
}

export const WPMAccuracyTracker: React.FC<WPMAccuracyTrackerProps> = ({ className }) => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { sessions, loading: sessionsLoading } = useTypingSessions(user?.id || '', {
    limit: 100,
    orderBy: 'created_at',
    ascending: false
  });

  // Fetch daily statistics from database
  useEffect(() => {
    if (!user?.id) return;

    const fetchDailyStats = async () => {
      setLoading(true);
      try {
        const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

        const { data, error } = await supabase
          .from('daily_statistics')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (error) throw error;
        setDailyStats(data || []);
      } catch (error) {
        console.error('Error fetching daily stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyStats();
  }, [user?.id, timeRange]);

  // Fetch performance goals
  useEffect(() => {
    if (!user?.id) return;

    const fetchGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('performance_goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: true });

        if (error) throw error;
        setGoals(data || []);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    fetchGoals();
  }, [user?.id]);

  // Filter sessions by time range
  const filteredSessions = sessions.filter(session => {
    if (timeRange === 'all') return true;
    
    const sessionDate = new Date(session.created_at);
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
    }
    
    return sessionDate >= cutoffDate;
  });

  // Calculate metrics
  const metrics = {
    totalSessions: filteredSessions.length,
    averageWpm: filteredSessions.length > 0 
      ? filteredSessions.reduce((sum, s) => sum + parseFloat(s.wpm.toString()), 0) / filteredSessions.length 
      : 0,
    averageAccuracy: filteredSessions.length > 0 
      ? filteredSessions.reduce((sum, s) => sum + parseFloat(s.accuracy.toString()), 0) / filteredSessions.length 
      : 0,
    bestWpm: filteredSessions.length > 0 
      ? Math.max(...filteredSessions.map(s => parseFloat(s.wpm.toString()))) 
      : 0,
    bestAccuracy: filteredSessions.length > 0 
      ? Math.max(...filteredSessions.map(s => parseFloat(s.accuracy.toString()))) 
      : 0,
    totalPracticeTime: filteredSessions.reduce((sum, s) => sum + (s.practice_time || 0), 0)
  };

  // Calculate trends
  const calculateTrend = (metric: 'wpm' | 'accuracy'): number => {
    if (filteredSessions.length < 5) return 0;
    
    const sortedSessions = [...filteredSessions].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const recentSessions = sortedSessions.slice(-5);
    const olderSessions = sortedSessions.slice(0, 5);
    
    const recentAvg = recentSessions.reduce((sum, s) => 
      sum + parseFloat(s[metric].toString()), 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, s) => 
      sum + parseFloat(s[metric].toString()), 0) / olderSessions.length;
    
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  };

  const wpmTrend = calculateTrend('wpm');
  const accuracyTrend = calculateTrend('accuracy');



  // Generate trend data for charts
  const trendData: MetricTrend[] = filteredSessions
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(session => ({
      date: session.created_at,
      wpm: parseFloat(session.wpm.toString()),
      accuracy: parseFloat(session.accuracy.toString()),
      session_id: session.id
    }));

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 5) return 'text-green-600';
    if (trend < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  if (loading || sessionsLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading performance data...</p>
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
          <h2 className="text-2xl font-bold">WPM & Accuracy Tracking</h2>
          <p className="text-muted-foreground">Monitor your typing performance over time</p>
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
          
          <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="wpm">WPM Only</SelectItem>
              <SelectItem value="accuracy">Accuracy Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <AnimatedContainer animation="fade" delay={200}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average WPM</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={Math.round(metrics.averageWpm)} />
              </div>
              <div className={cn('flex items-center text-xs', getTrendColor(wpmTrend))}>
                {getTrendIcon(wpmTrend)}
                <span className="ml-1">
                  {wpmTrend > 0 ? '+' : ''}{wpmTrend.toFixed(1)}% from previous period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={Math.round(metrics.averageAccuracy)} suffix="%" />
              </div>
              <div className={cn('flex items-center text-xs', getTrendColor(accuracyTrend))}>
                {getTrendIcon(accuracyTrend)}
                <span className="ml-1">
                  {accuracyTrend > 0 ? '+' : ''}{accuracyTrend.toFixed(1)}% from previous period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best WPM</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={Math.round(metrics.bestWpm)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Personal record
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={Math.round(metrics.totalPracticeTime / 60)} />
                <span className="text-sm font-normal">min</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalSessions} sessions
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>
    </div>
  );
};
