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
import { useLongPress } from '@/src/hook/useLongPress';
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
import { type ReactNode, useState } from 'react';

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
  isOutsideMonth?: boolean;
};

type JobPostingModalStateType = {
  type: 'DETAIL' | 'EDIT';
  jobPostingId: number;
  /** EDIT 모달을 닫을 때 동작: 상세로 복귀 vs 전체 닫기 */
  editCloseBehavior?: 'BACK_TO_DETAIL' | 'CLOSE_ALL';
} | null;

type TodoMenuState = { type: 'CREATE'; date: string } | { type: 'EDIT'; todo: TodoType } | null;

const MAX_VISIBLE_ROWS = 4;

/**
 * 모바일 전용 공고명 텍스트.
 * - 짧은 탭 → 상세 모달
 * - 길게 누름 → 수정 모달
 * - 데스크톱은 onClick 으로만 동작
 */
function MobileScheduleText({
  item,
  onDetail,
  onEdit,
}: {
  item: ParsedStageSchedule;
  onDetail: () => void;
  onEdit: () => void;
}) {
  const givenUp = isGivenUp(item);
  const longPress = useLongPress(onDetail, onEdit);

  return (
    <span
      className={cls(
        'block w-full truncate text-[11px] leading-[1.15] font-medium cursor-pointer select-none',
        givenUp && 'line-through text-gray-400',
      )}
      role="button"
      // 데스크톱: touch 이벤트가 없으므로 onClick 이 정상 동작
      // 모바일: onTouchEnd 에서 e.preventDefault() 로 click 차단 후 직접 처리
      onClick={onDetail}
      {...longPress}
    >
      {item.jobPosting.companyName}
    </span>
  );
}

export function CalendarCell({
  date,
  today,
  scheduleList,
  todoList,
  holidayMap,
  isOutsideMonth = false,
}: Props) {
  const isToday = isSameDay(date, today);
  const isSunday = date.getDay() === 0;

  // 공휴일
  const dateKey = dateToYYYYMMDD(date);
  const holidayName = holidayMap?.get(dateKey);
  const isRed = isSunday || !!holidayName;

  const totalItemCount = scheduleList.length + todoList.length;
  const hasOverflow = totalItemCount > MAX_VISIBLE_ROWS;
  const visibleItemLimit = MAX_VISIBLE_ROWS - (hasOverflow ? 1 : 0);
  const shownSchedules = scheduleList.slice(0, visibleItemLimit);
  const remainingSlots = Math.max(0, visibleItemLimit - shownSchedules.length);
  const shownTodos = todoList.slice(0, remainingSlots);
  const hiddenSchedules = scheduleList.slice(shownSchedules.length);
  const hiddenTodos = todoList.slice(shownTodos.length);
  const overflowCount = hiddenSchedules.length + hiddenTodos.length;

  // JobPosting - Modal
  const [modalState, setModalState] = useState<JobPostingModalStateType>(null);

  const onOpenDetailModal = (jobPostingId: number) => {
    setModalState({ type: 'DETAIL', jobPostingId });
  };

  const onOpenEditModal = (
    jobPostingId: number,
    closeBehavior: 'BACK_TO_DETAIL' | 'CLOSE_ALL' = 'BACK_TO_DETAIL',
  ) => {
    setModalState({ type: 'EDIT', jobPostingId, editCloseBehavior: closeBehavior });
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

  const renderScheduleItem = (
    item: ParsedStageSchedule,
    key: string,
    mobileOnly = false,
  ): ReactNode => {
    const checked = isChecked(item);
    const givenUp = isGivenUp(item);

    const mobileContent = (
      <div className={cls('min-w-0 rounded border px-1 py-0.5', getItemBoxStyle(item))}>
        <MobileScheduleText
          item={item}
          onDetail={() => onOpenDetailModal(item.jobPosting.id)}
          onEdit={() => onOpenEditModal(item.jobPosting.id, 'CLOSE_ALL')}
        />
      </div>
    );

    if (mobileOnly) {
      return (
        <div key={key} className="tablet:hidden">
          {mobileContent}
        </div>
      );
    }

    return (
      <div key={key}>
        <div className="tablet:hidden">{mobileContent}</div>
        <div className="hidden tablet:block py-0.5">
          <div className="flex items-center gap-1">
            <CheckedCircleBox
              className="w-4 h-4"
              checked={checked}
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
                  <span className="text-[11px] font-medium text-white">{getBadgeLabel(item)}</span>
                </div>
                <span
                  className={cls('text-[12px] truncate font-medium', givenUp && 'line-through text-gray-400')}
                >
                  {item.jobPosting.companyName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTodoItem = (todo: TodoType, key: string, mobileOnly = false): ReactNode => {
    const mobileContent = (
      <div className="flex items-center gap-1 py-0.5">
        <CheckedCircleBox
          className="w-3.5 h-3.5 shrink-0"
          checked={todo.isDone}
          onClick={() => handleTodoCheckClick(todo)}
        />
        <span
          className={cls(
            'min-w-0 flex-1 truncate text-[11px] leading-[1.15] text-gray-600 cursor-pointer',
            todo.isDone && 'line-through text-gray-400',
          )}
          onClick={() => openEditTodoMenu(todo)}
          role="button"
          tabIndex={0}
        >
          {todo.content}
        </span>
      </div>
    );

    if (mobileOnly) {
      return (
        <div key={key} className="tablet:hidden">
          {mobileContent}
        </div>
      );
    }

    return (
      <div key={key}>
        <div className="tablet:hidden">{mobileContent}</div>
        <div className="hidden tablet:block rounded border border-gray-200 bg-gray-50 px-1 py-0.5">
          <div className="flex items-center gap-1">
            <CheckedCircleBox
              className="w-3.5 h-3.5 shrink-0"
              checked={todo.isDone}
              onClick={() => handleTodoCheckClick(todo)}
            />
            <span
              className={cls(
                'min-w-0 flex-1 truncate text-[11px] leading-[1.15] font-medium cursor-pointer',
                todo.isDone && 'line-through text-gray-400',
              )}
              onClick={() => openEditTodoMenu(todo)}
              role="button"
              tabIndex={0}
            >
              {todo.content}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={cls(
          'w-full flex flex-col tablet:pl-2 pl-0.5 py-1.5 tablet:h-full tablet:min-h-0 tablet:overflow-hidden',
          isToday && 'bg-primary/5',
          isOutsideMonth && 'opacity-30',
        )}
      >
        <header
          className={cls(
            'mb-1.5 flex items-start justify-start gap-1 tablet:justify-between tablet:pr-1.5',
          )}
        >
          <div className="min-w-0 flex flex-1 items-center gap-1 overflow-hidden">
            <span
              className={cls(
                'shrink-0 text-sm leading-none',
                isToday ? 'font-semibold text-primary' : cls('font-medium', isRed && 'text-accent'),
              )}
            >
              {format(date, 'd')}
            </span>
            {holidayName && (
              <span className="min-w-0 truncate text-[12px] font-medium leading-none text-accent">
                {holidayName}
              </span>
            )}
          </div>

          <button
            className="mr-1 hidden shrink-0 items-center justify-center border border-muted tablet:inline-flex tablet:h-4 tablet:w-4 tablet:self-start tablet:rounded-sm"
            type="button"
            onClick={openCreateTodoMenu}
          >
            <AddIcon width={14} height={14} className="text-muted" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-1">
          {shownSchedules.map(item => renderScheduleItem(item, `${item.id}-${item.type}`))}
          {shownTodos.map(todo => renderTodoItem(todo, `${todo.id}`))}

          {/* 데스크톱: 숨겨진 항목은 토글 없이 바로 노출 */}
          {hiddenSchedules.map(item => (
            <div key={`desktop-${item.id}-${item.type}`} className="hidden tablet:block">
              {renderScheduleItem(item, `desktop-content-${item.id}-${item.type}`)}
            </div>
          ))}
          {hiddenTodos.map(todo => (
            <div key={`desktop-todo-${todo.id}`} className="hidden tablet:block">
              {renderTodoItem(todo, `desktop-todo-content-${todo.id}`)}
            </div>
          ))}

          {/* 모바일 전용: inline 확장 아이템 */}
          {isExpanded &&
            hiddenSchedules.map(item =>
              renderScheduleItem(item, `expanded-${item.id}-${item.type}`, true),
            )}
          {isExpanded &&
            hiddenTodos.map(todo => renderTodoItem(todo, `expanded-todo-${todo.id}`, true))}

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
              onClose={
                modalState.editCloseBehavior === 'CLOSE_ALL'
                  ? onCloseModal
                  : () => onOpenDetailModal(modalState.jobPostingId)
              }
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
