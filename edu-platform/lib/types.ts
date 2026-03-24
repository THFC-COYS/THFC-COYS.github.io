export type GradeLevel = 'K-2' | '3-5' | '6-8' | '9-12' | 'Higher Education';
export type UserRole = 'student' | 'educator';

export interface User {
  id: string;
  name: string;
  email: string;
  grade_level: GradeLevel;
  role: UserRole;
  subjects: string[];
  xp: number;
  streak_days: number;
  last_active: string;
  created_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface TutoringSession {
  id: string;
  user_id: string;
  subject: string;
  topic?: string;
  grade_level: GradeLevel;
  messages: Message[];
  agent_type: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correct_answer?: string;   // hidden until after submission
  explanation?: string;
  bloom_level?: string;
  points: number;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  grade_level: GradeLevel;
  questions: QuizQuestion[];
  score?: number;
  total_questions: number;
  time_taken_seconds?: number;
  completed_at?: string;
  created_at: string;
}

export interface QuizResult {
  quiz_id: string;
  score_percentage: number;
  total_score: number;
  total_possible: number;
  results: QuestionResult[];
  xp_earned: number;
}

export interface QuestionResult {
  question_id: string;
  student_answer: string;
  correct_answer: string;
  is_correct?: boolean;
  score: number;
  max_score: number;
  explanation?: string;
  feedback?: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  mastery_level: number;   // 0.0 – 1.0
  sessions_count: number;
  quizzes_count: number;
  avg_quiz_score?: number;
  last_practiced: string;
}

export interface ProgressInsights {
  summary: string;
  strengths: string[];
  growth_areas: string[];
  recommended_topics: Array<{ subject: string; topic: string; reason: string }>;
  weekly_goal: string;
  encouragement: string;
}

export interface CurriculumWeekActivity {
  day: number;
  title: string;
  description: string;
  activity_type: string;
  duration_minutes: number;
}

export interface CurriculumWeek {
  week: number;
  theme: string;
  learning_goals: string[];
  daily_activities: CurriculumWeekActivity[];
  assessment: { type: string; description: string };
  ai_enhancement: string;
  resources: string[];
}

export interface Curriculum {
  id: string;
  creator_id: string;
  title: string;
  subject: string;
  grade_level: GradeLevel;
  duration_weeks: number;
  objectives: string[];
  weeks: CurriculumWeek[];
  is_public: boolean;
  created_at: string;
}
