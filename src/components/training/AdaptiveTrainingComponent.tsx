import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedContainer, AnimatedButton } from '@/components/ui/animated-components';
import TypingArea from '@/components/TypingArea';
import { 
  AdaptiveTraining, 
  CustomExercise, 
  TypingSession 
} from '@/types/statistics';
import { adaptiveTrainingGenerator } from '@/utils/adaptiveTraining';
import { 
  Brain, 
  Target, 
  Clock, 
  Play, 
  RotateCcw, 
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdaptiveTrainingComponentProps {
  userId: string;
  layoutId: string;
  sessions: TypingSession[];
  onExerciseComplete?: (exercise: CustomExercise, stats: any) => void;
  className?: string;
}

export const AdaptiveTrainingComponent: React.FC<AdaptiveTrainingComponentProps> = ({
  userId,
  layoutId,
  sessions,
  onExerciseComplete,
  className
}) => {
  const [adaptiveTraining, setAdaptiveTraining] = useState<AdaptiveTraining | null>(null);
  const [currentExercise, setCurrentExercise] = useState<CustomExercise | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Generate adaptive training on component mount
  useEffect(() => {
    generateTraining();
  }, [userId, layoutId, sessions]);

  const generateTraining = async () => {
    setIsGenerating(true);
    try {
      const training = await adaptiveTrainingGenerator.generateAdaptiveTraining(
        userId,
        layoutId,
        sessions
      );
      setAdaptiveTraining(training);
      setExerciseIndex(0);
      setCurrentExercise(null);
      setCompletedExercises(new Set());
    } catch (error) {
      console.error('Error generating adaptive training:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startExercise = (exercise: CustomExercise) => {
    setCurrentExercise(exercise);
    setIsTraining(true);
  };

  const handleExerciseComplete = (stats: any) => {
    if (currentExercise) {
      setCompletedExercises(prev => new Set([...prev, currentExercise.id]));
      onExerciseComplete?.(currentExercise, stats);
      setIsTraining(false);
      setCurrentExercise(null);
    }
  };

  const nextExercise = () => {
    if (adaptiveTraining && exerciseIndex < adaptiveTraining.customExercises.length - 1) {
      setExerciseIndex(prev => prev + 1);
    }
  };

  const previousExercise = () => {
    if (exerciseIndex > 0) {
      setExerciseIndex(prev => prev - 1);
    }
  };

  const getExerciseTypeIcon = (type: string) => {
    switch (type) {
      case 'letter_drill': return <Target className="h-4 w-4" />;
      case 'word_practice': return <BookOpen className="h-4 w-4" />;
      case 'sentence_practice': return <Zap className="h-4 w-4" />;
      case 'pattern_practice': return <TrendingUp className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getExerciseTypeColor = (type: string) => {
    switch (type) {
      case 'letter_drill': return 'bg-blue-100 text-blue-800';
      case 'word_practice': return 'bg-green-100 text-green-800';
      case 'sentence_practice': return 'bg-purple-100 text-purple-800';
      case 'pattern_practice': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (isGenerating) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Analyzing your typing patterns...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!adaptiveTraining) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Unable to generate training. Please try again.</p>
            <Button onClick={generateTraining}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Regenerate Training
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isTraining && currentExercise) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getExerciseTypeIcon(currentExercise.type)}
                  {currentExercise.name}
                </CardTitle>
                <CardDescription>{currentExercise.description}</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsTraining(false)}
              >
                Exit Exercise
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Est. {currentExercise.estimatedTime} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>Target: {currentExercise.successCriteria.minAccuracy}% accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Min: {currentExercise.successCriteria.minWpm} WPM</span>
                </div>
              </div>

              <TypingArea
                text={currentExercise.content}
                layout={{ name: layoutId, keys: [] }} // Simplified for demo
                onComplete={handleExerciseComplete}
                onKeyPress={() => {}}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = completedExercises.size;
  const totalExercises = adaptiveTraining.customExercises.length;
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Training Overview */}
      <AnimatedContainer animation="fade" delay={200}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Adaptive Training Plan
            </CardTitle>
            <CardDescription>
              Personalized exercises based on your typing patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{adaptiveTraining.focusLetters.length}</div>
                <p className="text-sm text-muted-foreground">Focus Letters</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalExercises}</div>
                <p className="text-sm text-muted-foreground">Exercises</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{adaptiveTraining.estimatedPracticeTime}</div>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{completedCount} / {totalExercises}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={getPriorityColor(adaptiveTraining.priority)}>
                  {adaptiveTraining.priority} priority
                </Badge>
                <Badge variant="outline">
                  {adaptiveTraining.difficultyLevel}
                </Badge>
              </div>
              <Button onClick={generateTraining} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Focus Letters */}
      <AnimatedContainer animation="slide-up" delay={400}>
        <Card>
          <CardHeader>
            <CardTitle>Focus Letters</CardTitle>
            <CardDescription>
              Letters that need the most practice based on your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {adaptiveTraining.focusLetters.map(letter => (
                <Badge 
                  key={letter} 
                  variant="outline" 
                  className="text-lg font-mono px-3 py-1"
                >
                  {letter.toUpperCase()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Exercise List */}
      <AnimatedContainer animation="slide-up" delay={600}>
        <Card>
          <CardHeader>
            <CardTitle>Training Exercises</CardTitle>
            <CardDescription>
              Complete these exercises to improve your weak areas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adaptiveTraining.customExercises.map((exercise, index) => {
              const isCompleted = completedExercises.has(exercise.id);
              const isCurrent = index === exerciseIndex;
              
              return (
                <div
                  key={exercise.id}
                  className={cn(
                    'p-4 border rounded-lg transition-all',
                    isCurrent && 'ring-2 ring-primary',
                    isCompleted && 'bg-green-50 border-green-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      
                      <div>
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exercise.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{exercise.estimatedTime} min</span>
                        </div>
                        <div className="text-muted-foreground">
                          Difficulty: {exercise.difficulty}/10
                        </div>
                      </div>

                      <Badge className={getExerciseTypeColor(exercise.type)}>
                        {getExerciseTypeIcon(exercise.type)}
                        <span className="ml-1 capitalize">
                          {exercise.type.replace('_', ' ')}
                        </span>
                      </Badge>

                      <AnimatedButton
                        onClick={() => startExercise(exercise)}
                        disabled={isCompleted}
                        size="sm"
                        className="hover-lift"
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </>
                        )}
                      </AnimatedButton>
                    </div>
                  </div>

                  {exercise.targetLetters.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Target Letters:</p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.targetLetters.map(letter => (
                          <Badge key={letter} variant="outline" className="text-xs">
                            {letter.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </AnimatedContainer>
    </div>
  );
};
