// Core statistics interfaces
export interface TypingSession {
  id: string;
  userId: string;
  layoutId: string;
  lessonId?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  textLength: number;
  wpm: number;
  accuracy: number;
  correctCharacters: number;
  incorrectCharacters: number;
  totalCharacters: number;
  errorRate: number;
  consistency: number; // variance in typing speed
  keystrokes: KeystrokeData[];
  mistakes: MistakeData[];
  createdAt: Date;
}

export interface KeystrokeData {
  key: string;
  timestamp: number; // relative to session start
  isCorrect: boolean;
  timeSinceLastKey: number;
  expectedKey: string;
  finger: number;
}

export interface MistakeData {
  expectedKey: string;
  actualKey: string;
  position: number;
  timestamp: number;
  finger: number;
  frequency: number; // how often this mistake occurs
}

// Progress tracking interfaces
export interface UserProgress {
  userId: string;
  layoutId: string;
  level: number;
  experience: number;
  totalSessions: number;
  totalPracticeTime: number; // in seconds
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: string[];
  achievements: Achievement[];
  weakKeys: string[];
  strongKeys: string[];
  lastSessionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'consistency' | 'milestone' | 'streak';
  requirement: AchievementRequirement;
  unlockedAt?: Date;
  progress: number; // 0-100
}

export interface AchievementRequirement {
  type: 'wpm' | 'accuracy' | 'sessions' | 'streak' | 'time' | 'lessons';
  value: number;
  condition?: 'greater_than' | 'less_than' | 'equal_to';
}

// Analytics interfaces
export interface PerformanceMetrics {
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  startDate: Date;
  endDate: Date;
  totalSessions: number;
  totalPracticeTime: number;
  averageWpm: number;
  averageAccuracy: number;
  wpmTrend: TrendData[];
  accuracyTrend: TrendData[];
  consistencyScore: number;
  improvementRate: number; // percentage improvement
  mostCommonMistakes: MistakeFrequency[];
  keyPerformance: KeyPerformance[];
  sessionDistribution: SessionDistribution[];
}

export interface TrendData {
  date: Date;
  value: number;
  sessionCount: number;
}

export interface MistakeFrequency {
  expectedKey: string;
  actualKey: string;
  count: number;
  percentage: number;
  finger: number;
  improvement: number; // trend over time
}

export interface KeyPerformance {
  key: string;
  finger: number;
  averageTime: number; // milliseconds
  accuracy: number;
  frequency: number; // how often typed
  difficulty: 'easy' | 'medium' | 'hard';
  improvement: number;
}

export interface SessionDistribution {
  hour: number;
  dayOfWeek: number;
  sessionCount: number;
  averagePerformance: number;
}

// Learning analytics interfaces
export interface LearningInsights {
  userId: string;
  layoutId: string;
  overallProgress: number; // 0-100
  currentLevel: number;
  nextMilestone: Milestone;
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  learningVelocity: number; // improvement rate
  practiceConsistency: number; // regularity score
  focusAreas: FocusArea[];
  estimatedTimeToGoal: number; // days
  confidenceScore: number; // 0-100
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetWpm: number;
  targetAccuracy: number;
  requiredLessons: string[];
  estimatedTime: number; // hours
  progress: number; // 0-100
}

export interface Recommendation {
  id: string;
  type: 'lesson' | 'practice' | 'technique' | 'break';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionText: string;
  actionUrl?: string;
  estimatedTime: number; // minutes
  expectedImprovement: string;
}

export interface FocusArea {
  category: 'speed' | 'accuracy' | 'consistency' | 'specific_keys' | 'finger_strength';
  keys?: string[];
  currentScore: number;
  targetScore: number;
  priority: number; // 1-10
  exercises: string[];
}

// Statistics calculation interfaces
export interface StatisticsCalculator {
  calculateWpm(characters: number, timeInSeconds: number, errors: number): number;
  calculateAccuracy(correct: number, total: number): number;
  calculateConsistency(keystrokeTimes: number[]): number;
  calculateErrorRate(errors: number, total: number): number;
  calculateImprovement(oldValue: number, newValue: number): number;
  calculateLearningVelocity(sessions: TypingSession[]): number;
  calculateConfidenceScore(accuracy: number, consistency: number, experience: number): number;
}

// Database interfaces
export interface StatisticsRepository {
  saveSession(session: TypingSession): Promise<void>;
  getUserProgress(userId: string, layoutId: string): Promise<UserProgress | null>;
  updateUserProgress(progress: UserProgress): Promise<void>;
  getPerformanceMetrics(userId: string, layoutId: string, period: string): Promise<PerformanceMetrics>;
  getLearningInsights(userId: string, layoutId: string): Promise<LearningInsights>;
  getUserSessions(userId: string, layoutId: string, limit?: number): Promise<TypingSession[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;
}

// Letter-specific analytics interfaces
export interface LetterAnalytics {
  letter: string;
  finger: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  errorCount: number;
  errorRate: number;
  commonMistakes: LetterMistake[];
  improvementTrend: number; // percentage change over time
  difficultyScore: number; // 0-100, higher = more difficult
  practiceRecommendation: 'high' | 'medium' | 'low';
}

export interface LetterMistake {
  expectedLetter: string;
  typedLetter: string;
  frequency: number;
  percentage: number;
  lastOccurrence: Date;
  finger: number;
  position: 'same_finger' | 'adjacent_finger' | 'different_hand' | 'random';
}

export interface ErrorPattern {
  id: string;
  type: 'substitution' | 'omission' | 'insertion' | 'transposition';
  description: string;
  frequency: number;
  affectedLetters: string[];
  suggestedExercises: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AdaptiveTraining {
  userId: string;
  layoutId: string;
  generatedAt: Date;
  focusLetters: string[];
  errorPatterns: ErrorPattern[];
  customExercises: CustomExercise[];
  estimatedPracticeTime: number; // minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  priority: 'high' | 'medium' | 'low';
}

export interface CustomExercise {
  id: string;
  name: string;
  description: string;
  type: 'letter_drill' | 'word_practice' | 'sentence_practice' | 'pattern_practice';
  content: string;
  targetLetters: string[];
  estimatedTime: number; // minutes
  difficulty: number; // 1-10
  repetitions: number;
  successCriteria: {
    minAccuracy: number;
    minWpm: number;
    maxErrors: number;
  };
}

export interface LetterHeatmap {
  letter: string;
  finger: number;
  row: number;
  column: number;
  errorIntensity: number; // 0-1, higher = more errors
  speedIntensity: number; // 0-1, higher = slower
  practiceNeeded: boolean;
  color: string; // hex color for visualization
}

export interface FingerAnalytics {
  finger: number;
  fingerName: string;
  hand: 'left' | 'right';
  assignedKeys: string[];
  totalKeystrokes: number;
  averageAccuracy: number;
  averageSpeed: number;
  errorCount: number;
  strongestKeys: string[];
  weakestKeys: string[];
  improvementTrend: number;
  recommendedExercises: string[];
}

// Enhanced performance metrics with letter analytics
export interface EnhancedPerformanceMetrics extends PerformanceMetrics {
  letterAnalytics: LetterAnalytics[];
  fingerAnalytics: FingerAnalytics[];
  errorPatterns: ErrorPattern[];
  letterHeatmap: LetterHeatmap[];
  adaptiveTraining: AdaptiveTraining;
  weakestLetters: string[];
  strongestLetters: string[];
  improvementPriority: string[];
}

// Training generation interfaces
export interface TrainingGenerator {
  generateAdaptiveTraining(
    userId: string,
    layoutId: string,
    sessions: TypingSession[]
  ): Promise<AdaptiveTraining>;

  generateLetterDrills(
    targetLetters: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): CustomExercise[];

  generateWordPractice(
    targetLetters: string[],
    wordCount: number
  ): CustomExercise;

  generateSentencePractice(
    targetLetters: string[],
    sentenceCount: number
  ): CustomExercise;

  analyzeErrorPatterns(mistakes: MistakeData[]): ErrorPattern[];

  calculateLetterDifficulty(
    letter: string,
    sessions: TypingSession[]
  ): number;
}

// Export utility types
export type StatisticsPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
export type AchievementCategory = 'speed' | 'accuracy' | 'consistency' | 'milestone' | 'streak';
export type RecommendationType = 'lesson' | 'practice' | 'technique' | 'break';
export type FocusAreaCategory = 'speed' | 'accuracy' | 'consistency' | 'specific_keys' | 'finger_strength';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type Priority = 'low' | 'medium' | 'high';
export type ExerciseType = 'letter_drill' | 'word_practice' | 'sentence_practice' | 'pattern_practice';
export type ErrorType = 'substitution' | 'omission' | 'insertion' | 'transposition';
export type Hand = 'left' | 'right';
export type MistakePosition = 'same_finger' | 'adjacent_finger' | 'different_hand' | 'random';
