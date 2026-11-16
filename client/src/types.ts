export interface Author {
  id: number;
  username: string;
  avatar: string | null;
}

export interface Question {
  id: number;
  title: string;
  content?: string;
  excerpt?: string;
  tags: string[];
  views: number;
  answers_count: number;
  votes: number;
  is_solved: boolean;
  is_liked: boolean;
  created_at: string;
  author: Author;
}

export interface Answer {
  id: number;
  content: string;
  votes: number;
  is_accepted: boolean;
  is_liked: boolean;
  created_at: string;
  author: Author;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  points: number;
  created_at: string;
}

export interface TagStat {
  name: string;
  count: number;
}

export interface UserProfileResponse {
  user: {
    id: number;
    username: string;
    avatar: string | null;
    points: number;
    created_at: string;
  };
  stats: {
    question_count: number;
    answer_count: number;
    accepted_count: number;
  };
}
