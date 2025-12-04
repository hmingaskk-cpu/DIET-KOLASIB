-- Drop triggers first (especially those on auth.users which we don't drop)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
-- The trigger on_student_passed_out will be dropped when the 'students' table is dropped with CASCADE.

-- Drop functions next
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_student_passed_out() CASCADE;

-- Drop tables with CASCADE to remove all dependent objects (policies, foreign keys, etc.)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS alumni CASCADE;
DROP TABLE IF EXISTS calendarEvents CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create a table for public profiles
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'student' NOT NULL,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles."
  ON profiles FOR UPDATE TO authenticated USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  ) WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Create a function to create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create table for students
CREATE TABLE students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  rollNo text UNIQUE NOT NULL,
  course text NOT NULL,
  year integer NOT NULL, -- Represents semester
  status text NOT NULL DEFAULT 'active',
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students are viewable by authenticated users."
  ON students FOR SELECT USING (true);

CREATE POLICY "Admins and Staff can manage students."
  ON students FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );

-- Create table for alumni
CREATE TABLE alumni (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  graduation_year integer NOT NULL,
  course text NOT NULL,
  contact_number text,
  current_occupation text,
  linked_in text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumni records are viewable by authenticated users."
  ON alumni FOR SELECT USING (true);

CREATE POLICY "Admins and Staff can manage alumni."
  ON alumni FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );

-- Create a function to create an alumni record when a student passes out
CREATE OR REPLACE FUNCTION public.handle_student_passed_out()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'passed-out' AND OLD.status != 'passed-out' THEN
    INSERT INTO public.alumni (name, email, graduation_year, course, contact_number, current_occupation, linked_in)
    VALUES (OLD.name, OLD.email, EXTRACT(YEAR FROM NOW()), OLD.course, NULL, NULL, NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function when a student's status changes to 'passed-out'
CREATE TRIGGER on_student_passed_out
  AFTER UPDATE ON public.students
  FOR EACH ROW EXECUTE PROCEDURE public.handle_student_passed_out();

-- Create table for courses
CREATE TABLE courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  code text UNIQUE NOT NULL,
  instructor text NOT NULL,
  credits integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are viewable by authenticated users."
  ON courses FOR SELECT USING (true);

CREATE POLICY "Admins and Staff can manage courses."
  ON courses FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );

-- Create table for faculty
CREATE TABLE faculty (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  subject text NOT NULL,
  department text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active',
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty are viewable by authenticated users."
  ON faculty FOR SELECT USING (true);

CREATE POLICY "Admins and Staff can manage faculty."
  ON faculty FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );

-- Create table for calendarEvents
CREATE TABLE calendarEvents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  date date NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE calendarEvents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Calendar events are viewable by authenticated users."
  ON calendarEvents FOR SELECT USING (true);

CREATE POLICY "Admins and Staff can manage calendar events."
  ON calendarEvents FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'staff')
  );

-- Create table for attendance
CREATE TABLE attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  period integer NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL, -- 'present', 'absent', 'late'
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (date, period, student_id) -- Ensure unique attendance per student per period per day
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance is viewable by authenticated users."
  ON attendance FOR SELECT USING (true);

CREATE POLICY "Admins and Faculty can manage attendance."
  ON attendance FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'faculty')
  );

-- Set up storage for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for avatar storage
CREATE POLICY "Avatar images are publicly readable."
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update their own avatar."
  ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete their own avatar."
  ON storage.objects FOR DELETE USING (auth.uid() = owner AND bucket_id = 'avatars');