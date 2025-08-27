import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Keyboard, User, Mail, Lock } from 'lucide-react';
// import { handleAuthError, handleValidationError } from '@/utils/errorHandler';
// import { ValidationError } from '@/types/errors';

const AuthPage = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const validateSignUpForm = (): boolean => {
    // Temporarily simplified validation
    if (!email.trim()) {
      toast({
        title: t('auth:validation.required'),
        description: t('auth:errors.emailRequired'),
        variant: "destructive",
      });
      return false;
    }

    if (!username.trim()) {
      toast({
        title: t('auth:validation.required'),
        description: t('auth:errors.usernameRequired'),
        variant: "destructive",
      });
      return false;
    }

    if (!password.trim()) {
      toast({
        title: t('auth:validation.required'),
        description: t('auth:errors.passwordRequired'),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignUpForm()) {
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            full_name: username,
          }
        }
      });

      if (error) {
        toast({
          title: t('auth:errors.signUpFailed'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth:messages.checkEmail'),
          description: t('auth:messages.confirmationSent'),
        });
      }
    } catch (error) {
      toast({
        title: t('common:status.error'),
        description: t('auth:errors.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSignInForm = (): boolean => {
    // Simplified validation
    if (!email.trim()) {
      toast({
        title: t('auth:validation.required'),
        description: t('auth:errors.emailRequired'),
        variant: "destructive",
      });
      return false;
    }

    if (!password.trim()) {
      toast({
        title: t('auth:validation.required'),
        description: t('auth:errors.passwordRequired'),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignInForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: t('auth:errors.signInFailed'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: t('common:status.error'),
        description: t('auth:errors.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Language Switcher in top-right corner */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Keyboard className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('training:titles.keyboardTrainer')}</CardTitle>
          <CardDescription>
            {t('auth:messages.joinThousands')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth:titles.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth:titles.signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth:labels.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder={t('auth:placeholders.enterEmail')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth:labels.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder={t('auth:placeholders.enterPassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('common:status.loading') : t('auth:buttons.signIn')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">{t('auth:labels.username')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder={t('auth:placeholders.chooseUsername')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth:labels.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t('auth:placeholders.enterEmail')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth:labels.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder={t('auth:placeholders.confirmPassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('common:status.loading') : t('auth:buttons.createAccount')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;