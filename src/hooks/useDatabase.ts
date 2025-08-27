import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { databaseService } from '@/services/database';
import {
  ExtendedCurriculum,
  ExtendedUserProgress,
  ExtendedTypingSession,
  UserStatistics,
  ProgressAnalytics,
  UseCurriculumsResult,
  UseUserProgressResult,
  UseTypingSessionsResult,
  QueryOptions,
  CurriculumInsert,
  UserProgressUpdate,
  TypingSessionInsert
} from '@/types/database';
import { useToast } from '@/hooks/use-toast';

// Hook for managing curriculums
export const useCurriculums = (options: QueryOptions = {}): UseCurriculumsResult => {
  const { toast } = useToast();
  
  const {
    data: curriculums = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['curriculums', options],
    queryFn: async () => {
      const result = await databaseService.getCurriculums(options);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    curriculums,
    loading,
    error: error?.message || null,
    refetch
  };
};

// Hook for managing user progress
export const useUserProgress = (userId: string, curriculumId?: string): UseUserProgressResult => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: progress = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['userProgress', userId, curriculumId],
    queryFn: async () => {
      const result = await databaseService.getUserProgress(userId, curriculumId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ curriculumId, updates }: { curriculumId: string; updates: UserProgressUpdate }) => {
      const result = await databaseService.updateUserProgress(userId, curriculumId, updates);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress', userId] });
      toast({
        title: "Progress Updated",
        description: "Your progress has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Progress",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateProgress = useCallback(
    (curriculumId: string, updates: UserProgressUpdate) => {
      return updateProgressMutation.mutateAsync({ curriculumId, updates });
    },
    [updateProgressMutation]
  );

  return {
    progress,
    loading,
    error: error?.message || null,
    updateProgress
  };
};

// Hook for managing typing sessions
export const useTypingSessions = (userId: string, options: QueryOptions = {}): UseTypingSessionsResult => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: sessions = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['typingSessions', userId, options],
    queryFn: async () => {
      const result = await databaseService.getUserSessions(userId, options);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const createSessionMutation = useMutation({
    mutationFn: async (session: TypingSessionInsert) => {
      const result = await databaseService.createSession(session);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['typingSessions', userId] });
      queryClient.invalidateQueries({ queryKey: ['userProgress', userId] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics', userId] });
      queryClient.invalidateQueries({ queryKey: ['userAchievements', userId] });

      // Check for newly unlocked achievements
      try {
        await databaseService.checkAndUnlockAchievements(userId);
      } catch (error) {
        console.error('Error checking achievements after session:', error);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Session",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createSession = useCallback(
    (session: TypingSessionInsert) => {
      return createSessionMutation.mutateAsync(session);
    },
    [createSessionMutation]
  );

  return {
    sessions,
    loading,
    error: error?.message || null,
    createSession
  };
};

// Hook for user statistics
export const useUserStatistics = (userId: string) => {
  const {
    data: statistics,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userStatistics', userId],
    queryFn: async () => {
      const result = await databaseService.getUserStatistics(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    statistics,
    loading,
    error: error?.message || null,
    refetch
  };
};

// Hook for progress analytics
export const useProgressAnalytics = (userId: string, timeframe = '30d') => {
  const {
    data: analytics,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['progressAnalytics', userId, timeframe],
    queryFn: async () => {
      const result = await databaseService.getProgressAnalytics(userId, timeframe);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    analytics,
    loading,
    error: error?.message || null,
    refetch
  };
};

// Hook for authentication state
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};

// Hook for user achievements
export const useUserAchievements = (userId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: achievements = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userAchievements', userId],
    queryFn: async () => {
      const result = await databaseService.getUserAchievements(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to check and unlock achievements
  const checkAchievementsMutation = useMutation({
    mutationFn: async () => {
      const result = await databaseService.checkAndUnlockAchievements(userId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    onSuccess: (newlyUnlocked) => {
      if (newlyUnlocked.length > 0) {
        // Show toast for newly unlocked achievements
        newlyUnlocked.forEach(achievement => {
          toast({
            title: "🎉 Achievement Unlocked!",
            description: `${achievement.name}: ${achievement.description}`,
            duration: 5000,
          });
        });

        // Invalidate achievements query to refresh data
        queryClient.invalidateQueries({ queryKey: ['userAchievements', userId] });
      }
    },
    onError: (error: Error) => {
      console.error('Error checking achievements:', error);
    }
  });

  const checkAchievements = useCallback(() => {
    if (userId) {
      checkAchievementsMutation.mutate();
    }
  }, [userId, checkAchievementsMutation]);

  return {
    achievements,
    loading,
    error: error?.message || null,
    refetch,
    checkAchievements,
    isCheckingAchievements: checkAchievementsMutation.isPending
  };
};

// Hook for creating curriculums (admin/teacher functionality)
export const useCreateCurriculum = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (curriculum: CurriculumInsert) => {
      const result = await databaseService.createCurriculum(curriculum);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
      toast({
        title: "Curriculum Created",
        description: "New curriculum has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Curriculum",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

// Hook for offline/online state management
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addPendingOperation = useCallback((operation: any) => {
    if (!isOnline) {
      setPendingOperations(prev => [...prev, operation]);
    }
  }, [isOnline]);

  const syncPendingOperations = useCallback(async () => {
    if (isOnline && pendingOperations.length > 0) {
      // Sync logic would be implemented here for offline functionality
      console.log('Syncing pending operations:', pendingOperations);
      setPendingOperations([]);
    }
  }, [isOnline, pendingOperations]);

  useEffect(() => {
    if (isOnline) {
      syncPendingOperations();
    }
  }, [isOnline, syncPendingOperations]);

  return {
    isOnline,
    pendingOperations: pendingOperations.length,
    addPendingOperation,
    syncPendingOperations
  };
};
