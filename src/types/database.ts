import { Database } from '@/integrations/supabase/types';

// Re-export Supabase types for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Database table types
export type Profile = Tables<'profiles'>;
export type KeyboardLayoutDB = Tables<'keyboard_layouts'>;
export type CurriculumDB = Tables<'curriculums'>;
export type UserProgress = Tables<'user_progress'>;
export type TypingSession = Tables<'typing_sessions'>;

// Insert types
export type ProfileInsert = TablesInsert<'profiles'>;
export type KeyboardLayoutInsert = TablesInsert<'keyboard_layouts'>;
export type CurriculumInsert = TablesInsert<'curriculums'>;
export type UserProgressInsert = TablesInsert<'user_progress'>;
export type TypingSessionInsert = TablesInsert<'typing_sessions'>;

// Update types
export type ProfileUpdate = TablesUpdate<'profiles'>;
export type KeyboardLayoutUpdate = TablesUpdate<'keyboard_layouts'>;
export type CurriculumUpdate = TablesUpdate<'curriculums'>;
export type UserProgressUpdate = TablesUpdate<'user_progress'>;
export type TypingSessionUpdate = TablesUpdate<'typing_sessions'>;

// Extended types for our application
export interface ExtendedCurriculum extends Omit<CurriculumDB, 'lessons'> {
  lessons: TrainingLessonDB[];
  keyboard_layout?: KeyboardLayoutDB;
}

export interface ExtendedUserProgress extends UserProgress {
  curriculum?: CurriculumDB;
}

export interface ExtendedTypingSession extends TypingSession {
  curriculum?: CurriculumDB;
}

// Training lesson structure for database storage
export interface TrainingLessonDB {
  id: string;
  name: string;
  description: string;
  type: 'words' | 'sentences' | 'mixed' | 'bigrams';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusKeys: string[];
  content: string[];
  minAccuracy: number;
  minWpm: number;
  estimatedMinutes?: number;
  tags?: string[];
}

// Curriculum metadata for database storage
export interface CurriculumMetadata {
  trainingTips?: string[];
  prerequisites?: string[];
  objectives?: string[];
  category?: string;
  version?: string;
}

// User statistics aggregated from sessions
export interface UserStatistics {
  totalSessions: number;
  totalPracticeTime: number; // in seconds
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  totalCharacters: number;
  totalCorrectCharacters: number;
  totalIncorrectCharacters: number;
  improvementRate: number; // WPM improvement per week
  consistencyScore: number; // 0-100 based on session regularity
  lastActiveDate: string;
  firstSessionDate: string;
  streakDays: number;
}

// Progress analytics
export interface ProgressAnalytics {
  wpmHistory: Array<{ date: string; wpm: number; accuracy: number }>;
  lessonProgress: Array<{ lessonId: string; completed: boolean; masteryLevel: number; attempts: number }>;
  weakAreas: Array<{ key: string; errorRate: number; frequency: number }>;
  strongAreas: Array<{ key: string; accuracy: number; speed: number }>;
  timeDistribution: Array<{ hour: number; sessions: number; totalTime: number }>;
  difficultyProgression: Array<{ difficulty: string; averageWpm: number; averageAccuracy: number }>;
}

// Achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'consistency' | 'milestone' | 'special';
  criteria: {
    type: 'wpm' | 'accuracy' | 'sessions' | 'time' | 'streak' | 'lesson_completion';
    threshold: number;
    timeframe?: 'session' | 'day' | 'week' | 'month' | 'all_time';
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
  progress: number; // 0-100
  isCompleted: boolean;
}

// Session recording for detailed analysis
export interface DetailedSession {
  id: string;
  userId: string;
  curriculumId: string;
  lessonId: string;
  startTime: string;
  endTime: string;
  practiceText: string;
  typedText: string;
  keystrokes: Array<{
    key: string;
    timestamp: number;
    correct: boolean;
    expectedKey: string;
    position: number;
  }>;
  mistakes: Array<{
    expectedKey: string;
    actualKey: string;
    position: number;
    timestamp: number;
    finger: number;
    frequency: number;
  }>;
  wpmHistory: Array<{ timestamp: number; wpm: number }>;
  accuracyHistory: Array<{ timestamp: number; accuracy: number }>;
  finalStats: {
    wpm: number;
    accuracy: number;
    totalCharacters: number;
    correctCharacters: number;
    incorrectCharacters: number;
    practiceTime: number;
  };
}

// API response types
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

// Service interfaces
export interface DatabaseService {
  // Curriculum operations
  getCurriculums(options?: QueryOptions): Promise<DatabaseResponse<ExtendedCurriculum[]>>;
  getCurriculumById(id: string): Promise<DatabaseResponse<ExtendedCurriculum>>;
  createCurriculum(curriculum: CurriculumInsert): Promise<DatabaseResponse<CurriculumDB>>;
  updateCurriculum(id: string, updates: CurriculumUpdate): Promise<DatabaseResponse<CurriculumDB>>;
  deleteCurriculum(id: string): Promise<DatabaseResponse<void>>;

  // User progress operations
  getUserProgress(userId: string, curriculumId?: string): Promise<DatabaseResponse<ExtendedUserProgress[]>>;
  updateUserProgress(userId: string, curriculumId: string, progress: UserProgressUpdate): Promise<DatabaseResponse<UserProgress>>;
  
  // Session operations
  createSession(session: TypingSessionInsert): Promise<DatabaseResponse<TypingSession>>;
  getUserSessions(userId: string, options?: QueryOptions): Promise<DatabaseResponse<ExtendedTypingSession[]>>;
  
  // Statistics operations
  getUserStatistics(userId: string): Promise<DatabaseResponse<UserStatistics>>;
  getProgressAnalytics(userId: string, timeframe?: string): Promise<DatabaseResponse<ProgressAnalytics>>;

  // Achievement operations
  getUserAchievements(userId: string): Promise<DatabaseResponse<any[]>>;
  calculateStreakDays(userId: string): Promise<number>;
  calculateLongestStreak(userId: string): Promise<number>;
  unlockAchievement(userId: string, achievementId: string): Promise<DatabaseResponse<any>>;
  checkAndUnlockAchievements(userId: string): Promise<DatabaseResponse<any[]>>;
}

// Hook return types
export interface UseCurriculumsResult {
  curriculums: ExtendedCurriculum[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseUserProgressResult {
  progress: ExtendedUserProgress[];
  loading: boolean;
  error: string | null;
  updateProgress: (curriculumId: string, updates: UserProgressUpdate) => Promise<void>;
}

export interface UseTypingSessionsResult {
  sessions: ExtendedTypingSession[];
  loading: boolean;
  error: string | null;
  createSession: (session: TypingSessionInsert) => Promise<void>;
}

// Error types
export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
  hint?: string;
}

// Migration types
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  warnings: string[];
}

export interface MigrationOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  validateOnly?: boolean;
}
