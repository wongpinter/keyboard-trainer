import { useState, useCallback, useEffect } from 'react';
import { KeyboardLayout, KeyState, TypingStats, LessonProgress } from '@/types/keyboard';

export interface TrainingSession {
  currentLesson: number;
  currentStage: number;
  activeKeys: string[];
  practiceText: string;
  keyStates: KeyState[];
  stats: TypingStats;
}

export const useKeyboardTraining = (layout: KeyboardLayout) => {
  const [session, setSession] = useState<TrainingSession>(() => ({
    currentLesson: 0,
    currentStage: 0,
    activeKeys: layout.learningOrder[0] || [],
    practiceText: '',
    keyStates: [],
    stats: {
      wpm: 0,
      accuracy: 0,
      totalCharacters: 0,
      correctCharacters: 0,
      incorrectCharacters: 0
    }
  }));

  const [progress, setProgress] = useState<LessonProgress[]>([]);

  // Generate practice text based on active keys
  const generatePracticeText = useCallback((keys: string[], length: number = 50): string => {
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
    const practiceText = generatePracticeText(activeKeys);
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
  }, [layout.learningOrder, generatePracticeText, initializeKeyStates]);

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
    availableLessons: layout.learningOrder.length
  };
};