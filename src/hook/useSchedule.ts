import { stageScheduleApi } from '@/src/api/stageSchedule';
import { useJobPostingStore } from '@/src/stores/jobPostingStore';
import { useScheduleStore } from '@/src/stores/scheduleStore';
import { STAGE_RESULT } from '@/src/types/jobPosting';
import {
  SCHEDULE_TYPE,
  StageCompletedRequestBody,
  StagePassedRequestBody,
  StagePassedResponse,
  StageSchedule,
} from '@/src/types/stageSchedule';
import { dateToYYYYMMDD } from '@/src/utils/dateFormatters';

export const useSchedule = () => {
  const { insertJobPostingItemStage, updateJobPostingItemStage, deleteJobPostingItemStage } =
    useJobPostingStore();
  const { insertScheduleItem, updateScheduleItem, deleteScheduleItem } = useScheduleStore();

  const onCompletedStageSchedule = async (
    id: number,
    payload: StageCompletedRequestBody,
  ): Promise<StageSchedule> => {
    const updated = await stageScheduleApi.completed(id, payload);
    updateStage({
      jobId: updated.jobPosting.id,
      stage: updated,
    });
    if (updated.expectedAnnouncementAt) {
      insertAnnouncement({
        stage: updated,
      });
    }
    return updated;
  };

  const onUncompletedStageSchedule = async (id: number): Promise<StageSchedule> => {
    const uncompleted = await stageScheduleApi.uncompleted(id);
    updateStage({
      jobId: uncompleted.jobPosting.id,
      stage: uncompleted,
    });
    return uncompleted;
  };

  const onPassedAnnouncementSchedule = async (
    id: number,
    payload: StagePassedRequestBody,
  ): Promise<StagePassedResponse> => {
    const updated = await stageScheduleApi.passed(id, payload);
    updateAnnouncement({
      jobId: updated.jobPosting.id,
      stage: updated,
    });
    if (updated.next) {
      insertStage({
        jobId: updated.jobPosting.id,
        stage: updated.next,
      });
    }
    return updated;
  };

  const onRejectedAnnouncementSchedule = async (id: number): Promise<StageSchedule> => {
    const rejected = await stageScheduleApi.rejected(id);
    updateStage({
      jobId: rejected.jobPosting.id,
      stage: rejected,
    });
    return rejected;
  };

  const onRollbackSchedule = async (id: number, jobPostingId: number): Promise<StageSchedule> => {
    const reverted = await stageScheduleApi.rollback(id);

    // 롤백을 요청한 데이터가 실제 업데이트된 데이터와 다른 경우
    // 새로 생긴 Stage 가 삭제되고, 이전의 Stage 정보가 수정된 상태
    if (reverted.id !== id) {
      deleteStage({
        jobId: jobPostingId,
        stageId: id,
      });
      updateAnnouncement({
        jobId: reverted.jobPosting.id,
        stage: reverted,
      });
      updateStage({
        jobId: reverted.jobPosting.id,
        stage: reverted,
      });
    }

    // 롤백을 요청한 데이터가 실제 업데이트된 데이터와 같은 경우
    // Stage 가 삭제되지 않고, 정보만 수정된 상태
    else {
      if (reverted.result === STAGE_RESULT.IN_PROGRESS) {
        deleteAnnouncement({
          stageId: reverted.id,
        });
      } else {
        updateAnnouncement({
          jobId: reverted.jobPosting.id,
          stage: reverted,
        });
      }
      updateStage({
        jobId: reverted.jobPosting.id,
        stage: reverted,
      });
    }
    return reverted;
  };

  // 새로운 Stage 타입의 일정을 추가 ✅
  const insertStage = ({ jobId, stage }: { jobId: number; stage: StageSchedule }) => {
    insertScheduleItem({
      type: SCHEDULE_TYPE.STAGE,
      date: dateToYYYYMMDD(new Date(stage.eventAt)), // yyyy-MM-dd
      ...stage,
    });
    insertJobPostingItemStage(jobId, stage);
  };

  // 새로운 Announcement 타입의 일정을 추가 ✅
  const insertAnnouncement = ({ stage }: { stage: StageSchedule }) => {
    if (stage.expectedAnnouncementAt) {
      insertScheduleItem({
        type: SCHEDULE_TYPE.ANNOUNCEMENT,
        date: dateToYYYYMMDD(new Date(stage.expectedAnnouncementAt)), // yyyy-MM-dd
        ...stage,
      });
    }
  };

  // 기존 Stage 타입의 일정을 수정 ⏳
  const updateStage = ({ jobId, stage }: { jobId: number; stage: StageSchedule }) => {
    updateScheduleItem({
      type: SCHEDULE_TYPE.STAGE,
      date: dateToYYYYMMDD(new Date(stage.eventAt)), // yyyy-MM-dd
      ...stage,
    });
    updateJobPostingItemStage(jobId, stage);
  };

  // 기존 Announcement 타입의 일정을 수정 ⏳
  const updateAnnouncement = ({ jobId, stage }: { jobId: number; stage: StageSchedule }) => {
    if (stage.expectedAnnouncementAt) {
      updateScheduleItem({
        type: SCHEDULE_TYPE.ANNOUNCEMENT,
        date: dateToYYYYMMDD(new Date(stage.expectedAnnouncementAt)), // yyyy-MM-dd
        ...stage,
      });
    }
    updateJobPostingItemStage(jobId, stage);
  };

  // 기존 Stage 타입의 일정을 삭제 ⏳
  const deleteStage = ({ jobId, stageId }: { jobId: number; stageId: number }) => {
    deleteScheduleItem(stageId, SCHEDULE_TYPE.STAGE);
    deleteJobPostingItemStage(jobId, stageId);
  };

  // 기존 Announcement 타입의 일정을 삭제 ⏳
  const deleteAnnouncement = ({ stageId }: { stageId: number }) => {
    deleteScheduleItem(stageId, SCHEDULE_TYPE.ANNOUNCEMENT);
  };

  return {
    onCompletedStageSchedule,
    onUncompletedStageSchedule,
    onPassedAnnouncementSchedule,
    onRejectedAnnouncementSchedule,
    onRollbackSchedule,
  };
};
