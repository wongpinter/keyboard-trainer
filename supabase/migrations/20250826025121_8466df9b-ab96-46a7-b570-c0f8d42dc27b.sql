-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create keyboard_layouts table
CREATE TABLE public.keyboard_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  layout_data JSONB NOT NULL, -- Store the complete KeyboardLayout object
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create curriculums table
CREATE TABLE public.curriculums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  keyboard_layout_id UUID NOT NULL REFERENCES public.keyboard_layouts(id) ON DELETE CASCADE,
  lessons JSONB NOT NULL, -- Array of lesson objects
  difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_hours INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum_id UUID NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
  lesson_index INTEGER NOT NULL DEFAULT 0,
  completed_lessons INTEGER[] DEFAULT '{}',
  current_lesson_attempts INTEGER NOT NULL DEFAULT 0,
  best_wpm NUMERIC(5,2) DEFAULT 0,
  best_accuracy NUMERIC(5,2) DEFAULT 0,
  total_practice_time INTEGER DEFAULT 0, -- in seconds
  mastery_level NUMERIC(5,2) DEFAULT 0, -- 0-100
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, curriculum_id)
);

-- Create typing_sessions table for detailed statistics
CREATE TABLE public.typing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
  lesson_index INTEGER,
  wpm NUMERIC(5,2) NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL,
  total_characters INTEGER NOT NULL,
  correct_characters INTEGER NOT NULL,
  incorrect_characters INTEGER NOT NULL,
  practice_time INTEGER NOT NULL, -- in seconds
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for keyboard_layouts
CREATE POLICY "Users can view public layouts and their own" ON public.keyboard_layouts 
FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "Users can create their own layouts" ON public.keyboard_layouts 
FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own layouts" ON public.keyboard_layouts 
FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own layouts" ON public.keyboard_layouts 
FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for curriculums
CREATE POLICY "Users can view public curriculums and their own" ON public.curriculums 
FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "Users can create their own curriculums" ON public.curriculums 
FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own curriculums" ON public.curriculums 
FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own curriculums" ON public.curriculums 
FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON public.user_progress 
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress 
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for typing_sessions
CREATE POLICY "Users can view their own sessions" ON public.typing_sessions 
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.typing_sessions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_keyboard_layouts_updated_at BEFORE UPDATE ON public.keyboard_layouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_curriculums_updated_at BEFORE UPDATE ON public.curriculums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default Colemak layout
INSERT INTO public.keyboard_layouts (name, description, layout_data, is_public) VALUES (
  'Colemak',
  'The efficient Colemak keyboard layout designed for comfortable and fast typing',
  '{
    "name": "Colemak",
    "homeRow": ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o"],
    "keys": [
      {"qwerty": "z", "target": "z", "finger": 0, "row": 0},
      {"qwerty": "x", "target": "x", "finger": 1, "row": 0},
      {"qwerty": "c", "target": "c", "finger": 2, "row": 0},
      {"qwerty": "v", "target": "v", "finger": 3, "row": 0},
      {"qwerty": "b", "target": "b", "finger": 4, "row": 0},
      {"qwerty": "n", "target": "k", "finger": 5, "row": 0},
      {"qwerty": "m", "target": "m", "finger": 6, "row": 0},
      {"qwerty": ",", "target": ",", "finger": 7, "row": 0},
      {"qwerty": ".", "target": ".", "finger": 8, "row": 0},
      {"qwerty": "/", "target": "/", "finger": 9, "row": 0},
      {"qwerty": "a", "target": "a", "finger": 0, "row": 1},
      {"qwerty": "s", "target": "r", "finger": 1, "row": 1},
      {"qwerty": "d", "target": "s", "finger": 2, "row": 1},
      {"qwerty": "f", "target": "t", "finger": 3, "row": 1},
      {"qwerty": "g", "target": "d", "finger": 4, "row": 1},
      {"qwerty": "h", "target": "h", "finger": 5, "row": 1},
      {"qwerty": "j", "target": "n", "finger": 6, "row": 1},
      {"qwerty": "k", "target": "e", "finger": 7, "row": 1},
      {"qwerty": "l", "target": "i", "finger": 8, "row": 1},
      {"qwerty": ";", "target": "o", "finger": 9, "row": 1},
      {"qwerty": "q", "target": "q", "finger": 0, "row": 2},
      {"qwerty": "w", "target": "w", "finger": 1, "row": 2},
      {"qwerty": "e", "target": "f", "finger": 2, "row": 2},
      {"qwerty": "r", "target": "p", "finger": 3, "row": 2},
      {"qwerty": "t", "target": "g", "finger": 4, "row": 2},
      {"qwerty": "y", "target": "j", "finger": 5, "row": 2},
      {"qwerty": "u", "target": "l", "finger": 6, "row": 2},
      {"qwerty": "i", "target": "u", "finger": 7, "row": 2},
      {"qwerty": "o", "target": "y", "finger": 8, "row": 2},
      {"qwerty": "p", "target": ";", "finger": 9, "row": 2}
    ],
    "learningOrder": [
      ["a", "r", "s", "t"],
      ["d", "h", "n", "e"],
      ["i", "o"],
      ["f", "p", "l", "u"],
      ["g", "j", "y"],
      ["q", "w", "c", "v"],
      ["b", "k", "m", "x", "z"],
      [",", ".", ";", "/"]
    ]
  }',
  true
);

-- Insert a default curriculum for Colemak
INSERT INTO public.curriculums (name, description, keyboard_layout_id, lessons, difficulty_level, estimated_hours, is_public)
SELECT 
  'Colemak Basics',
  'Learn the Colemak layout step by step, starting with the home row',
  id,
  '[
    {"name": "Home Row Foundation", "keys": ["a", "r", "s", "t"], "targetWpm": 15, "targetAccuracy": 95},
    {"name": "Right Hand Home", "keys": ["d", "h", "n", "e"], "targetWpm": 20, "targetAccuracy": 95},
    {"name": "Complete Home Row", "keys": ["i", "o"], "targetWpm": 25, "targetAccuracy": 95},
    {"name": "Common Extensions", "keys": ["f", "p", "l", "u"], "targetWpm": 30, "targetAccuracy": 93},
    {"name": "Middle Letters", "keys": ["g", "j", "y"], "targetWpm": 35, "targetAccuracy": 93},
    {"name": "Edge Letters", "keys": ["q", "w", "c", "v"], "targetWpm": 40, "targetAccuracy": 90},
    {"name": "Final Letters", "keys": ["b", "k", "m", "x", "z"], "targetWpm": 45, "targetAccuracy": 90},
    {"name": "Punctuation", "keys": [",", ".", ";", "/"], "targetWpm": 50, "targetAccuracy": 90}
  ]',
  1,
  20,
  true
FROM public.keyboard_layouts 
WHERE name = 'Colemak';