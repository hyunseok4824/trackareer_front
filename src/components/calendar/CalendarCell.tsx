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

// compact 모드 — 기존 배지 색상 체계와 동일한 의미/톤으로 박스 배경+테두리 색상
function getItemBoxStyle(item: ParsedStageSchedule): string {
  if (isGivenUp(item)) return 'bg-gray-100 border-gray-200';
  if (item.type === SCHEDULE_TYPE.ANNOUNCEMENT) return 'bg-primary/30 border-primary/60';
  switch (item.stageType) {
    case 'DOCUMENT':
    case 'ASSIGNMENT':
      return 'bg-primary/10 border-primary/20';
    case 'INTERVIEW':
    case 'EXAM':
      return 'bg-primary/20 border-primary/40';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

// non-compact 모드용 배지 — 기존 유지
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
  if (item.type === 'ANNOUNCEMENT') return 'bg-primary';
  if (isGivenUp(item)) return 'bg-disabled/100';
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

  // 숨겨진 아이템 (compact overflow 패널용)
  const hiddenSchedules = compact ? scheduleList.slice(shownSchedules.length) : [];
  const hiddenTodos = compact ? todoList.slice(shownTodos.length) : [];

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
        setStageNextMenuState({
          type: SCHEDULE_TYPE.STAGE,
          schedule: stageMenuState.schedule,
          position: stageMenuState.position,
        });
        break;
      case STAGE_UPDATE_MENU_ACTION.SET_PASSED:
        setStageNextMenuState({
          type: SCHEDULE_TYPE.ANNOUNCEMENT,
          schedule: stageMenuState.schedule,
          position: stageMenuState.position,
        });
        break;
      case STAGE_UPDATE_MENU_ACTION.SET_INCOMPLETED:
        await onUncompletedStageSchedule(stageMenuState.schedule.id);
        break;
      case STAGE_UPDATE_MENU_ACTION.SET_REJECTED:
        await onRejectedAnnouncementSchedule(stageMenuState.schedule.id);
        break;
      case STAGE_UPDATE_MENU_ACTION.REVERT:
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

  // +N개 inline 토글 (모바일 전용)
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(v => !v);

  return (
    <>
      <div
        className={cls(
          'w-full',
          compact
            ? 'flex flex-col py-1.5 tablet:h-full tablet:min-h-0 tablet:overflow-hidden'
            : 'py-3 min-h-54.5',
          isToday && compact && 'bg-primary/5',
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
            // 날짜 + 공휴일명: flex로 한 줄 유지, 공휴일명은 truncate 처리
            <div className="min-w-0 flex items-center gap-1 overflow-hidden">
              <span
                className={cls(
                  'shrink-0 text-xs leading-none',
                  isToday ? 'font-semibold text-primary' : cls('font-medium', isRed && 'text-accent'),
                )}
              >
                {format(date, 'd')}
              </span>
              {holidayName && (
                <span className="min-w-0 truncate text-[9px] font-medium leading-none text-accent">
                  {holidayName}
                </span>
              )}
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

              if (compact) {
                // 모바일: 색상 박스, tablet+: 배지 라벨
                return (
                  <div key={`${item.id}-${item.type}`}>
                    {/* 모바일 전용: 색상 박스 + 체크박스 + 회사명 */}
                    <div
                      className={cls(
                        'tablet:hidden min-w-0 rounded border px-1 py-0.5',
                        getItemBoxStyle(item),
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <CheckedCircleBox
                          className="w-3.5 h-3.5 shrink-0"
                          checked={isCheckedItem}
                          onClick={e => onOpenStageMenu(e, item)}
                        />
                        <span
                          className={cls(
                            'min-w-0 flex-1 text-[11px] leading-[1.15] truncate font-medium cursor-pointer',
                            isGivenUpItem && 'line-through text-gray-400',
                          )}
                          onClick={() => onOpenDetailModal(item.jobPosting.id)}
                          role="button"
                        >
                          {item.jobPosting.companyName}
                        </span>
                      </div>
                    </div>
                    {/* tablet+ 전용: 배지 라벨 스타일 */}
                    <div className="hidden tablet:block py-0.5">
                      <div className="flex items-center gap-1">
                        <CheckedCircleBox
                          className="w-3.5 h-3.5"
                          checked={isCheckedItem}
                          onClick={e => onOpenStageMenu(e, item)}
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className="flex items-center gap-0.5 cursor-pointer"
                            role="button"
                            onClick={() => onOpenDetailModal(item.jobPosting.id)}
                          >
                            <div
                              className={cls(
                                'w-4 h-4 rounded-sm shrink-0 flex items-center justify-center',
                                getBadgeBg(item),
                              )}
                            >
                              <span className="text-[10px] font-medium text-white">
                                {getBadgeLabel(item)}
                              </span>
                            </div>
                            <span
                              className={cls(
                                'text-[11px] truncate font-medium',
                                isGivenUpItem && 'line-through text-gray-400',
                              )}
                            >
                              {item.jobPosting.companyName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // non-compact: 기존 배지 스타일 유지
              return (
                <div key={`${item.id}-${item.type}`} className="py-1">
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
                            'text-xs truncate font-medium cursor-pointer',
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
            shownTodos.map(it => {
              if (compact) {
                return (
                  <div
                    key={it.id}
                    className="flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1 py-0.5"
                  >
                    <CheckedCircleBox
                      className="w-3.5 h-3.5 shrink-0"
                      checked={it.isDone}
                      onClick={() => handleTodoCheckClick(it)}
                    />
                    <span
                      className={cls(
                        'min-w-0 flex-1 text-[11px] leading-[1.15] truncate font-medium cursor-pointer',
                        it.isDone && 'line-through text-gray-400',
                      )}
                      onClick={() => openEditTodoMenu(it)}
                      role="button"
                      tabIndex={0}
                    >
                      {it.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={it.id} className="py-1">
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
                            'text-xs truncate font-medium cursor-pointer',
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
              );
            })}

          {/* 모바일 전용: inline 확장 아이템 */}
          {isExpanded &&
            hiddenSchedules.map(item => {
              const isCheckedItem = isChecked(item);
              const isGivenUpItem = isGivenUp(item);
              return (
                <div
                  key={`expanded-${item.id}-${item.type}`}
                  className={cls(
                    'tablet:hidden min-w-0 rounded border px-1 py-0.5',
                    getItemBoxStyle(item),
                  )}
                >
                  <div className="flex items-center gap-1">
                    <CheckedCircleBox
                      className="w-3.5 h-3.5 shrink-0"
                      checked={isCheckedItem}
                      onClick={e => onOpenStageMenu(e, item)}
                    />
                    <span
                      className={cls(
                        'min-w-0 flex-1 text-[11px] leading-[1.15] truncate font-medium cursor-pointer',
                        isGivenUpItem && 'line-through text-gray-400',
                      )}
                      onClick={() => onOpenDetailModal(item.jobPosting.id)}
                      role="button"
                    >
                      {item.jobPosting.companyName}
                    </span>
                  </div>
                </div>
              );
            })}
          {isExpanded &&
            hiddenTodos.map(it => (
              <div
                key={`expanded-todo-${it.id}`}
                className="tablet:hidden flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1 py-0.5"
              >
                <CheckedCircleBox
                  className="w-3.5 h-3.5 shrink-0"
                  checked={it.isDone}
                  onClick={() => handleTodoCheckClick(it)}
                />
                <span
                  className={cls(
                    'min-w-0 flex-1 text-[11px] leading-[1.15] truncate font-medium cursor-pointer',
                    it.isDone && 'line-through text-gray-400',
                  )}
                  onClick={() => openEditTodoMenu(it)}
                  role="button"
                  tabIndex={0}
                >
                  {it.content}
                </span>
              </div>
            ))}

          {/* 초과 아이템 */}
          {overflowCount > 0 && (
            <div className="mt-auto">
              {/* 모바일: inline 토글 */}
              <button
                className="tablet:hidden w-full rounded-md bg-gray-50 px-1.5 py-0.5 text-left text-[11px] text-primary/70 font-bold hover:bg-gray-100 active:bg-gray-100"
                onClick={toggleExpand}
              >
                {isExpanded ? '접기' : `+${overflowCount}개`}
              </button>
              {/* tablet+: 정적 카운트 */}
              <span className="hidden tablet:block px-1 text-[11px] text-gray-400">
                +{overflowCount}개
              </span>
            </div>
          )}
        </div>
      </div>

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
