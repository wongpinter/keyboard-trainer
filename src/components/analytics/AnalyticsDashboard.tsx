import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer } from '@/components/ui/animated-components';
import { WPMAccuracyTracker } from './WPMAccuracyTracker';
import { ProgressVisualization } from './ProgressVisualization';
import { MistakeAnalysis } from './MistakeAnalysis';
import { StatisticsDashboard } from '../statistics/StatisticsDashboard';
import { useAuth } from '@/hooks/useDatabase';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  Award,
  Calendar,
  Download,
  Share,
  Settings,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement data export functionality
    console.log('Exporting analytics data...');
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing analytics...');
  };

  if (!user) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">Please sign in to view your typing analytics</p>
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
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of your typing performance and progress
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
              <div className="text-2xl font-bold text-yellow-600">85</div>
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnimatedContainer animation="slideUp" delay={200}>
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
                      <Badge variant="outline">42 WPM</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Accuracy</span>
                      <Badge variant="outline">94.2%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Practice Time</span>
                      <Badge variant="outline">12.5 hours</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sessions Completed</span>
                      <Badge variant="outline">47 sessions</Badge>
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
                    {[
                      { date: 'Today', wpm: 45, accuracy: 96, time: '15 min' },
                      { date: 'Yesterday', wpm: 42, accuracy: 94, time: '20 min' },
                      { date: '2 days ago', wpm: 38, accuracy: 92, time: '12 min' },
                      { date: '3 days ago', wpm: 41, accuracy: 95, time: '18 min' }
                    ].map((session, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <div className="text-sm font-medium">{session.date}</div>
                          <div className="text-xs text-muted-foreground">{session.time} practice</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{session.wpm} WPM</div>
                          <div className="text-xs text-muted-foreground">{session.accuracy}% accuracy</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimatedContainer>

          {/* Goals and Achievements */}
          <AnimatedContainer animation="slideUp" delay={400}>
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
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Reach 50 WPM</span>
                        <Badge variant="outline">84% complete</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">95% Accuracy</span>
                        <Badge variant="outline">99% complete</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">30 Day Streak</span>
                        <Badge variant="outline">67% complete</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Achievements</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Speed Demon - 40+ WPM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Accuracy Master - 90%+</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Consistent Typer - 7 day streak</span>
                      </div>
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
          <StatisticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
