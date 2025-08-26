import { 
  TypingSession, 
  LetterAnalytics, 
  LetterMistake, 
  ErrorPattern, 
  LetterHeatmap,
  FingerAnalytics,
  MistakeData,
  KeystrokeData
} from '@/types/statistics';

export class LetterAnalyticsCalculator {
  
  /**
   * Analyze letter performance from typing sessions
   */
  analyzeLetterPerformance(sessions: TypingSession[]): LetterAnalytics[] {
    const letterStats = new Map<string, {
      totalAttempts: number;
      correctAttempts: number;
      totalTime: number;
      errorCount: number;
      mistakes: LetterMistake[];
      finger: number;
    }>();

    // Process all sessions
    sessions.forEach(session => {
      session.keystrokes.forEach(keystroke => {
        const letter = keystroke.key.toLowerCase();
        
        if (!letterStats.has(letter)) {
          letterStats.set(letter, {
            totalAttempts: 0,
            correctAttempts: 0,
            totalTime: 0,
            errorCount: 0,
            mistakes: [],
            finger: keystroke.finger
          });
        }

        const stats = letterStats.get(letter)!;
        stats.totalAttempts++;
        stats.totalTime += keystroke.timeSinceLastKey;
        
        if (keystroke.isCorrect) {
          stats.correctAttempts++;
        } else {
          stats.errorCount++;
        }
      });

      // Process mistakes
      session.mistakes.forEach(mistake => {
        const expectedLetter = mistake.expectedKey.toLowerCase();
        const typedLetter = mistake.actualKey.toLowerCase();
        
        if (letterStats.has(expectedLetter)) {
          const stats = letterStats.get(expectedLetter)!;
          
          // Find or create mistake entry
          let mistakeEntry = stats.mistakes.find(m => 
            m.expectedLetter === expectedLetter && m.typedLetter === typedLetter
          );
          
          if (!mistakeEntry) {
            mistakeEntry = {
              expectedLetter,
              typedLetter,
              frequency: 0,
              percentage: 0,
              lastOccurrence: new Date(session.startTime.getTime() + mistake.timestamp),
              finger: mistake.finger,
              position: this.calculateMistakePosition(mistake.finger, expectedLetter, typedLetter)
            };
            stats.mistakes.push(mistakeEntry);
          }
          
          mistakeEntry.frequency++;
          mistakeEntry.lastOccurrence = new Date(session.startTime.getTime() + mistake.timestamp);
        }
      });
    });

    // Convert to LetterAnalytics array
    return Array.from(letterStats.entries()).map(([letter, stats]) => {
      const accuracy = stats.totalAttempts > 0 ? (stats.correctAttempts / stats.totalAttempts) * 100 : 0;
      const averageTime = stats.totalAttempts > 0 ? stats.totalTime / stats.totalAttempts : 0;
      const errorRate = stats.totalAttempts > 0 ? (stats.errorCount / stats.totalAttempts) * 100 : 0;
      
      // Calculate mistake percentages
      const totalMistakes = stats.mistakes.reduce((sum, m) => sum + m.frequency, 0);
      stats.mistakes.forEach(mistake => {
        mistake.percentage = totalMistakes > 0 ? (mistake.frequency / totalMistakes) * 100 : 0;
      });

      // Calculate difficulty score (0-100, higher = more difficult)
      const difficultyScore = this.calculateLetterDifficulty(accuracy, averageTime, errorRate);
      
      // Calculate improvement trend (simplified - would need historical data)
      const improvementTrend = 0; // Placeholder
      
      // Determine practice recommendation
      const practiceRecommendation = this.getPracticeRecommendation(accuracy, errorRate, difficultyScore);

      return {
        letter,
        finger: stats.finger,
        totalAttempts: stats.totalAttempts,
        correctAttempts: stats.correctAttempts,
        accuracy: Math.round(accuracy),
        averageTime: Math.round(averageTime),
        errorCount: stats.errorCount,
        errorRate: Math.round(errorRate),
        commonMistakes: stats.mistakes.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
        improvementTrend,
        difficultyScore: Math.round(difficultyScore),
        practiceRecommendation
      };
    }).sort((a, b) => b.difficultyScore - a.difficultyScore);
  }

  /**
   * Calculate mistake position relationship
   */
  private calculateMistakePosition(finger: number, expected: string, typed: string): 'same_finger' | 'adjacent_finger' | 'different_hand' | 'random' {
    // Simplified finger mapping (would need actual layout data)
    const leftFingers = [0, 1, 2, 3, 4]; // left pinky to thumb
    const rightFingers = [5, 6, 7, 8, 9]; // right thumb to pinky
    
    const isLeftHand = leftFingers.includes(finger);
    const adjacentFingers = isLeftHand ? 
      leftFingers.filter(f => Math.abs(f - finger) <= 1) :
      rightFingers.filter(f => Math.abs(f - finger) <= 1);

    // This would need actual key-to-finger mapping
    // For now, return a simplified classification
    if (expected === typed) return 'same_finger';
    return 'random';
  }

  /**
   * Calculate letter difficulty score
   */
  private calculateLetterDifficulty(accuracy: number, averageTime: number, errorRate: number): number {
    // Normalize metrics to 0-100 scale
    const accuracyScore = Math.max(0, 100 - accuracy); // Lower accuracy = higher difficulty
    const timeScore = Math.min(100, (averageTime / 500) * 100); // Slower = higher difficulty
    const errorScore = Math.min(100, errorRate); // More errors = higher difficulty
    
    // Weighted average
    return (accuracyScore * 0.4) + (timeScore * 0.3) + (errorScore * 0.3);
  }

  /**
   * Get practice recommendation based on performance
   */
  private getPracticeRecommendation(accuracy: number, errorRate: number, difficultyScore: number): 'high' | 'medium' | 'low' {
    if (difficultyScore > 70 || accuracy < 80 || errorRate > 20) return 'high';
    if (difficultyScore > 40 || accuracy < 90 || errorRate > 10) return 'medium';
    return 'low';
  }

  /**
   * Analyze finger performance
   */
  analyzeFingerPerformance(sessions: TypingSession[], letterAnalytics: LetterAnalytics[]): FingerAnalytics[] {
    const fingerStats = new Map<number, {
      totalKeystrokes: number;
      correctKeystrokes: number;
      totalTime: number;
      errorCount: number;
      letters: Set<string>;
    }>();

    // Initialize finger stats
    for (let i = 0; i < 10; i++) {
      fingerStats.set(i, {
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        totalTime: 0,
        errorCount: 0,
        letters: new Set()
      });
    }

    // Process sessions
    sessions.forEach(session => {
      session.keystrokes.forEach(keystroke => {
        const stats = fingerStats.get(keystroke.finger);
        if (stats) {
          stats.totalKeystrokes++;
          stats.totalTime += keystroke.timeSinceLastKey;
          stats.letters.add(keystroke.key.toLowerCase());
          
          if (keystroke.isCorrect) {
            stats.correctKeystrokes++;
          } else {
            stats.errorCount++;
          }
        }
      });
    });

    // Convert to FingerAnalytics array
    return Array.from(fingerStats.entries()).map(([finger, stats]) => {
      const fingerName = this.getFingerName(finger);
      const hand = finger < 5 ? 'left' : 'right';
      const assignedKeys = Array.from(stats.letters);
      const averageAccuracy = stats.totalKeystrokes > 0 ? 
        (stats.correctKeystrokes / stats.totalKeystrokes) * 100 : 0;
      const averageSpeed = stats.totalKeystrokes > 0 ? 
        stats.totalTime / stats.totalKeystrokes : 0;

      // Get letter performance for this finger
      const fingerLetters = letterAnalytics.filter(la => la.finger === finger);
      const strongestKeys = fingerLetters
        .filter(la => la.accuracy >= 95)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 3)
        .map(la => la.letter);
      
      const weakestKeys = fingerLetters
        .filter(la => la.accuracy < 85)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
        .map(la => la.letter);

      return {
        finger,
        fingerName,
        hand,
        assignedKeys,
        totalKeystrokes: stats.totalKeystrokes,
        averageAccuracy: Math.round(averageAccuracy),
        averageSpeed: Math.round(averageSpeed),
        errorCount: stats.errorCount,
        strongestKeys,
        weakestKeys,
        improvementTrend: 0, // Placeholder
        recommendedExercises: this.getFingerExercises(finger, weakestKeys)
      };
    });
  }

  /**
   * Get finger name
   */
  private getFingerName(finger: number): string {
    const names = [
      'Left Pinky', 'Left Ring', 'Left Middle', 'Left Index', 'Left Thumb',
      'Right Thumb', 'Right Index', 'Right Middle', 'Right Ring', 'Right Pinky'
    ];
    return names[finger] || 'Unknown';
  }

  /**
   * Get recommended exercises for finger
   */
  private getFingerExercises(finger: number, weakKeys: string[]): string[] {
    const exercises = [];
    
    if (weakKeys.length > 0) {
      exercises.push(`Practice ${weakKeys.join(', ')} keys`);
      exercises.push(`${this.getFingerName(finger)} strengthening drills`);
    }
    
    exercises.push(`${this.getFingerName(finger)} coordination exercises`);
    
    return exercises;
  }

  /**
   * Generate letter heatmap data
   */
  generateLetterHeatmap(letterAnalytics: LetterAnalytics[]): LetterHeatmap[] {
    return letterAnalytics.map(la => {
      // Simplified row/column mapping (would need actual layout data)
      const row = this.getKeyRow(la.letter);
      const column = this.getKeyColumn(la.letter);
      
      // Calculate intensities (0-1 scale)
      const errorIntensity = Math.min(1, la.errorRate / 50); // Normalize to 50% max
      const speedIntensity = Math.min(1, la.averageTime / 1000); // Normalize to 1000ms max
      
      const practiceNeeded = la.practiceRecommendation === 'high';
      
      // Generate color based on performance
      const color = this.getHeatmapColor(errorIntensity, speedIntensity);

      return {
        letter: la.letter,
        finger: la.finger,
        row,
        column,
        errorIntensity,
        speedIntensity,
        practiceNeeded,
        color
      };
    });
  }

  /**
   * Get key row (simplified)
   */
  private getKeyRow(letter: string): number {
    const topRow = 'qwertyuiop';
    const homeRow = 'asdfghjkl';
    const bottomRow = 'zxcvbnm';
    
    if (topRow.includes(letter)) return 2;
    if (homeRow.includes(letter)) return 1;
    if (bottomRow.includes(letter)) return 0;
    return 1; // default to home row
  }

  /**
   * Get key column (simplified)
   */
  private getKeyColumn(letter: string): number {
    const keyOrder = 'qwertyuiopasdfghjklzxcvbnm';
    return keyOrder.indexOf(letter) % 10;
  }

  /**
   * Generate heatmap color
   */
  private getHeatmapColor(errorIntensity: number, speedIntensity: number): string {
    const intensity = Math.max(errorIntensity, speedIntensity);
    
    if (intensity < 0.2) return '#22c55e'; // Green - good performance
    if (intensity < 0.4) return '#eab308'; // Yellow - moderate issues
    if (intensity < 0.6) return '#f97316'; // Orange - needs attention
    return '#ef4444'; // Red - needs significant practice
  }

  /**
   * Analyze error patterns
   */
  analyzeErrorPatterns(mistakes: MistakeData[]): ErrorPattern[] {
    const patterns = new Map<string, {
      type: 'substitution' | 'omission' | 'insertion' | 'transposition';
      frequency: number;
      affectedLetters: Set<string>;
    }>();

    mistakes.forEach(mistake => {
      const expected = mistake.expectedKey.toLowerCase();
      const actual = mistake.actualKey.toLowerCase();
      
      // Determine error type (simplified)
      let type: 'substitution' | 'omission' | 'insertion' | 'transposition' = 'substitution';
      
      if (actual === '') type = 'omission';
      else if (expected === '') type = 'insertion';
      else if (expected !== actual) type = 'substitution';
      
      const patternKey = `${type}-${expected}-${actual}`;
      
      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, {
          type,
          frequency: 0,
          affectedLetters: new Set()
        });
      }
      
      const pattern = patterns.get(patternKey)!;
      pattern.frequency++;
      pattern.affectedLetters.add(expected);
      pattern.affectedLetters.add(actual);
    });

    // Convert to ErrorPattern array
    return Array.from(patterns.entries()).map(([key, pattern], index) => ({
      id: `pattern-${index}`,
      type: pattern.type,
      description: this.getPatternDescription(pattern.type, Array.from(pattern.affectedLetters)),
      frequency: pattern.frequency,
      affectedLetters: Array.from(pattern.affectedLetters),
      suggestedExercises: this.getPatternExercises(pattern.type, Array.from(pattern.affectedLetters)),
      difficulty: pattern.frequency > 10 ? 'advanced' : pattern.frequency > 5 ? 'intermediate' : 'beginner'
    })).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get pattern description
   */
  private getPatternDescription(type: string, letters: string[]): string {
    switch (type) {
      case 'substitution':
        return `Frequently substituting ${letters.slice(0, 3).join(', ')} keys`;
      case 'omission':
        return `Often missing ${letters.slice(0, 3).join(', ')} keys`;
      case 'insertion':
        return `Adding extra ${letters.slice(0, 3).join(', ')} keys`;
      case 'transposition':
        return `Swapping ${letters.slice(0, 3).join(', ')} key order`;
      default:
        return 'Unknown error pattern';
    }
  }

  /**
   * Get exercises for error pattern
   */
  private getPatternExercises(type: string, letters: string[]): string[] {
    const exercises = [];
    
    switch (type) {
      case 'substitution':
        exercises.push(`Practice distinguishing ${letters.join(' vs ')}`);
        exercises.push('Slow, deliberate typing drills');
        break;
      case 'omission':
        exercises.push(`Focus on ${letters.join(', ')} key placement`);
        exercises.push('Rhythm and timing exercises');
        break;
      case 'insertion':
        exercises.push('Accuracy over speed drills');
        exercises.push('Finger independence exercises');
        break;
      case 'transposition':
        exercises.push('Letter sequence practice');
        exercises.push('Common word drills');
        break;
    }
    
    return exercises;
  }
}

// Export singleton instance
export const letterAnalyticsCalculator = new LetterAnalyticsCalculator();
