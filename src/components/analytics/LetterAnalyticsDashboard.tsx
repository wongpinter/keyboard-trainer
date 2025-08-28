import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedContainer, AnimatedProgressBar } from '@/components/ui/animated-components';
import { 
  LetterAnalytics, 
  FingerAnalytics, 
  LetterHeatmap, 
  ErrorPattern,
  TypingSession 
} from '@/types/statistics';
import { letterAnalyticsCalculator } from '@/utils/letterAnalytics';
import { 
  Target, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Hand,
  Keyboard,
  Zap,
  Eye,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LetterAnalyticsDashboardProps {
  sessions: TypingSession[];
  className?: string;
}

export const LetterAnalyticsDashboard: React.FC<LetterAnalyticsDashboardProps> = ({
  sessions,
  className
}) => {
  const { t } = useTranslation(['statistics', 'common']);
  const [letterAnalytics, setLetterAnalytics] = useState<LetterAnalytics[]>([]);
  const [fingerAnalytics, setFingerAnalytics] = useState<FingerAnalytics[]>([]);
  const [letterHeatmap, setLetterHeatmap] = useState<LetterHeatmap[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyzeData = async () => {
      setIsLoading(true);
      
      try {
        // Analyze letter performance
        const letters = letterAnalyticsCalculator.analyzeLetterPerformance(sessions);
        setLetterAnalytics(letters);

        // Analyze finger performance
        const fingers = letterAnalyticsCalculator.analyzeFingerPerformance(sessions, letters);
        setFingerAnalytics(fingers);

        // Generate heatmap
        const heatmap = letterAnalyticsCalculator.generateLetterHeatmap(letters);
        setLetterHeatmap(heatmap);

        // Analyze error patterns
        const allMistakes = sessions.flatMap(s => s.mistakes);
        const patterns = letterAnalyticsCalculator.analyzeErrorPatterns(allMistakes);
        setErrorPatterns(patterns);

      } catch (error) {
        console.error('Error analyzing letter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessions.length > 0) {
      analyzeData();
    }
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const problemLetters = letterAnalytics.filter(la => la.practiceRecommendation === 'high');
  const goodLetters = letterAnalytics.filter(la => la.accuracy >= 95);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <AnimatedContainer animation="fade" delay={200}>
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problem Letters</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {problemLetters.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Need focused practice
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mastered Letters</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {goodLetters.length}
              </div>
              <p className="text-xs text-muted-foreground">
                95%+ accuracy
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Patterns</CardTitle>
              <Brain className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {errorPatterns.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Identified patterns
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Letter Speed</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(letterAnalytics.reduce((sum, la) => sum + la.averageTime, 0) / letterAnalytics.length)}
                <span className="text-sm font-normal">ms</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Per keystroke
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      {/* Main Analytics Tabs */}
      <AnimatedContainer animation="slide-up" delay={400}>
        <Tabs defaultValue="letters" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="letters">{t('statistics:analytics.letters')}</TabsTrigger>
            <TabsTrigger value="fingers">{t('statistics:analytics.fingers')}</TabsTrigger>
            <TabsTrigger value="heatmap">{t('statistics:analytics.heatmap')}</TabsTrigger>
            <TabsTrigger value="patterns">{t('statistics:analytics.errorPatterns')}</TabsTrigger>
          </TabsList>

          {/* Letter Analytics Tab */}
          <TabsContent value="letters" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Problem Letters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Letters Needing Practice
                  </CardTitle>
                  <CardDescription>
                    Focus on these letters to improve your typing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {problemLetters.slice(0, 8).map((letter) => (
                    <div key={letter.letter} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-mono font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                            {letter.letter.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {letter.accuracy}% accuracy
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {letter.errorCount} errors in {letter.totalAttempts} attempts
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {letter.practiceRecommendation}
                        </Badge>
                      </div>
                      <AnimatedProgressBar 
                        value={letter.accuracy} 
                        max={100}
                        color="destructive"
                        size="sm"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Good Letters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Target className="h-5 w-5" />
                    Well-Mastered Letters
                  </CardTitle>
                  <CardDescription>
                    Letters you type accurately and quickly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goodLetters.slice(0, 8).map((letter) => (
                    <div key={letter.letter} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-mono font-bold bg-green-100 text-green-800 px-2 py-1 rounded">
                            {letter.letter.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {letter.accuracy}% accuracy
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {letter.averageTime}ms average
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Mastered
                        </Badge>
                      </div>
                      <AnimatedProgressBar 
                        value={letter.accuracy} 
                        max={100}
                        color="success"
                        size="sm"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* All Letters Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Letter Performance</CardTitle>
                <CardDescription>
                  Detailed breakdown of all letter statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-6 lg:grid-cols-8">
                  {letterAnalytics.map((letter) => (
                    <div
                      key={letter.letter}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all hover:scale-105',
                        letter.practiceRecommendation === 'high' && 'bg-red-50 border-red-200',
                        letter.practiceRecommendation === 'medium' && 'bg-yellow-50 border-yellow-200',
                        letter.practiceRecommendation === 'low' && 'bg-green-50 border-green-200'
                      )}
                    >
                      <div className="text-lg font-mono font-bold">
                        {letter.letter.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {letter.accuracy}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {letter.averageTime}ms
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finger Analytics Tab */}
          <TabsContent value="fingers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {fingerAnalytics.map((finger) => (
                <Card key={finger.finger} className="hover-lift">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hand className="h-5 w-5" />
                      {finger.fingerName}
                    </CardTitle>
                    <CardDescription>
                      {finger.hand} hand • {finger.assignedKeys.length} keys assigned
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Accuracy</p>
                        <div className="text-2xl font-bold">
                          {finger.averageAccuracy}%
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Avg Speed</p>
                        <div className="text-2xl font-bold">
                          {finger.averageSpeed}ms
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Performance</p>
                      <AnimatedProgressBar 
                        value={finger.averageAccuracy} 
                        max={100}
                        color={finger.averageAccuracy >= 90 ? 'success' : finger.averageAccuracy >= 80 ? 'warning' : 'destructive'}
                        size="sm"
                      />
                    </div>

                    {finger.weakestKeys.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t('statistics:analytics.weakestKeys')}</p>
                        <div className="flex flex-wrap gap-1">
                          {finger.weakestKeys.map(key => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {finger.strongestKeys.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t('statistics:analytics.strongestKeys')}</p>
                        <div className="flex flex-wrap gap-1">
                          {finger.strongestKeys.map(key => (
                            <Badge key={key} variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {key.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Keyboard Performance Heatmap
                </CardTitle>
                <CardDescription>
                  Visual representation of your typing performance by key
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Good Performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span>Moderate Issues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span>Needs Attention</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Significant Practice Needed</span>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-10">
                    {letterHeatmap.map((heatmapData) => (
                      <div
                        key={heatmapData.letter}
                        className="aspect-square flex items-center justify-center rounded-lg text-white font-mono font-bold text-lg transition-all hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: heatmapData.color }}
                        title={`${heatmapData.letter.toUpperCase()}: ${Math.round((1 - heatmapData.errorIntensity) * 100)}% performance`}
                      >
                        {heatmapData.letter.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Common Error Patterns
                </CardTitle>
                <CardDescription>
                  Identify and address recurring typing mistakes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorPatterns.map((pattern) => (
                  <div key={pattern.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{pattern.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pattern.type} • {pattern.frequency} occurrences
                        </p>
                      </div>
                      <Badge 
                        variant={pattern.difficulty === 'advanced' ? 'destructive' : pattern.difficulty === 'intermediate' ? 'default' : 'secondary'}
                      >
                        {pattern.difficulty}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Affected Letters</p>
                      <div className="flex flex-wrap gap-1">
                        {pattern.affectedLetters.map(letter => (
                          <Badge key={letter} variant="outline" className="text-xs">
                            {letter.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Suggested Exercises</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {pattern.suggestedExercises.map((exercise, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            {exercise}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedContainer>
    </div>
  );
};
