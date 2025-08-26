import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedContainer, AnimatedProgressBar, AnimatedCounter } from '@/components/ui/animated-components';
import { useStatistics } from '@/hooks/useStatistics';
import { StatisticsPeriod } from '@/types/statistics';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BarChart3, 
  Calendar,
  Zap,
  CheckCircle,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsDashboardProps {
  layoutId: string;
  className?: string;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  layoutId,
  className
}) => {
  const {
    userProgress,
    achievements,
    performanceMetrics,
    learningInsights,
    loadUserProgress,
    loadPerformanceMetrics,
    loadLearningInsights,
    isLoading,
    error
  } = useStatistics();

  const [selectedPeriod, setSelectedPeriod] = useState<StatisticsPeriod>('week');

  // Load data on component mount
  useEffect(() => {
    loadUserProgress(layoutId);
    loadPerformanceMetrics(layoutId, selectedPeriod);
    loadLearningInsights(layoutId);
  }, [layoutId, selectedPeriod, loadUserProgress, loadPerformanceMetrics, loadLearningInsights]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading statistics: {error}</span>
        </div>
      </Card>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const inProgressAchievements = achievements.filter(a => !a.unlockedAt && a.progress > 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <AnimatedContainer animation="fade" delay={200}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Level</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={userProgress?.level || 0} />
              </div>
              <p className="text-xs text-muted-foreground">
                {userProgress?.experience || 0} XP
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average WPM</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={userProgress?.averageWpm || 0} />
              </div>
              <p className="text-xs text-muted-foreground">
                Best: {userProgress?.bestWpm || 0} WPM
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedCounter value={userProgress?.averageAccuracy || 0} suffix="%" />
              </div>
              <p className="text-xs text-muted-foreground">
                Best: {userProgress?.bestAccuracy || 0}%
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
                <AnimatedCounter 
                  value={Math.round((userProgress?.totalPracticeTime || 0) / 3600)} 
                  suffix="h" 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {userProgress?.totalSessions || 0} sessions
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      {/* Main Content Tabs */}
      <AnimatedContainer animation="slide-up" delay={400}>
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Overall Progress
                  </CardTitle>
                  <CardDescription>
                    Your journey to mastering {layoutId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress to next level</span>
                      <span>{learningInsights?.overallProgress || 0}%</span>
                    </div>
                    <AnimatedProgressBar 
                      value={learningInsights?.overallProgress || 0} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Current Streak</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔥</span>
                      <span className="text-lg font-bold">
                        {userProgress?.currentStreak || 0} days
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Longest streak: {userProgress?.longestStreak || 0} days
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Next Milestone */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Next Milestone
                  </CardTitle>
                  <CardDescription>
                    {learningInsights?.nextMilestone.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{learningInsights?.nextMilestone.progress || 0}%</span>
                    </div>
                    <AnimatedProgressBar 
                      value={learningInsights?.nextMilestone.progress || 0}
                      color="success"
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      {learningInsights?.nextMilestone.description}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Target: {learningInsights?.nextMilestone.targetWpm} WPM</span>
                      <span>Accuracy: {learningInsights?.nextMilestone.targetAccuracy}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Estimated time: {learningInsights?.nextMilestone.estimatedTime} hours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {learningInsights?.strengths.map((strength, index) => (
                      <Badge key={index} variant="secondary" className="mr-2">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {learningInsights?.weaknesses.map((weakness, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="flex gap-2 mb-4">
              {(['day', 'week', 'month', 'year'] as StatisticsPeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Your typing performance over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {performanceMetrics?.averageWpm || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Average WPM</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {performanceMetrics?.averageAccuracy || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Average Accuracy</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {performanceMetrics?.consistencyScore || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Consistency Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Unlocked Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Unlocked ({unlockedAchievements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unlockedAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* In Progress Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    In Progress ({inProgressAchievements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inProgressAchievements.map((achievement) => (
                    <div key={achievement.id} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl opacity-50">{achievement.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <AnimatedProgressBar 
                          value={achievement.progress} 
                          className="h-1"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
                <CardDescription>
                  Personalized recommendations to improve your typing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Learning Velocity</h4>
                    <div className="text-2xl font-bold">
                      {learningInsights?.learningVelocity || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Improvement rate per session
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Confidence Score</h4>
                    <div className="text-2xl font-bold">
                      {learningInsights?.confidenceScore || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on accuracy and consistency
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Estimated Time to Goal</h4>
                  <p className="text-lg">
                    {learningInsights?.estimatedTimeToGoal || 0} days to reach your next milestone
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedContainer>
    </div>
  );
};
