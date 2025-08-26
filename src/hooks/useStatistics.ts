import { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '@/contexts/AuthContext'; // TODO: Implement auth context
import { 
  TypingSession, 
  UserProgress, 
  PerformanceMetrics, 
  LearningInsights,
  Achievement,
  StatisticsPeriod,
  KeystrokeData,
  MistakeData
} from '@/types/statistics';
import { statisticsCalculator } from '@/utils/statisticsCalculator';

// Mock data for development - replace with actual API calls
const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first typing session',
    icon: '🎯',
    category: 'milestone',
    requirement: { type: 'sessions', value: 1 },
    progress: 100,
    unlockedAt: new Date()
  },
  {
    id: 'speed_demon_30',
    name: 'Speed Demon',
    description: 'Reach 30 WPM',
    icon: '⚡',
    category: 'speed',
    requirement: { type: 'wpm', value: 30, condition: 'greater_than' },
    progress: 75
  },
  {
    id: 'accuracy_master_95',
    name: 'Accuracy Master',
    description: 'Achieve 95% accuracy',
    icon: '🎯',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 95, condition: 'greater_than' },
    progress: 60
  },
  {
    id: 'consistent_performer',
    name: 'Consistent Performer',
    description: 'Maintain consistent typing for 10 sessions',
    icon: '📊',
    category: 'consistency',
    requirement: { type: 'sessions', value: 10 },
    progress: 40
  },
  {
    id: 'week_streak',
    name: 'Week Warrior',
    description: 'Practice for 7 consecutive days',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    progress: 30
  }
];

interface UseStatisticsReturn {
  // Current session data
  currentSession: TypingSession | null;
  isSessionActive: boolean;
  
  // User progress
  userProgress: UserProgress | null;
  achievements: Achievement[];
  
  // Performance metrics
  performanceMetrics: PerformanceMetrics | null;
  learningInsights: LearningInsights | null;
  
  // Session management
  startSession: (layoutId: string, lessonId?: string) => void;
  recordKeystroke: (keystroke: Omit<KeystrokeData, 'timestamp'>) => void;
  recordMistake: (mistake: Omit<MistakeData, 'timestamp' | 'frequency'>) => void;
  endSession: () => Promise<void>;
  
  // Data fetching
  loadUserProgress: (layoutId: string) => Promise<void>;
  loadPerformanceMetrics: (layoutId: string, period: StatisticsPeriod) => Promise<void>;
  loadLearningInsights: (layoutId: string) => Promise<void>;
  
  // Utilities
  calculateCurrentStats: () => {
    wpm: number;
    accuracy: number;
    consistency: number;
    errorRate: number;
  };
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export const useStatistics = (): UseStatisticsReturn => {
  // Mock user for development - replace with actual auth
  const user = { id: 'mock-user-id', email: 'user@example.com' };
  
  // State management
  const [currentSession, setCurrentSession] = useState<TypingSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(MOCK_ACHIEVEMENTS);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session management
  const startSession = useCallback((layoutId: string, lessonId?: string) => {
    if (!user) return;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    const newSession: TypingSession = {
      id: sessionId,
      userId: user.id,
      layoutId,
      lessonId,
      startTime,
      endTime: startTime, // Will be updated when session ends
      duration: 0,
      textLength: 0,
      wpm: 0,
      accuracy: 0,
      correctCharacters: 0,
      incorrectCharacters: 0,
      totalCharacters: 0,
      errorRate: 0,
      consistency: 0,
      keystrokes: [],
      mistakes: [],
      createdAt: startTime
    };

    setCurrentSession(newSession);
    setIsSessionActive(true);
    setError(null);
  }, [user]);

  const recordKeystroke = useCallback((keystroke: Omit<KeystrokeData, 'timestamp'>) => {
    if (!currentSession || !isSessionActive) return;

    const timestamp = Date.now() - currentSession.startTime.getTime();
    const newKeystroke: KeystrokeData = {
      ...keystroke,
      timestamp
    };

    setCurrentSession(prev => {
      if (!prev) return prev;
      
      const updatedKeystrokes = [...prev.keystrokes, newKeystroke];
      const totalCharacters = updatedKeystrokes.length;
      const correctCharacters = updatedKeystrokes.filter(k => k.isCorrect).length;
      const incorrectCharacters = totalCharacters - correctCharacters;
      
      return {
        ...prev,
        keystrokes: updatedKeystrokes,
        totalCharacters,
        correctCharacters,
        incorrectCharacters,
        duration: timestamp / 1000,
        wpm: statisticsCalculator.calculateWpm(totalCharacters, timestamp / 1000, incorrectCharacters),
        accuracy: statisticsCalculator.calculateAccuracy(correctCharacters, totalCharacters),
        errorRate: statisticsCalculator.calculateErrorRate(incorrectCharacters, totalCharacters)
      };
    });
  }, [currentSession, isSessionActive]);

  const recordMistake = useCallback((mistake: Omit<MistakeData, 'timestamp' | 'frequency'>) => {
    if (!currentSession || !isSessionActive) return;

    const timestamp = Date.now() - currentSession.startTime.getTime();
    const newMistake: MistakeData = {
      ...mistake,
      timestamp,
      frequency: 1 // Will be calculated properly in real implementation
    };

    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        mistakes: [...prev.mistakes, newMistake]
      };
    });
  }, [currentSession, isSessionActive]);

  const endSession = useCallback(async () => {
    if (!currentSession || !isSessionActive) return;

    const endTime = new Date();
    const duration = (endTime.getTime() - currentSession.startTime.getTime()) / 1000;
    
    // Calculate final statistics
    const keystrokeTimes = currentSession.keystrokes.map(k => k.timeSinceLastKey);
    const consistency = statisticsCalculator.calculateConsistency(keystrokeTimes);

    const finalSession: TypingSession = {
      ...currentSession,
      endTime,
      duration,
      consistency
    };

    setCurrentSession(finalSession);
    setIsSessionActive(false);

    try {
      // In a real app, save to database
      console.log('Session completed:', finalSession);
      
      // Update user progress
      await updateUserProgressAfterSession(finalSession);
      
      // Check for new achievements
      checkForNewAchievements(finalSession);
      
    } catch (err) {
      setError('Failed to save session data');
      console.error('Error saving session:', err);
    }
  }, [currentSession, isSessionActive]);

  // Helper function to update user progress
  const updateUserProgressAfterSession = async (session: TypingSession) => {
    if (!userProgress) return;

    const updatedProgress: UserProgress = {
      ...userProgress,
      totalSessions: userProgress.totalSessions + 1,
      totalPracticeTime: userProgress.totalPracticeTime + session.duration,
      averageWpm: Math.round((userProgress.averageWpm * userProgress.totalSessions + session.wpm) / (userProgress.totalSessions + 1)),
      averageAccuracy: Math.round((userProgress.averageAccuracy * userProgress.totalSessions + session.accuracy) / (userProgress.totalSessions + 1)),
      bestWpm: Math.max(userProgress.bestWpm, session.wpm),
      bestAccuracy: Math.max(userProgress.bestAccuracy, session.accuracy),
      lastSessionDate: session.endTime,
      updatedAt: new Date()
    };

    setUserProgress(updatedProgress);
  };

  // Helper function to check for new achievements
  const checkForNewAchievements = (session: TypingSession) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlockedAt) return achievement; // Already unlocked

      let progress = achievement.progress;
      let unlockedAt: Date | undefined;

      switch (achievement.requirement.type) {
        case 'wpm':
          if (session.wpm >= achievement.requirement.value) {
            progress = 100;
            unlockedAt = new Date();
          } else {
            progress = Math.min(100, (session.wpm / achievement.requirement.value) * 100);
          }
          break;
        case 'accuracy':
          if (session.accuracy >= achievement.requirement.value) {
            progress = 100;
            unlockedAt = new Date();
          } else {
            progress = Math.min(100, (session.accuracy / achievement.requirement.value) * 100);
          }
          break;
        case 'sessions':
          const sessionCount = (userProgress?.totalSessions || 0) + 1;
          if (sessionCount >= achievement.requirement.value) {
            progress = 100;
            unlockedAt = new Date();
          } else {
            progress = (sessionCount / achievement.requirement.value) * 100;
          }
          break;
      }

      return {
        ...achievement,
        progress: Math.round(progress),
        unlockedAt
      };
    }));
  };

  // Data loading functions
  const loadUserProgress = useCallback(async (layoutId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockProgress: UserProgress = {
        userId: user.id,
        layoutId,
        level: 5,
        experience: 1250,
        totalSessions: 25,
        totalPracticeTime: 7200, // 2 hours
        averageWpm: 28,
        averageAccuracy: 92,
        bestWpm: 35,
        bestAccuracy: 98,
        currentStreak: 3,
        longestStreak: 7,
        lessonsCompleted: ['lesson1', 'lesson2', 'lesson3'],
        achievements: [],
        weakKeys: ['q', 'z', 'x'],
        strongKeys: ['a', 's', 'd', 'f'],
        lastSessionDate: new Date(Date.now() - 86400000), // Yesterday
        createdAt: new Date(Date.now() - 30 * 86400000), // 30 days ago
        updatedAt: new Date()
      };

      setUserProgress(mockProgress);
    } catch (err) {
      setError('Failed to load user progress');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadPerformanceMetrics = useCallback(async (layoutId: string, period: StatisticsPeriod) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockMetrics: PerformanceMetrics = {
        period,
        startDate: new Date(Date.now() - 30 * 86400000),
        endDate: new Date(),
        totalSessions: 25,
        totalPracticeTime: 7200,
        averageWpm: 28,
        averageAccuracy: 92,
        wpmTrend: [],
        accuracyTrend: [],
        consistencyScore: 85,
        improvementRate: 15,
        mostCommonMistakes: [],
        keyPerformance: [],
        sessionDistribution: []
      };

      setPerformanceMetrics(mockMetrics);
    } catch (err) {
      setError('Failed to load performance metrics');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadLearningInsights = useCallback(async (layoutId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockInsights: LearningInsights = {
        userId: user.id,
        layoutId,
        overallProgress: 65,
        currentLevel: 5,
        nextMilestone: {
          id: 'milestone_30wpm',
          name: '30 WPM Milestone',
          description: 'Reach 30 words per minute consistently',
          targetWpm: 30,
          targetAccuracy: 90,
          requiredLessons: [],
          estimatedTime: 10,
          progress: 75
        },
        strengths: ['Home row keys', 'Common words', 'Consistent rhythm'],
        weaknesses: ['Number row', 'Special characters', 'Less common letters'],
        recommendations: [],
        learningVelocity: 2.5,
        practiceConsistency: 80,
        focusAreas: [],
        estimatedTimeToGoal: 14,
        confidenceScore: 78
      };

      setLearningInsights(mockInsights);
    } catch (err) {
      setError('Failed to load learning insights');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Calculate current session statistics
  const calculateCurrentStats = useCallback(() => {
    if (!currentSession) {
      return { wpm: 0, accuracy: 0, consistency: 0, errorRate: 0 };
    }

    const keystrokeTimes = currentSession.keystrokes.map(k => k.timeSinceLastKey);
    
    return {
      wpm: currentSession.wpm,
      accuracy: currentSession.accuracy,
      consistency: statisticsCalculator.calculateConsistency(keystrokeTimes),
      errorRate: currentSession.errorRate
    };
  }, [currentSession]);

  return {
    // Current session data
    currentSession,
    isSessionActive,
    
    // User progress
    userProgress,
    achievements,
    
    // Performance metrics
    performanceMetrics,
    learningInsights,
    
    // Session management
    startSession,
    recordKeystroke,
    recordMistake,
    endSession,
    
    // Data fetching
    loadUserProgress,
    loadPerformanceMetrics,
    loadLearningInsights,
    
    // Utilities
    calculateCurrentStats,
    
    // Loading states
    isLoading,
    error
  };
};
