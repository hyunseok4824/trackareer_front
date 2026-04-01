'use client';

import { useEffect, useEffectEvent, useState } from 'react';

import type { Position } from '@/src/types/position';

import CheckedCircleBox from '@/src/components/common/button/CheckedCircleBox';
import CommonMenu from '@/src/components/common/menu/CommonMenu';
import { StageCompletedRequestBody } from '@/src/types/stageSchedule';
import { formatDate, formatTime } from '@/src/utils/dateFormatters';
import { cls } from '@/src/utils/strFormatters';

function toEventAtISOString(dateDot: string, time?: string, include?: boolean) {
  const digits = dateDot.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));

  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  let hh = 23;
  let mm = 59;

  if (include) {
    const tDigits = (time ?? '').replace(/\D/g, '');
    if (tDigits.length !== 4) return null;

    hh = Number(tDigits.slice(0, 2));
    mm = Number(tDigits.slice(2, 4));
    if (hh > 23 || mm > 59) return null;
  }

  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);

  // ✅ 달력상 invalid 방지 (예: 2026.02.31)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;

  return dt.toISOString();
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      aria-pressed={checked}
      disabled={disabled}
      className={cls(
        'relative inline-flex w-8 h-5 rounded-full transition-colors duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-primary/30',
        disabled && 'opacity-50 cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-gray-300',
      )}
    >
      <span
        className={cls(
          'absolute top-1/2 left-0.5 -translate-y-1/2',
          'w-4 h-4 rounded-full bg-white shadow-sm',
          'transition-transform duration-200 ease-out will-change-transform',
          checked ? 'translate-x-3' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export default function StageCompleteMenu({
  position,
  onClose,
  onSubmit,
}: {
  position: Position;
  onClose: () => void;
  onSubmit: (payload: StageCompletedRequestBody) => void;
}) {
  // ✅ 훅은 항상 호출 (조건부 return 금지)
  const [isSeparateNotice, setIsSeparateNotice] = useState<boolean>(false);
  const [date, setDate] = useState<string>('');
  const [hasTime, setHasTime] = useState<boolean>(false);
  const [time, setTime] = useState<string>('');

  const inputDisabled = isSeparateNotice;

  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const initialize = useEffectEvent(() => {
    setDate('');
    setTime('');
    setHasTime(false);

    setDateError(null);
    setTimeError(null);
  });

  useEffect(() => {
    initialize();
  }, []);

  return (
    <CommonMenu
      isOpen={true}
      position={position}
      onClose={onClose}
      autoFit
      className="w-46.5 h-auto rounded-2xl shadow shadow-black/25 border border-gray-100 overflow-hidden"
    >
      {/*
       * 모바일 bottom sheet / 데스크톱 팝오버 공용 레이아웃
       * - 패딩: 모바일 p-4, 데스크톱 p-2
       * - 입력 높이: 모바일 h-9(36px) → 터치 가능, 데스크톱 h-6(24px)
       * - 닫기 버튼: 모바일 min-w/h-9 → 터치 가능
       */}
      <div className="p-4 tablet:p-2">
        <header className="flex items-center justify-between border-b border-gray-100 tablet:border-0 pb-3 tablet:pb-0">
          <div className="text-sm tablet:text-xs font-bold">결과 발표 예정일</div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-9 min-h-9 tablet:min-w-0 tablet:min-h-0 tablet:w-2 tablet:h-2 flex items-center justify-center rounded-lg text-disabled text-xs hover:bg-gray-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="mt-3 tablet:mt-2 space-y-3 tablet:space-y-2">
          <div className="flex items-center gap-2 w-full">
            <CheckedCircleBox
              checked={!isSeparateNotice}
              onClick={() => {
                setIsSeparateNotice(false);
                setDateError(null);
                setTimeError(null);
              }}
              className="w-5 h-5 tablet:w-4 tablet:h-4 shrink-0"
            />

            {/* 날짜/시간 입력 — flex-wrap으로 좁은 화면에서 줄바꿈 허용 */}
            <div className="flex flex-wrap items-center gap-1 flex-1">
              <input
                value={date}
                onChange={e => {
                  setDate(formatDate(e.target.value));
                  setDateError(null);
                }}
                onBlur={() => {
                  const iso = toEventAtISOString(date);
                  setDateError(iso ? null : '유효하지 않은 날짜입니다.');
                }}
                disabled={inputDisabled}
                inputMode="numeric"
                className={cls(
                  'flex-1 min-w-20 tablet:flex-none tablet:w-20',
                  'h-9 tablet:h-6 rounded-lg border px-2 text-xs outline-none',
                  inputDisabled
                    ? 'border-gray-200 bg-gray-100 text-gray-400'
                    : dateError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-300 focus:border-primary',
                )}
                placeholder="2025.12.31"
              />

              {hasTime && (
                <input
                  value={time}
                  onChange={e => {
                    setTime(formatTime(e.target.value));
                    setTimeError(null);
                  }}
                  onBlur={() => {
                    const iso = toEventAtISOString(date, time, true);
                    setTimeError(iso ? null : '시간 형식이 올바르지 않아요. (예: 20:00)');
                  }}
                  disabled={inputDisabled}
                  inputMode="numeric"
                  className={cls(
                    'w-16 tablet:w-13',
                    'h-9 tablet:h-6 rounded-lg border px-2 text-xs outline-none',
                    inputDisabled
                      ? 'border-gray-200 bg-gray-100 text-gray-400'
                      : timeError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-300 focus:border-primary',
                  )}
                  placeholder="09:00"
                />
              )}
            </div>
          </div>

          <div className="flex items-center pl-7 tablet:pl-6 pr-1 gap-3 tablet:gap-0">
            <div className="text-sm tablet:text-xs text-gray-900 tablet:pr-3">시간 포함</div>
            <ToggleSwitch
              checked={hasTime}
              onChange={next => {
                setHasTime(next);
                setTimeError(null);
              }}
              disabled={inputDisabled}
            />
          </div>

          {!inputDisabled && (dateError || (hasTime && timeError)) && (
            <p className="text-xs tablet:text-[10px] text-red-500 pl-7 tablet:pl-6">
              {dateError ?? timeError}
            </p>
          )}

          <div className="flex items-center gap-2">
            <CheckedCircleBox
              checked={isSeparateNotice}
              onClick={() => {
                setIsSeparateNotice(true);
                setDateError(null);
                setTimeError(null);
              }}
              className="w-5 h-5 tablet:w-4 tablet:h-4 shrink-0"
            />
            <div className="text-sm tablet:text-xs font-regular text-gray-900">별도 안내</div>
          </div>

          {/* 등록 버튼: 모바일 h-11(44px), 데스크톱 h-7(28px) */}
          <button
            type="button"
            className={cls(
              'w-full h-11 tablet:h-7 rounded-xl text-sm font-medium transition bg-primary text-white',
            )}
            onClick={() => {
              if (isSeparateNotice) {
                onSubmit({ expectedAnnouncementAt: null });
                return;
              }

              const isoDateString = toEventAtISOString(date);

              if (!isoDateString) {
                setDateError('유효하지 않은 날짜입니다.');
                return;
              }

              if (hasTime) {
                const isoDateTimeString = toEventAtISOString(date, time, true);

                if (!isoDateTimeString || !time) {
                  setTimeError('시간 형식이 올바르지 않아요. (예: 20:00)');
                  return;
                }
              }

              onSubmit({ expectedAnnouncementAt: isoDateString });
            }}
          >
            등록하기
          </button>
        </div>
      </div>
    </CommonMenu>
  );
}
