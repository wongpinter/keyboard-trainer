import { 
  TypingSession, 
  AdaptiveTraining, 
  CustomExercise, 
  ErrorPattern,
  LetterAnalytics,
  TrainingGenerator
} from '@/types/statistics';
import { letterAnalyticsCalculator } from './letterAnalytics';

export class AdaptiveTrainingGenerator implements TrainingGenerator {
  
  /**
   * Generate adaptive training based on user performance
   */
  async generateAdaptiveTraining(
    userId: string, 
    layoutId: string, 
    sessions: TypingSession[]
  ): Promise<AdaptiveTraining> {
    
    // Analyze letter performance
    const letterAnalytics = letterAnalyticsCalculator.analyzeLetterPerformance(sessions);
    
    // Identify focus letters (worst performing)
    const focusLetters = letterAnalytics
      .filter(la => la.practiceRecommendation === 'high')
      .slice(0, 8) // Focus on top 8 problem letters
      .map(la => la.letter);

    // Analyze error patterns
    const allMistakes = sessions.flatMap(s => s.mistakes);
    const errorPatterns = letterAnalyticsCalculator.analyzeErrorPatterns(allMistakes);

    // Determine difficulty level
    const averageAccuracy = letterAnalytics.reduce((sum, la) => sum + la.accuracy, 0) / letterAnalytics.length;
    const difficultyLevel = this.determineDifficultyLevel(averageAccuracy, focusLetters.length);

    // Generate custom exercises
    const customExercises = this.generateCustomExercises(focusLetters, errorPatterns, difficultyLevel);

    // Calculate estimated practice time
    const estimatedPracticeTime = customExercises.reduce((sum, ex) => sum + ex.estimatedTime, 0);

    // Determine priority
    const priority = focusLetters.length > 5 ? 'high' : focusLetters.length > 2 ? 'medium' : 'low';

    return {
      userId,
      layoutId,
      generatedAt: new Date(),
      focusLetters,
      errorPatterns: errorPatterns.slice(0, 5), // Top 5 error patterns
      customExercises,
      estimatedPracticeTime,
      difficultyLevel,
      priority
    };
  }

  /**
   * Generate letter drills for specific letters
   */
  generateLetterDrills(
    targetLetters: string[], 
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): CustomExercise[] {
    const exercises: CustomExercise[] = [];

    targetLetters.forEach((letter, index) => {
      // Single letter drill
      const singleLetterDrill = this.createSingleLetterDrill(letter, difficulty);
      exercises.push(singleLetterDrill);

      // Letter combination drill
      if (index < targetLetters.length - 1) {
        const nextLetter = targetLetters[index + 1];
        const combinationDrill = this.createLetterCombinationDrill([letter, nextLetter], difficulty);
        exercises.push(combinationDrill);
      }
    });

    // Multi-letter drill
    if (targetLetters.length > 2) {
      const multiLetterDrill = this.createMultiLetterDrill(targetLetters, difficulty);
      exercises.push(multiLetterDrill);
    }

    return exercises;
  }

  /**
   * Generate word practice exercise
   */
  generateWordPractice(targetLetters: string[], wordCount: number): CustomExercise {
    const words = this.generateWordsWithLetters(targetLetters, wordCount);
    
    return {
      id: `word-practice-${Date.now()}`,
      name: `Word Practice: ${targetLetters.join(', ').toUpperCase()}`,
      description: `Practice common words containing ${targetLetters.join(', ')} letters`,
      type: 'word_practice',
      content: words.join(' '),
      targetLetters,
      estimatedTime: Math.max(5, Math.ceil(wordCount / 10)),
      difficulty: this.calculateWordDifficulty(words),
      repetitions: 3,
      successCriteria: {
        minAccuracy: 90,
        minWpm: 20,
        maxErrors: Math.ceil(words.length * 0.1)
      }
    };
  }

  /**
   * Generate sentence practice exercise
   */
  generateSentencePractice(targetLetters: string[], sentenceCount: number): CustomExercise {
    const sentences = this.generateSentencesWithLetters(targetLetters, sentenceCount);
    
    return {
      id: `sentence-practice-${Date.now()}`,
      name: `Sentence Practice: ${targetLetters.join(', ').toUpperCase()}`,
      description: `Practice sentences emphasizing ${targetLetters.join(', ')} letters`,
      type: 'sentence_practice',
      content: sentences.join(' '),
      targetLetters,
      estimatedTime: Math.max(8, Math.ceil(sentenceCount * 2)),
      difficulty: this.calculateSentenceDifficulty(sentences),
      repetitions: 2,
      successCriteria: {
        minAccuracy: 85,
        minWpm: 25,
        maxErrors: Math.ceil(sentences.join(' ').length * 0.05)
      }
    };
  }

  /**
   * Analyze error patterns from mistakes
   */
  analyzeErrorPatterns(mistakes: any[]): ErrorPattern[] {
    return letterAnalyticsCalculator.analyzeErrorPatterns(mistakes);
  }

  /**
   * Calculate letter difficulty
   */
  calculateLetterDifficulty(letter: string, sessions: TypingSession[]): number {
    const letterAnalytics = letterAnalyticsCalculator.analyzeLetterPerformance(sessions);
    const letterData = letterAnalytics.find(la => la.letter === letter);
    return letterData?.difficultyScore || 50;
  }

  // Private helper methods

  private determineDifficultyLevel(averageAccuracy: number, problemLetterCount: number): 'beginner' | 'intermediate' | 'advanced' {
    if (averageAccuracy < 70 || problemLetterCount > 6) return 'beginner';
    if (averageAccuracy < 85 || problemLetterCount > 3) return 'intermediate';
    return 'advanced';
  }

  private generateCustomExercises(
    focusLetters: string[], 
    errorPatterns: ErrorPattern[], 
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): CustomExercise[] {
    const exercises: CustomExercise[] = [];

    // Letter drills
    const letterDrills = this.generateLetterDrills(focusLetters, difficulty);
    exercises.push(...letterDrills);

    // Word practice
    if (focusLetters.length > 0) {
      const wordPractice = this.generateWordPractice(focusLetters, 20);
      exercises.push(wordPractice);
    }

    // Sentence practice
    if (difficulty !== 'beginner' && focusLetters.length > 0) {
      const sentencePractice = this.generateSentencePractice(focusLetters, 5);
      exercises.push(sentencePractice);
    }

    // Error pattern specific exercises
    errorPatterns.forEach(pattern => {
      const patternExercise = this.createErrorPatternExercise(pattern);
      exercises.push(patternExercise);
    });

    return exercises;
  }

  private createSingleLetterDrill(letter: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): CustomExercise {
    const repetitions = difficulty === 'beginner' ? 20 : difficulty === 'intermediate' ? 15 : 10;
    const content = Array(repetitions).fill(letter).join(' ');

    return {
      id: `single-letter-${letter}-${Date.now()}`,
      name: `${letter.toUpperCase()} Key Drill`,
      description: `Focus on the ${letter.toUpperCase()} key`,
      type: 'letter_drill',
      content,
      targetLetters: [letter],
      estimatedTime: 2,
      difficulty: difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7,
      repetitions: 5,
      successCriteria: {
        minAccuracy: 95,
        minWpm: 15,
        maxErrors: 2
      }
    };
  }

  private createLetterCombinationDrill(letters: string[], difficulty: 'beginner' | 'intermediate' | 'advanced'): CustomExercise {
    const combinations = [];
    for (let i = 0; i < letters.length; i++) {
      for (let j = 0; j < letters.length; j++) {
        if (i !== j) {
          combinations.push(letters[i] + letters[j]);
        }
      }
    }

    const repetitions = difficulty === 'beginner' ? 10 : difficulty === 'intermediate' ? 8 : 6;
    const content = Array(repetitions).fill(combinations.join(' ')).join(' ');

    return {
      id: `combination-${letters.join('')}-${Date.now()}`,
      name: `${letters.join(', ').toUpperCase()} Combination Drill`,
      description: `Practice ${letters.join(' and ')} letter combinations`,
      type: 'letter_drill',
      content,
      targetLetters: letters,
      estimatedTime: 3,
      difficulty: difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 6 : 8,
      repetitions: 3,
      successCriteria: {
        minAccuracy: 90,
        minWpm: 18,
        maxErrors: 3
      }
    };
  }

  private createMultiLetterDrill(letters: string[], difficulty: 'beginner' | 'intermediate' | 'advanced'): CustomExercise {
    const patterns = this.generateLetterPatterns(letters);
    const content = patterns.join(' ');

    return {
      id: `multi-letter-${letters.join('')}-${Date.now()}`,
      name: `${letters.join(', ').toUpperCase()} Pattern Practice`,
      description: `Practice patterns with ${letters.join(', ')} letters`,
      type: 'pattern_practice',
      content,
      targetLetters: letters,
      estimatedTime: 5,
      difficulty: difficulty === 'beginner' ? 5 : difficulty === 'intermediate' ? 7 : 9,
      repetitions: 2,
      successCriteria: {
        minAccuracy: 85,
        minWpm: 22,
        maxErrors: 5
      }
    };
  }

  private createErrorPatternExercise(pattern: ErrorPattern): CustomExercise {
    const content = this.generatePatternSpecificContent(pattern);

    return {
      id: `error-pattern-${pattern.id}`,
      name: `Fix: ${pattern.description}`,
      description: `Address ${pattern.type} errors with ${pattern.affectedLetters.join(', ')}`,
      type: 'pattern_practice',
      content,
      targetLetters: pattern.affectedLetters,
      estimatedTime: 4,
      difficulty: pattern.difficulty === 'beginner' ? 4 : pattern.difficulty === 'intermediate' ? 6 : 8,
      repetitions: 3,
      successCriteria: {
        minAccuracy: 88,
        minWpm: 20,
        maxErrors: 4
      }
    };
  }

  private generateWordsWithLetters(letters: string[], count: number): string[] {
    // Simplified word generation - in a real app, this would use a dictionary
    const commonWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
      'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
      'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
    ];

    const wordsWithTargetLetters = commonWords.filter(word => 
      letters.some(letter => word.includes(letter))
    );

    // Repeat words to reach desired count
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(wordsWithTargetLetters[i % wordsWithTargetLetters.length]);
    }

    return result;
  }

  private generateSentencesWithLetters(letters: string[], count: number): string[] {
    // Simplified sentence generation
    const templates = [
      'The quick brown fox jumps over the lazy dog.',
      'She sells seashells by the seashore.',
      'A journey of a thousand miles begins with a single step.',
      'Practice makes perfect when you focus on accuracy.',
      'Every expert was once a beginner who never gave up.'
    ];

    const sentences = [];
    for (let i = 0; i < count; i++) {
      sentences.push(templates[i % templates.length]);
    }

    return sentences;
  }

  private generateLetterPatterns(letters: string[]): string[] {
    const patterns = [];
    
    // Create various patterns
    patterns.push(letters.join(''));
    patterns.push(letters.reverse().join(''));
    patterns.push(letters.join(' '));
    
    // Alternating patterns
    for (let i = 0; i < letters.length - 1; i++) {
      patterns.push(letters[i] + letters[i + 1] + letters[i]);
    }

    return patterns;
  }

  private generatePatternSpecificContent(pattern: ErrorPattern): string {
    const letters = pattern.affectedLetters;
    
    switch (pattern.type) {
      case 'substitution':
        return letters.map(l => `${l} ${l} ${l}`).join(' ');
      case 'omission':
        return letters.map(l => `${l}${l}${l}`).join(' ');
      case 'insertion':
        return letters.map(l => `${l} ${l} ${l}`).join(' ');
      case 'transposition':
        return letters.length > 1 ? 
          `${letters[0]}${letters[1]} ${letters[1]}${letters[0]}`.repeat(5) :
          letters[0].repeat(10);
      default:
        return letters.join(' ').repeat(10);
    }
  }

  private calculateWordDifficulty(words: string[]): number {
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    return Math.min(10, Math.max(1, Math.ceil(avgLength / 2)));
  }

  private calculateSentenceDifficulty(sentences: string[]): number {
    const avgLength = sentences.reduce((sum, sentence) => sum + sentence.length, 0) / sentences.length;
    return Math.min(10, Math.max(3, Math.ceil(avgLength / 20)));
  }
}

// Export singleton instance
export const adaptiveTrainingGenerator = new AdaptiveTrainingGenerator();
