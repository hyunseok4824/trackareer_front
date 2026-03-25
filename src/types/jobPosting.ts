export const STAGE_RESULT = {
  PASSED: 'PASSED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export const STAGE_TYPE = {
  DOCUMENT: 'DOCUMENT',
  INTERVIEW: 'INTERVIEW',
  EXAM: 'EXAM',
  ASSIGNMENT: 'ASSIGNMENT',
} as const;

export const JOB_POSTING_EDIT_MODE = {
  DIRECT: 'DIRECT',
  SYNTHETIC: 'SYNTHETIC',
  MODIFIED: 'MODIFIED',
} as const;

export type JobPostingEditMode = (typeof JOB_POSTING_EDIT_MODE)[keyof typeof JOB_POSTING_EDIT_MODE];
export type StageType = (typeof STAGE_TYPE)[keyof typeof STAGE_TYPE];
export type StageResult = (typeof STAGE_RESULT)[keyof typeof STAGE_RESULT];

export interface JobPostingStage {
  id: number;
  stageType: StageType;
  stageOrder: number;
  stageName: string;
  eventAt: string;
  doneAt: string | null;
  expectedAnnouncementAt: string | null;
  result: StageResult;
  createdAt: string;
  updatedAt: string;
}

export type JobPosting = {
  id: number;
  companyName: string;
  title: string;
  sourceUrl: string | null;
  memo: string | null;
  jobPostingStages: JobPostingStage[];
  createdAt: string;
  updatedAt: string;
};
