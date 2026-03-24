export type Subject = {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: string[];
  gradeRange: string;
};

export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: 'calculator',
    color: '#8B5CF6',
    topics: [
      'Arithmetic', 'Fractions', 'Decimals', 'Algebra', 'Geometry',
      'Trigonometry', 'Calculus', 'Statistics', 'Linear Algebra',
    ],
    gradeRange: 'K-Higher Ed',
  },
  {
    id: 'science',
    name: 'Science',
    icon: 'flask',
    color: '#06B6D4',
    topics: [
      'Life Science', 'Earth Science', 'Physical Science', 'Biology',
      'Chemistry', 'Physics', 'Environmental Science', 'Astronomy',
    ],
    gradeRange: 'K-Higher Ed',
  },
  {
    id: 'english',
    name: 'English / ELA',
    icon: 'book-open',
    color: '#F97316',
    topics: [
      'Reading Comprehension', 'Writing', 'Grammar', 'Vocabulary',
      'Literature', 'Research Papers', 'Creative Writing', 'Public Speaking',
    ],
    gradeRange: 'K-Higher Ed',
  },
  {
    id: 'history',
    name: 'History / Social Studies',
    icon: 'globe',
    color: '#F59E0B',
    topics: [
      'US History', 'World History', 'Geography', 'Civics',
      'Economics', 'Ancient Civilizations', 'Modern History', 'Political Science',
    ],
    gradeRange: 'K-Higher Ed',
  },
  {
    id: 'coding',
    name: 'Computer Science',
    icon: 'code',
    color: '#10B981',
    topics: [
      'Block Coding', 'Python', 'JavaScript', 'Web Development',
      'Data Structures', 'Algorithms', 'AI & Machine Learning', 'Cybersecurity',
    ],
    gradeRange: 'K-Higher Ed',
  },
  {
    id: 'art',
    name: 'Arts & Music',
    icon: 'music',
    color: '#EC4899',
    topics: [
      'Drawing', 'Painting', 'Music Theory', 'Instruments',
      'Art History', 'Digital Art', 'Photography', 'Film',
    ],
    gradeRange: 'K-Higher Ed',
  },
  {
    id: 'foreign-language',
    name: 'World Languages',
    icon: 'message-circle',
    color: '#3B82F6',
    topics: [
      'Spanish', 'French', 'Mandarin', 'German', 'Japanese',
      'Arabic', 'Portuguese', 'Italian',
    ],
    gradeRange: 'K-Higher Ed',
  },
  {
    id: 'health',
    name: 'Health & PE',
    icon: 'heart',
    color: '#EF4444',
    topics: [
      'Nutrition', 'Physical Fitness', 'Mental Health', 'Human Body',
      'First Aid', 'Sports', 'Wellness', 'Health Science',
    ],
    gradeRange: 'K-Higher Ed',
  },
];

export const GRADE_LEVELS = [
  { id: 'K-2', label: 'Kindergarten – 2nd Grade', icon: '🌱', description: 'Early learners' },
  { id: '3-5', label: '3rd – 5th Grade', icon: '📚', description: 'Elementary school' },
  { id: '6-8', label: '6th – 8th Grade', icon: '🔬', description: 'Middle school' },
  { id: '9-12', label: '9th – 12th Grade', icon: '🎓', description: 'High school' },
  { id: 'Higher Education', label: 'College / University', icon: '🏛️', description: 'Higher education' },
];

export const AGENT_TYPES = [
  { id: 'tutor', name: 'AI Tutor', icon: 'cpu', description: 'Adaptive tutoring & explanations' },
  { id: 'quiz', name: 'Quiz Generator', icon: 'help-circle', description: 'AI-generated practice quizzes' },
  { id: 'curriculum', name: 'Curriculum Builder', icon: 'layout', description: 'For educators: build lesson plans' },
  { id: 'progress', name: 'Progress Analyzer', icon: 'trending-up', description: 'Personalized learning insights' },
];
