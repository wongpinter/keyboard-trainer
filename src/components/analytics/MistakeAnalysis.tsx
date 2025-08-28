import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedContainer, AnimatedProgressBar } from '@/components/ui/animated-components';
import { useTypingSessions, useAuth } from '@/hooks/useDatabase';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Target, 
  TrendingDown,
  Zap,
  Eye,
  Hand,
  Finger,
  Brain,
  RefreshCw,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MistakeAnalysisProps {
  className?: string;
}

interface MistakePattern {
  id: string;
  expected_key: string;
  actual_key: string;
  frequency: number;
  mistake_type: string;
  finger_confusion: boolean;
  hand_confusion: boolean;
  last_occurred_at: string;
}

interface LetterDifficulty {
  letter: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_percentage: number;
  average_time_ms: number;
  difficulty_score: number;
  finger_number: number;
  hand: string;
}

export const MistakeAnalysis: React.FC<MistakeAnalysisProps> = ({ className }) => {
  const { user } = useAuth();
  const [mistakePatterns, setMistakePatterns] = useState<MistakePattern[]>([]);
  const [letterDifficulties, setLetterDifficulties] = useState<LetterDifficulty[]>([]);
  const [loading, setLoading] = useState(true);

  const { sessions, loading: sessionsLoading } = useTypingSessions(user?.id || '', { 
    limit: 50,
    orderBy: 'created_at',
    ascending: false
  });

  // Fetch mistake patterns from database
  useEffect(() => {
    if (!user?.id) return;

    const fetchMistakePatterns = async () => {
      try {
        const { data, error } = await supabase
          .from('mistake_patterns')
          .select('*')
          .eq('user_id', user.id)
          .order('frequency', { ascending: false })
          .limit(20);

        if (error) throw error;
        setMistakePatterns(data || []);
      } catch (error) {
        console.error('Error fetching mistake patterns:', error);
      }
    };

    fetchMistakePatterns();
  }, [user?.id]);

  // Fetch letter difficulties from database
  useEffect(() => {
    if (!user?.id) return;

    const fetchLetterDifficulties = async () => {
      try {
        const { data, error } = await supabase
          .from('letter_statistics')
          .select('*')
          .eq('user_id', user.id)
          .order('difficulty_score', { ascending: false })
          .limit(26); // All letters

        if (error) throw error;
        setLetterDifficulties(data || []);
      } catch (error) {
        console.error('Error fetching letter difficulties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLetterDifficulties();
  }, [user?.id]);

  // Analyze current sessions for patterns (this would normally be done server-side)
  const analyzeSessionMistakes = async () => {
    if (!user?.id || !sessions.length) return;

    // Get real mistake patterns from database
    const { data: mistakePatterns, error } = await supabase
      .from('mistake_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('frequency', { ascending: false })
      .limit(10);

    if (error || !mistakePatterns) {
      console.error('Error fetching mistake patterns:', error);
      return;
    }

    // Use the real mistake patterns from database
    setMistakePatterns(mistakePatterns);
  };

  // Get mistake type icon
  const getMistakeTypeIcon = (type: string) => {
    switch (type) {
      case 'substitution': return <ArrowRight className="h-4 w-4" />;
      case 'insertion': return <Zap className="h-4 w-4" />;
      case 'deletion': return <X className="h-4 w-4" />;
      case 'transposition': return <RefreshCw className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (score: number) => {
    if (score > 80) return 'text-red-600 bg-red-50';
    if (score > 60) return 'text-orange-600 bg-orange-50';
    if (score > 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  // Get finger name
  const getFingerName = (fingerNumber: number) => {
    const fingers = ['Left Pinky', 'Left Ring', 'Left Middle', 'Left Index', 'Left Thumb',
                    'Right Thumb', 'Right Index', 'Right Middle', 'Right Ring', 'Right Pinky'];
    return fingers[fingerNumber] || 'Unknown';
  };

  if (loading || sessionsLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing mistake patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Mistake Analysis</h2>
          <p className="text-muted-foreground">Identify and improve your typing weaknesses</p>
        </div>
        
        <Button onClick={analyzeSessionMistakes} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Analyze Recent Sessions
        </Button>
      </div>

      {/* Overview Cards */}
      <AnimatedContainer animation="fade" delay={200}>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Common Mistakes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {mistakePatterns.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Patterns identified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finger Confusion</CardTitle>
              <Hand className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mistakePatterns.filter(m => m.finger_confusion).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Same finger errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hand Confusion</CardTitle>
              <Finger className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {mistakePatterns.filter(m => m.hand_confusion).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Wrong hand errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Difficult Letters</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {letterDifficulties.filter(l => l.accuracy_percentage < 85).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Below 85% accuracy
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      {/* Analysis Tabs */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Mistake Patterns</TabsTrigger>
          <TabsTrigger value="letters">Letter Difficulties</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Most Common Mistakes
              </CardTitle>
              <CardDescription>
                Keys you frequently mistype and their patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mistakePatterns.slice(0, 10).map((pattern, index) => (
                  <div key={pattern.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                          {pattern.expected_key.toUpperCase()}
                        </span>
                        {getMistakeTypeIcon(pattern.mistake_type)}
                        <span className="text-lg font-mono font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {pattern.actual_key.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        {pattern.finger_confusion && (
                          <Badge variant="outline" className="text-orange-600">
                            <Hand className="h-3 w-3 mr-1" />
                            Finger
                          </Badge>
                        )}
                        {pattern.hand_confusion && (
                          <Badge variant="outline" className="text-yellow-600">
                            <Finger className="h-3 w-3 mr-1" />
                            Hand
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{pattern.frequency} times</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(pattern.last_occurred_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {mistakePatterns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No mistake patterns detected yet.</p>
                    <p className="text-sm">Complete more typing sessions to see analysis.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="letters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Letter Difficulty Analysis
              </CardTitle>
              <CardDescription>
                Individual letter performance and difficulty scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {letterDifficulties.map((letter, index) => (
                  <div key={letter.letter} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-lg font-mono font-bold px-3 py-2 rounded",
                        getDifficultyColor(letter.difficulty_score)
                      )}>
                        {letter.letter.toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm font-medium">
                          {letter.accuracy_percentage.toFixed(1)}% accuracy
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getFingerName(letter.finger_number)} • {letter.average_time_ms}ms avg
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Difficulty: {letter.difficulty_score.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {letter.total_attempts} attempts
                      </div>
                    </div>
                  </div>
                ))}
                
                {letterDifficulties.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No letter analysis available yet.</p>
                    <p className="text-sm">Complete more typing sessions to see detailed analysis.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Improvement Recommendations
              </CardTitle>
              <CardDescription>
                Personalized suggestions based on your mistake patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mistakePatterns.slice(0, 5).map((pattern, index) => (
                  <div key={pattern.id} className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900">
                          Practice {pattern.expected_key.toUpperCase()} vs {pattern.actual_key.toUpperCase()}
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You've confused these keys {pattern.frequency} times. 
                          {pattern.finger_confusion && " This appears to be a finger positioning issue."}
                          {pattern.hand_confusion && " This appears to be a hand coordination issue."}
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-blue-600">
                            Focus on {pattern.mistake_type} errors
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {mistakePatterns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No specific recommendations yet.</p>
                    <p className="text-sm">Complete more typing sessions to get personalized advice.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
