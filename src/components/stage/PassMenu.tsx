'use client';

import { useEffect, useEffectEvent, useState } from 'react';

import CheckedCircleBox from '@/src/components/common/button/CheckedCircleBox';
import CommonMenu from '@/src/components/common/menu/CommonMenu';
import type { StageType } from '@/src/types/jobPosting';
import type { Position } from '@/src/types/position';
import { StagePassedRequestBody } from '@/src/types/stageSchedule';
import { formatDate, formatTime } from '@/src/utils/dateFormatters';
import { cls } from '@/src/utils/strFormatters';

// ✅ 날짜/시간 -> ISO + 달력 유효성
// ✅ include=false면 23:59로 보냄
function toEventAtISOString(dateDot: string, time?: string, include?: boolean) {
  const digits = dateDot.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));

  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  // ✅ 기본은 23:59
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

type Mode = 'NEXT_STAGE' | 'FINAL_PASSED';

// ✅ placeholder를 위해 "''" 추가
type StageSelect = '' | StageType;

const STAGE_OPTIONS: Array<{ key: StageType; label: string }> = [
  { key: 'DOCUMENT', label: '서류' },
  { key: 'ASSIGNMENT', label: '과제' },
  { key: 'EXAM', label: '시험' },
  { key: 'INTERVIEW', label: '면접' },
];

export default function StagePassMenu({
  position,
  onClose,
  onSubmit,
}: {
  position: Position;
  onClose: () => void;
  onSubmit: (payload: StagePassedRequestBody) => void;
}) {
  // ✅ 선택 모드 (라디오)
  const [mode, setMode] = useState<Mode>('NEXT_STAGE');

  // ✅ 다음 전형 데이터
  const [stageType, setStageType] = useState<StageSelect>('');
  const [stageName, setStageName] = useState<string>('');

  // ✅ 전형 일시
  const [eventDate, setEventDate] = useState<string>('');
  const [eventHasTime, setEventHasTime] = useState<boolean>(false);
  const [eventTime, setEventTime] = useState<string>('');

  const [eventError, setEventError] = useState<string | null>(null);
  const [expectedError, setExpectedError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null); // ✅ 추가

  const inputDisabled = mode !== 'NEXT_STAGE';

  const initialize = useEffectEvent(() => {
    setMode('NEXT_STAGE');
    setStageType('');
    setStageName('');
    setEventDate('');
    setEventHasTime(false);
    setEventTime('');

    setEventError(null);
    setExpectedError(null);
    setNameError(null);
    setTypeError(null);
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
      className="w-70 h-auto rounded-2xl shadow shadow-black/25 border border-gray-100 overflow-hidden"
    >
      <div className="p-3">
        <header className="flex items-center justify-between">
          <div className="text-xs font-bold">합격 처리</div>
          <button
            type="button"
            onClick={onClose}
            className="w-2 h-2 flex items-center justify-center rounded-lg text-disabled text-xs"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="mt-3 space-y-6">
          <div></div>
          {/* ✅ 라디오 1) 다음 전형 추가 */}
          <div
            className="flex items-start gap-2"
            onClickCapture={() => {
              if (mode === 'NEXT_STAGE') return;
              setMode('NEXT_STAGE');
              setEventError(null);
              setExpectedError(null);
              setNameError(null);
              setTypeError(null);
            }}
          >
            <CheckedCircleBox
              checked={mode === 'NEXT_STAGE'}
              onClick={() => {
                setMode('NEXT_STAGE');
                setEventError(null);
                setExpectedError(null);
                setNameError(null);
                setTypeError(null);
              }}
              className="w-4 h-4 shrink-0"
            />

            <div className="flex-1 min-w-0">
              {/* 전형 타입/이름 */}
              <div className="flex gap-2">
                <select
                  value={stageType}
                  onChange={e => {
                    setStageType(e.target.value as StageSelect);
                    setTypeError(null);
                  }}
                  onBlur={() => {
                    if (inputDisabled) return;
                    setTypeError(stageType ? null : '전형 타입을 선택해주세요');
                  }}
                  disabled={inputDisabled}
                  className={cls(
                    'h-7 rounded-lg border px-2 text-xs text-center outline-none',
                    inputDisabled
                      ? 'border-gray-200 bg-gray-100 text-gray-400'
                      : typeError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-300 focus:border-primary',
                  )}
                >
                  <option value="" disabled>
                    선택
                  </option>
                  {STAGE_OPTIONS.map(s => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <input
                  value={stageName}
                  onChange={e => {
                    setStageName(e.target.value);
                    setNameError(null);
                  }}
                  onBlur={() => {
                    if (inputDisabled) return;
                    setNameError(stageName.trim() ? null : '전형 이름을 입력해주세요');
                  }}
                  disabled={inputDisabled}
                  className={cls(
                    'flex-1 h-7 rounded-lg border px-2 text-xs outline-none',
                    inputDisabled
                      ? 'border-gray-200 bg-gray-100 text-gray-400'
                      : nameError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-300 focus:border-primary',
                  )}
                  placeholder="예: 1차 면접"
                />
              </div>

              <div className={cls('mt-3 space-y-4', inputDisabled && 'opacity-60')}>
                {/* ✅ 전형 일시 */}
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-700">전형 일시</div>
                  <div className="flex items-center gap-1">
                    <input
                      value={eventDate}
                      onChange={e => {
                        setEventDate(formatDate(e.target.value));
                        setEventError(null);
                      }}
                      onBlur={() => {
                        if (inputDisabled) return;
                        const iso = toEventAtISOString(eventDate, eventTime, eventHasTime);
                        setEventError(iso ? null : '유효하지 않은 날짜/시간입니다');
                      }}
                      disabled={inputDisabled}
                      className={cls(
                        'w-23 h-7 rounded-lg border px-2 text-xs outline-none',
                        inputDisabled
                          ? 'border-gray-200 bg-gray-100 text-gray-400'
                          : eventError
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-gray-300 focus:border-primary',
                      )}
                      placeholder="2026.02.20"
                    />

                    {eventHasTime && (
                      <input
                        value={eventTime}
                        onChange={e => {
                          setEventTime(formatTime(e.target.value));
                          setEventError(null);
                        }}
                        onBlur={() => {
                          if (inputDisabled) return;
                          const iso = toEventAtISOString(eventDate, eventTime, true);
                          setEventError(iso ? null : '시간 형식이 올바르지 않아요 (예: 20:00)');
                        }}
                        disabled={inputDisabled}
                        className={cls(
                          'w-15 h-7 rounded-lg border px-2 text-xs outline-none',
                          inputDisabled
                            ? 'border-gray-200 bg-gray-100 text-gray-400'
                            : eventError
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-gray-300 focus:border-primary',
                        )}
                        placeholder="14:00"
                      />
                    )}

                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-[11px] text-gray-800">시간</span>
                      <ToggleSwitch
                        checked={eventHasTime}
                        onChange={next => {
                          setEventHasTime(next);
                          setEventError(null);
                        }}
                        disabled={inputDisabled}
                      />
                    </div>
                  </div>
                </div>

                {/* ✅ 결과 발표 예정일 */}
                {/* <div className="space-y-1">
                  <div className="text-[11px] text-gray-700">결과 발표 예정일</div>
                  <div className="flex items-center gap-1">
                    <input
                      value={expectedDate}
                      onChange={e => {
                        setExpectedDate(formatDate(e.target.value));
                        setExpectedError(null);
                      }}
                      onBlur={() => {
                        if (inputDisabled) return;
                        const iso = toEventAtISOString(expectedDate, expectedTime, expectedHasTime);
                        setExpectedError(iso ? null : '유효하지 않은 날짜/시간입니다');
                      }}
                      disabled={inputDisabled}
                      className={cls(
                        'w-[92px] h-7 rounded-lg border px-2 text-xs outline-none',
                        inputDisabled
                          ? 'border-gray-200 bg-gray-100 text-gray-400'
                          : expectedError
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-gray-300 focus:border-primary',
                      )}
                      placeholder="2026.02.25"
                    />

                    {expectedHasTime && (
                      <input
                        value={expectedTime}
                        onChange={e => {
                          setExpectedTime(formatTime(e.target.value));
                          setExpectedError(null);
                        }}
                        onBlur={() => {
                          if (inputDisabled) return;
                          const iso = toEventAtISOString(expectedDate, expectedTime, true);
                          setExpectedError(iso ? null : '시간 형식이 올바르지 않아요 (예: 20:00)');
                        }}
                        disabled={inputDisabled}
                        className={cls(
                          'w-[60px] h-7 rounded-lg border px-2 text-xs outline-none',
                          inputDisabled
                            ? 'border-gray-200 bg-gray-100 text-gray-400'
                            : expectedError
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-gray-300 focus:border-primary',
                        )}
                        placeholder="14:00"
                      />
                    )}

                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-[11px] text-gray-800">시간</span>
                      <ToggleSwitch
                        checked={expectedHasTime}
                        onChange={next => {
                          setExpectedHasTime(next);
                          setExpectedError(null);
                        }}
                        disabled={inputDisabled}
                      />
                    </div>
                  </div>
                </div> */}

                {/* 에러 메시지 */}
                {!inputDisabled && (typeError || nameError || eventError || expectedError) && (
                  <p className="text-[10px] text-red-500">
                    {typeError ?? nameError ?? eventError ?? expectedError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ 라디오 2) 최종합격 */}
          <div
            className="flex items-start gap-2"
            onClickCapture={() => {
              if (mode === 'NEXT_STAGE') return;
              setMode('NEXT_STAGE');
              setEventError(null);
              setExpectedError(null);
              setNameError(null);
              setTypeError(null);
            }}
          >
            <CheckedCircleBox
              checked={mode === 'FINAL_PASSED'}
              onClick={() => {
                setMode('FINAL_PASSED');
                setEventError(null);
                setExpectedError(null);
                setNameError(null);
                setTypeError(null);
              }}
              className="w-4 h-4 shrink-0"
            />
            <div className="text-xs font-regular text-gray-900">최종합격</div>
          </div>

          <button
            type="button"
            className={cls(
              'w-full h-8 rounded-xl text-sm font-medium transition bg-primary text-white',
            )}
            onClick={() => {
              if (mode === 'FINAL_PASSED') {
                onSubmit({ next: null } as StagePassedRequestBody);
                return;
              }

              if (!stageType) {
                setTypeError('전형 타입을 선택해주세요');
                return;
              }
              if (!stageName.trim()) {
                setNameError('전형 이름을 입력해주세요');
                return;
              }

              const eventAt = toEventAtISOString(eventDate, eventTime, eventHasTime);
              if (!eventAt) {
                setEventError('유효하지 않은 날짜/시간입니다');
                return;
              }

              onSubmit({
                next: {
                  stageType: stageType as StageType,
                  stageName: stageName.trim(),
                  eventAt,
                },
              });
            }}
          >
            등록하기
          </button>
        </div>
      </div>
    </CommonMenu>
  );
}
