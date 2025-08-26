import { supabase } from '@/integrations/supabase/client';

/**
 * Populate database with sample statistics data for better analytics
 */
export async function populateStatisticsData(userId: string) {
  console.log('🎯 Populating statistics data for user:', userId);

  try {
    // 1. Create sample daily statistics for the last 30 days
    const dailyStats = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate improving performance over time
      const baseWpm = 25 + (29 - i) * 0.5 + Math.random() * 5;
      const baseAccuracy = 85 + (29 - i) * 0.3 + Math.random() * 3;
      
      dailyStats.push({
        user_id: userId,
        date: date.toISOString().split('T')[0],
        total_sessions: Math.floor(Math.random() * 3) + 1,
        total_practice_time: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
        average_wpm: Math.round(baseWpm * 100) / 100,
        best_wpm: Math.round((baseWpm + Math.random() * 8) * 100) / 100,
        average_accuracy: Math.round(baseAccuracy * 100) / 100,
        best_accuracy: Math.round(Math.min(100, baseAccuracy + Math.random() * 5) * 100) / 100,
        total_characters: Math.floor(Math.random() * 2000) + 500,
        total_correct_characters: Math.floor(Math.random() * 1800) + 450,
        total_incorrect_characters: Math.floor(Math.random() * 200) + 50,
        consistency_score: Math.round((75 + Math.random() * 20) * 100) / 100,
        improvement_rate: Math.round((Math.random() * 10 - 2) * 100) / 100
      });
    }

    const { error: dailyError } = await supabase
      .from('daily_statistics')
      .upsert(dailyStats, { onConflict: 'user_id,date' });

    if (dailyError) throw dailyError;
    console.log('✅ Created daily statistics');

    // 2. Create letter statistics for common letters
    const commonLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const letterStats = commonLetters.map((letter, index) => {
      const difficulty = Math.random() * 100;
      const attempts = Math.floor(Math.random() * 500) + 100;
      const correctAttempts = Math.floor(attempts * (0.7 + Math.random() * 0.25));
      
      return {
        user_id: userId,
        letter,
        total_attempts: attempts,
        correct_attempts: correctAttempts,
        total_time_ms: Math.floor(Math.random() * 50000) + 10000,
        average_time_ms: Math.round((150 + Math.random() * 100) * 100) / 100,
        accuracy_percentage: Math.round((correctAttempts / attempts) * 10000) / 100,
        finger_number: index % 10, // Distribute across fingers
        hand: index < 13 ? 'left' : 'right',
        difficulty_score: Math.round(difficulty * 100) / 100,
        improvement_trend: Math.round((Math.random() * 20 - 5) * 100) / 100,
        last_practiced_at: new Date().toISOString()
      };
    });

    const { error: letterError } = await supabase
      .from('letter_statistics')
      .upsert(letterStats, { onConflict: 'user_id,letter' });

    if (letterError) throw letterError;
    console.log('✅ Created letter statistics');

    // 3. Create common mistake patterns
    const commonMistakes = [
      { expected: 'e', actual: 'r', type: 'substitution' },
      { expected: 'i', actual: 'o', type: 'substitution' },
      { expected: 'a', actual: 's', type: 'substitution' },
      { expected: 'n', actual: 'm', type: 'substitution' },
      { expected: 't', actual: 'y', type: 'substitution' },
      { expected: 'h', actual: 'g', type: 'substitution' },
      { expected: 'l', actual: 'k', type: 'substitution' },
      { expected: 'u', actual: 'i', type: 'substitution' },
      { expected: 'c', actual: 'v', type: 'substitution' },
      { expected: 'p', actual: 'o', type: 'substitution' }
    ];

    const mistakePatterns = commonMistakes.map(mistake => ({
      user_id: userId,
      expected_key: mistake.expected,
      actual_key: mistake.actual,
      frequency: Math.floor(Math.random() * 15) + 1,
      context_before: 'the',
      context_after: 'and',
      mistake_type: mistake.type,
      finger_confusion: Math.random() > 0.7,
      hand_confusion: Math.random() > 0.8,
      last_occurred_at: new Date().toISOString()
    }));

    const { error: mistakeError } = await supabase
      .from('mistake_patterns')
      .upsert(mistakePatterns, { onConflict: 'user_id,expected_key,actual_key' });

    if (mistakeError) throw mistakeError;
    console.log('✅ Created mistake patterns');

    // 4. Create performance goals
    const goals = [
      {
        user_id: userId,
        goal_type: 'wpm',
        target_value: 50,
        current_value: 42,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        achieved: false,
        description: 'Reach 50 words per minute',
        priority: 1,
        is_active: true
      },
      {
        user_id: userId,
        goal_type: 'accuracy',
        target_value: 95,
        current_value: 94.2,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        achieved: false,
        description: 'Achieve 95% accuracy consistently',
        priority: 2,
        is_active: true
      },
      {
        user_id: userId,
        goal_type: 'consistency',
        target_value: 85,
        current_value: 78,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        achieved: false,
        description: 'Improve typing consistency to 85%',
        priority: 3,
        is_active: true
      }
    ];

    const { error: goalsError } = await supabase
      .from('performance_goals')
      .upsert(goals);

    if (goalsError) throw goalsError;
    console.log('✅ Created performance goals');

    // 5. Create achievements
    const achievements = [
      {
        user_id: userId,
        achievement_type: 'speed_milestone',
        title: 'Speed Demon',
        description: 'Reached 40+ WPM',
        icon: 'zap',
        badge_color: 'yellow',
        requirement_type: 'wpm',
        requirement_value: 40,
        current_progress: 42,
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        rarity: 'common',
        points: 100
      },
      {
        user_id: userId,
        achievement_type: 'accuracy_milestone',
        title: 'Accuracy Master',
        description: 'Achieved 90%+ accuracy',
        icon: 'target',
        badge_color: 'blue',
        requirement_type: 'accuracy',
        requirement_value: 90,
        current_progress: 94.2,
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        rarity: 'common',
        points: 150
      },
      {
        user_id: userId,
        achievement_type: 'consistency',
        title: 'Consistent Typer',
        description: 'Maintained 7-day practice streak',
        icon: 'calendar',
        badge_color: 'green',
        requirement_type: 'streak',
        requirement_value: 7,
        current_progress: 7,
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        rarity: 'rare',
        points: 200
      },
      {
        user_id: userId,
        achievement_type: 'speed_milestone',
        title: 'Lightning Fingers',
        description: 'Reach 60+ WPM',
        icon: 'zap',
        badge_color: 'purple',
        requirement_type: 'wpm',
        requirement_value: 60,
        current_progress: 42,
        is_unlocked: false,
        rarity: 'epic',
        points: 500
      }
    ];

    const { error: achievementsError } = await supabase
      .from('achievements')
      .upsert(achievements);

    if (achievementsError) throw achievementsError;
    console.log('✅ Created achievements');

    console.log('🎉 Successfully populated statistics data!');
    return {
      success: true,
      message: 'Statistics data populated successfully',
      data: {
        dailyStats: dailyStats.length,
        letterStats: letterStats.length,
        mistakePatterns: mistakePatterns.length,
        goals: goals.length,
        achievements: achievements.length
      }
    };

  } catch (error: any) {
    console.error('❌ Error populating statistics data:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

/**
 * Clear all statistics data for a user (useful for testing)
 */
export async function clearStatisticsData(userId: string) {
  console.log('🗑️ Clearing statistics data for user:', userId);

  try {
    const tables = [
      'daily_statistics',
      'letter_statistics', 
      'mistake_patterns',
      'performance_goals',
      'achievements'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      console.log(`✅ Cleared ${table}`);
    }

    console.log('🎉 Successfully cleared all statistics data!');
    return { success: true, message: 'Statistics data cleared successfully' };

  } catch (error: any) {
    console.error('❌ Error clearing statistics data:', error);
    return { success: false, message: error.message, error };
  }
}
