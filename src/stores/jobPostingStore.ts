import { JobPosting, JobPostingStage } from '@/src/types/jobPosting';
import { create } from 'zustand';

/* ---- 타입 정의 ---- */
type JobPostingStore = {
  jobPostingItems: JobPosting[];
  hydrateJobPostingItems: (items: JobPosting[]) => void;
  insertJobPostingItem: (item: JobPosting) => void;
  insertJobPostingItemStage: (jobId: number, stage: JobPostingStage) => void;
  updateJobPostingItem: (updated: JobPosting) => void;
  updateJobPostingItemStage: (jobId: number, stage: JobPostingStage) => void;
  deleteJobPostingItem: (id: number) => void;
  deleteJobPostingItemStage: (jobId: number, stageId: number) => void;
};

export const useJobPostingStore = create<JobPostingStore>((set, get) => ({
  jobPostingItems: [],
  hydrateJobPostingItems: items => {
    set(s => {
      const map = new Map<number, JobPosting>();
      for (const it of s.jobPostingItems) map.set(it.id, it);
      for (const it of items) map.set(it.id, it);
      return { jobPostingItems: Array.from(map.values()) };
    });
  },
  insertJobPostingItem: item => set({ jobPostingItems: [...get().jobPostingItems, item] }),
  insertJobPostingItemStage: (jobId, stage) =>
    set({
      jobPostingItems: get().jobPostingItems.map(item =>
        item.id === jobId ? { ...item, jobPostingStages: [...item.jobPostingStages, stage] } : item,
      ),
    }),
  updateJobPostingItem: updated =>
    set({
      jobPostingItems: get().jobPostingItems.map(item => (item.id === updated.id ? updated : item)),
    }),
  updateJobPostingItemStage: (jobId, updatedStage) =>
    set({
      jobPostingItems: get().jobPostingItems.map(item =>
        item.id === jobId
          ? {
              ...item,
              jobPostingStages: item.jobPostingStages.map(stage =>
                stage.id === updatedStage.id ? updatedStage : stage,
              ),
            }
          : item,
      ),
    }),
  deleteJobPostingItem: id =>
    set({ jobPostingItems: get().jobPostingItems.filter(item => item.id !== id) }),
  deleteJobPostingItemStage: (jobId, stageId) =>
    set({
      jobPostingItems: get().jobPostingItems.map(item =>
        item.id === jobId
          ? {
              ...item,
              jobPostingStages: item.jobPostingStages.filter(stage => stage.id !== stageId),
            }
          : item,
      ),
    }),
}));
