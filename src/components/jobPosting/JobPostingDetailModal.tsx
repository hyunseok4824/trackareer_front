'use client';

import CheckIcon from '@/public/svg/Check.svg';
import ChevronDownIcon from '@/public/svg/ChevronDown.svg';
import CloseIcon from '@/public/svg/Close.svg';
import ExportIcon from '@/public/svg/Export.svg';
import { jobPostingsApi } from '@/src/api/jobPosting'; // ✅ detail 조회 API import
import CommonModal from '@/src/components/common/modal/CommonModal';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import LoadingView from '@/src/components/common/view/LoadingView';
import JobPostingDeleteModal from '@/src/components/jobPosting/JobPostingDeleteModal';
import StageCompleteMenu from '@/src/components/stage/CompleteMenu';
import StagePassMenu from '@/src/components/stage/PassMenu';
import StageUpdateMenu, {
  STAGE_UPDATE_MENU_ACTION,
  StageUpdateMenuAction,
} from '@/src/components/stage/UpdateMenu';
import { useJobPosting } from '@/src/hook/useJobPosting';
import { useSchedule } from '@/src/hook/useSchedule';
import {
  STAGE_RESULT,
  STAGE_TYPE,
  StageResult,
  type JobPosting,
  type JobPostingStage,
  type StageType,
} from '@/src/types/jobPosting';
import {
  SCHEDULE_TYPE,
  ScheduleType,
  StageCompletedRequestBody,
  StageMenuState,
  StageNextMenuState,
  StagePassedRequestBody,
  StageSchedule,
} from '@/src/types/stageSchedule';
import { datetimeToString, dateToDiffDays } from '@/src/utils/dateFormatters';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  jobId: number;
  onEdit: () => void;
  onClose: () => void;
};

function JobPostingInfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-start justify-start gap-1">
      <h3 className="py-1 w-20 text-base font-medium text-muted">{label}</h3>
      {children}
    </div>
  );
}

function StageStatus({
  jobPosting,
  onOpenStageMenu,
}: {
  jobPosting: JobPosting;
  onOpenStageMenu: (e: React.MouseEvent<HTMLButtonElement>, schedule: StageSchedule) => void;
}) {
  function getParsedStageName(stage: JobPostingStage) {
    const stageTypeStr = getStageTypeStr(stage.stageType);
    const parsedStageName = `${stage.stageName.replace(stageTypeStr, '').trim()} ${stageTypeStr}`;
    return parsedStageName;
  }

  const getCurrentStageResult = (result: StageResult) => {
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
  };

  const stages = jobPosting.jobPostingStages;
  const currentStage = stages[stages.length - 1];

  const prevStage = stages.length >= 2 ? stages[stages.length - 2] : null;
  const prevStageSummary = prevStage ? getParsedStageName(prevStage) + ' 합격' : null;
  const currentStageSummary = getParsedStageName(currentStage);

  const summaryStr = prevStageSummary
    ? `${prevStageSummary} → ${currentStageSummary}`
    : currentStageSummary;
  return (
    <div className="flex flex-row items-center gap-2 py-0.5">
      <p className="text-base font-normal text-text">{summaryStr}</p>
      <button
        type="button"
        onClick={e => onOpenStageMenu(e, { ...currentStage, jobPosting } as StageSchedule)}
        className="flex flex-row gap-1 items-center justify-between bg-primary rounded-xl px-2 py-1"
      >
        <p className="text-sm font-normal text-white">
          {getCurrentStageResult(currentStage.result)}
        </p>
        <ChevronDownIcon width={16} height={16} className="text-white/80" />
      </button>
    </div>
  );
}

function getStageTypeStr(stage: StageType) {
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

function ScheduleItem({
  schedule,
  isFirst,
  isFinal,
}: {
  schedule: { type: ScheduleType; stage: JobPostingStage };
  isFirst: boolean;
  isFinal: boolean;
}) {
  const stage = schedule.stage;
  const type = schedule.type;
  const stageTypeStr = getStageTypeStr(stage.stageType);
  const parsedStageName = `${stage.stageName.replace(stageTypeStr, '').trim()} ${stageTypeStr}`;
  const stageNameSuffix =
    type === SCHEDULE_TYPE.ANNOUNCEMENT
      ? '결과 발표'
      : stage.stageType === STAGE_TYPE.DOCUMENT || stage.stageType === STAGE_TYPE.ASSIGNMENT
        ? '제출'
        : '참석';
  const stageResultStr =
    isFinal && stage.result === STAGE_RESULT.PASSED
      ? '최종 합격'
      : type === SCHEDULE_TYPE.STAGE
        ? stage.result === STAGE_RESULT.IN_PROGRESS
          ? '진행 중'
          : '완료'
        : stage.result === STAGE_RESULT.DONE
          ? '대기 중'
          : stage.result === STAGE_RESULT.PASSED
            ? '합격'
            : '불합격';
  const stageAtStr =
    type === SCHEDULE_TYPE.STAGE
      ? datetimeToString(stage.eventAt)
      : stage.expectedAnnouncementAt
        ? datetimeToString(stage.expectedAnnouncementAt)
        : isFinal && stage.result == STAGE_RESULT.PASSED
          ? '종료'
          : '별도 안내';
  const diffDays =
    stage.result === STAGE_RESULT.IN_PROGRESS
      ? dateToDiffDays(stage.eventAt)
      : stage.expectedAnnouncementAt
        ? dateToDiffDays(stage.expectedAnnouncementAt)
        : null;

  const inProgress =
    (type === SCHEDULE_TYPE.STAGE && stage.result === STAGE_RESULT.IN_PROGRESS) ||
    (type === SCHEDULE_TYPE.ANNOUNCEMENT && stage.result === STAGE_RESULT.DONE);

  return (
    <li key={stage.id} className="flex flex-row items-stretch gap-3">
      <div className="shrink-0 flex flex-col justify-center items-center">
        {!isFirst && <div className={'w-px h-3 bg-primary'} />}
        <div
          className={[
            'w-8 h-8 rounded-full shrink-0 flex items-center justify-center border border-primary',
            inProgress ? 'bg-white' : 'bg-primary',
          ].join(' ')}
        >
          {inProgress ? (
            <div className="w-4 h-4 rounded-full bg-primary" />
          ) : (
            <CheckIcon width={16} height={16} className="text-white" />
          )}
        </div>
        <div className={['flex-1 w-px', !isFinal ? 'bg-primary' : 'bg-transparent'].join(' ')} />
      </div>
      <div className={`${isFirst ? 'pt-1' : 'pt-4'} flex-1 flex flex-col items-stretch gap-1`}>
        <h3 className="text-base text-text font-medium">
          {parsedStageName} {stageNameSuffix}
        </h3>
        <p className="text-sm text-muted font-normal">{stageResultStr}</p>
      </div>
      <div className={`${isFirst ? 'pt-1' : 'pt-4'} shrink-0 flex flex-col items-end`}>
        <p className="text-base text-text font-normal">{stageAtStr}</p>
        {diffDays !== null && isFinal && (
          <p className="text-sm text-muted font-normal">
            {diffDays === 0 ? 'D-DAY' : diffDays > 0 ? `D-${diffDays}` : isFinal ? '기한 종료' : ``}
          </p>
        )}
      </div>
    </li>
  );
}

export default function JobPostingDetailModal({ jobId, onEdit, onClose }: Props) {
  const [onFetching, setOnFetching] = useState<boolean>(false);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);

  useEffect(() => {
    const fetchJobPosting = async () => {
      try {
        setOnFetching(true);
        const data = await jobPostingsApi.get(jobId);
        setJobPosting(data);
      } catch (error) {
        console.error('Error fetching job posting:', error);
      } finally {
        setOnFetching(false);
      }
    };

    fetchJobPosting();
  }, [jobId]);

  const sortedSchedules = useMemo(() => {
    if (!jobPosting?.jobPostingStages) return [];

    const scheduledList = [] as {
      type: ScheduleType;
      stage: JobPostingStage;
    }[];

    for (const item of jobPosting.jobPostingStages) {
      scheduledList.push({
        type: SCHEDULE_TYPE.STAGE,
        stage: item,
      });
      if (item.result !== STAGE_RESULT.IN_PROGRESS) {
        scheduledList.push({
          type: SCHEDULE_TYPE.ANNOUNCEMENT,
          stage: item,
        });
      }
    }

    return scheduledList.sort((a, b) => {
      if (a.stage.stageOrder === b.stage.stageOrder) {
        if (a.type === SCHEDULE_TYPE.STAGE) return -1;
        return 1;
      }

      return a.stage.stageOrder - b.stage.stageOrder;
    });
  }, [jobPosting?.jobPostingStages]);

  // Stage - Menu
  const {
    onCompletedStageSchedule,
    onPassedAnnouncementSchedule,
    onRejectedAnnouncementSchedule,
    onRollbackSchedule,
    onUncompletedStageSchedule,
  } = useSchedule();
  const [stageMenuState, setStageMenuState] = useState<StageMenuState>(null);
  const [stageNextMenuState, setStageNextMenuState] = useState<StageNextMenuState>(null);

  const onOpenStageMenu = (e: React.MouseEvent<HTMLButtonElement>, schedule: StageSchedule) => {
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
        const incompleted = await onUncompletedStageSchedule(stageMenuState.schedule.id);
        setJobPosting(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            jobPostingStages: prev.jobPostingStages.map(stage =>
              stage.id === incompleted.id ? incompleted : stage,
            ),
          };
        });
        break;
      case STAGE_UPDATE_MENU_ACTION.SET_REJECTED:
        // ✅ "불합격" 선택 시 불합격 처리 (API 호출)
        const rejected = await onRejectedAnnouncementSchedule(stageMenuState.schedule.id);
        setJobPosting(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            jobPostingStages: prev.jobPostingStages.map(stage =>
              stage.id === rejected.id ? rejected : stage,
            ),
          };
        });
        break;
      case STAGE_UPDATE_MENU_ACTION.REVERT:
        // ✅ "되돌리기" 선택 시 되돌리기 처리 (API 호출)
        const reverted = await onRollbackSchedule(
          stageMenuState.schedule.id,
          stageMenuState.schedule.jobPosting.id,
        );
        if (reverted.id !== stageMenuState.schedule.id) {
          // 되돌리기 결과가 기존 스테이지와 다른 경우 (ex. 3단계에서 2단계로 되돌리기)
          setJobPosting(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              jobPostingStages: prev.jobPostingStages
                .map(stage => (stage.id === reverted.id ? reverted : stage))
                .filter(stage => stage.id !== stageMenuState.schedule.id),
            };
          });
        } else {
          // 되돌리기 결과가 기존 스테이지와 동일한 경우 (ex. 2단계에서 2단계로 되돌리기)
          setJobPosting(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              jobPostingStages: prev.jobPostingStages.map(stage =>
                stage.id === reverted.id ? reverted : stage,
              ),
            };
          });
        }

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
      const updated = await onCompletedStageSchedule(stageNextMenuState.schedule.id, payload);
      setJobPosting(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          jobPostingStages: prev.jobPostingStages.map(stage =>
            stage.id === updated.id ? updated : stage,
          ),
        };
      });

      setStageNextMenuState(null);
    } catch (e) {
      console.error(e);
    }
  };

  const onPassStage = async (payload: StagePassedRequestBody) => {
    if (!stageNextMenuState) return;

    try {
      const updated = await onPassedAnnouncementSchedule(stageNextMenuState.schedule.id, payload);
      setJobPosting(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          jobPostingStages: prev.jobPostingStages
            .map(stage => (stage.id === updated.id ? updated : stage))
            .concat(updated.next ? [updated.next] : []),
        };
      });

      setStageNextMenuState(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete
  const { deleteJobPosting } = useJobPosting();
  const [onDeleting, setOnDeleting] = useState<boolean>(false);
  const [isDeleteModalOpened, setIsDeleteModalOpened] = useState<boolean>(false);

  const onOpenDeleteModal = async () => {
    if (onDeleting) return;

    setIsDeleteModalOpened(true);
  };

  const onCloseDeleteModal = () => setIsDeleteModalOpened(false);

  const onDelete = async () => {
    if (onDeleting) return;

    try {
      setOnDeleting(true);
      await jobPostingsApi.delete(jobId);
      deleteJobPosting(jobId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setOnDeleting(false);
    }
  };

  return (
    <>
      {/* ✅ 기존 initialValues -> view 로만 바꿔주면 됨 */}
      <div className="w-full tablet:w-180 h-dvh tablet:h-auto tablet:max-h-[90dvh] flex flex-col">
        <header className="shrink-0 w-full p-6 flex flex-row gap-3 items-start border-b-[0.5px] border-muted/25">
          {jobPosting && (
            <h1 className="flex-1 font-bold text-2xl">
              [{jobPosting.companyName}] {jobPosting.title}
            </h1>
          )}
          <button
            className="flex items-center justify-center w-8 h-8"
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon width={24} height={24} className={'text-muted'} />
          </button>
        </header>
        {onFetching && <LoadingView />}
        {!onFetching && !jobPosting && (
          <div className="w-full h-full p-6 flex items-center justify-center">
            <p className="text-muted font-bold text-2xl">공고 정보를 불러올 수 없습니다.</p>
          </div>
        )}
        {!onFetching && jobPosting && (
          <div
            className="w-full p-6 flex-1 flex flex-col items-start overflow-y-auto"
            style={{
              scrollbarWidth: 'none',
            }}
          >
            <section className="w-full mb-6 flex flex-col gap-2 items-start">
              <div className="w-full flex flex-row justify-start items-center gap-3">
                <h2 className="flex-1 text-lg text-text font-medium">공고 정보</h2>
                <button
                  className="text-muted text-sm font-normal"
                  onClick={onOpenDeleteModal}
                  disabled={onDeleting}
                >
                  삭제하기
                </button>
                <div className="w-px h-4 bg-muted/50" />
                <button className="text-muted text-sm font-normal" type="button" onClick={onEdit}>
                  수정하기
                </button>
              </div>
              <JobPostingInfoItem label="회사명">
                <p className="py-1 font-regular">{jobPosting.companyName}</p>
              </JobPostingInfoItem>
              <JobPostingInfoItem label="현재 상태">
                <StageStatus jobPosting={jobPosting} onOpenStageMenu={onOpenStageMenu} />
              </JobPostingInfoItem>
              <JobPostingInfoItem label="원본 링크">
                {jobPosting.sourceUrl ? (
                  <a
                    className="py-1 flex items-center text-primary"
                    target="_blank"
                    rel="noreferrer"
                    href={jobPosting.sourceUrl}
                  >
                    링크로 이동하기
                    <ExportIcon width={16} height={16} className="text-primary" />
                  </a>
                ) : (
                  <p className="text-muted">-</p>
                )}
              </JobPostingInfoItem>
              <JobPostingInfoItem label="메모">
                <p
                  className={`py-1 text-base font-normal ${jobPosting.memo ? 'text-text' : 'text-muted'}`}
                >
                  {jobPosting.memo || '-'}
                </p>
              </JobPostingInfoItem>
            </section>
            <section className="w-full mb-6 flex flex-col gap-3 items-start">
              <h2 className="text-lg text-text font-medium">지원 현황 및 일정</h2>
              {/* <JobPostingStatus jobPosting={jobPosting} /> */}
              <ul className="w-full flex flex-col">
                {sortedSchedules.map((schedule, index) => (
                  <ScheduleItem
                    key={schedule.stage.id + schedule.type}
                    schedule={schedule}
                    isFirst={index === 0}
                    isFinal={index === sortedSchedules.length - 1}
                  />
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>

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

      {/* Delete */}
      <CommonModal isOpen={isDeleteModalOpened} onClose={onCloseDeleteModal}>
        <JobPostingDeleteModal onClose={onCloseDeleteModal} onDelete={onDelete} />
      </CommonModal>

      <LoadingModal isOpen={onDeleting} />
    </>
  );
}
