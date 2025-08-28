import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AccessibilitySettings } from '@/components/ui/accessibility-settings';
import { FocusModeToggle } from '@/components/ui/focus-mode-toggle';
import { StatisticsDashboard } from '@/components/statistics/StatisticsDashboard';
import { LetterAnalyticsDashboard } from '@/components/analytics/LetterAnalyticsDashboard';
import { AdaptiveTrainingComponent } from '@/components/training/AdaptiveTrainingComponent';
import { useStatistics } from '@/hooks/useStatistics';
import { useCurriculums, useUserStatistics, useTypingSessions, useAuth, useUserAchievements } from '@/hooks/useDatabase';
import { EmulationToggle } from '@/components/ui/emulation-toggle';
import { Keyboard, LogOut, Plus, BarChart3, Trophy, Clock, Target, Brain, Zap, Award } from 'lucide-react';
import CurriculumList from './CurriculumList';
import UserStats from './UserStats';
import LayoutBuilder from './LayoutBuilder';

const Dashboard = () => {
  const { t } = useTranslation(['statistics', 'common', 'training']);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Database hooks for real data
  const { curriculums } = useCurriculums();
  const { statistics } = useUserStatistics(user?.id || '');
  const { sessions } = useTypingSessions(user?.id || '', { limit: 10 });

  const {
    loadLetterAnalytics,
    generateAdaptiveTraining,
    letterAnalytics,
    adaptiveTraining
  } = useStatistics();



  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      } else {
        // Fetch user profile
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
      } else {
        navigate('/auth');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Keyboard className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{t('common:ui.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Skip Links */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>

      <header
        id="navigation"
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Keyboard className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">{t('training:titles.keyboardTrainer')}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/statistics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('statistics:analytics.analytics')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('statistics:dashboard.welcome')}, {profile?.display_name || profile?.username || user.email}
            </span>
            <FocusModeToggle />
            <EmulationToggle variant="compact" layoutId="colemak" />
            <AccessibilitySettings />
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="container py-8"
        role="main"
        tabIndex={-1}
      >
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t('statistics:titles.dashboard')}</h1>
            <p className="text-muted-foreground">
              {t('statistics:dashboard.trackProgress', 'Track your progress and manage your typing curriculum')}
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('statistics:titles.overview')}</TabsTrigger>
              <TabsTrigger value="curriculums">{t('common:curriculum.curriculums')}</TabsTrigger>
              <TabsTrigger value="layouts">{t('common:layout.layoutBuilder')}</TabsTrigger>
              {/* Statistics moved to dedicated page - removed redundancy */}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats Overview - Essential metrics only */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('statistics:dashboard.todaysProgress')}</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics?.totalSessions || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('statistics:dashboard.sessionsToday', 'Sessions completed today')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('statistics:realtime.currentWpm')}</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(statistics?.averageWpm || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('statistics:realtime.averageWpm')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('statistics:metrics.accuracy')}</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(statistics?.averageAccuracy || 0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('statistics:realtime.currentAccuracy')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('statistics:dashboard.currentStreak')}</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics?.streakDays || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('statistics:dashboard.daysPracticing', 'Days practicing')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Available Curriculums
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{curriculums.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Training programs
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Best WPM
                    </CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(statistics?.bestWpm || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      Personal best
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Practice Time
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics?.totalPracticeTime ?
                        Math.round(statistics.totalPracticeTime / 3600) + 'h' : '0h'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total practice
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Best Accuracy
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.round(statistics?.bestAccuracy || 0)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Personal best
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Statistics Dashboard */}
              <StatisticsDashboard layoutId="colemak" />

              {/* Letter Analytics Dashboard */}
              <LetterAnalyticsDashboard
                sessions={sessions}
                className="mt-6"
              />

              {/* Adaptive Training */}
              <AdaptiveTrainingComponent
                userId={user?.id || ''}
                layoutId="colemak"
                sessions={sessions}
                className="mt-6"
              />

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('statistics:dashboard.quickActions', 'Quick Actions')}</CardTitle>
                    <CardDescription>
                      {t('statistics:dashboard.quickActionsDesc', 'Jump into practice or view detailed analytics')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" onClick={() => navigate('/trainer')}>
                      <Keyboard className="w-4 h-4 mr-2" />
                      {t('training:practice.continuePractice')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/statistics')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {t('statistics:analytics.analytics')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('common:layout.createLayout')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Keyboard Setup */}
                <EmulationToggle variant="keyboard-setup" layoutId="colemak" className="col-span-full" />

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest practice sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sessions.length > 0 ? (
                        sessions.slice(0, 3).map((session, index) => (
                          <div key={session.id} className="flex justify-between text-sm">
                            <span>
                              {session.curriculum?.name || 'Practice Session'} - Lesson {session.lesson_index + 1}
                            </span>
                            <span className="text-muted-foreground">{Math.round(parseFloat(session.wpm.toString()))} WPM</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No recent sessions. Start practicing to see your activity here!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="curriculums">
              <CurriculumList />
            </TabsContent>



            <TabsContent value="layouts">
              <LayoutBuilder />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;