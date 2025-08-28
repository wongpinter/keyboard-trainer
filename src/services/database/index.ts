import { supabase } from '@/integrations/supabase/client';
import {
  DatabaseResponse,
  ExtendedCurriculum,
  ExtendedUserProgress,
  ExtendedTypingSession,
  CurriculumInsert,
  CurriculumUpdate,
  UserProgressUpdate,
  TypingSessionInsert,
  QueryOptions,
  UserStatistics,
  ProgressAnalytics,
  DatabaseService,
  DatabaseError,
  TrainingLessonDB
} from '@/types/database';

class SupabaseDatabaseService implements DatabaseService {
  private handleError(error: any): DatabaseError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.details,
      hint: error.hint
    };
  }

  private async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<DatabaseResponse<T>> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        console.error('Database query error:', error);
        return {
          data: null,
          error: this.handleError(error).message,
          loading: false
        };
      }

      return {
        data,
        error: null,
        loading: false
      };
    } catch (err) {
      console.error('Database service error:', err);
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        loading: false
      };
    }
  }

  // Curriculum operations
  async getCurriculums(options: QueryOptions = {}): Promise<DatabaseResponse<ExtendedCurriculum[]>> {
    return this.executeQuery(async () => {
      let query = supabase
        .from('curriculums')
        .select(`
          *,
          keyboard_layout:keyboard_layouts(*)
        `);

      // Apply filters
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          query = (query as any).eq(key, value);
        }
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) return { data: null, error };

      // Transform the data to match our extended type
      const transformedData = (data || []).map(curriculum => ({
        ...curriculum,
        lessons: Array.isArray(curriculum.lessons) ? curriculum.lessons as unknown as TrainingLessonDB[] : []
      })) as ExtendedCurriculum[];

      return { data: transformedData, error: null };
    });
  }

  async getCurriculumById(id: string): Promise<DatabaseResponse<ExtendedCurriculum>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('curriculums')
        .select(`
          *,
          keyboard_layout:keyboard_layouts(*)
        `)
        .eq('id', id)
        .single();

      if (error) return { data: null, error };

      const transformedData = {
        ...data,
        lessons: Array.isArray(data.lessons) ? data.lessons as unknown as TrainingLessonDB[] : []
      } as ExtendedCurriculum;

      return { data: transformedData, error: null };
    });
  }

  async createCurriculum(curriculum: CurriculumInsert): Promise<DatabaseResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('curriculums')
        .insert(curriculum)
        .select()
        .single();
    });
  }

  async updateCurriculum(id: string, updates: CurriculumUpdate): Promise<DatabaseResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('curriculums')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async deleteCurriculum(id: string): Promise<DatabaseResponse<void>> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('curriculums')
        .delete()
        .eq('id', id);
      
      return { data: undefined, error };
    });
  }

  // User progress operations
  async getUserProgress(userId: string, curriculumId?: string): Promise<DatabaseResponse<ExtendedUserProgress[]>> {
    return this.executeQuery(async () => {
      let query = supabase
        .from('user_progress')
        .select(`
          *,
          curriculum:curriculums(*)
        `)
        .eq('user_id', userId);

      if (curriculumId) {
        query = query.eq('curriculum_id', curriculumId);
      }

      const { data, error } = await query;
      return { data: data as ExtendedUserProgress[] || [], error };
    });
  }

  async updateUserProgress(
    userId: string,
    curriculumId: string,
    progress: UserProgressUpdate
  ): Promise<DatabaseResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          curriculum_id: curriculumId,
          ...progress
        }, {
          onConflict: 'user_id,curriculum_id'
        })
        .select()
        .single();
    });
  }

  // Session operations
  async createSession(session: TypingSessionInsert): Promise<DatabaseResponse<any>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('typing_sessions')
        .insert(session)
        .select()
        .single();
    });
  }

  async getUserSessions(userId: string, options: QueryOptions = {}): Promise<DatabaseResponse<ExtendedTypingSession[]>> {
    return this.executeQuery(async () => {
      let query = supabase
        .from('typing_sessions')
        .select(`
          *,
          curriculum:curriculums(*)
        `)
        .eq('user_id', userId);

      // Apply ordering (default to most recent first)
      query = query.order(options.orderBy || 'created_at', { 
        ascending: options.ascending ?? false 
      });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      return { data: data as ExtendedTypingSession[] || [], error };
    });
  }

  // Statistics operations
  async getUserStatistics(userId: string): Promise<DatabaseResponse<UserStatistics>> {
    return this.executeQuery(async () => {
      // Get all sessions for the user
      const { data: sessions, error } = await supabase
        .from('typing_sessions')
        .select('*')
        .eq('user_id', userId);

      if (error) return { data: null, error };

      if (!sessions || sessions.length === 0) {
        const emptyStats: UserStatistics = {
          totalSessions: 0,
          totalPracticeTime: 0,
          averageWpm: 0,
          averageAccuracy: 0,
          bestWpm: 0,
          bestAccuracy: 0,
          totalCharacters: 0,
          totalCorrectCharacters: 0,
          totalIncorrectCharacters: 0,
          improvementRate: 0,
          consistencyScore: 0,
          lastActiveDate: new Date().toISOString(),
          firstSessionDate: new Date().toISOString(),
          streakDays: 0
        };
        return { data: emptyStats, error: null };
      }

      // Calculate statistics (convert string numbers to actual numbers)
      const totalSessions = sessions.length;
      const totalPracticeTime = sessions.reduce((sum, s) => sum + s.practice_time, 0);
      const totalCharacters = sessions.reduce((sum, s) => sum + s.total_characters, 0);
      const totalCorrectCharacters = sessions.reduce((sum, s) => sum + s.correct_characters, 0);
      const totalIncorrectCharacters = sessions.reduce((sum, s) => sum + s.incorrect_characters, 0);

      const averageWpm = sessions.reduce((sum, s) => sum + parseFloat(s.wpm.toString()), 0) / totalSessions;
      const averageAccuracy = sessions.reduce((sum, s) => sum + parseFloat(s.accuracy.toString()), 0) / totalSessions;
      const bestWpm = Math.max(...sessions.map(s => parseFloat(s.wpm.toString())));
      const bestAccuracy = Math.max(...sessions.map(s => parseFloat(s.accuracy.toString())));
      
      const lastActiveDate = sessions[0]?.created_at || new Date().toISOString();

      // Calculate improvement rate (simplified)
      const improvementRate = sessions.length > 1 ?
        (parseFloat(sessions[0].wpm.toString()) - parseFloat(sessions[sessions.length - 1].wpm.toString())) / sessions.length : 0;

      // Calculate consistency score (simplified)
      const wpmVariance = sessions.reduce((sum, s) => sum + Math.pow(parseFloat(s.wpm.toString()) - averageWpm, 2), 0) / totalSessions;
      const consistencyScore = averageWpm > 0 ? Math.max(0, 100 - (wpmVariance / averageWpm) * 100) : 0;

      const statistics: UserStatistics = {
        totalSessions,
        totalPracticeTime,
        averageWpm: Math.round(averageWpm * 100) / 100,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        bestWpm: Math.round(bestWpm * 100) / 100,
        bestAccuracy: Math.round(bestAccuracy * 100) / 100,
        totalCharacters,
        totalCorrectCharacters,
        totalIncorrectCharacters,
        improvementRate: Math.round(improvementRate * 100) / 100,
        consistencyScore: Math.round(consistencyScore * 100) / 100,
        lastActiveDate,
        firstSessionDate: sessions[sessions.length - 1]?.created_at || lastActiveDate,
        streakDays: await this.calculateStreakDays(userId)
      };

      return { data: statistics, error: null };
    });
  }

  async getProgressAnalytics(userId: string, _timeframe = '30d'): Promise<DatabaseResponse<ProgressAnalytics>> {
    return this.executeQuery(async () => {
      // This is a simplified implementation
      // In a real app, you'd want more sophisticated analytics
      const { data: sessions, error } = await supabase
        .from('typing_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) return { data: null, error };

      const analytics: ProgressAnalytics = {
        wpmHistory: (sessions || []).map(s => ({
          date: s.created_at,
          wpm: s.wpm,
          accuracy: s.accuracy
        })),
        lessonProgress: [], // Will be populated when lesson tracking is implemented
        weakAreas: [], // Will be calculated from letter analytics
        strongAreas: [], // Will be calculated from letter analytics
        timeDistribution: [], // Will be calculated from session timestamps
        difficultyProgression: [] // Will be calculated from lesson difficulty progression
      };

      return { data: analytics, error: null };
    });
  }

  // Calculate consecutive practice days (streak)
  async calculateStreakDays(userId: string): Promise<number> {
    try {
      const { data: sessions, error } = await supabase
        .from('typing_sessions')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !sessions || sessions.length === 0) {
        return 0;
      }

      // Group sessions by date
      const sessionDates = new Set<string>();
      sessions.forEach(session => {
        const date = session.created_at.split('T')[0];
        sessionDates.add(date);
      });

      const sortedDates = Array.from(sessionDates).sort().reverse();

      if (sortedDates.length === 0) return 0;

      // Check if user practiced today or yesterday
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let streak = 0;
      let currentDate = today;

      // Start counting from today if practiced today, otherwise from yesterday
      if (sortedDates.includes(today)) {
        streak = 1;
        currentDate = yesterday;
      } else if (sortedDates.includes(yesterday)) {
        streak = 1;
        currentDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
      } else {
        return 0; // No recent practice
      }

      // Count consecutive days backwards
      for (const date of sortedDates) {
        if (date === currentDate) {
          streak++;
          const prevDate = new Date(new Date(currentDate).getTime() - 86400000);
          currentDate = prevDate.toISOString().split('T')[0];
        } else if (date < currentDate) {
          break; // Gap found, streak ends
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak days:', error);
      return 0;
    }
  }

  // Calculate longest streak ever achieved
  async calculateLongestStreak(userId: string): Promise<number> {
    try {
      const { data: sessions, error } = await supabase
        .from('typing_sessions')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error || !sessions || sessions.length === 0) {
        return 0;
      }

      // Group sessions by date
      const sessionDates = new Set<string>();
      sessions.forEach(session => {
        const date = session.created_at.split('T')[0];
        sessionDates.add(date);
      });

      const sortedDates = Array.from(sessionDates).sort();

      if (sortedDates.length === 0) return 0;

      let longestStreak = 1;
      let currentStreak = 1;

      // Calculate longest consecutive streak
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currentDate = new Date(sortedDates[i]);
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      return longestStreak;
    } catch (error) {
      console.error('Error calculating longest streak:', error);
      return 0;
    }
  }

  // Get user achievements with progress
  async getUserAchievements(userId: string): Promise<DatabaseResponse<any[]>> {
    return this.executeQuery(async () => {
      // Get achievement templates (global achievements with user_id = null)
      const { data: templates, error: templatesError } = await (supabase as any)
        .from('achievements')
        .select('*')
        .is('user_id', null)
        .order('requirement_value', { ascending: true });

      if (templatesError) return { data: null, error: templatesError };

      // Get user's unlocked achievements
      const { data: userAchievements, error: userError } = await (supabase as any)
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

      if (userError) return { data: null, error: userError };

      // Get user statistics to calculate progress
      const statsResult = await this.getUserStatistics(userId);
      if (statsResult.error || !statsResult.data) {
        return { data: [], error: null };
      }

      const stats = statsResult.data;
      const unlockedMap = new Map();

      // Create map of unlocked achievements
      (userAchievements || []).forEach((ua: any) => {
        const key = `${ua.achievement_type}-${ua.title}`;
        unlockedMap.set(key, ua);
      });

      // Calculate progress for each achievement template
      const achievementsWithProgress = (templates || []).map((template: any) => {
        const key = `${template.achievement_type}-${template.title}`;
        const userAchievement = unlockedMap.get(key);

        let currentProgress = 0;
        let isUnlocked = !!userAchievement;
        const requirementValue = parseFloat(template.requirement_value);

        if (!isUnlocked) {
          // Calculate progress based on requirement type
          switch (template.requirement_type) {
            case 'sessions':
              currentProgress = Math.min(100, (stats.totalSessions / requirementValue) * 100);
              break;
            case 'wpm':
              currentProgress = Math.min(100, (stats.bestWpm / requirementValue) * 100);
              break;
            case 'accuracy':
              currentProgress = Math.min(100, (stats.bestAccuracy / requirementValue) * 100);
              break;
            case 'practice_time':
              const hoursRequired = requirementValue;
              const hoursCompleted = stats.totalPracticeTime / 3600;
              currentProgress = Math.min(100, (hoursCompleted / hoursRequired) * 100);
              break;
            default:
              currentProgress = 0;
          }
        } else {
          currentProgress = 100;
        }

        return {
          id: template.id,
          name: template.title,
          description: template.description,
          icon: template.icon,
          category: template.achievement_type,
          requirement: {
            type: template.requirement_type,
            value: requirementValue
          },
          progress: Math.round(currentProgress),
          unlockedAt: userAchievement ? new Date(userAchievement.unlocked_at) : null,
          rarity: template.rarity,
          points: template.points
        };
      });

      return { data: achievementsWithProgress, error: null };
    });
  }

  // Unlock achievement for user
  async unlockAchievement(userId: string, achievementId: string): Promise<DatabaseResponse<any>> {
    return this.executeQuery(async () => {
      // First get the achievement template
      const { data: template, error: templateError } = await (supabase as any)
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .is('user_id', null)
        .single();

      if (templateError || !template) {
        return { data: null, error: templateError || new Error('Achievement template not found') };
      }

      // Check if user already has this achievement
      const { data: existing } = await (supabase as any)
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_type', template.achievement_type)
        .eq('title', template.title)
        .single();

      if (existing) {
        // Already unlocked
        return { data: existing, error: null };
      }

      // Create user-specific achievement record
      const { data, error } = await (supabase as any)
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_type: template.achievement_type,
          title: template.title,
          description: template.description,
          icon: template.icon,
          badge_color: template.badge_color,
          requirement_type: template.requirement_type,
          requirement_value: template.requirement_value,
          current_progress: 100,
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
          rarity: template.rarity,
          points: template.points
        })
        .select()
        .single();

      if (error) return { data: null, error };
      return { data, error: null };
    });
  }

  // Check and unlock achievements based on user statistics
  async checkAndUnlockAchievements(userId: string): Promise<DatabaseResponse<any[]>> {
    return this.executeQuery(async () => {
      // Get user achievements to see which ones should be unlocked
      const achievementsResult = await this.getUserAchievements(userId);
      if (achievementsResult.error || !achievementsResult.data) {
        return { data: [], error: achievementsResult.error };
      }

      const newlyUnlocked: any[] = [];

      // Check each achievement and unlock if requirements are met
      for (const achievement of achievementsResult.data) {
        if (!achievement.unlockedAt && achievement.progress >= 100) {
          const unlockResult = await this.unlockAchievement(userId, achievement.id);
          if (!unlockResult.error) {
            newlyUnlocked.push({
              ...achievement,
              unlockedAt: new Date(),
              is_unlocked: true
            });
          }
        }
      }

      return { data: newlyUnlocked, error: null };
    });
  }
}

// Export singleton instance
export const databaseService = new SupabaseDatabaseService();
export default databaseService;
