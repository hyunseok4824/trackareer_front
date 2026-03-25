import { apiRequest } from '@/src/lib/api/client';
import {
  StageCompletedRequestBody,
  StagePassedRequestBody,
  StagePassedResponse,
  StageSchedule,
} from '@/src/types/stageSchedule';

export const stageScheduleApi = {
  getList: ({
    startDate,
    endDate,
  }: {
    startDate: string; // ISO string
    endDate: string; // ISO string
  }): Promise<StageSchedule[]> =>
    apiRequest({
      path: `/stages/schedules?${new URLSearchParams({ startDate, endDate }).toString()}`,
      method: 'GET',
    }),
  completed: (id: number, body: StageCompletedRequestBody): Promise<StageSchedule> =>
    apiRequest({
      path: `/stages/${id}/completed`,
      method: 'POST',
      body,
    }),

  uncompleted: (id: number): Promise<StageSchedule> =>
    apiRequest({
      path: `/stages/${id}/uncompleted`,
      method: 'POST',
    }),

  passed: (id: number, body: StagePassedRequestBody): Promise<StagePassedResponse> =>
    apiRequest({
      path: `/stages/${id}/passed`,
      method: 'POST',
      body,
    }),

  rejected: (id: number): Promise<StageSchedule> =>
    apiRequest({
      path: `/stages/${id}/rejected`,
      method: 'POST',
    }),

  rollback: (id: number): Promise<StageSchedule> =>
    apiRequest({
      path: `/stages/${id}/rollback`,
      method: 'POST',
    }),
};
