import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useDatabase';
import { databaseService } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import {
  TypingSession,
  UserProgress,
  PerformanceMetrics,
  LearningInsights,
  Achievement,
  StatisticsPeriod,
  KeystrokeData,
  MistakeData,
  LetterAnalytics,
  FingerAnalytics,
  ErrorPattern,
  AdaptiveTraining,
  EnhancedPerformanceMetrics
} from '@/types/statistics';
import { statisticsCalculator } from '@/utils/statisticsCalculator';
import { letterAnalyticsCalculator } from '@/utils/letterAnalytics';
import { adaptiveTrainingGenerator } from '@/utils/adaptiveTraining';

// Real data from database - no more mock data

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

  // Letter analytics
  letterAnalytics: LetterAnalytics[];
  fingerAnalytics: FingerAnalytics[];
  errorPatterns: ErrorPattern[];
  adaptiveTraining: AdaptiveTraining | null;
  
  // Session management
  startSession: (layoutId: string, lessonId?: string) => void;
  recordKeystroke: (keystroke: Omit<KeystrokeData, 'timestamp'>) => void;
  recordMistake: (mistake: Omit<MistakeData, 'timestamp' | 'frequency'>) => void;
  endSession: () => Promise<void>;
  
  // Data fetching
  loadUserProgress: (layoutId: string) => Promise<void>;
  loadPerformanceMetrics: (layoutId: string, period: StatisticsPeriod) => Promise<void>;
  loadLearningInsights: (layoutId: string) => Promise<void>;
  loadLetterAnalytics: (layoutId: string) => Promise<void>;
  generateAdaptiveTraining: (layoutId: string) => Promise<void>;
  
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
  // Use real auth instead of mock user
  const { user } = useAuth();
  
  // State management
  const [currentSession, setCurrentSession] = useState<TypingSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [letterAnalytics, setLetterAnalytics] = useState<LetterAnalytics[]>([]);
  const [fingerAnalytics, setFingerAnalytics] = useState<FingerAnalytics[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [adaptiveTraining, setAdaptiveTraining] = useState<AdaptiveTraining | null>(null);
  const [userSessions, setUserSessions] = useState<TypingSession[]>([]);
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
      // Save session to database
      if (user?.id) {
        const sessionData = {
          user_id: user.id,
          curriculum_id: finalSession.curriculumId || '',
          lesson_index: finalSession.lessonIndex || 0,
          wpm: finalSession.wpm,
          accuracy: finalSession.accuracy,
          total_characters: finalSession.totalCharacters,
          correct_characters: finalSession.correctCharacters,
          incorrect_characters: finalSession.incorrectCharacters,
          practice_time: Math.round(finalSession.duration),
          completed: true
        };

        const result = await databaseService.createSession(sessionData);
        if (result.error) {
          throw new Error(result.error);
        }

        console.log('Session saved to database:', result.data);
      }

      // Update user progress
      await updateUserProgressAfterSession(finalSession);

      // Check for new achievements will be handled automatically by the database hooks

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
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get real user statistics from database
      const statsResult = await databaseService.getUserStatistics(user.id);
      if (statsResult.error) {
        throw new Error(statsResult.error);
      }

      const stats = statsResult.data;
      if (!stats) {
        setUserProgress(null);
        return;
      }

      // Convert database statistics to UserProgress format
      const progress: UserProgress = {
        userId: user.id,
        layoutId,
        level: Math.floor((stats.totalSessions || 0) / 5) + 1, // Level up every 5 sessions
        experience: (stats.totalSessions || 0) * 50 + (stats.totalPracticeTime || 0) / 60, // XP from sessions + minutes
        totalSessions: stats.totalSessions || 0,
        totalPracticeTime: stats.totalPracticeTime || 0,
        averageWpm: stats.averageWpm || 0,
        averageAccuracy: stats.averageAccuracy || 0,
        bestWpm: stats.bestWpm || 0,
        bestAccuracy: stats.bestAccuracy || 0,
        currentStreak: stats.streakDays || 0,
        longestStreak: await databaseService.calculateLongestStreak(user.id),
        lessonsCompleted: await getLessonsCompleted(user.id),
        achievements: [], // Will be loaded separately
        weakKeys: calculateWeakKeys(letterAnalytics),
        strongKeys: calculateStrongKeys(letterAnalytics),
        lastSessionDate: new Date(stats.lastActiveDate),
        createdAt: new Date(stats.firstSessionDate || Date.now()),
        updatedAt: new Date()
      };

      setUserProgress(progress);
    } catch (err) {
      setError('Failed to load user progress');
      console.error('Error loading user progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadPerformanceMetrics = useCallback(async (layoutId: string, period: StatisticsPeriod) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get real performance analytics from database
      const analyticsResult = await databaseService.getProgressAnalytics(user.id, period);
      if (analyticsResult.error) {
        throw new Error(analyticsResult.error);
      }

      const analytics = analyticsResult.data;
      if (!analytics) {
        setPerformanceMetrics(null);
        return;
      }

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Convert analytics to PerformanceMetrics format
      const metrics: PerformanceMetrics = {
        period,
        startDate,
        endDate,
        totalSessions: analytics.wpmHistory?.length || 0,
        totalPracticeTime: await calculateTotalPracticeTime(user.id),
        averageWpm: analytics.wpmHistory?.reduce((sum, h) => sum + h.wpm, 0) / (analytics.wpmHistory?.length || 1) || 0,
        averageAccuracy: analytics.wpmHistory?.reduce((sum, h) => sum + h.accuracy, 0) / (analytics.wpmHistory?.length || 1) || 0,
        wpmTrend: analytics.wpmHistory || [],
        accuracyTrend: analytics.wpmHistory?.map(h => ({ date: h.date, accuracy: h.accuracy })) || [],
        consistencyScore: calculateConsistencyScore(analytics.wpmHistory || []),
        improvementRate: calculateImprovementRate(analytics.wpmHistory || []),
        mostCommonMistakes: await getMostCommonMistakes(user.id),
        keyPerformance: letterAnalytics.slice(0, 10), // Top 10 letter performance
        sessionDistribution: await calculateSessionDistribution(user.id)
      };

      setPerformanceMetrics(metrics);
    } catch (err) {
      setError('Failed to load performance metrics');
      console.error('Error loading performance metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadLearningInsights = useCallback(async (layoutId: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get real user statistics for insights
      const statsResult = await databaseService.getUserStatistics(user.id);
      if (statsResult.error) {
        throw new Error(statsResult.error);
      }

      const stats = statsResult.data;
      if (!stats) {
        setLearningInsights(null);
        return;
      }

      // Calculate learning insights from real data
      const currentLevel = Math.floor((stats.totalSessions || 0) / 10) + 1;
      const overallProgress = Math.min(100, ((stats.averageWpm || 0) / 60) * 100);

      // Determine next milestone based on current WPM
      let nextMilestone;
      if (stats.averageWpm < 20) {
        nextMilestone = {
          id: 'milestone_20wpm',
          name: '20 WPM Milestone',
          description: 'Reach 20 words per minute consistently',
          targetWpm: 20,
          targetAccuracy: 85,
          requiredLessons: [],
          estimatedTime: 5,
          progress: Math.min(100, (stats.averageWpm / 20) * 100)
        };
      } else if (stats.averageWpm < 30) {
        nextMilestone = {
          id: 'milestone_30wpm',
          name: '30 WPM Milestone',
          description: 'Reach 30 words per minute consistently',
          targetWpm: 30,
          targetAccuracy: 90,
          requiredLessons: [],
          estimatedTime: 8,
          progress: Math.min(100, ((stats.averageWpm - 20) / 10) * 100)
        };
      } else {
        nextMilestone = {
          id: 'milestone_40wpm',
          name: '40 WPM Milestone',
          description: 'Reach 40 words per minute consistently',
          targetWpm: 40,
          targetAccuracy: 95,
          requiredLessons: [],
          estimatedTime: 12,
          progress: Math.min(100, ((stats.averageWpm - 30) / 10) * 100)
        };
      }

      const insights: LearningInsights = {
        userId: user.id,
        layoutId,
        overallProgress: Math.round(overallProgress),
        currentLevel,
        nextMilestone,
        strengths: stats.averageAccuracy > 90 ? ['High accuracy', 'Consistent typing'] : ['Steady progress'],
        weaknesses: stats.averageAccuracy < 85 ? ['Accuracy needs improvement'] : stats.averageWpm < 25 ? ['Speed development needed'] : [],
        recommendations: [
          stats.averageAccuracy < 90 ? 'Focus on accuracy before speed' : 'Continue building speed',
          stats.totalSessions < 10 ? 'Practice regularly for better results' : 'Great consistency!'
        ],
        learningVelocity: Math.min(5, (stats.totalSessions || 0) / 10),
        practiceConsistency: Math.min(100, (stats.streakDays || 0) * 20),
        focusAreas: [],
        estimatedTimeToGoal: Math.max(1, Math.round((nextMilestone.targetWpm - stats.averageWpm) * 2)),
        confidenceScore: Math.min(100, Math.round((stats.averageAccuracy + stats.averageWpm) / 2))
      };

      setLearningInsights(insights);
    } catch (err) {
      setError('Failed to load learning insights');
      console.error('Error loading learning insights:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadLetterAnalytics = useCallback(async (layoutId: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load real user sessions from database
      const sessionsResult = await databaseService.getUserSessions(user.id, { limit: 50 });
      if (sessionsResult.error) {
        throw new Error(sessionsResult.error);
      }

      const sessions = sessionsResult.data || [];

      // If no sessions exist, set empty analytics
      if (sessions.length === 0) {
        setLetterAnalytics([]);
        setFingerAnalytics([]);
        return;
      }

      // Analyze letter performance
      const letters = letterAnalyticsCalculator.analyzeLetterPerformance(sessions);
      setLetterAnalytics(letters);

      // Analyze finger performance
      const fingers = letterAnalyticsCalculator.analyzeFingerPerformance(sessions, letters);
      setFingerAnalytics(fingers);

      // Analyze error patterns
      const allMistakes = sessions.flatMap(s => s.mistakes);
      const patterns = letterAnalyticsCalculator.analyzeErrorPatterns(allMistakes);
      setErrorPatterns(patterns);

      // Store sessions for future use
      setUserSessions(sessions);

    } catch (err) {
      setError('Failed to load letter analytics');
    } finally {
      setIsLoading(false);
    }
  }, [user, userSessions]);

  const generateAdaptiveTraining = useCallback(async (layoutId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Use existing sessions or load from database
      const sessions = userSessions.length > 0 ? userSessions : [];

      if (sessions.length === 0) {
        // No sessions available for adaptive training
        setAdaptiveTraining(null);
        return;
      }

      const training = await adaptiveTrainingGenerator.generateAdaptiveTraining(
        user.id,
        layoutId,
        sessions
      );

      setAdaptiveTraining(training);

    } catch (err) {
      setError('Failed to generate adaptive training');
    } finally {
      setIsLoading(false);
    }
  }, [user, userSessions, loadLetterAnalytics]);

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

  // Helper functions for calculations
  const calculateConsistencyScore = useCallback((wpmHistory: any[]) => {
    if (wpmHistory.length < 2) return 0;

    // Calculate coefficient of variation (CV) for WPM
    const wpms = wpmHistory.map(h => h.wpm);
    const mean = wpms.reduce((sum, wpm) => sum + wpm, 0) / wpms.length;
    const variance = wpms.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / wpms.length;
    const standardDeviation = Math.sqrt(variance);
    const cv = standardDeviation / mean;

    // Convert CV to consistency score (lower CV = higher consistency)
    const consistencyScore = Math.max(0, Math.min(100, 100 - (cv * 100)));
    return Math.round(consistencyScore);
  }, []);

  const calculateImprovementRate = useCallback((wpmHistory: any[]) => {
    if (wpmHistory.length < 2) return 0;

    // Calculate linear regression slope for WPM over time
    const n = wpmHistory.length;
    const xSum = wpmHistory.reduce((sum, _, i) => sum + i, 0);
    const ySum = wpmHistory.reduce((sum, h) => sum + h.wpm, 0);
    const xySum = wpmHistory.reduce((sum, h, i) => sum + (i * h.wpm), 0);
    const x2Sum = wpmHistory.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

    // Convert slope to percentage improvement rate
    const avgWpm = ySum / n;
    const improvementRate = avgWpm > 0 ? (slope / avgWpm) * 100 : 0;
    return Math.round(improvementRate * 10) / 10; // Round to 1 decimal
  }, []);

  const calculateTotalPracticeTime = useCallback(async (userId: string) => {
    try {
      // Get real practice time from database sessions
      const { data: sessions, error } = await supabase
        .from('typing_sessions')
        .select('practice_time')
        .eq('user_id', userId);

      if (error || !sessions) return 0;

      return sessions.reduce((total, session) => total + (session.practice_time || 0), 0);
    } catch (error) {
      console.error('Error calculating total practice time:', error);
      return 0;
    }
  }, []);

  const calculateWeakKeys = useCallback((analytics: LetterAnalytics[]) => {
    if (!analytics || analytics.length === 0) return [];

    // Find keys with accuracy below 80% or speed below average
    const avgSpeed = analytics.reduce((sum, a) => sum + a.averageSpeed, 0) / analytics.length;
    const weakKeys = analytics
      .filter(a => a.accuracy < 80 || a.averageSpeed < avgSpeed * 0.8)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
      .map(a => a.letter);

    return weakKeys;
  }, []);

  const calculateStrongKeys = useCallback((analytics: LetterAnalytics[]) => {
    if (!analytics || analytics.length === 0) return [];

    // Find keys with accuracy above 95% and speed above average
    const avgSpeed = analytics.reduce((sum, a) => sum + a.averageSpeed, 0) / analytics.length;
    const strongKeys = analytics
      .filter(a => a.accuracy > 95 && a.averageSpeed > avgSpeed * 1.2)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)
      .map(a => a.letter);

    return strongKeys;
  }, []);

  const getLessonsCompleted = useCallback(async (userId: string) => {
    try {
      const result = await databaseService.getUserProgress(userId);
      if (result.error || !result.data) return [];

      // Extract completed lesson IDs from user progress
      return result.data
        .filter(progress => progress.completed)
        .map(progress => progress.lesson_id);
    } catch (error) {
      console.error('Error getting lessons completed:', error);
      return [];
    }
  }, []);

  const getMostCommonMistakes = useCallback(async (userId: string) => {
    try {
      // Get mistake patterns from database
      const { data: mistakes, error } = await supabase
        .from('mistake_patterns')
        .select('*')
        .eq('user_id', userId)
        .order('frequency', { ascending: false })
        .limit(5);

      if (error) return [];
      return mistakes || [];
    } catch (error) {
      console.error('Error getting common mistakes:', error);
      return [];
    }
  }, []);

  const calculateSessionDistribution = useCallback(async (userId: string) => {
    try {
      // Get real session data from database
      const { data: sessions, error } = await supabase
        .from('typing_sessions')
        .select('created_at, practice_time')
        .eq('user_id', userId);

      if (error || !sessions) return [];

      // Group sessions by hour of day
      const hourDistribution = Array(24).fill(0).map((_, hour) => ({
        hour,
        sessions: 0,
        totalTime: 0
      }));

      sessions.forEach(session => {
        const hour = new Date(session.created_at).getHours();
        hourDistribution[hour].sessions++;
        hourDistribution[hour].totalTime += session.practice_time || 0;
      });

      return hourDistribution.filter(h => h.sessions > 0);
    } catch (error) {
      console.error('Error calculating session distribution:', error);
      return [];
    }
  }, []);

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

    // Letter analytics
    letterAnalytics,
    fingerAnalytics,
    errorPatterns,
    adaptiveTraining,

    // Session management
    startSession,
    recordKeystroke,
    recordMistake,
    endSession,
    
    // Data fetching
    loadUserProgress,
    loadPerformanceMetrics,
    loadLearningInsights,
    loadLetterAnalytics,
    generateAdaptiveTraining,
    
    // Utilities
    calculateCurrentStats,
    
    // Loading states
    isLoading,
    error
  };
};
