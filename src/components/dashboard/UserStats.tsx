import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [stats, setStats] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserStats();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      // Fetch recent typing sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('typing_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;

      // Fetch user progress summary
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      setSessions(sessionsData || []);

      // Calculate summary statistics
      if (sessionsData && sessionsData.length > 0) {
        const summary: ProgressSummary = {
          total_sessions: sessionsData.length,
          total_practice_time: sessionsData.reduce((sum, session) => sum + session.practice_time, 0),
          best_wpm: Math.max(...sessionsData.map(s => s.wpm)),
          average_wpm: sessionsData.reduce((sum, session) => sum + session.wpm, 0) / sessionsData.length,
          best_accuracy: Math.max(...sessionsData.map(s => s.accuracy)),
          average_accuracy: sessionsData.reduce((sum, session) => sum + session.accuracy, 0) / sessionsData.length,
          active_curriculums: progressData?.length || 0,
          completed_lessons: progressData?.reduce((sum, progress) => sum + progress.completed_lessons.length, 0) || 0
        };
        setStats(summary);
      } else {
        setStats({
          total_sessions: 0,
          total_practice_time: 0,
          best_wpm: 0,
          average_wpm: 0,
          best_accuracy: 0,
          average_accuracy: 0,
          active_curriculums: progressData?.length || 0,
          completed_lessons: 0
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading statistics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
                        <div className={`text-sm font-medium ${getPerformanceColor(session.wpm)}`}>
                          {Math.round(session.wpm)} WPM
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(session.accuracy)}% accuracy
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