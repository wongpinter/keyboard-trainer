import { 
  TypingSession, 
  KeystrokeData, 
  MistakeData, 
  StatisticsCalculator,
  PerformanceMetrics,
  TrendData,
  MistakeFrequency,
  KeyPerformance
} from '@/types/statistics';

export class TypingStatisticsCalculator implements StatisticsCalculator {
  
  /**
   * Calculate Words Per Minute (WPM)
   * Standard formula: (characters typed / 5) / (time in minutes)
   * Adjusted for errors: (correct characters / 5) / (time in minutes)
   */
  calculateWpm(characters: number, timeInSeconds: number, errors: number = 0): number {
    if (timeInSeconds <= 0) return 0;
    
    const timeInMinutes = timeInSeconds / 60;
    const correctCharacters = Math.max(0, characters - errors);
    const words = correctCharacters / 5; // Standard: 5 characters = 1 word
    
    return Math.round(words / timeInMinutes);
  }

  /**
   * Calculate typing accuracy as percentage
   */
  calculateAccuracy(correct: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * Calculate typing consistency based on keystroke timing variance
   * Lower variance = higher consistency
   */
  calculateConsistency(keystrokeTimes: number[]): number {
    if (keystrokeTimes.length < 2) return 100;

    const mean = keystrokeTimes.reduce((sum, time) => sum + time, 0) / keystrokeTimes.length;
    const variance = keystrokeTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / keystrokeTimes.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (0-100, higher is better)
    const coefficientOfVariation = standardDeviation / mean;
    const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));
    
    return Math.round(consistencyScore);
  }

  /**
   * Calculate error rate as percentage
   */
  calculateErrorRate(errors: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((errors / total) * 100);
  }

  /**
   * Calculate improvement percentage between two values
   */
  calculateImprovement(oldValue: number, newValue: number): number {
    if (oldValue <= 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }

  /**
   * Calculate learning velocity based on recent sessions
   * Returns improvement rate per session
   */
  calculateLearningVelocity(sessions: TypingSession[]): number {
    if (sessions.length < 2) return 0;

    // Sort sessions by date
    const sortedSessions = sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Calculate WPM trend
    const wpmValues = sortedSessions.map(session => session.wpm);
    const firstHalf = wpmValues.slice(0, Math.floor(wpmValues.length / 2));
    const secondHalf = wpmValues.slice(Math.floor(wpmValues.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, wpm) => sum + wpm, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, wpm) => sum + wpm, 0) / secondHalf.length;
    
    return this.calculateImprovement(firstHalfAvg, secondHalfAvg) / sessions.length;
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  calculateConfidenceScore(accuracy: number, consistency: number, experience: number): number {
    // Weight factors: accuracy (40%), consistency (30%), experience (30%)
    const accuracyWeight = 0.4;
    const consistencyWeight = 0.3;
    const experienceWeight = 0.3;
    
    // Normalize experience (sessions) to 0-100 scale
    const normalizedExperience = Math.min(100, (experience / 100) * 100);
    
    const confidenceScore = 
      (accuracy * accuracyWeight) + 
      (consistency * consistencyWeight) + 
      (normalizedExperience * experienceWeight);
    
    return Math.round(confidenceScore);
  }

  /**
   * Analyze keystroke data to identify patterns
   */
  analyzeKeystrokePatterns(keystrokes: KeystrokeData[]): {
    averageKeystrokeTime: number;
    fastestKeys: string[];
    slowestKeys: string[];
    mostAccurateKeys: string[];
    leastAccurateKeys: string[];
  } {
    if (keystrokes.length === 0) {
      return {
        averageKeystrokeTime: 0,
        fastestKeys: [],
        slowestKeys: [],
        mostAccurateKeys: [],
        leastAccurateKeys: []
      };
    }

    // Group keystrokes by key
    const keyGroups = keystrokes.reduce((groups, keystroke) => {
      if (!groups[keystroke.key]) {
        groups[keystroke.key] = [];
      }
      groups[keystroke.key].push(keystroke);
      return groups;
    }, {} as Record<string, KeystrokeData[]>);

    // Calculate metrics for each key
    const keyMetrics = Object.entries(keyGroups).map(([key, strokes]) => {
      const avgTime = strokes.reduce((sum, stroke) => sum + stroke.timeSinceLastKey, 0) / strokes.length;
      const accuracy = this.calculateAccuracy(
        strokes.filter(s => s.isCorrect).length,
        strokes.length
      );
      
      return { key, avgTime, accuracy, count: strokes.length };
    });

    // Sort and extract insights
    const sortedByTime = keyMetrics.sort((a, b) => a.avgTime - b.avgTime);
    const sortedByAccuracy = keyMetrics.sort((a, b) => b.accuracy - a.accuracy);

    return {
      averageKeystrokeTime: keystrokes.reduce((sum, k) => sum + k.timeSinceLastKey, 0) / keystrokes.length,
      fastestKeys: sortedByTime.slice(0, 5).map(k => k.key),
      slowestKeys: sortedByTime.slice(-5).map(k => k.key),
      mostAccurateKeys: sortedByAccuracy.slice(0, 5).map(k => k.key),
      leastAccurateKeys: sortedByAccuracy.slice(-5).map(k => k.key)
    };
  }

  /**
   * Calculate mistake frequency and patterns
   */
  calculateMistakeFrequency(mistakes: MistakeData[]): MistakeFrequency[] {
    if (mistakes.length === 0) return [];

    // Group mistakes by expected/actual key combination
    const mistakeGroups = mistakes.reduce((groups, mistake) => {
      const key = `${mistake.expectedKey}->${mistake.actualKey}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(mistake);
      return groups;
    }, {} as Record<string, MistakeData[]>);

    // Calculate frequency and percentage
    const totalMistakes = mistakes.length;
    
    return Object.entries(mistakeGroups)
      .map(([key, mistakeList]) => {
        const [expectedKey, actualKey] = key.split('->');
        const count = mistakeList.length;
        const percentage = (count / totalMistakes) * 100;
        const finger = mistakeList[0].finger;
        
        // Calculate improvement trend (simplified)
        const improvement = 0; // Would need historical data
        
        return {
          expectedKey,
          actualKey,
          count,
          percentage: Math.round(percentage),
          finger,
          improvement
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Generate performance trends over time
   */
  generatePerformanceTrends(sessions: TypingSession[], metric: 'wpm' | 'accuracy'): TrendData[] {
    if (sessions.length === 0) return [];

    // Sort sessions by date
    const sortedSessions = sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Group sessions by day
    const dailyGroups = sortedSessions.reduce((groups, session) => {
      const dateKey = session.startTime.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
      return groups;
    }, {} as Record<string, TypingSession[]>);

    // Calculate daily averages
    return Object.entries(dailyGroups).map(([dateStr, daySessions]) => {
      const values = daySessions.map(session => session[metric]);
      const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        date: new Date(dateStr),
        value: Math.round(averageValue),
        sessionCount: daySessions.length
      };
    });
  }

  /**
   * Calculate key performance metrics
   */
  calculateKeyPerformance(keystrokes: KeystrokeData[]): KeyPerformance[] {
    if (keystrokes.length === 0) return [];

    // Group keystrokes by key
    const keyGroups = keystrokes.reduce((groups, keystroke) => {
      if (!groups[keystroke.key]) {
        groups[keystroke.key] = [];
      }
      groups[keystroke.key].push(keystroke);
      return groups;
    }, {} as Record<string, KeystrokeData[]>);

    return Object.entries(keyGroups).map(([key, strokes]) => {
      const averageTime = strokes.reduce((sum, stroke) => sum + stroke.timeSinceLastKey, 0) / strokes.length;
      const accuracy = this.calculateAccuracy(
        strokes.filter(s => s.isCorrect).length,
        strokes.length
      );
      const frequency = strokes.length;
      const finger = strokes[0].finger;
      
      // Determine difficulty based on average time and accuracy
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      if (averageTime < 200 && accuracy > 95) difficulty = 'easy';
      else if (averageTime > 400 || accuracy < 80) difficulty = 'hard';
      
      return {
        key,
        finger,
        averageTime: Math.round(averageTime),
        accuracy: Math.round(accuracy),
        frequency,
        difficulty,
        improvement: 0 // Would need historical comparison
      };
    }).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculate overall session statistics
   */
  calculateSessionStats(session: TypingSession): {
    wpm: number;
    accuracy: number;
    consistency: number;
    errorRate: number;
    keystrokeAnalysis: ReturnType<typeof this.analyzeKeystrokePatterns>;
    mistakeFrequency: MistakeFrequency[];
  } {
    const keystrokeTimes = session.keystrokes.map(k => k.timeSinceLastKey);
    
    return {
      wpm: this.calculateWpm(session.totalCharacters, session.duration, session.incorrectCharacters),
      accuracy: this.calculateAccuracy(session.correctCharacters, session.totalCharacters),
      consistency: this.calculateConsistency(keystrokeTimes),
      errorRate: this.calculateErrorRate(session.incorrectCharacters, session.totalCharacters),
      keystrokeAnalysis: this.analyzeKeystrokePatterns(session.keystrokes),
      mistakeFrequency: this.calculateMistakeFrequency(session.mistakes)
    };
  }
}

// Export singleton instance
export const statisticsCalculator = new TypingStatisticsCalculator();
