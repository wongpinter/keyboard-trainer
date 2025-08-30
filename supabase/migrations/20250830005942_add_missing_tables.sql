-- Add missing tables for comprehensive keyboard trainer application
-- This migration adds the remaining tables that complete the application schema

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type CHARACTER VARYING(50) NOT NULL,
  title CHARACTER VARYING(100) NOT NULL,
  description TEXT,
  icon CHARACTER VARYING(50),
  badge_color CHARACTER VARYING(20) DEFAULT 'blue'::CHARACTER VARYING,
  requirement_type CHARACTER VARYING(20) NOT NULL,
  requirement_value NUMERIC(8,2) NOT NULL,
  current_progress NUMERIC(8,2) DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  rarity CHARACTER VARYING(20) DEFAULT 'common'::CHARACTER VARYING,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create daily_statistics table
CREATE TABLE public.daily_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_practice_time INTEGER DEFAULT 0,
  average_wpm NUMERIC(5,2) DEFAULT 0,
  best_wpm NUMERIC(5,2) DEFAULT 0,
  average_accuracy NUMERIC(5,2) DEFAULT 0,
  best_accuracy NUMERIC(5,2) DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  total_correct_characters INTEGER DEFAULT 0,
  total_incorrect_characters INTEGER DEFAULT 0,
  consistency_score NUMERIC(5,2) DEFAULT 0,
  improvement_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create letter_statistics table
CREATE TABLE public.letter_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  letter CHARACTER(1) NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  average_time_ms NUMERIC(8,2) DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) DEFAULT 0,
  finger_number INTEGER,
  hand CHARACTER VARYING(5),
  difficulty_score NUMERIC(5,2) DEFAULT 0,
  improvement_trend NUMERIC(5,2) DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mistake_patterns table
CREATE TABLE public.mistake_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expected_key CHARACTER(1) NOT NULL,
  actual_key CHARACTER(1) NOT NULL,
  frequency INTEGER DEFAULT 1,
  context_before CHARACTER VARYING(5),
  context_after CHARACTER VARYING(5),
  mistake_type CHARACTER VARYING(20),
  finger_confusion BOOLEAN DEFAULT false,
  hand_confusion BOOLEAN DEFAULT false,
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create performance_goals table
CREATE TABLE public.performance_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type CHARACTER VARYING(20) NOT NULL,
  target_value NUMERIC(8,2) NOT NULL,
  current_value NUMERIC(8,2) DEFAULT 0,
  deadline DATE,
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_achievements_progress ON public.achievements USING btree (user_id, current_progress DESC);
CREATE INDEX idx_achievements_unlocked ON public.achievements USING btree (user_id, is_unlocked);
CREATE INDEX idx_achievements_user ON public.achievements USING btree (user_id);

CREATE INDEX idx_daily_stats_date ON public.daily_statistics USING btree (date DESC);
CREATE INDEX idx_daily_stats_user_date ON public.daily_statistics USING btree (user_id, date DESC);

CREATE INDEX idx_letter_stats_accuracy ON public.letter_statistics USING btree (user_id, accuracy_percentage DESC);
CREATE INDEX idx_letter_stats_difficulty ON public.letter_statistics USING btree (user_id, difficulty_score DESC);
CREATE INDEX idx_letter_stats_user ON public.letter_statistics USING btree (user_id);

CREATE INDEX idx_mistake_patterns_frequency ON public.mistake_patterns USING btree (user_id, frequency DESC);
CREATE INDEX idx_mistake_patterns_recent ON public.mistake_patterns USING btree (user_id, last_occurred_at DESC);
CREATE INDEX idx_mistake_patterns_user ON public.mistake_patterns USING btree (user_id);

CREATE INDEX idx_performance_goals_type ON public.performance_goals USING btree (user_id, goal_type);
CREATE INDEX idx_performance_goals_user_active ON public.performance_goals USING btree (user_id, is_active);

-- Add unique constraints
ALTER TABLE public.daily_statistics ADD CONSTRAINT daily_statistics_user_id_date_key UNIQUE (user_id, date);
ALTER TABLE public.letter_statistics ADD CONSTRAINT letter_statistics_user_id_letter_key UNIQUE (user_id, letter);
ALTER TABLE public.mistake_patterns ADD CONSTRAINT mistake_patterns_user_id_expected_key_actual_key_key UNIQUE (user_id, expected_key, actual_key);

-- Enable Row Level Security
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.achievements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily statistics" ON public.daily_statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily statistics" ON public.daily_statistics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily statistics" ON public.daily_statistics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own letter statistics" ON public.letter_statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own letter statistics" ON public.letter_statistics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own letter statistics" ON public.letter_statistics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own mistake patterns" ON public.mistake_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own mistake patterns" ON public.mistake_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mistake patterns" ON public.mistake_patterns FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance goals" ON public.performance_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own performance goals" ON public.performance_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own performance goals" ON public.performance_goals FOR UPDATE USING (auth.uid() = user_id);

-- Add check constraints
ALTER TABLE public.achievements ADD CONSTRAINT achievements_rarity_check CHECK (rarity::text = ANY (ARRAY['common'::character varying, 'rare'::character varying, 'epic'::character varying, 'legendary'::character varying]::text[]));
ALTER TABLE public.achievements ADD CONSTRAINT achievements_requirement_type_check CHECK (requirement_type::text = ANY (ARRAY['wpm'::character varying, 'accuracy'::character varying, 'sessions'::character varying, 'practice_time'::character varying, 'streak'::character varying, 'lessons'::character varying]::text[]));

ALTER TABLE public.letter_statistics ADD CONSTRAINT letter_statistics_hand_check CHECK (hand::text = ANY (ARRAY['left'::character varying, 'right'::character varying]::text[]));

ALTER TABLE public.mistake_patterns ADD CONSTRAINT mistake_patterns_mistake_type_check CHECK (mistake_type::text = ANY (ARRAY['substitution'::character varying, 'insertion'::character varying, 'deletion'::character varying, 'transposition'::character varying]::text[]));

ALTER TABLE public.performance_goals ADD CONSTRAINT performance_goals_goal_type_check CHECK (goal_type::text = ANY (ARRAY['wpm'::character varying, 'accuracy'::character varying, 'consistency'::character varying, 'practice_time'::character varying, 'sessions'::character varying]::text[]));
ALTER TABLE public.performance_goals ADD CONSTRAINT performance_goals_priority_check CHECK (priority >= 1 AND priority <= 5);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_statistics_updated_at BEFORE UPDATE ON public.daily_statistics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_letter_statistics_updated_at BEFORE UPDATE ON public.letter_statistics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mistake_patterns_updated_at BEFORE UPDATE ON public.mistake_patterns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_performance_goals_updated_at BEFORE UPDATE ON public.performance_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default achievements
INSERT INTO public.achievements (achievement_type, title, description, requirement_type, requirement_value, rarity, points) VALUES
('wpm', 'Speed Demon', 'Achieve 60 WPM in a single session', 'wpm', 60, 'epic', 100),
('accuracy', 'Perfectionist', 'Achieve 98% accuracy in a session', 'accuracy', 98, 'rare', 75),
('sessions', 'Dedicated Learner', 'Complete 100 practice sessions', 'sessions', 100, 'common', 50),
('practice_time', 'Time Warrior', 'Practice for 10 hours total', 'practice_time', 36000, 'rare', 80),
('streak', 'Consistency King', 'Maintain a 7-day practice streak', 'streak', 7, 'legendary', 150);

-- Insert some default performance goals
INSERT INTO public.performance_goals (goal_type, target_value, description, priority) VALUES
('wpm', 40, 'Reach 40 WPM typing speed', 1),
('accuracy', 95, 'Maintain 95% typing accuracy', 2),
('practice_time', 7200, 'Practice for 2 hours this week', 3),
('sessions', 20, 'Complete 20 practice sessions this week', 4);
