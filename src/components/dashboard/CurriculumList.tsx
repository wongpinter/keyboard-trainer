import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCurriculums, useUserProgress, useAuth } from '@/hooks/useDatabase';
import { Play, Users, Clock, Star, BookOpen } from 'lucide-react';

interface Curriculum {
  id: string;
  name: string;
  description: string;
  difficulty_level: number;
  estimated_hours: number;
  is_public: boolean;
  lessons: any[];
  keyboard_layout: {
    name: string;
  };
  progress?: {
    lesson_index: number;
    completed_lessons: number[];
    mastery_level: number;
    best_wpm: number;
    best_accuracy: number;
  };
}

const CurriculumList = () => {
  const { t } = useTranslation(['common', 'training']);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use database hooks instead of manual fetching
  const { curriculums, loading: curriculumsLoading } = useCurriculums({ filters: { is_public: true } });
  const { progress } = useUserProgress(user?.id || '');

  const loading = curriculumsLoading;

  // Combine curriculum data with progress
  const curriculumsWithProgress = curriculums.map(curriculum => {
    const userProgress = progress.find(p => p.curriculum_id === curriculum.id);
    return {
      ...curriculum,
      lessons: Array.isArray(curriculum.lessons) ? curriculum.lessons : [],
      progress: userProgress
    };
  });

  const startCurriculum = async (curriculumId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Use upsert to avoid duplicate key errors
      // The database has a unique constraint on (user_id, curriculum_id)
      // so we use upsert with ignoreDuplicates to handle race conditions
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.user.id,
          curriculum_id: curriculumId,
          lesson_index: 0,
          completed_lessons: [],
          current_lesson_attempts: 0,
          best_wpm: 0,
          best_accuracy: 0,
          total_practice_time: 0,
          mastery_level: 0
        }, {
          onConflict: 'user_id,curriculum_id',
          ignoreDuplicates: true
        });

      if (error) {
        // If it's a duplicate key error, it's not actually an error - the progress already exists
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.log('Progress already exists for this curriculum, continuing...');
        } else {
          throw error;
        }
      }

      // Navigate to trainer with curriculum
      navigate(`/trainer?curriculum=${curriculumId}`);
    } catch (error: any) {
      console.error('Error starting curriculum:', error);
      toast({
        title: "Error starting curriculum",
        description: error.message || "Failed to start curriculum. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return t('common:difficulty.beginner');
      case 2: return t('common:difficulty.easy');
      case 3: return t('common:difficulty.medium');
      case 4: return t('common:difficulty.hard');
      case 5: return t('common:difficulty.expert');
      default: return t('common:difficulty.unknown');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('common:curriculum.availableCurriculums')}</h2>
          <p className="text-muted-foreground">
            {t('common:curriculum.chooseCurriculum')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {curriculumsWithProgress.map((curriculum) => {
          const progressPercentage = curriculum.progress 
            ? (curriculum.progress.completed_lessons.length / curriculum.lessons.length) * 100
            : 0;

          return (
            <Card key={curriculum.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{curriculum.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {curriculum.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`${getDifficultyColor(curriculum.difficulty_level)} text-white`}
                  >
                    {getDifficultyLabel(curriculum.difficulty_level)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {curriculum.keyboard_layout.name}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {curriculum.estimated_hours}h
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('common:progress.progress')}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {t('common:curriculum.lessonsCompleted', {
                      completed: curriculum.progress?.completed_lessons.length || 0,
                      total: curriculum.lessons.length
                    })}
                  </div>
                </div>

                {curriculum.progress && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Best WPM</div>
                      <div className="font-semibold">{curriculum.progress.best_wpm}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Accuracy</div>
                      <div className="font-semibold">{curriculum.progress.best_accuracy}%</div>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => startCurriculum(curriculum.id)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {curriculum.progress ? t('common:buttons.continue') : t('common:buttons.start')} {t('training:practice.learning')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {curriculums.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No curriculums available</h3>
            <p className="text-muted-foreground text-center">
              Check back later or create your own curriculum in the Layout Builder
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurriculumList;