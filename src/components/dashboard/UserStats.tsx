import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserStatistics, useTypingSessions, useUserProgress } from '@/hooks/useDatabase';
import { BarChart3, TrendingUp, Clock, Target, Calendar, Award } from 'lucide-react';

interface UserStatsProps {
  userId: string;
}

interface TypingSession {
  id: string;
  wpm: number;
  accuracy: number;
  practice_time: number;
  completed: boolean;
  created_at: string;
  curriculum_id: string;
  lesson_index: number;
}

interface ProgressSummary {
  total_sessions: number;
  total_practice_time: number;
  best_wpm: number;
  average_wpm: number;
  best_accuracy: number;
  average_accuracy: number;
  active_curriculums: number;
  completed_lessons: number;
}

const UserStats = ({ userId }: UserStatsProps) => {
  const { toast } = useToast();

  // Use database hooks instead of manual fetching
  const { statistics, loading: statsLoading } = useUserStatistics(userId);
  const { sessions, loading: sessionsLoading } = useTypingSessions(userId, { limit: 20 });
  const { progress, loading: progressLoading } = useUserProgress(userId);

  const loading = statsLoading || sessionsLoading || progressLoading;

  // Calculate summary statistics from database hooks
  const stats: ProgressSummary | null = statistics ? {
    total_sessions: statistics.totalSessions,
    total_practice_time: statistics.totalPracticeTime,
    best_wpm: statistics.bestWpm,
    average_wpm: statistics.averageWpm,
    best_accuracy: statistics.bestAccuracy,
    average_accuracy: statistics.averageAccuracy,
    active_curriculums: progress.length,
    completed_lessons: progress.reduce((sum, p) => sum + (p.completed_lessons?.length || 0), 0)
  } : null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPerformanceColor = (wpm: number) => {
    if (wpm >= 60) return 'text-green-600';
    if (wpm >= 40) return 'text-blue-600';
    if (wpm >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Your Statistics</h2>
        <p className="text-muted-foreground">
          Track your typing progress and achievements
        </p>
      </div>

      {stats && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_sessions}</div>
                <p className="text-xs text-muted-foreground">
                  Practice sessions completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best WPM</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(stats.best_wpm)}`}>
                  {Math.round(stats.best_wpm)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {Math.round(stats.average_wpm)} WPM
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(stats.best_accuracy)}%</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {Math.round(stats.average_accuracy)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(stats.total_practice_time)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total time practiced
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Your progress milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Curriculums</span>
                    <Badge variant="secondary">{stats.active_curriculums}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed Lessons</span>
                    <Badge variant="secondary">{stats.completed_lessons}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Performance Level</span>
                    <Badge variant={stats.best_wpm >= 40 ? "default" : "secondary"}>
                      {stats.best_wpm >= 60 ? "Expert" : 
                       stats.best_wpm >= 40 ? "Advanced" : 
                       stats.best_wpm >= 25 ? "Intermediate" : "Beginner"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>
                  Your latest practice sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session, index) => (
                    <div key={session.id} className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Session #{sessions.length - index}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getPerformanceColor(parseFloat(session.wpm.toString()))}`}>
                          {Math.round(parseFloat(session.wpm.toString()))} WPM
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(parseFloat(session.accuracy.toString()))}% accuracy
                        </div>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No practice sessions yet. Start a curriculum to see your progress!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default UserStats;