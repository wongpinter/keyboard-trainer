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
        streakDays: 0 // TODO: Calculate actual streak
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
        lessonProgress: [], // TODO: Implement
        weakAreas: [], // TODO: Implement
        strongAreas: [], // TODO: Implement
        timeDistribution: [], // TODO: Implement
        difficultyProgression: [] // TODO: Implement
      };

      return { data: analytics, error: null };
    });
  }
}

// Export singleton instance
export const databaseService = new SupabaseDatabaseService();
export default databaseService;
