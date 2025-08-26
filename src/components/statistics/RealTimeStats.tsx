import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter, AnimatedProgressBar } from '@/components/ui/animated-components';
import { useStatistics } from '@/hooks/useStatistics';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface RealTimeStatsProps {
  className?: string;
  compact?: boolean;
  showProgress?: boolean;
}

export const RealTimeStats: React.FC<RealTimeStatsProps> = ({
  className,
  compact = false,
  showProgress = true
}) => {
  const { 
    currentSession, 
    isSessionActive, 
    calculateCurrentStats,
    userProgress 
  } = useStatistics();

  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 0,
    consistency: 0,
    errorRate: 0
  });

  const [sessionTime, setSessionTime] = useState(0);

  // Update stats in real-time
  useEffect(() => {
    if (isSessionActive) {
      const interval = setInterval(() => {
        const currentStats = calculateCurrentStats();
        setStats(currentStats);
        
        if (currentSession) {
          const elapsed = (Date.now() - currentSession.startTime.getTime()) / 1000;
          setSessionTime(elapsed);
        }
      }, 100); // Update every 100ms for smooth animations

      return () => clearInterval(interval);
    }
  }, [isSessionActive, calculateCurrentStats, currentSession]);

  // Reset stats when session ends
  useEffect(() => {
    if (!isSessionActive) {
      setSessionTime(0);
    }
  }, [isSessionActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWpmColor = (wpm: number): 'primary' | 'success' | 'warning' | 'destructive' => {
    if (wpm >= 40) return 'success';
    if (wpm >= 25) return 'primary';
    if (wpm >= 15) return 'warning';
    return 'destructive';
  };

  const getAccuracyColor = (accuracy: number): 'primary' | 'success' | 'warning' | 'destructive' => {
    if (accuracy >= 95) return 'success';
    if (accuracy >= 90) return 'primary';
    if (accuracy >= 80) return 'warning';
    return 'destructive';
  };

  if (compact) {
    return (
      <div className={cn('flex gap-4', className)}>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-mono text-lg font-bold">
            <AnimatedCounter value={stats.wpm} />
          </span>
          <span className="text-sm text-muted-foreground">WPM</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-green-500" />
          <span className="font-mono text-lg font-bold">
            <AnimatedCounter value={stats.accuracy} suffix="%" />
          </span>
          <span className="text-sm text-muted-foreground">ACC</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="font-mono text-lg font-bold">
            {formatTime(sessionTime)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={cn(
          'transition-all duration-300',
          isSessionActive && 'ring-2 ring-primary/20'
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Speed</CardTitle>
            <Zap className={cn(
              'h-4 w-4',
              stats.wpm >= 30 ? 'text-green-500' : 
              stats.wpm >= 20 ? 'text-yellow-500' : 'text-red-500'
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              <AnimatedCounter value={stats.wpm} />
              <span className="text-sm font-normal text-muted-foreground ml-1">WPM</span>
            </div>
            {userProgress && (
              <p className="text-xs text-muted-foreground">
                Avg: {userProgress.averageWpm} | Best: {userProgress.bestWpm}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(
          'transition-all duration-300',
          isSessionActive && 'ring-2 ring-primary/20'
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className={cn(
              'h-4 w-4',
              stats.accuracy >= 95 ? 'text-green-500' : 
              stats.accuracy >= 85 ? 'text-yellow-500' : 'text-red-500'
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              <AnimatedCounter value={stats.accuracy} suffix="%" />
            </div>
            {userProgress && (
              <p className="text-xs text-muted-foreground">
                Avg: {userProgress.averageAccuracy}% | Best: {userProgress.bestAccuracy}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(
          'transition-all duration-300',
          isSessionActive && 'ring-2 ring-primary/20'
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <Activity className={cn(
              'h-4 w-4',
              stats.consistency >= 80 ? 'text-green-500' : 
              stats.consistency >= 60 ? 'text-yellow-500' : 'text-red-500'
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              <AnimatedCounter value={stats.consistency} />
            </div>
            <p className="text-xs text-muted-foreground">
              Rhythm stability
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          'transition-all duration-300',
          isSessionActive && 'ring-2 ring-primary/20'
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatTime(sessionTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Session duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicators */}
      {showProgress && isSessionActive && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Session Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* WPM Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Speed Progress</span>
                  <span>{stats.wpm} / {userProgress?.bestWpm || 50} WPM</span>
                </div>
                <AnimatedProgressBar 
                  value={(stats.wpm / (userProgress?.bestWpm || 50)) * 100}
                  max={100}
                  color={getWpmColor(stats.wpm)}
                  size="sm"
                />
              </div>

              {/* Accuracy Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Accuracy Progress</span>
                  <span>{stats.accuracy}%</span>
                </div>
                <AnimatedProgressBar 
                  value={stats.accuracy}
                  max={100}
                  color={getAccuracyColor(stats.accuracy)}
                  size="sm"
                />
              </div>

              {/* Characters Typed */}
              {currentSession && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Characters Typed</span>
                    <span>{currentSession.totalCharacters}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      {currentSession.correctCharacters} correct
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      {currentSession.incorrectCharacters} errors
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          )} />
          <span className="text-muted-foreground">
            {isSessionActive ? 'Session Active' : 'Session Inactive'}
          </span>
        </div>
        
        {currentSession && (
          <div className="text-muted-foreground">
            {currentSession.totalCharacters} characters typed
          </div>
        )}
      </div>

      {/* Performance Indicators */}
      {isSessionActive && (
        <div className="grid gap-2 md:grid-cols-3 text-sm">
          <div className={cn(
            'flex items-center gap-2 p-2 rounded',
            stats.wpm >= (userProgress?.averageWpm || 0) ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          )}>
            <TrendingUp className="h-4 w-4" />
            <span>
              {stats.wpm >= (userProgress?.averageWpm || 0) ? 'Above' : 'Below'} average speed
            </span>
          </div>
          
          <div className={cn(
            'flex items-center gap-2 p-2 rounded',
            stats.accuracy >= (userProgress?.averageAccuracy || 0) ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          )}>
            <Target className="h-4 w-4" />
            <span>
              {stats.accuracy >= (userProgress?.averageAccuracy || 0) ? 'Above' : 'Below'} average accuracy
            </span>
          </div>
          
          <div className={cn(
            'flex items-center gap-2 p-2 rounded',
            stats.consistency >= 70 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          )}>
            <Activity className="h-4 w-4" />
            <span>
              {stats.consistency >= 70 ? 'Good' : 'Improving'} consistency
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
