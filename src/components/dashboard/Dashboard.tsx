import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Keyboard, LogOut, Plus, BarChart3, Trophy, Clock, Target, Brain, Zap } from 'lucide-react';
import CurriculumList from './CurriculumList';
import UserStats from './UserStats';
import LayoutBuilder from './LayoutBuilder';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    loadLetterAnalytics,
    generateAdaptiveTraining,
    letterAnalytics,
    adaptiveTraining
  } = useStatistics();

  // Mock sessions for demonstration
  const mockSessions = [
    {
      id: 'mock-session-1',
      userId: user?.id || 'mock-user',
      layoutId: 'colemak',
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() - 86400000 + 300000),
      duration: 300,
      textLength: 100,
      wpm: 25,
      accuracy: 88,
      correctCharacters: 88,
      incorrectCharacters: 12,
      totalCharacters: 100,
      errorRate: 12,
      consistency: 75,
      keystrokes: [
        { key: 'a', timestamp: 1000, isCorrect: true, timeSinceLastKey: 200, expectedKey: 'a', finger: 3 },
        { key: 's', timestamp: 1200, isCorrect: true, timeSinceLastKey: 200, expectedKey: 's', finger: 2 },
        { key: 'd', timestamp: 1400, isCorrect: false, timeSinceLastKey: 200, expectedKey: 'f', finger: 1 },
      ],
      mistakes: [
        { expectedKey: 'f', actualKey: 'd', position: 2, timestamp: 1400, finger: 1, frequency: 1 }
      ],
      createdAt: new Date(Date.now() - 86400000)
    }
  ];

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
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
              <span className="text-xl font-bold">Keyboard Trainer</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.display_name || profile?.username || user.email}
            </span>
            <FocusModeToggle />
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
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your progress and manage your typing curriculum
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculums">Curriculums</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="layouts">Layout Builder</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Curriculums
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">
                      +1 from last week
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
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">
                      +5 from last session
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
                    <div className="text-2xl font-bold">12h</div>
                    <p className="text-xs text-muted-foreground">
                      This week
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Accuracy
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground">
                      Average this week
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Statistics Dashboard */}
              <StatisticsDashboard layoutId="colemak" />

              {/* Letter Analytics Dashboard */}
              <LetterAnalyticsDashboard
                sessions={mockSessions}
                className="mt-6"
              />

              {/* Adaptive Training */}
              <AdaptiveTrainingComponent
                userId={user?.id || 'mock-user'}
                layoutId="colemak"
                sessions={mockSessions}
                className="mt-6"
              />

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Jump into practice or manage your layouts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" onClick={() => navigate('/trainer')}>
                      <Keyboard className="w-4 h-4 mr-2" />
                      Continue Practice
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Layout
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest practice sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Colemak Basics - Lesson 3</span>
                        <span className="text-muted-foreground">42 WPM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Home Row Practice</span>
                        <span className="text-muted-foreground">38 WPM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Punctuation Training</span>
                        <span className="text-muted-foreground">35 WPM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="curriculums">
              <CurriculumList />
            </TabsContent>

            <TabsContent value="statistics">
              <UserStats userId={user.id} />
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