import { useJobPostingStore } from '@/src/stores/jobPostingStore';
import { useScheduleStore } from '@/src/stores/scheduleStore';
import { JobPosting } from '@/src/types/jobPosting';

export const useJobPosting = () => {
  const { insertJobPostingItem, updateJobPostingItem, deleteJobPostingItem } = useJobPostingStore();
  const {
    insertJobPostingItem: insertScheduleJobPostingItem,
    updateJobPostingItem: updateScheduleJobPostingItem,
    deleteJobPostingItem: deleteScheduleJobPostingItem,
  } = useScheduleStore();

  // 새로운 Job Posting을 추가 ⏳
  const insertJobPosting = (jobPosting: JobPosting) => {
    insertJobPostingItem(jobPosting);
    insertScheduleJobPostingItem(jobPosting);
    // TODO
  };

  // 기존 Job Posting을 수정 ⏳
  const updateJobPosting = (jobPosting: JobPosting) => {
    updateJobPostingItem(jobPosting);
    updateScheduleJobPostingItem(jobPosting);
  };

  // 기존 Job Posting을 삭제 ⏳
  const deleteJobPosting = (jobId: number) => {
    deleteJobPostingItem(jobId);
    deleteScheduleJobPostingItem(jobId);
  };

  return {
    insertJobPosting,
    updateJobPosting,
    deleteJobPosting,
  };
};
