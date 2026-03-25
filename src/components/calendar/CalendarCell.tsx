'use client';

import AddIcon from '@/public/svg/Add.svg';
import { todoApi } from '@/src/api/todo';
import CheckedCircleBox from '@/src/components/common/button/CheckedCircleBox';
import CommonModal from '@/src/components/common/modal/CommonModal';
import JobPostingDetailModal from '@/src/components/jobPosting/JobPostingDetailModal';
import JobPostingEditModal from '@/src/components/jobPosting/JobPostingEditModal';
import StageCompleteMenu from '@/src/components/stage/CompleteMenu';
import StagePassMenu from '@/src/components/stage/PassMenu';
import StageUpdateMenu, {
  STAGE_UPDATE_MENU_ACTION,
  StageUpdateMenuAction,
} from '@/src/components/stage/UpdateMenu';
import CreateTodoModal from '@/src/components/todo/CreateTodoModal';
import EditTodoModal from '@/src/components/todo/EditTodoModal';
import { useSchedule } from '@/src/hook/useSchedule';
import { useTodoStore } from '@/src/stores/todoStore';
import { STAGE_RESULT } from '@/src/types/jobPosting';
import {
  ParsedStageSchedule,
  SCHEDULE_TYPE,
  StageCompletedRequestBody,
  StageMenuState,
  StageNextMenuState,
  StagePassedRequestBody,
} from '@/src/types/stageSchedule';
import { TodoType } from '@/src/types/todo';
import { dateToYYYYMMDD } from '@/src/utils/dateFormatters';
import { cls } from '@/src/utils/strFormatters';
import { format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';

// ✅ 전형 완료 여부
function isChecked(schedule: ParsedStageSchedule) {
  const onStage =
    schedule.type === SCHEDULE_TYPE.STAGE && schedule.result !== STAGE_RESULT.IN_PROGRESS;
  const onAnnouncement =
    schedule.type === SCHEDULE_TYPE.ANNOUNCEMENT && schedule.result !== STAGE_RESULT.DONE;
  return onStage || onAnnouncement;
}

// 포기한 전형 여부
function isGivenUp(schedule: ParsedStageSchedule) {
  return schedule.type === 'STAGE' && schedule.result === 'REJECTED' && schedule.doneAt === null;
}

function getBadgeLabel(item: ParsedStageSchedule) {
  if (item.type === 'ANNOUNCEMENT') return '결';

  switch (item.stageType) {
    case 'DOCUMENT':
      return '서';
    case 'INTERVIEW':
      return '면';
    case 'EXAM':
      return '시';
    case 'ASSIGNMENT':
      return '과';
  }
}

function getBadgeBg(item: ParsedStageSchedule) {
  if (item.type === 'ANNOUNCEMENT') return 'bg-primary'; // ✅ 발표 전용 색 (원하는 값으로)

  // ✅ 포기한 전형
  if (isGivenUp(item)) {
    return 'bg-disabled/100';
  }

  switch (item.stageType) {
    case 'DOCUMENT':
    case 'ASSIGNMENT':
      return 'bg-primary/50';
    case 'INTERVIEW':
    case 'EXAM':
      return 'bg-primary/75';
  }
}

type Props = {
  date: Date;
  today: Date;
  scheduleList: ParsedStageSchedule[];
  todoList: TodoType[];
  holidayMap?: Map<string, string>;
  compact?: boolean;
  isOutsideMonth?: boolean;
};

type JobPostingModalStateType = {
  type: 'DETAIL' | 'EDIT';
  jobPostingId: number;
} | null;

type TodoMenuState = { type: 'CREATE'; date: string } | { type: 'EDIT'; todo: TodoType } | null;

const MAX_COMPACT_ROWS = 4;

export function CalendarCell({
  date,
  today,
  scheduleList,
  todoList,
  holidayMap,
  compact = false,
  isOutsideMonth = false,
}: Props) {
  const isToday = isSameDay(date, today);
  const isSunday = date.getDay() === 0;

  // 공휴일
  const dateKey = dateToYYYYMMDD(date);
  const holidayName = holidayMap?.get(dateKey);
  const isRed = isSunday || !!holidayName;

  // compact 모드에서 최대 4개 슬롯만 사용하고, 초과 시 마지막 슬롯은 overflow 표시에 사용
  const totalItemCount = scheduleList.length + todoList.length;
  const hasOverflow = compact && totalItemCount > MAX_COMPACT_ROWS;
  const visibleItemLimit = compact ? MAX_COMPACT_ROWS - (hasOverflow ? 1 : 0) : totalItemCount;
  const shownSchedules = compact ? scheduleList.slice(0, visibleItemLimit) : scheduleList;
  const remainingSlots = compact
    ? Math.max(0, visibleItemLimit - shownSchedules.length)
    : todoList.length;
  const shownTodos = compact ? todoList.slice(0, remainingSlots) : todoList;
  const overflowCount = compact
    ? Math.max(0, totalItemCount - shownSchedules.length - shownTodos.length)
    : 0;

  // JobPosting - Modal
  const [modalState, setModalState] = useState<JobPostingModalStateType>(null);

  const onOpenDetailModal = (jobPostingId: number) => {
    setModalState({ type: 'DETAIL', jobPostingId });
  };

  const onOpenEditModal = (jobPostingId: number) => {
    setModalState({ type: 'EDIT', jobPostingId });
  };

  const onCloseModal = () => {
    setModalState(null);
  };

  // Todo
  const [todoMenuState, setTodoMenuState] = useState<TodoMenuState>(null);
  const { updateTodoItem } = useTodoStore();

  const openCreateTodoMenu = () => setTodoMenuState({ type: 'CREATE', date: dateToYYYYMMDD(date) });
  const openEditTodoMenu = (todo: TodoType) => setTodoMenuState({ type: 'EDIT', todo });

  const closeTodoMenu = () => {
    setTodoMenuState(null);
  };

  const handleTodoCheckClick = async (todo: TodoType) => {
    try {
      const updated = await todoApi.update({
        id: todo.id,
        content: todo.content,
        isDone: !todo.isDone,
      });
      updateTodoItem(updated);
    } catch (e) {
      console.error(e);
    }
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

  const onOpenStageMenu = (e: React.MouseEvent<HTMLDivElement>, schedule: ParsedStageSchedule) => {
    // ISSUE : 최종 합격 및 불합격한 경우에 되돌리기가 불가능 - 다음 스테이지를 알 수 없기 때문
    if (
      (schedule.type === SCHEDULE_TYPE.STAGE && schedule.result !== STAGE_RESULT.IN_PROGRESS) ||
      (schedule.type === SCHEDULE_TYPE.ANNOUNCEMENT && schedule.result !== STAGE_RESULT.DONE)
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const position = { left: rect.left, top: rect.bottom + 4 };
    setStageMenuState({ type: schedule.type, schedule, position });
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
      <div
        className={cls(
          'w-full',
          compact ? 'flex h-full min-h-0 flex-col overflow-hidden py-1.5' : 'py-3 min-h-54.5',
          isOutsideMonth && 'opacity-30',
        )}
      >
        <header
          className={cls(
            'flex justify-between gap-1',
            compact ? 'mb-1.5 items-start' : 'mb-2 items-center',
          )}
        >
          {compact ? (
            <div className="min-w-0">
              <div
                className={cls(
                  'text-xs font-medium min-w-0 leading-none',
                  isToday && 'font-semibold text-primary',
                )}
              >
                <span className={cls(!isToday && isRed && 'text-accent')}>{format(date, 'd')}</span>
                {holidayName && (
                  <span className="ml-2 truncate rounded-full bg-accent/10  text-[12px] font-medium leading-none text-accent">
                    {holidayName}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className={cls('text-sm font-medium', isToday && 'font-semibold text-primary')}>
              <span className={cls(!isToday && isRed && 'text-accent')}>
                {format(date, 'MM.dd', { locale: ko })}
              </span>
              <span className={cls(!isToday && isRed && 'text-accent')}>
                ({format(date, 'EEE', { locale: ko })})
              </span>
            </div>
          )}

          {!compact && (
            <button
              className="w-4 h-4 flex items-center justify-center rounded-sm border border-muted"
              type="button"
              onClick={openCreateTodoMenu}
            >
              <AddIcon width={16} height={16} className={'text-muted'} />
            </button>
          )}
        </header>

        <div className={cls(compact && 'flex min-h-0 flex-1 flex-col gap-1')}>
          {!compact && scheduleList.length === 0 && todoList.length === 0 && (
            <div className="h-6 flex flex-row items-center">
              <p className="text-xs text-gray-300 ">일정이 없습니다</p>
            </div>
          )}

          {/* JOB */}
          {shownSchedules.length > 0 &&
            shownSchedules.map(item => {
              const isCheckedItem = isChecked(item);
              const isGivenUpItem = isGivenUp(item);
              return (
                <div key={`${item.id}-${item.type}`} className={cls(compact ? 'min-w-0' : 'py-1')}>
                  <div className="flex items-center gap-1 justify-center">
                    <CheckedCircleBox
                      className="w-4 h-4"
                      checked={isCheckedItem}
                      onClick={e => onOpenStageMenu(e, item)}
                    />

                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-1 cursor-pointer"
                        role="button"
                        onClick={() => onOpenDetailModal(item.jobPosting.id)}
                      >
                        <div
                          className={cls(
                            'w-4 h-4 rounded-sm shrink-0 flex items-center justify-center',
                            getBadgeBg(item),
                          )}
                        >
                          <span className={'text-xs font-medium text-white'}>
                            {getBadgeLabel(item)}
                          </span>
                        </div>
                        <span
                          className={cls(
                            compact
                              ? 'text-[11px] leading-4 truncate font-medium cursor-pointer'
                              : 'text-xs truncate font-medium cursor-pointer',
                            isGivenUpItem && 'line-through text-gray-400',
                          )}
                        >
                          {item.jobPosting.companyName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* TODO */}
          {shownTodos.length > 0 &&
            shownTodos.map(it => (
              <div key={it.id} className={cls(compact ? 'min-w-0' : 'py-1')}>
                <div className="flex items-center gap-1 justify-center">
                  <CheckedCircleBox
                    className="w-4 h-4"
                    checked={it.isDone}
                    onClick={() => handleTodoCheckClick(it)}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={cls(
                          compact
                            ? 'text-[11px] leading-4 truncate font-medium cursor-pointer'
                            : 'text-xs truncate font-medium cursor-pointer',
                          it.isDone && 'line-through text-gray-400',
                        )}
                        onClick={() => openEditTodoMenu(it)}
                        role="button"
                        tabIndex={0}
                      >
                        {it.content}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* 초과 아이템 표시 */}
          {overflowCount > 0 && (
            <div
              className={cls(
                compact ? 'mt-auto rounded-md bg-gray-50 px-1.5 py-0.5' : 'py-0.5 px-1',
              )}
            >
              <span className="text-[12px] text-primary/70 font-bold">+{overflowCount}개</span>
            </div>
          )}
        </div>
      </div>

      {modalState && (
        <CommonModal isOpen={true} onClose={onCloseModal}>
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

      {/* ✅ Todo Create/Edit 모달 */}
      {todoMenuState && (
        <CommonModal isOpen={true} onClose={closeTodoMenu}>
          {todoMenuState.type === 'CREATE' && (
            <CreateTodoModal date={todoMenuState.date} onClose={closeTodoMenu} />
          )}
          {todoMenuState.type === 'EDIT' && (
            <EditTodoModal todo={todoMenuState.todo} onClose={closeTodoMenu} />
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
