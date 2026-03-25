import { JobPosting } from '@/src/types/jobPosting';
import { ParsedStageSchedule, SCHEDULE_TYPE } from '@/src/types/stageSchedule';
import { dateToYYYYMMDD } from '@/src/utils/dateFormatters';
import { create } from 'zustand';

/* ---- 타입 정의 ---- */
type ScheduleStore = {
  scheduleItems: ParsedStageSchedule[];
  hydrateScheduleItems: (items: ParsedStageSchedule[]) => void;
  insertScheduleItem: (item: ParsedStageSchedule) => void;
  updateScheduleItem: (updated: ParsedStageSchedule) => void;
  deleteScheduleItem: (id: number, type: string) => void;
  insertJobPostingItem: (jobPosting: JobPosting) => void;
  updateJobPostingItem: (jobPosting: JobPosting) => void;
  deleteJobPostingItem: (id: number) => void;
};

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  scheduleItems: [],
  hydrateScheduleItems: items => {
    set(s => {
      const map = new Map<string, ParsedStageSchedule>();
      for (const it of s.scheduleItems) map.set(`${it.id}-${it.type}`, it);
      for (const it of items) map.set(`${it.id}-${it.type}`, it);
      return { scheduleItems: Array.from(map.values()) };
    });
  },
  insertScheduleItem: item => set({ scheduleItems: [...get().scheduleItems, item] }),
  updateScheduleItem: updated => {
    return set({
      scheduleItems: get().scheduleItems.map(item =>
        item.id === updated.id && item.type === updated.type ? updated : item,
      ),
    });
  },
  deleteScheduleItem: (id, type) =>
    set({
      scheduleItems: get().scheduleItems.filter(item => item.id !== id || item.type !== type),
    }),
  insertJobPostingItem: jobPosting => {
    const newScheduleItems = jobPosting.jobPostingStages.map(stage => ({
      type: SCHEDULE_TYPE.STAGE,
      date: dateToYYYYMMDD(new Date(stage.eventAt)),
      ...stage,
      jobPosting: {
        id: jobPosting.id,
        companyName: jobPosting.companyName,
        title: jobPosting.title,
      },
    })) as ParsedStageSchedule[];
    set({ scheduleItems: [...get().scheduleItems, ...newScheduleItems] });
  },
  updateJobPostingItem: jobPosting => {
    set({
      scheduleItems: get().scheduleItems.map(item => {
        if (item.jobPosting.id === jobPosting.id) {
          return {
            ...item,
            jobPosting: {
              id: jobPosting.id,
              companyName: jobPosting.companyName,
              title: jobPosting.title,
            },
          };
        }
        return item;
      }),
    });
  },
  deleteJobPostingItem: id =>
    set({
      scheduleItems: get().scheduleItems.filter(item => {
        return item.jobPosting.id !== id;
      }),
    }),
}));
