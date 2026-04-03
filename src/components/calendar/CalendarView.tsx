'use client';

import ChevronLeftIcon from '@/public/svg/ChevronLeft.svg';
import ChevronRightIcon from '@/public/svg/ChevronRight.svg';
import { stageScheduleApi } from '@/src/api/stageSchedule';
import { todoApi } from '@/src/api/todo';
import { CalendarCell } from '@/src/components/calendar/CalendarCell';
import { useScheduleStore } from '@/src/stores/scheduleStore';
import { useTodoStore } from '@/src/stores/todoStore';
import { ParsedStageSchedule, SCHEDULE_TYPE } from '@/src/types/stageSchedule';
import { TodoType } from '@/src/types/todo';
import { holidayApi } from '@/src/api/holiday';
import { HolidayType } from '@/src/types/holiday';
import {
  dateToYYYYMMDD,
  toUtcZEndOfDayFromDate,
  toUtcZStartOfDayFromDate,
} from '@/src/utils/dateFormatters';
import { cls } from '@/src/utils/strFormatters';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';

function sortSchedule(a: ParsedStageSchedule, b: ParsedStageSchedule) {
  const kindOrder = (item: ParsedStageSchedule) =>
    item.type === SCHEDULE_TYPE.ANNOUNCEMENT ? 0 : 1;

  const k = kindOrder(a) - kindOrder(b);
  if (k !== 0) return k;

  return a.stageName.localeCompare(b.stageName);
}

function sortTodo(a: TodoType, b: TodoType) {
  const typeOrder = (t: TodoType['isDone']) => (t ? 1 : 0);
  const t = typeOrder(a.isDone) - typeOrder(b.isDone);
  if (t !== 0) return t;
  return a.content.localeCompare(b.content);
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type Range = { start: Date; end: Date };

export default function CalendarView() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [anchorDate, setAnchorDate] = useState<Date>(today);

  const monthStart = useMemo(() => startOfMonth(anchorDate), [anchorDate]);
  const monthEnd = useMemo(() => endOfMonth(anchorDate), [anchorDate]);

  const calStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart]);
  const calEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 0 }), [monthEnd]);

  const calDays = useMemo(
    () => eachDayOfInterval({ start: calStart, end: calEnd }),
    [calStart, calEnd],
  );

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calDays.length; i += 7) {
      result.push(calDays.slice(i, i + 7));
    }
    return result;
  }, [calDays]);

  const monthLabel = useMemo(() => format(anchorDate, 'yyyy년 M월'), [anchorDate]);

  const loadedRange = useMemo<Range>(() => ({ start: calStart, end: calEnd }), [calStart, calEnd]);

  const startIso = useMemo(() => toUtcZStartOfDayFromDate(loadedRange.start), [loadedRange.start]);
  const endIso = useMemo(() => toUtcZEndOfDayFromDate(loadedRange.end), [loadedRange.end]);

  const prevMonth = () => setAnchorDate(d => subMonths(d, 1));
  const nextMonth = () => setAnchorDate(d => addMonths(d, 1));
  const goToday = () => setAnchorDate(today);

  // Data
  const { scheduleItems, hydrateScheduleItems } = useScheduleStore();
  const hydrateScheduleItemsRef = useRef(hydrateScheduleItems);
  const { todoItems, hydrateTodoItems } = useTodoStore();
  const hydrateTodoItemsRef = useRef(hydrateTodoItems);
  const [holidayList, setHolidayList] = useState<HolidayType[]>([]);

  // 스크롤 컨테이너 ref — 월 전환 시 스크롤 초기화용
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      const list = await stageScheduleApi.getList({ startDate: startIso, endDate: endIso });
      const scheduledList = [];
      for (const item of list) {
        const eventAt = dateToYYYYMMDD(new Date(item.eventAt));
        scheduledList.push({
          ...item,
          date: eventAt,
          type: SCHEDULE_TYPE.STAGE,
        } as ParsedStageSchedule);
        if (item.expectedAnnouncementAt) {
          const expectedAnnouncementAt = dateToYYYYMMDD(new Date(item.expectedAnnouncementAt));
          scheduledList.push({
            ...item,
            date: expectedAnnouncementAt,
            type: SCHEDULE_TYPE.ANNOUNCEMENT,
          } as ParsedStageSchedule);
        }
      }
      hydrateScheduleItemsRef.current(scheduledList);
    };

    const fetchTodos = async () => {
      const list = await todoApi.getList({ startDate: startIso, endDate: endIso });
      hydrateTodoItemsRef.current(list);
    };

    fetchSchedules();
    fetchTodos();
  }, [startIso, endIso]);

  // 공휴일은 파라미터 없이 한 번만 조회 (API 명세에 쿼리 파라미터 없음)
  useEffect(() => {
    holidayApi.getList().then(setHolidayList).catch(console.error);
  }, []);

  // 월 전환 시 내부 스크롤 맨 위로 초기화
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [anchorDate]);

  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();
    const visibleKeys = new Set(calDays.map(d => dateToYYYYMMDD(d)));
    for (const h of holidayList) {
      if (visibleKeys.has(h.date)) {
        map.set(h.date, h.name);
      }
    }
    return map;
  }, [holidayList, calDays]);

  const sortedScheduleMap = useMemo(() => {
    const map = new Map<string, ParsedStageSchedule[]>();

    for (const item of scheduleItems) {
      const arr = map.get(item.date) ?? [];
      arr.push(item);
      map.set(item.date, arr);
    }

    for (const [k, arr] of map.entries()) {
      arr.sort(sortSchedule);
      map.set(k, arr);
    }

    return map;
  }, [scheduleItems]);

  const sortedTodoMap = useMemo(() => {
    const map = new Map<string, TodoType[]>();

    for (const it of todoItems) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }

    for (const [k, arr] of map.entries()) {
      arr.sort(sortTodo);
      map.set(k, arr);
    }

    return map;
  }, [todoItems]);

  return (
    <section className="bg-white flex flex-1 min-h-0 flex-col overflow-hidden tablet:rounded-3xl tablet:shadow-default">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Sticky header — 월 이동 + 요일 행 */}
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="px-3 tablet:px-4 pt-4 tablet:pt-6 pb-3">
            <header className="w-full flex flex-row items-center justify-between gap-3">
              <section className="flex items-center gap-3">
                <button onClick={prevMonth} className="rounded-lg hover:bg-gray-50">
                  <ChevronLeftIcon className={'text-black'} width={32} height={32} />
                </button>

                <span className="text-base text-black font-medium">{monthLabel}</span>

                <button onClick={nextMonth} className="rounded-lg hover:bg-gray-50">
                  <ChevronRightIcon className={'text-black'} width={32} height={32} />
                </button>
              </section>

              <button
                onClick={goToday}
                className="py-2 text-xs text-disabled font-medium hover:text-black"
              >
                오늘로 이동하기
              </button>
            </header>
          </div>

          {/* 모바일 전용 색상 범례 — 요일 헤더 border 바로 위 */}
          <div className="tablet:hidden px-3 pb-2 flex flex-wrap gap-x-3 gap-y-1">
            {(
              [
                { label: '서류·과제', bg: 'bg-primary/10', border: 'border-primary/20' },
                { label: '면접·시험', bg: 'bg-primary/20', border: 'border-primary/40' },
                { label: '발표', bg: 'bg-primary/30', border: 'border-primary/60' },
              ] as const
            ).map(({ label, bg, border }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={cls('w-3 h-3 rounded-sm shrink-0 border', bg, border)} />
                <span className="text-[10px] text-gray-500">{label}</span>
              </span>
            ))}
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 gap-x-0.5 tablet:gap-x-0 border-t border-gray-100 bg-white px-2 tablet:px-4 py-2">
            {DOW_LABELS.map((label, i) => (
              <div
                key={i}
                className={cls(
                  'text-center text-xs font-medium text-muted py-1',
                  i === 0 && 'text-accent',
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Monthly grid — 각 주 행 높이 고정 */}
        <div className="space-y-1 tablet:space-y-0 px-2 tablet:px-4 pb-4 tablet:pb-6">
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 gap-x-0.5 tablet:gap-x-0 border-t border-gray-100 min-h-30 tablet:min-h-[7.75rem]"
            >
              {week.map(date => {
                const key = dateToYYYYMMDD(date);
                const isOutsideMonth = !isSameMonth(date, anchorDate);
                return (
                  <CalendarCell
                    key={key}
                    date={date}
                    today={today}
                    scheduleList={sortedScheduleMap.get(key) ?? []}
                    todoList={sortedTodoMap.get(key) ?? []}
                    holidayMap={holidayMap}
                    isOutsideMonth={isOutsideMonth}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
