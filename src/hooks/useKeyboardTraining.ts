import { useState, useCallback, useEffect } from 'react';
import { KeyboardLayout, KeyState, TypingStats, LessonProgress } from '@/types/keyboard';
import { TrainingLesson, generatePracticeText } from '@/data/colemakTraining';
import { useCurriculums, useUserProgress, useTypingSessions, useAuth } from '@/hooks/useDatabase';
import { ExtendedCurriculum, TrainingLessonDB } from '@/types/database';

export interface TrainingSession {
  currentLesson: number;
  currentStage: number;
  activeKeys: string[];
  practiceText: string;
  keyStates: KeyState[];
  stats: TypingStats;
  selectedLesson?: TrainingLessonDB;
  selectedCurriculum?: ExtendedCurriculum;
  lessonProgress: Record<string, { completed: boolean; bestWpm: number; bestAccuracy: number }>;
}

export const useKeyboardTraining = (layout: KeyboardLayout) => {
  const { user } = useAuth();
  const { curriculums, loading: curriculumsLoading } = useCurriculums();
  const { progress, updateProgress } = useUserProgress(user?.id || '');
  const { createSession } = useTypingSessions(user?.id || '');

  // Get the main Colemak curriculum
  const mainCurriculum = curriculums.find(c => c.name === 'Complete Colemak Training');
  const firstLesson = mainCurriculum?.lessons?.[0];

  const [session, setSession] = useState<TrainingSession>(() => ({
    currentLesson: 0,
    currentStage: 0,
    activeKeys: firstLesson?.focusKeys?.length > 0 ? firstLesson.focusKeys : layout.learningOrder[0] || [],
    practiceText: '', // Will be set in useEffect
    keyStates: [],
    stats: {
      wpm: 0,
      accuracy: 0,
      totalCharacters: 0,
      correctCharacters: 0,
      incorrectCharacters: 0
    },
    selectedLesson: firstLesson,
    selectedCurriculum: mainCurriculum,
    lessonProgress: {}
  }));

  // Initialize practice text after component mounts
  useEffect(() => {
    if (session.selectedLesson && !session.practiceText) {
      const initialText = generatePracticeText(session.selectedLesson, 100);
      setSession(prev => ({
        ...prev,
        practiceText: initialText
      }));
    }
  }, [session.selectedLesson, session.practiceText]);

  // Update session when curriculum loads
  useEffect(() => {
    if (mainCurriculum && !session.selectedCurriculum) {
      const firstLesson = mainCurriculum.lessons?.[0];
      if (firstLesson) {
        setSession(prev => ({
          ...prev,
          selectedLesson: firstLesson,
          selectedCurriculum: mainCurriculum,
          activeKeys: firstLesson.focusKeys?.length > 0 ? firstLesson.focusKeys : layout.learningOrder[0] || []
        }));
      }
    }
  }, [mainCurriculum, session.selectedCurriculum, layout.learningOrder]);

  // Select a specific lesson from database
  const selectLesson = useCallback((lesson: TrainingLessonDB) => {
    const newPracticeText = generatePracticeText(lesson, 100);

    setSession(prev => ({
      ...prev,
      selectedLesson: lesson,
      practiceText: newPracticeText,
      activeKeys: lesson.focusKeys.length > 0 ? lesson.focusKeys : layout.keys.map(k => k.target),
      stats: {
        wpm: 0,
        accuracy: 0,
        totalCharacters: 0,
        correctCharacters: 0,
        incorrectCharacters: 0
      }
    }));
  }, [layout.keys]);

  // Update lesson progress
  const updateLessonProgress = useCallback((lessonId: string, wpm: number, accuracy: number) => {
    setSession(prev => {
      const currentProgress = prev.lessonProgress[lessonId] || { completed: false, bestWpm: 0, bestAccuracy: 0 };
      const lesson = colemakCurriculum.lessons.find(l => l.id === lessonId);

      if (!lesson) return prev;

      const isCompleted = wpm >= lesson.minWpm && accuracy >= lesson.minAccuracy;
      const newProgress = {
        completed: isCompleted || currentProgress.completed,
        bestWpm: Math.max(currentProgress.bestWpm, wpm),
        bestAccuracy: Math.max(currentProgress.bestAccuracy, accuracy)
      };

      return {
        ...prev,
        lessonProgress: {
          ...prev.lessonProgress,
          [lessonId]: newProgress
        }
      };
    });
  }, []);

  // Generate new practice text for current lesson
  const generateNewPracticeText = useCallback(() => {
    if (session.selectedLesson) {
      const newText = generatePracticeText(session.selectedLesson, 100);
      setSession(prev => ({
        ...prev,
        practiceText: newText,
        stats: {
          wpm: 0,
          accuracy: 0,
          totalCharacters: 0,
          correctCharacters: 0,
          incorrectCharacters: 0
        }
      }));
    }
  }, [session.selectedLesson]);

  // Generate practice text based on active keys (for legacy key-based training)
  const generateKeyBasedPracticeText = useCallback((keys: string[], length: number = 50): string => {
    if (keys.length === 0) return '';

    let text = '';
    for (let i = 0; i < length; i++) {
      if (i > 0 && i % 10 === 0) {
        text += ' '; // Add spaces for word breaks
      } else {
        text += keys[Math.floor(Math.random() * keys.length)];
      }
    }
    return text.trim();
  }, []);

  // Initialize key states
  const initializeKeyStates = useCallback((activeKeys: string[], nextKey?: string): KeyState[] => {
    return layout.keys.map(keyMapping => ({
      key: keyMapping.target,
      state: nextKey === keyMapping.target ? 'next' : 
             activeKeys.includes(keyMapping.target) ? 'idle' : 'idle'
    }));
  }, [layout]);

  // Start a new lesson
  const startLesson = useCallback((lessonIndex: number) => {
    if (lessonIndex >= layout.learningOrder.length) return;

    const activeKeys = layout.learningOrder[lessonIndex];
    const practiceText = generateKeyBasedPracticeText(activeKeys);
    const keyStates = initializeKeyStates(activeKeys, practiceText[0]);

    setSession({
      currentLesson: lessonIndex,
      currentStage: 0,
      activeKeys,
      practiceText,
      keyStates,
      stats: {
        wpm: 0,
        accuracy: 0,
        totalCharacters: 0,
        correctCharacters: 0,
        incorrectCharacters: 0
      }
    });
  }, [layout.learningOrder, generateKeyBasedPracticeText, initializeKeyStates]);

  // Handle key press during typing
  const handleKeyPress = useCallback((expectedKey: string, isCorrect: boolean) => {
    setSession(prev => {
      const newKeyStates = prev.keyStates.map(ks => ({
        ...ks,
        state: ks.key === expectedKey ? 
               (isCorrect ? 'correct' : 'incorrect') : 
               ks.state
      }));

      // Update the next key to highlight
      const currentIndex = prev.stats.totalCharacters;
      const nextKey = prev.practiceText[currentIndex + 1];
      
      if (nextKey) {
        const nextKeyState = newKeyStates.find(ks => ks.key === nextKey);
        if (nextKeyState) {
          nextKeyState.state = 'next';
        }
      }

      return {
        ...prev,
        keyStates: newKeyStates
      };
    });
  }, []);

  // Update typing statistics
  const updateStats = useCallback((newStats: TypingStats) => {
    setSession(prev => ({
      ...prev,
      stats: newStats
    }));
  }, []);

  // Complete current lesson and save to database
  const completeLesson = useCallback(async () => {
    if (!user || !session.selectedLesson || !session.selectedCurriculum) return;

    try {
      // Save typing session to database
      // Find the lesson index in the curriculum
      const lessonIndex = session.selectedCurriculum.lessons.findIndex(l => l.id === session.selectedLesson.id);

      await createSession({
        user_id: user.id,
        curriculum_id: session.selectedCurriculum.id,
        lesson_index: lessonIndex >= 0 ? lessonIndex : 0,
        wpm: session.stats.wpm,
        accuracy: session.stats.accuracy,
        total_characters: session.stats.totalCharacters,
        correct_characters: session.stats.correctCharacters,
        incorrect_characters: session.stats.incorrectCharacters,
        practice_time: Math.floor((session.stats.endTime || Date.now() - (session.stats.startTime || Date.now())) / 1000),
        completed: session.stats.accuracy >= session.selectedLesson.minAccuracy && session.stats.wpm >= session.selectedLesson.minWpm
      });

      // Update user progress
      const masteryLevel = Math.min(100, ((session.stats.wpm / session.selectedLesson.minWpm) * 50) + ((session.stats.accuracy / 100) * 50));
      const isCompleted = session.stats.accuracy >= session.selectedLesson.minAccuracy && session.stats.wpm >= session.selectedLesson.minWpm;

      await updateProgress(session.selectedCurriculum.id, {
        lesson_index: lessonIndex >= 0 ? lessonIndex : 0,
        completed_lessons: isCompleted ? [lessonIndex] : [],
        best_wpm: session.stats.wpm,
        best_accuracy: session.stats.accuracy,
        mastery_level: masteryLevel,
        total_practice_time: Math.floor((session.stats.endTime || Date.now() - (session.stats.startTime || Date.now())) / 1000),
        last_practiced_at: new Date().toISOString(),
        completed_at: isCompleted ? new Date().toISOString() : null
      });

    } catch (error) {
      console.error('Failed to save lesson completion:', error);
    }
  }, [user, session, createSession, updateProgress]);

  // Restart current lesson
  const restartLesson = useCallback(() => {
    startLesson(session.currentLesson);
  }, [session.currentLesson, startLesson]);

  // Initialize with first lesson
  useEffect(() => {
    startLesson(0);
  }, [startLesson]);

  // Get current lesson progress from database
  const currentLessonProgress = session.selectedLesson && session.selectedCurriculum ?
    progress.find(p => p.curriculum_id === session.selectedCurriculum.id) : null;

  const overallProgress = session.selectedCurriculum ?
    (progress.filter(p => p.completed_at !== null).length / session.selectedCurriculum.lessons.length) * 100 : 0;

  return {
    session,
    progress,
    currentLessonProgress,
    overallProgress,
    startLesson,
    restartLesson,
    handleKeyPress,
    updateStats,
    completeLesson,
    availableLessons: layout.learningOrder.length,
    // Database-driven lesson system
    selectLesson,
    updateLessonProgress,
    generateNewPracticeText,
    curriculums,
    curriculumsLoading,
    mainCurriculum,
    // Legacy compatibility
    colemakLessons: mainCurriculum?.lessons || []
  };
};