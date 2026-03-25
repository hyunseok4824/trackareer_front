import { JobPostingStage, StageType } from '@/src/types/jobPosting';
import { Position } from '@/src/types/position';

export const SCHEDULE_TYPE = {
  STAGE: 'STAGE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
} as const;

export type ScheduleType = (typeof SCHEDULE_TYPE)[keyof typeof SCHEDULE_TYPE];

export interface ParsedStageSchedule extends StageSchedule {
  date: string; // yyyy-MM-dd
  type: ScheduleType;
}

export interface StageSchedule extends JobPostingStage {
  jobPosting: {
    id: number;
    companyName: string;
    title: string;
  };
}

export type StageMenuState = {
  type: ScheduleType;
  schedule: StageSchedule;
  position: Position;
} | null;

export type StageNextMenuState = {
  type: ScheduleType;
  schedule: StageSchedule;
  position: Position;
} | null;

export type StageCompletedRequestBody = {
  expectedAnnouncementAt: string | null; // ISO string
};

export type StagePassedRequestBody = {
  next: {
    stageType: StageType;
    stageName: string;
    eventAt: string; // ISO string
  } | null;
};

export interface StagePassedResponse extends StageSchedule {
  next?: StageSchedule;
}
