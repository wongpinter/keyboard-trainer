import { useState, useCallback, useEffect } from 'react';
import { KeyboardLayout, KeyState, TypingStats, LessonProgress } from '@/types/keyboard';
import { TrainingLesson, generatePracticeText, colemakCurriculum } from '@/data/colemakTraining';

export interface TrainingSession {
  currentLesson: number;
  currentStage: number;
  activeKeys: string[];
  practiceText: string;
  keyStates: KeyState[];
  stats: TypingStats;
  selectedLesson?: TrainingLesson;
  lessonProgress: Record<string, { completed: boolean; bestWpm: number; bestAccuracy: number }>;
}

export const useKeyboardTraining = (layout: KeyboardLayout) => {
  const [session, setSession] = useState<TrainingSession>(() => {
    const firstLesson = colemakCurriculum.lessons[0];

    return {
      currentLesson: 0,
      currentStage: 0,
      activeKeys: firstLesson.focusKeys.length > 0 ? firstLesson.focusKeys : layout.learningOrder[0] || [],
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
      lessonProgress: {}
    };
  });

  const [progress, setProgress] = useState<LessonProgress[]>([]);

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

  // Select a specific lesson
  const selectLesson = useCallback((lesson: TrainingLesson) => {
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

  // Complete current lesson
  const completeLesson = useCallback(() => {
    const lessonId = `lesson-${session.currentLesson}`;
    const currentProgress = progress.find(p => p.lessonId === lessonId);
    
    const newProgress: LessonProgress = {
      lessonId,
      completed: true,
      bestWpm: Math.max(currentProgress?.bestWpm || 0, session.stats.wpm),
      bestAccuracy: Math.max(currentProgress?.bestAccuracy || 0, session.stats.accuracy),
      attempts: (currentProgress?.attempts || 0) + 1,
      masteryLevel: Math.min(100, ((session.stats.wpm / 30) * 50) + ((session.stats.accuracy / 100) * 50))
    };

    setProgress(prev => {
      const existing = prev.findIndex(p => p.lessonId === lessonId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newProgress;
        return updated;
      }
      return [...prev, newProgress];
    });

    // Auto-advance to next lesson if mastery level is sufficient
    if (newProgress.masteryLevel >= 70 && session.currentLesson < layout.learningOrder.length - 1) {
      setTimeout(() => startLesson(session.currentLesson + 1), 1000);
    }
  }, [session, progress, layout.learningOrder.length, startLesson]);

  // Restart current lesson
  const restartLesson = useCallback(() => {
    startLesson(session.currentLesson);
  }, [session.currentLesson, startLesson]);

  // Initialize with first lesson
  useEffect(() => {
    startLesson(0);
  }, [startLesson]);

  const currentLessonProgress = progress.find(p => p.lessonId === `lesson-${session.currentLesson}`);
  const overallProgress = (session.currentLesson / layout.learningOrder.length) * 100;

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
    // New lesson system functions
    selectLesson,
    updateLessonProgress,
    generateNewPracticeText,
    colemakLessons: colemakCurriculum.lessons
  };
};