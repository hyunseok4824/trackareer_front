import { apiRequest } from '@/src/lib/api/client';
import type { JobPosting, JobPostingEditMode, StageType } from '@/src/types/jobPosting';

export const jobPostingsApi = {
  create: (payload: {
    companyName: string;
    title: string;
    eventAt: string;
    stageType: StageType;
    sourceUrl: string | null;
    memo: string | null;
    editMode: JobPostingEditMode;
  }) =>
    apiRequest<JobPosting>({
      path: '/job-postings',
      method: 'POST',
      body: payload,
    }),

  // ✅ 1) getAll도 타입 지정
  getList: () =>
    apiRequest<JobPosting[]>({
      path: '/job-postings',
      method: 'GET',
    }),

  // ✅ 2) update 응답 타입도 서버에 맞춰 지정 (예: updated detail 반환한다고 가정)
  update: (
    jobId: number,
    payload: {
      companyName: string;
      title: string;
      memo: string | null;
    },
  ) =>
    apiRequest<JobPosting>({
      path: `/job-postings/${jobId}`,
      method: 'PUT',
      body: payload,
    }),

  // ✅ 3) get은 Detail을 반환하도록 제네릭 지정
  get: (jobId: number) =>
    apiRequest<JobPosting>({
      path: `/job-postings/${jobId}`, // ✅ 앞에 / 붙이는 걸 추천 (일관성)
      method: 'GET',
    }),

  delete: (jobId: number) =>
    apiRequest({
      path: `/job-postings/${jobId}`, // ✅ 앞에 / 붙이는 걸 추천 (일관성)
      method: 'DELETE',
    }),
};
