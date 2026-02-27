export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface Document {
  id: string;
  lesson_id?: string;
  title: string;
  content: string;
  type: 'pdf' | 'text' | 'url';
  created_at: string;
  highlights?: Highlight[];
}

export interface Highlight {
  id: string;
  document_id: string;
  text: string;
  color: string;
  tags: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface StudyStats {
  totalDocs: number;
  totalHighlights: number;
  avgRecall: number;
  totalTime: number;
  totalDistractions: number;
}
