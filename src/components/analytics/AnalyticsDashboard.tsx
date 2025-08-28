import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer } from '@/components/ui/animated-components';
import { WPMAccuracyTracker } from './WPMAccuracyTracker';
import { ProgressVisualization } from './ProgressVisualization';
import { MistakeAnalysis } from './MistakeAnalysis';
import { StatisticsDashboard } from '../statistics/StatisticsDashboard';
import { useAuth, useUserStatistics, useTypingSessions, useUserAchievements } from '@/hooks/useDatabase';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  Award,
  Calendar,
  Download,
  Share,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  layoutId?: string;
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ layoutId = "colemak", className }) => {
  const { t } = useTranslation(['statistics', 'common']);
  const { user } = useAuth();
  const { statistics } = useUserStatistics(user?.id || '');
  const { sessions } = useTypingSessions(user?.id || '', { limit: 10 });
  const { achievements } = useUserAchievements(user?.id || '');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {
    // Export functionality - would generate CSV/PDF of analytics data
    console.log('Exporting analytics data...');
    // Implementation would go here when needed
  };

  const handleShare = () => {
    // Share functionality - would create shareable analytics report
    console.log('Sharing analytics...');
    // Implementation would go here when needed
  };

  if (!user) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t('statistics:analytics.analytics')}</h3>
              <p className="text-muted-foreground">{t('common:auth.signInRequired')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('statistics:analytics.analytics')}</h1>
          <p className="text-muted-foreground">
            {t('statistics:analytics.comprehensiveAnalysis', 'Comprehensive analysis of your typing performance and progress')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShare}
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <AnimatedContainer animation="fade" delay={100}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics ? Math.round((statistics.averageWpm + statistics.averageAccuracy) / 2) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall typing performance
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+12%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consistency</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">78%</div>
              <p className="text-xs text-muted-foreground">
                Performance stability
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Areas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">3</div>
              <p className="text-xs text-muted-foreground">
                Keys need practice
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('statistics:titles.overview')}</TabsTrigger>
          <TabsTrigger value="performance">{t('statistics:realtime.performance')}</TabsTrigger>
          <TabsTrigger value="progress">{t('common:progress.progress')}</TabsTrigger>
          <TabsTrigger value="mistakes">{t('statistics:analytics.mistakeAnalysis')}</TabsTrigger>
          <TabsTrigger value="detailed">{t('statistics:titles.detailed')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnimatedContainer animation="slide-up" delay={200}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Quick Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Summary
                  </CardTitle>
                  <CardDescription>
                    Your typing performance at a glance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average WPM</span>
                      <Badge variant="outline">{Math.round(statistics?.averageWpm || 0)} WPM</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Accuracy</span>
                      <Badge variant="outline">{Math.round(statistics?.averageAccuracy || 0)}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Practice Time</span>
                      <Badge variant="outline">
                        {statistics?.totalPracticeTime ?
                          Math.round(statistics.totalPracticeTime / 3600 * 10) / 10 : 0} hours
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sessions Completed</span>
                      <Badge variant="outline">{statistics?.totalSessions || 0} sessions</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest typing sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions.length > 0 ? (
                      sessions.slice(0, 4).map((session) => {
                        const sessionDate = new Date(session.created_at);
                        const today = new Date();
                        const diffTime = Math.abs(today.getTime() - sessionDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        let dateLabel = '';
                        if (diffDays === 1) dateLabel = 'Today';
                        else if (diffDays === 2) dateLabel = 'Yesterday';
                        else dateLabel = `${diffDays - 1} days ago`;

                        const practiceMinutes = Math.round((session.practice_time || 0) / 60);

                        return (
                          <div key={session.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <div>
                              <div className="text-sm font-medium">{dateLabel}</div>
                              <div className="text-xs text-muted-foreground">{practiceMinutes} min practice</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{Math.round(parseFloat(session.wpm.toString()))} WPM</div>
                              <div className="text-xs text-muted-foreground">{Math.round(parseFloat(session.accuracy.toString()))}% accuracy</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No recent sessions. Start practicing to see your activity here!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimatedContainer>

          {/* Goals and Achievements */}
          <AnimatedContainer animation="slide-up" delay={400}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Goals & Achievements
                </CardTitle>
                <CardDescription>
                  Track your progress towards typing goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium">Active Goals</h4>
                    <div className="space-y-2">
                      {achievements.filter(a => !a.unlockedAt && a.progress > 0).slice(0, 3).map(achievement => (
                        <div key={achievement.id} className="flex justify-between items-center">
                          <span className="text-sm">{achievement.name}</span>
                          <Badge variant="outline">{achievement.progress}% complete</Badge>
                        </div>
                      ))}
                      {achievements.filter(a => !a.unlockedAt && a.progress > 0).length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          Start practicing to see your goals!
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Achievements</h4>
                    <div className="space-y-2">
                      {achievements.filter(a => a.unlockedAt).slice(0, 3).map(achievement => (
                        <div key={achievement.id} className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{achievement.name} - {achievement.description}</span>
                        </div>
                      ))}
                      {achievements.filter(a => a.unlockedAt).length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No achievements unlocked yet. Keep practicing!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <WPMAccuracyTracker />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <ProgressVisualization />
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-6">
          <MistakeAnalysis />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <StatisticsDashboard layoutId={layoutId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
