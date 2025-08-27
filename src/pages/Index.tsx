import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AccessibilitySettings } from '@/components/ui/accessibility-settings';
import { FocusModeToggle } from '@/components/ui/focus-mode-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { AnimatedContainer, AnimatedButton } from '@/components/ui/animated-components';
import { Keyboard, ArrowRight, Star, Users, BookOpen, Zap } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation(['common', 'training']);
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        {t('common:navigation.skipToMain', 'Skip to main content')}
      </a>
      <a href="#navigation" className="skip-link">
        {t('common:navigation.skipToNavigation', 'Skip to navigation')}
      </a>

      <header
        id="navigation"
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">{t('training:titles.keyboardTrainer')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <FocusModeToggle />
            <AccessibilitySettings />
            <ThemeToggle />
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>
                {t('common:buttons.goToDashboard')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  {t('common:buttons.signin')}
                </Button>
                <Button onClick={() => navigate('/auth')}>
                  {t('common:buttons.getStarted')}
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
          <AnimatedContainer animation="fade" delay={200}>
            <div className="space-y-4">
              <AnimatedContainer animation="slide-up" delay={400}>
                <Badge variant="secondary" className="mb-4 hover-lift">
                  <Star className="w-3 h-3 mr-1" />
                  {t('training:titles.training', 'Professional Typing Training')}
                </Badge>
              </AnimatedContainer>

              <AnimatedContainer animation="slide-up" delay={600}>
                <h1 className="hero-title text-4xl md:text-6xl font-bold tracking-tight text-balance">
                  {t('common:hero.masterAlternative', 'Master Alternative')}
                  <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"> {t('common:hero.keyboardLayouts', 'Keyboard Layouts')}</span>
                </h1>
              </AnimatedContainer>

              <AnimatedContainer animation="slide-up" delay={800}>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  {t('common:hero.description', 'Learn Colemak, Dvorak, and custom layouts with structured curriculums, progress tracking, and personalized statistics.')}
                </p>
              </AnimatedContainer>
            </div>
          </AnimatedContainer>
          
          <AnimatedContainer animation="slide-up" delay={1000}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <AnimatedButton size="lg" onClick={() => navigate('/dashboard')} className="hover-lift">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {t('common:hero.continuelearning')}
                  </AnimatedButton>
                  <AnimatedButton size="lg" variant="outline" onClick={() => navigate('/trainer')} className="hover-lift">
                    {t('common:hero.quickPractice')}
                  </AnimatedButton>
                </>
              ) : (
                <>
                  <AnimatedButton size="lg" onClick={() => navigate('/auth')} className="hover-lift">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {t('common:hero.startLearning')}
                  </AnimatedButton>
                  <AnimatedButton size="lg" variant="outline" onClick={() => navigate('/trainer')} className="hover-lift">
                    {t('common:hero.tryDemo')}
                  </AnimatedButton>
                </>
              )}
            </div>
          </AnimatedContainer>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card className="text-center">
            <CardHeader>
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="feature-title">{t('common:features.structuredCurriculums')}</CardTitle>
              <CardDescription className="card-description">
                {t('common:features.structuredDescription')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="feature-title">{t('common:features.progressTracking')}</CardTitle>
              <CardDescription className="card-description">
                {t('common:features.progressDescription')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className="feature-title">{t('common:features.customLayouts')}</CardTitle>
              <CardDescription className="card-description">
                {t('common:features.customDescription')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">{t('common:hero.readyToTransform')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('common:hero.joinThousands')}
            </p>
          </div>

          {!isAuthenticated && (
            <Button size="lg" onClick={() => navigate('/auth')}>
              {t('common:hero.createFreeAccount')}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
