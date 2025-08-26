import { useState } from 'react';
import { COLEMAK_LAYOUT } from '@/types/keyboard';
import { useKeyboardTraining } from '@/hooks/useKeyboardTraining';
import KeyboardVisualization from './KeyboardVisualization';
import TypingArea from './TypingArea';
import ProgressTracker from './ProgressTracker';
import { RealTimeStats } from './statistics/RealTimeStats';
import { FocusModeToggle } from './ui/focus-mode-toggle';
import { LessonSelector } from './training/LessonSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, SkipForward, BookOpen, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const KeyboardTrainer = () => {
  const [showFingerGuide, setShowFingerGuide] = useState(true);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const { toast } = useToast();

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
    colemakLessons
  } = useKeyboardTraining(COLEMAK_LAYOUT);

  const handleLessonComplete = () => {
    completeLesson();
    toast({
      title: "Lesson Complete!",
      description: `Great job! WPM: ${session.stats.wpm}, Accuracy: ${session.stats.accuracy}%`,
    });
  };

  const currentKeys = session.activeKeys.join('').toUpperCase();
  const lessonName = session.selectedLesson ? session.selectedLesson.name : `Stage ${session.currentLesson + 1}`;
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
                Learning keys: <Badge variant="secondary">{currentKeys}</Badge>
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
                Restart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFingerGuide(!showFingerGuide)}
              >
                {showFingerGuide ? 'Hide' : 'Show'} Finger Guide
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLessonSelector(!showLessonSelector)}
              >
                <List className="w-4 h-4 mr-2" />
                {showLessonSelector ? 'Hide' : 'Show'} Lessons
              </Button>
              {session.currentLesson < availableLessons - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startLesson(session.currentLesson + 1)}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Next Lesson
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
              onStatsUpdate={updateStats}
              onKeyPress={handleKeyPress}
              onComplete={handleLessonComplete}
            />
            
            {/* Keyboard Visualization - Right below typing area */}
            <KeyboardVisualization
              layout={COLEMAK_LAYOUT}
              keyStates={session.keyStates}
              showFingerGuide={showFingerGuide}
            />
          </div>

          {/* Right: Progress Stats */}
          <div>
            <ProgressTracker
              stats={session.stats}
              targetWpm={30}
              targetAccuracy={95}
              lessonProgress={currentLessonProgress?.masteryLevel || 0}
            />
          </div>
        </div>

        {/* Lesson Selection */}
        <Card className="mt-6 p-4">
          <h3 className="text-lg font-semibold mb-3">Available Lessons</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {COLEMAK_LAYOUT.learningOrder.map((keys, index) => {
              const lessonProgress = progress.find(p => p.lessonId === `lesson-${index}`);
              const isActive = index === session.currentLesson;
              const isCompleted = lessonProgress?.completed;
              
              return (
                <Button
                  key={index}
                  variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => startLesson(index)}
                  className="text-xs"
                >
                  <div className="text-center">
                    <div>Stage {index + 1}</div>
                    <div className="text-xs opacity-75">
                      {keys.join('').toUpperCase()}
                    </div>
                    {lessonProgress && (
                      <div className="text-xs">
                        {Math.round(lessonProgress.masteryLevel)}%
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default KeyboardTrainer;