import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  MessageSquare, 
  Shuffle, 
  Star, 
  Clock, 
  Target,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { 
  TrainingLesson, 
  colemakCurriculum, 
  getLessonsByType, 
  getLessonsByDifficulty 
} from '@/data/colemakTraining';
import { cn } from '@/lib/utils';

interface LessonSelectorProps {
  currentLessonId?: string;
  onLessonSelect: (lesson: TrainingLesson) => void;
  userProgress?: Record<string, { completed: boolean; bestWpm: number; bestAccuracy: number }>;
  className?: string;
}

export const LessonSelector: React.FC<LessonSelectorProps> = ({
  currentLessonId,
  onLessonSelect,
  userProgress = {},
  className
}) => {
  const [selectedTab, setSelectedTab] = useState<'type' | 'difficulty'>('type');

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'words': return <BookOpen className="h-4 w-4" />;
      case 'sentences': return <MessageSquare className="h-4 w-4" />;
      case 'mixed': return <Shuffle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <Star className="h-4 w-4" />;
      case 'intermediate': return <Clock className="h-4 w-4" />;
      case 'advanced': return <Target className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const renderLessonCard = (lesson: TrainingLesson) => {
    const progress = userProgress[lesson.id];
    const isCompleted = progress?.completed || false;
    const isCurrent = currentLessonId === lesson.id;
    
    return (
      <Card 
        key={lesson.id}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isCurrent && "ring-2 ring-primary",
          isCompleted && "bg-green-50 dark:bg-green-950"
        )}
        onClick={() => onLessonSelect(lesson)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getLessonIcon(lesson.type)}
              <CardTitle className="text-lg">{lesson.name}</CardTitle>
              {isCompleted && <Trophy className="h-4 w-4 text-yellow-500" />}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={cn("text-white", getDifficultyColor(lesson.difficulty))}
              >
                {getDifficultyIcon(lesson.difficulty)}
                <span className="ml-1 capitalize">{lesson.difficulty}</span>
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <CardDescription>{lesson.description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {/* Lesson Requirements */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{lesson.minAccuracy}% accuracy</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{lesson.minWpm} WPM</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{lesson.content.length} items</span>
              </div>
            </div>

            {/* Focus Keys */}
            {lesson.focusKeys.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Focus Keys:</p>
                <div className="flex flex-wrap gap-1">
                  {lesson.focusKeys.slice(0, 10).map(key => (
                    <Badge key={key} variant="outline" className="text-xs px-1 py-0">
                      {key}
                    </Badge>
                  ))}
                  {lesson.focusKeys.length > 10 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{lesson.focusKeys.length - 10}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Progress */}
            {progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Best Performance</span>
                  <span>{progress.bestWpm} WPM • {progress.bestAccuracy}%</span>
                </div>
                <Progress 
                  value={Math.min(100, (progress.bestWpm / lesson.minWpm) * 100)} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Curriculum Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {colemakCurriculum.name}
          </CardTitle>
          <CardDescription>{colemakCurriculum.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{colemakCurriculum.lessons.length}</div>
              <div className="text-sm text-muted-foreground">Total Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(userProgress).filter(p => p.completed).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((Object.values(userProgress).filter(p => p.completed).length / colemakCurriculum.lessons.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Selection */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'type' | 'difficulty')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="type">By Type</TabsTrigger>
          <TabsTrigger value="difficulty">By Difficulty</TabsTrigger>
        </TabsList>

        <TabsContent value="type" className="space-y-6">
          {/* Words Lessons */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Word Practice
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getLessonsByType('words').map(renderLessonCard)}
            </div>
          </div>

          {/* Sentences Lessons */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sentence Practice
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getLessonsByType('sentences').map(renderLessonCard)}
            </div>
          </div>

          {/* Mixed Lessons */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              Mixed Practice
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getLessonsByType('mixed').map(renderLessonCard)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-6">
          {/* Beginner Lessons */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-green-500" />
              Beginner
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getLessonsByDifficulty('beginner').map(renderLessonCard)}
            </div>
          </div>

          {/* Intermediate Lessons */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Intermediate
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getLessonsByDifficulty('intermediate').map(renderLessonCard)}
            </div>
          </div>

          {/* Advanced Lessons */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Advanced
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getLessonsByDifficulty('advanced').map(renderLessonCard)}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LessonSelector;
