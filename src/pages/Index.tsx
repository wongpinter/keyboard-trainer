import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AccessibilitySettings } from '@/components/ui/accessibility-settings';
import { Keyboard, ArrowRight, Star, Users, BookOpen, Zap } from 'lucide-react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Keyboard className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
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
          <div className="flex items-center space-x-2">
            <Keyboard className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Keyboard Trainer</span>
          </div>
          <div className="flex items-center space-x-4">
            <AccessibilitySettings />
            <ThemeToggle />
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="container py-16"
        role="main"
        tabIndex={-1}
      >
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              Professional Typing Training
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Master Alternative
              <span className="text-primary"> Keyboard Layouts</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn Colemak, Dvorak, and custom layouts with structured curriculums, 
              progress tracking, and personalized statistics.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Button size="lg" onClick={() => navigate('/dashboard')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/trainer')}>
                  Quick Practice
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate('/auth')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/trainer')}>
                  Try Demo
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card className="text-center">
            <CardHeader>
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Structured Curriculums</CardTitle>
              <CardDescription>
                Follow proven learning paths designed by experts to master new layouts efficiently
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Monitor your WPM, accuracy, and mastery level with detailed statistics and insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Custom Layouts</CardTitle>
              <CardDescription>
                Create and share your own keyboard layouts with the community
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Ready to Transform Your Typing?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who have improved their typing speed and comfort 
              with alternative keyboard layouts.
            </p>
          </div>
          
          {!isAuthenticated && (
            <Button size="lg" onClick={() => navigate('/auth')}>
              Create Free Account
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
