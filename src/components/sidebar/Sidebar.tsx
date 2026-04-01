// SideBar.tsx (최종본: CompletedMenu / PassedMenu + ⋯ DetailView 모달 포함)

'use client';

import ChevronDown from '@/public/svg/ChevronDown.svg';
import { jobPostingsApi } from '@/src/api/jobPosting';
import CommonModal from '@/src/components/common/modal/CommonModal';
import JobPostingDetailModal from '@/src/components/jobPosting/JobPostingDetailModal';
import JobPostingEditModal from '@/src/components/jobPosting/JobPostingEditModal';
import StageCompleteMenu from '@/src/components/stage/CompleteMenu';
import StagePassMenu from '@/src/components/stage/PassMenu';
import StageUpdateMenu, {
  STAGE_UPDATE_MENU_ACTION,
  StageUpdateMenuAction,
} from '@/src/components/stage/UpdateMenu';
import { useSchedule } from '@/src/hook/useSchedule';
import { useJobPostingStore } from '@/src/stores/jobPostingStore';
import {
  STAGE_RESULT,
  STAGE_TYPE,
  StageResult,
  type JobPostingStage,
  type StageType,
} from '@/src/types/jobPosting';
import {
  SCHEDULE_TYPE,
  StageCompletedRequestBody,
  StageMenuState,
  StageNextMenuState,
  StagePassedRequestBody,
  StageSchedule,
} from '@/src/types/stageSchedule';
import { dateToDiffDays } from '@/src/utils/dateFormatters';
import { cls } from '@/src/utils/strFormatters';
import { useEffect, useMemo, useRef, useState } from 'react';

const SUBJECT_TAB = {
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;
type SubjectTab = (typeof SUBJECT_TAB)[keyof typeof SUBJECT_TAB];

const STAGE_FILTER = {
  ALL: 'ALL',
  ...STAGE_TYPE,
};
type StageFilter = (typeof STAGE_FILTER)[keyof typeof STAGE_FILTER];

const IN_PROGRESS_DETAIL_TAB = {
  TODO: 'TODO',
  DONE: 'DONE',
} as const;
type InProgressDetailTab = (typeof IN_PROGRESS_DETAIL_TAB)[keyof typeof IN_PROGRESS_DETAIL_TAB];

const DONE_DETAIL_TAB = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
} as const;
type DoneDetailTab = (typeof DONE_DETAIL_TAB)[keyof typeof DONE_DETAIL_TAB];

type DetailTab = InProgressDetailTab | DoneDetailTab;

const SUBJECT_TABS: Array<{ key: SubjectTab; label: string }> = [
  { key: SUBJECT_TAB.IN_PROGRESS, label: '진행 중' },
  { key: SUBJECT_TAB.DONE, label: '종료' },
];

const IN_PROGRESS_DETAIL_TABS: Array<{ key: InProgressDetailTab; label: string }> = [
  { key: IN_PROGRESS_DETAIL_TAB.TODO, label: '할 일' },
  { key: IN_PROGRESS_DETAIL_TAB.DONE, label: '완료' },
];

const DONE_DETAIL_TABS: Array<{ key: DoneDetailTab; label: string }> = [
  { key: DONE_DETAIL_TAB.PASSED, label: '최종 합격' },
  { key: DONE_DETAIL_TAB.FAILED, label: '불합격' },
];

const FILTERS: Array<{ key: StageFilter; label: string }> = [
  { key: STAGE_FILTER.ALL, label: '전체' },
  { key: STAGE_FILTER.DOCUMENT, label: '서류' },
  { key: STAGE_FILTER.ASSIGNMENT, label: '과제' },
  { key: STAGE_FILTER.EXAM, label: '시험' },
  { key: STAGE_FILTER.INTERVIEW, label: '면접' },
];

// StagePriority는 낮을 수록 중요도가 높음 (면접 > 시험 > 과제 > 서류)
const STAGE_PRIORITY: Record<StageType, number> = {
  INTERVIEW: 1,
  EXAM: 2,
  ASSIGNMENT: 3,
  DOCUMENT: 4,
};

function stageLabel(stage: StageType) {
  switch (stage) {
    case STAGE_TYPE.DOCUMENT:
      return '서류';
    case STAGE_TYPE.ASSIGNMENT:
      return '과제';
    case STAGE_TYPE.EXAM:
      return '시험';
    case STAGE_TYPE.INTERVIEW:
      return '면접';
  }
}

function getStageResultLabel(result: StageResult) {
  switch (result) {
    case STAGE_RESULT.PASSED:
      return '최종 합격';
    case STAGE_RESULT.REJECTED:
      return '불합격';
    case STAGE_RESULT.IN_PROGRESS:
      return '진행 중';
    case STAGE_RESULT.DONE:
      return '완료';
  }
}

function getSummaryStr(stage: JobPostingStage): string {
  if (stage.result === STAGE_RESULT.PASSED) {
    return '최종 합격';
  }

  const stageLabelStr = stageLabel(stage.stageType);
  const title = `${stage.stageName.replace(stageLabelStr, '').trim()} ${stageLabelStr}`;

  if (stage.result === STAGE_RESULT.REJECTED && stage.doneAt === null) {
    return `${title} 포기`;
  }

  if (stage.result === STAGE_RESULT.REJECTED) {
    return title;
  }

  const headSuffix = stage.result === STAGE_RESULT.DONE ? ' 결과' : '';

  const head = `${title}${headSuffix}`;

  if (stage.result === STAGE_RESULT.DONE && !stage.expectedAnnouncementAt) {
    return `${head} 별도 안내`;
  }

  const stageDate =
    stage.result === STAGE_RESULT.DONE && stage.expectedAnnouncementAt
      ? stage.expectedAnnouncementAt
      : stage.eventAt;
  const diffDays = dateToDiffDays(stageDate);

  if (diffDays === 0) return `${head} D-day`;
  if (diffDays > 0) return `${head} D-${diffDays}`;
  return `${head} 기한 종료`;
}

type ModalStateType = {
  type: 'DETAIL' | 'EDIT';
  jobPostingId: number;
} | null;

export default function SideBar() {
  // Tab
  const [subject, setSubject] = useState<SubjectTab>(SUBJECT_TAB.IN_PROGRESS);
  const [inProgressDetailTab, setInProgressDetailTab] = useState<InProgressDetailTab>(
    IN_PROGRESS_DETAIL_TAB.TODO,
  );
  const [doneDetailTab, setDoneDetailTab] = useState<DoneDetailTab>(DONE_DETAIL_TAB.PASSED);
  const currentDetailTab: DetailTab =
    subject === SUBJECT_TAB.IN_PROGRESS ? inProgressDetailTab : doneDetailTab;

  const [filter, setFilter] = useState<StageFilter>(STAGE_FILTER.ALL);

  // JobPosting List
  const [onLoading, setOnLoading] = useState<boolean>(false);
  const { jobPostingItems, hydrateJobPostingItems } = useJobPostingStore();
  const hydrateJobPostingItemsRef = useRef(hydrateJobPostingItems);

  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        setOnLoading(true);
        const list = await jobPostingsApi.getList();
        hydrateJobPostingItemsRef.current(list);
      } catch (error) {
        console.error('Error fetching job postings:', error);
      } finally {
        setOnLoading(false);
      }
    };

    fetchJobPostings();
  }, []);

  const stageList: StageSchedule[] = useMemo(() => {
    const stages = jobPostingItems.map(
      jobPosting =>
        ({
          ...(jobPosting.jobPostingStages[
            jobPosting.jobPostingStages.length - 1
          ] as JobPostingStage),
          jobPosting: {
            id: jobPosting.id,
            companyName: jobPosting.companyName,
            title: jobPosting.title,
          },
        }) as StageSchedule,
    );
    return stages;
  }, [jobPostingItems]);

  const filteredStageList = useMemo(() => {
    return stageList
      .filter(item => {
        switch (item.result) {
          case STAGE_RESULT.IN_PROGRESS:
            return (
              subject === SUBJECT_TAB.IN_PROGRESS &&
              currentDetailTab === IN_PROGRESS_DETAIL_TAB.TODO
            );
          case STAGE_RESULT.DONE:
            return (
              subject === SUBJECT_TAB.IN_PROGRESS &&
              currentDetailTab === IN_PROGRESS_DETAIL_TAB.DONE
            );
          case STAGE_RESULT.PASSED:
            return subject === SUBJECT_TAB.DONE && currentDetailTab === DONE_DETAIL_TAB.PASSED;
          case STAGE_RESULT.REJECTED:
            return subject === SUBJECT_TAB.DONE && currentDetailTab === DONE_DETAIL_TAB.FAILED;
        }
      })
      .sort((a, b) => {
        const aPriority = STAGE_PRIORITY[a.stageType];
        const bPriority = STAGE_PRIORITY[b.stageType];

        // 항상 면접 > 시험 > 과제 > 서류 순으로 정렬
        if (aPriority !== bPriority) return aPriority - bPriority;

        // 진행 중인 일정의 경우 마감일 빠른 순으로 정렬
        if (a.result === STAGE_RESULT.IN_PROGRESS) {
          return a.eventAt.localeCompare(b.eventAt);
        }

        // a,b 모두 발표일이 있는 경우 발표일 빠른 순으로 정렬
        if (a.expectedAnnouncementAt !== null && b.expectedAnnouncementAt !== null) {
          return a.expectedAnnouncementAt.localeCompare(b.expectedAnnouncementAt);
        }
        // a만 발표일이 있는 경우 a가 먼저
        if (a.expectedAnnouncementAt !== null) {
          return -1;
        }
        // b만 발표일이 있는 경우 b가 먼저
        if (b.expectedAnnouncementAt !== null) {
          return 1;
        }
        // 둘 다 발표일이 없는 경우 공고명으로 정렬
        return a.jobPosting.title.localeCompare(b.jobPosting.title);
      });
  }, [stageList, subject, currentDetailTab]);

  // JobPosting Detail - Modal
  const [modalState, setModalState] = useState<ModalStateType>(null);

  const onOpenDetailModal = (jobPostingId: number) => {
    setModalState({ type: 'DETAIL', jobPostingId });
  };

  const onOpenEditModal = (jobPostingId: number) => {
    setModalState({ type: 'EDIT', jobPostingId });
  };

  const onCloseModal = () => {
    setModalState(null);
  };

  // Stage - Menu
  const {
    onCompletedStageSchedule,
    onUncompletedStageSchedule,
    onPassedAnnouncementSchedule,
    onRejectedAnnouncementSchedule,
    onRollbackSchedule,
  } = useSchedule();
  const [stageMenuState, setStageMenuState] = useState<StageMenuState>(null);
  const [stageNextMenuState, setStageNextMenuState] = useState<StageNextMenuState>(null);

  const onOpenStageMenu = (e: React.MouseEvent<HTMLButtonElement>, schedule: StageSchedule) => {
    e.stopPropagation(); // 이벤트 버블링 방지

    const rect = e.currentTarget.getBoundingClientRect();
    const position = { left: rect.left, top: rect.bottom + 4 };
    const scheduleType =
      schedule.result === STAGE_RESULT.DONE ? SCHEDULE_TYPE.ANNOUNCEMENT : SCHEDULE_TYPE.STAGE;
    setStageMenuState({ type: scheduleType, schedule, position });
  };

  const onCloseStageMenu = () => {
    setStageMenuState(null);
  };

  const onSelectStageMenu = async (action: StageUpdateMenuAction) => {
    if (!stageMenuState) return;

    switch (action) {
      case STAGE_UPDATE_MENU_ACTION.SET_COMPLETED:
        // ✅ "완료" 선택 시 완료 메뉴 오픈
        setStageNextMenuState({
          type: SCHEDULE_TYPE.STAGE,
          schedule: stageMenuState.schedule,
          position: stageMenuState.position,
        });
        break;
      case STAGE_UPDATE_MENU_ACTION.SET_PASSED:
        // ✅ "합격" 선택 시 합격 메뉴 오픈
        setStageNextMenuState({
          type: SCHEDULE_TYPE.ANNOUNCEMENT,
          schedule: stageMenuState.schedule,
          position: stageMenuState.position,
        });
        break;
      case STAGE_UPDATE_MENU_ACTION.SET_INCOMPLETED:
        // ✅ "미완료" 선택 시 미완료 처리 (API 호출)
        await onUncompletedStageSchedule(stageMenuState.schedule.id);
        break;
      case STAGE_UPDATE_MENU_ACTION.SET_REJECTED:
        // ✅ "불합격" 선택 시 불합격 처리 (API 호출)
        await onRejectedAnnouncementSchedule(stageMenuState.schedule.id);
        break;
      case STAGE_UPDATE_MENU_ACTION.REVERT:
        // ✅ "되돌리기" 선택 시 되돌리기 처리 (API 호출)
        await onRollbackSchedule(stageMenuState.schedule.id, stageMenuState.schedule.jobPosting.id);
        break;
    }

    setStageMenuState(null);
  };

  const onCloseStageNextMenu = () => {
    setStageNextMenuState(null);
  };

  const onCompleteStage = async (payload: StageCompletedRequestBody) => {
    if (!stageNextMenuState) return;

    try {
      await onCompletedStageSchedule(stageNextMenuState.schedule.id, payload);
      setStageNextMenuState(null);
    } catch (e) {
      console.error(e);
    }
  };

  const onPassStage = async (payload: StagePassedRequestBody) => {
    if (!stageNextMenuState) return;

    try {
      await onPassedAnnouncementSchedule(stageNextMenuState.schedule.id, payload);
      setStageNextMenuState(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <aside className="shrink-0 w-full tablet:w-80 h-full bg-tertiary tablet:rounded-3xl tablet:shadow-default overflow-hidden flex flex-col">
        <div className="flex">
          {SUBJECT_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSubject(tab.key)}
              className={cls(
                'relative flex-1 py-3 px-6 text-sm font-regular',
                subject === tab.key &&
                  subject === SUBJECT_TAB.IN_PROGRESS &&
                  'bg-white rounded-se-4xl',
                subject === tab.key && subject === SUBJECT_TAB.DONE && 'bg-white rounded-ss-4xl',
              )}
            >
              {tab.label}
              {subject === tab.key && (
                <span className="absolute left-8 right-8 bottom-0 h-px bg-black" />
              )}
            </button>
          ))}
        </div>

        <div className="bg-white p-4 flex flex-col flex-1 min-h-0">
          <div className="bg-tertiary rounded-3xl p-1 flex">
            {(subject === SUBJECT_TAB.IN_PROGRESS ? IN_PROGRESS_DETAIL_TABS : DONE_DETAIL_TABS).map(
              tab => {
                const isActive = currentDetailTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      subject === SUBJECT_TAB.IN_PROGRESS
                        ? setInProgressDetailTab(tab.key as InProgressDetailTab)
                        : setDoneDetailTab(tab.key as DoneDetailTab)
                    }
                    className={cls(
                      'flex-1 py-2 text-sm font-medium rounded-3xl transition',
                      isActive ? 'bg-white' : 'text-muted',
                    )}
                  >
                    {tab.label}
                  </button>
                );
              },
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-900">
              {onLoading ? (
                '공고 갯수를 세는 중...'
              ) : (
                <>
                  <span className="font-semibold">{filteredStageList.length}</span>
                  개의 공고가 있습니다.
                </>
              )}
            </div>

            <div className="relative">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as StageFilter)}
                className="appearance-none bg-tertiary text-xs font-semibold text-gray-700 rounded-lg px-3 py-2 pr-7 outline-none"
              >
                {FILTERS.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">
                <ChevronDown className="text-black w-3 h-3" />
              </span>
            </div>
          </div>

          <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
            {onLoading ? (
              <div className="text-xs text-gray-300 py-10 text-center">
                등록한 일정 목록을 불러오는 중...
              </div>
            ) : filteredStageList.length === 0 ? (
              <div className="text-xs text-gray-300 py-10 text-center">등록한 일정이 없습니다.</div>
            ) : (
              filteredStageList.map(stage => (
                <div
                  key={stage.jobPosting.id}
                  className="border-b border-gray-100 p-3 cursor-pointer hover:bg-gray-50 rounded-lg transition"
                  onClick={() => onOpenDetailModal(stage.jobPosting.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted font-medium">
                        {stage.jobPosting.companyName}
                      </span>

                      {/* ✅ ⋯ 클릭 => DetailView */}
                      <span
                        className="shrink-0 w-8 h-8 flex items-center justify-center text-muted font-bold"
                        aria-label="더보기"
                      >
                        ⋯
                      </span>
                    </div>

                    <div className="mt-1 text-base font-medium truncate">
                      [{stage.jobPosting.companyName}] {stage.jobPosting.title}
                    </div>

                    <section className="flex flex-row items-center justify-between mt-2">
                      <span className="text-xs font-medium text-primary">
                        {getSummaryStr(stage)}
                      </span>

                      <button
                        type="button"
                        onClick={e => onOpenStageMenu(e, stage)}
                        className="flex flex-row items-center justify-between bg-white border border-disabled text-xs space-x-2 font-medium rounded-full px-2 py-1"
                      >
                        <span className="text-xs text-gray-700">
                          {getStageResultLabel(stage.result)}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </section>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ✅ DetailView 모달 */}
      {modalState && (
        <CommonModal isOpen={true} onClose={onCloseModal} mobileFullscreen>
          {modalState.type === 'DETAIL' && (
            <JobPostingDetailModal
              jobId={modalState.jobPostingId}
              onEdit={() => onOpenEditModal(modalState.jobPostingId)}
              onClose={onCloseModal}
            />
          )}
          {modalState.type === 'EDIT' && (
            <JobPostingEditModal
              mode="MODIFIED"
              data={{ jobId: modalState.jobPostingId }}
              onClose={() => onOpenDetailModal(modalState.jobPostingId)}
            />
          )}
        </CommonModal>
      )}

      {stageMenuState && (
        <StageUpdateMenu
          isFirstStage={stageMenuState.schedule.stageOrder === 1}
          position={stageMenuState.position}
          currentStatus={stageMenuState.schedule.result}
          onClose={onCloseStageMenu}
          onSelect={onSelectStageMenu}
        />
      )}

      {/* ✅ TODO -> 완료 메뉴 */}
      {stageNextMenuState !== null && (
        <>
          {stageNextMenuState.type === SCHEDULE_TYPE.STAGE && (
            <StageCompleteMenu
              position={stageNextMenuState.position}
              onClose={onCloseStageNextMenu}
              onSubmit={onCompleteStage}
            />
          )}

          {/* ✅ DONE -> 합격 메뉴 */}
          {stageNextMenuState.type === SCHEDULE_TYPE.ANNOUNCEMENT && (
            <StagePassMenu
              position={stageNextMenuState.position}
              onClose={onCloseStageNextMenu}
              onSubmit={onPassStage}
            />
          )}
        </>
      )}
    </>
  );
}
