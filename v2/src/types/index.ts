export type Platform = 'lc' | 'cf' | 'ac';
export type ThemeMode = 'dark' | 'light';
export type TrackerStatus = 'all' | 'solved' | 'unsolved' | 'premium' | 'free';
export type LcDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface ReviewRecord {
  intervalIndex: number;
  intervalDays: number;
  nextReviewAt: string;
  lastReviewedAt: string;
  reviewCount: number;
}

export interface PlatformProgress {
  solved: Record<string, string>;
  activity: Record<string, number>;
  bookmarks: Record<string, boolean>;
  notes: Record<string, string>;
  reviewData: Record<string, ReviewRecord>;
  solveTimes: Record<string, number>; // problemId → seconds
  lastSyncAt: string | null;
}

export interface LcProblem {
  platform: 'lc';
  id: number;
  slug: string;
  title: string;
  difficulty: LcDifficulty;
  acceptance: string;
  tags: string[];
  isPremium: boolean;
}

export interface CfProblem {
  platform: 'cf';
  id: string;
  contestId: number;
  index: string;
  name: string;
  title: string;
  rating: number | null;
  tags: string[];
  solvedCount: number;
}

export interface AcProblem {
  platform: 'ac';
  id: string;
  contestId: string;
  title: string;
  difficulty: number | null;
  isExperimental: boolean;
  solvedCount: number;
}

export type Problem = LcProblem | CfProblem | AcProblem;

export interface UserPlatformInfo {
  username: string | null;
  avatar: string | null;
  ranking: number | null;
  solvedCount: number | null;
  rating: number | null;
  peakRating: number | null;
  rankLabel: string | null;
  contests: number | null;
}

export interface FiltersState {
  search: string;
  difficulties: string[];
  tags: string[];
  status: TrackerStatus;
  starredOnly: boolean;
  reviewOnly: boolean;
  curatedList: string;
}

export interface StatDatum {
  label: string;
  value: number | string;
  hint?: string;
  color?: string;
}

export interface ContestItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  url: string;
  phase: 'upcoming' | 'ongoing' | 'past';
  platform: Extract<Platform, 'cf' | 'ac'>;
}

export interface RatingHistoryPoint {
  contestId: string;
  contestName: string;
  rank: number | null;
  oldRating: number | null;
  newRating: number | null;
  delta: number | null;
  rating: number | null;
  date: string;
}

export interface WeeklyBucket {
  label: string;
  easy: number;
  medium: number;
  hard: number;
}

export interface HeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface RivalSeries {
  handle: string;
  points: Array<{ date: string; rating: number }>;
}

export interface PersistedProgressRow {
  lc_username: string | null;
  cf_username: string | null;
  ac_username: string | null;
  solved: Record<string, string> | null;
  activity: Record<string, number> | null;
  bookmarks: Record<string, boolean> | null;
  notes: Record<string, string> | null;
  review_data: Record<string, ReviewRecord> | null;
  cf_solved: Record<string, string> | null;
  cf_activity: Record<string, number> | null;
  cf_bookmarks: Record<string, boolean> | null;
  cf_notes: Record<string, string> | null;
  cf_review_data: Record<string, ReviewRecord> | null;
  cf_user_info: UserPlatformInfo | null;
  ac_solved: Record<string, string> | null;
  ac_activity: Record<string, number> | null;
  ac_bookmarks: Record<string, boolean> | null;
  ac_notes: Record<string, string> | null;
  ac_review_data: Record<string, ReviewRecord> | null;
  ac_user_info: UserPlatformInfo | null;
  lc_last_sync: string | null;
  cf_rivals: string[] | null;
  ac_rivals: string[] | null;
  interview_date: string | null;
}
