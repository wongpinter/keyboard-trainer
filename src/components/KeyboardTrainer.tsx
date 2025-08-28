import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { COLEMAK_LAYOUT } from '@/types/keyboard';
import { useKeyboardTraining } from '@/hooks/useKeyboardTraining';
import { useAuth } from '@/hooks/useDatabase';
import KeyboardVisualization from './KeyboardVisualization';
import TypingArea from './TypingArea';
import ProgressTracker from './ProgressTracker';
import { RealTimeStats } from './statistics/RealTimeStats';
import { FocusModeToggle } from './ui/focus-mode-toggle';
import { LessonSelector } from './training/LessonSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, SkipForward, List, User, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { useEmulation } from '@/contexts/EmulationContext';
import { EmulationToggle } from '@/components/ui/emulation-toggle';

const KeyboardTrainer = () => {
  const { t } = useTranslation(['training', 'common']);
  const [showFingerGuide, setShowFingerGuide] = useState(true);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isFocusMode } = useFocusMode();
  const { isLayoutEmulationEnabled } = useEmulation();

  // Get current layout ID (could be dynamic based on selected curriculum)
  const currentLayoutId = 'colemak'; // This could come from props or state
  const isEmulationEnabled = isLayoutEmulationEnabled(currentLayoutId);

  const {
    session,
    progress,
    currentLessonProgress,
    overallProgress,
    startLesson,
    restartLesson,
    handleKeyPress,
    updateStats,
    completeLesson,
    availableLessons,
    selectLesson,
    updateLessonProgress,
    generateNewPracticeText,
    colemakLessons,
    curriculumsLoading,
    mainCurriculum
  } = useKeyboardTraining(COLEMAK_LAYOUT);

  // Show loading state
  if (authLoading || curriculumsLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('training:interface.loadingTrainingSystem')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication prompt for guest users
  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Card className="p-8 text-center max-w-md">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-4">{t('training:interface.signInToStartTraining')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('training:interface.signInToTrackProgress')}
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                {t('common:buttons.signin')}
              </Button>
              <Alert className="mt-4">
                <AlertDescription>
                  {t('training:interface.progressWillBeSaved')}
                </AlertDescription>
              </Alert>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleLessonComplete = () => {
    completeLesson();
    toast({
      title: t('training:interface.lessonComplete'),
      description: t('training:interface.greatJobStats', {
        wpm: session.stats.wpm,
        accuracy: session.stats.accuracy
      }),
    });
  };

  const currentKeys = session.activeKeys.join('').toUpperCase();
  const lessonName = session.selectedLesson ? session.selectedLesson.name : t('training:interface.stage', { number: session.currentLesson + 1 });
  const lessonDescription = session.selectedLesson ? session.selectedLesson.description : 'Progressive keyboard training';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div></div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Keyboard Layout Trainer
              </h1>
              <p className="text-muted-foreground">
                Master alternative keyboard layouts through progressive training
              </p>
            </div>
            <FocusModeToggle />
          </div>
        </header>

        {/* Lesson Info */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{lessonName}</h2>
              <p className="text-muted-foreground mb-2">{lessonDescription}</p>
              <p className="text-muted-foreground">
                {t('training:interface.learningKeys')} <Badge variant="secondary">{currentKeys}</Badge>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={restartLesson}
                disabled={session.stats.totalCharacters === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('training:interface.restart')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFingerGuide(!showFingerGuide)}
              >
                {showFingerGuide ? t('training:interface.hideFingerGuide') : t('training:interface.showFingerGuide')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLessonSelector(!showLessonSelector)}
              >
                <List className="w-4 h-4 mr-2" />
                {showLessonSelector ? t('common:buttons.hide') : t('common:buttons.show')} {t('training:titles.lessons')}
              </Button>
              {session.currentLesson < availableLessons - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startLesson(session.currentLesson + 1)}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  {t('training:lessons.nextLesson')}
                </Button>
              )}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Real-time Statistics */}
        <RealTimeStats className="mb-6" />

        {/* Lesson Selector */}
        {showLessonSelector && (
          <LessonSelector
            currentLessonId={session.selectedLesson?.id}
            onLessonSelect={(lesson) => {
              selectLesson(lesson);
              setShowLessonSelector(false);
              toast({
                title: "Lesson Selected",
                description: `Now practicing: ${lesson.name}`,
              });
            }}
            userProgress={session.lessonProgress}
            className="mb-6"
          />
        )}

        {/* Main Training Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Typing + Keyboard */}
          <div className="lg:col-span-3 space-y-4">
            {/* Typing Area */}
            <TypingArea
              text={session.practiceText}
              layout={COLEMAK_LAYOUT}
              layoutId={currentLayoutId}
              onStatsUpdate={updateStats}
              onKeyPress={handleKeyPress}
              onComplete={handleLessonComplete}
            />
            
            {/* Keyboard Visualization - Only show in emulation mode */}
            {isEmulationEnabled && (
              <KeyboardVisualization
                layout={COLEMAK_LAYOUT}
                keyStates={session.keyStates}
                showFingerGuide={showFingerGuide}
              />
            )}
          </div>

          {/* Right: Progress Stats */}
          <div>
            <ProgressTracker
              stats={session.stats}
              targetWpm={session.selectedLesson?.minWpm || 30}
              targetAccuracy={session.selectedLesson?.minAccuracy || 95}
              lessonProgress={currentLessonProgress?.mastery_level || 0}
            />
          </div>
        </div>

        {/* Lesson Selection */}
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold mb-3">Available Lessons</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {COLEMAK_LAYOUT.learningOrder.map((keys, index) => {
              // Check if this lesson index is in the completed_lessons array
              const curriculumProgress = progress.find(p => p.curriculum_id === session.selectedCurriculum?.id);
              const isCompleted = curriculumProgress?.completed_lessons?.includes(index) || false;
              const isActive = index === session.currentLesson;
              
              return (
                <Button
                  key={index}
                  variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => startLesson(index)}
                  className="text-xs"
                >
                  <div className="text-center">
                    <div>{t('training:interface.stage', { number: index + 1 })}</div>
                    <div className="text-xs opacity-75">
                      {keys.join('').toUpperCase()}
                    </div>
                    {curriculumProgress && isCompleted && (
                      <div className="text-xs">
                        {Math.round(curriculumProgress.mastery_level || 0)}%
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Floating Emulation Toggle */}
      <EmulationToggle variant="floating" layoutId={currentLayoutId} />
    </div>
  );
};

export default KeyboardTrainer;