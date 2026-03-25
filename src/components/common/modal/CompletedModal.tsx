/** ✅ TODO -> 완료 모달 (Figma UI 맞춤) */
'use client';

import {} from '@/src/api/stageSchedule';
import CheckedCircleBox from '@/src/components/common/button/CheckedCircleBox';
import CommonModal from '@/src/components/common/modal/CommonModal';
import { StageCompletedRequestBody } from '@/src/types/stageSchedule';
import { cls } from '@/src/utils/strFormatters';
import { useState } from 'react';

function buildISOFromDotAndTime(dateDot: string, timeHm?: string | null) {
  const digits = dateDot.replace(/\D/g, '');
  if (digits.length !== 8) return new Date().toISOString();

  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));

  let hh = 0;
  let mm = 0;

  if (timeHm) {
    const t = timeHm.replace(/\D/g, '');
    if (t.length === 4) {
      hh = Number(t.slice(0, 2));
      mm = Number(t.slice(2, 4));
    }
  }

  return new Date(y, m - 1, d, hh, mm, 0).toISOString();
}

// ✅ 스위치 UI (그림처럼)
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
        'relative inline-flex w-11 h-6 rounded-full transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-gray-300',
      )}
    >
      <span
        className={cls(
          'absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white transition-all',
          checked ? 'left-5.5' : 'left-0.5',
        )}
      />
    </button>
  );
}

export default function CompletedModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: StageCompletedRequestBody) => void;
}) {
  // ✅ 기본 체크 = 별도 안내
  const [isSeparateNotice, setIsSeparateNotice] = useState(true);

  const [date, setDate] = useState('2025.12.31');
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState('09:00');

  const inputDisabled = isSeparateNotice;

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <div className="w-100 max-w-[90vw] px-6 pt-5 pb-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="text-lg font-bold">결과 발표 예정일</div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        {/* Body */}
        <div className="mt-4 space-y-4">
          {/* 날짜/시간 입력 줄 */}
          <div className="flex items-center gap-3">
            {/* ✅ 날짜 입력 선택 */}
            <CheckedCircleBox
              checked={!isSeparateNotice}
              onClick={() => setIsSeparateNotice(false)}
              className="w-6 h-6 shrink-0"
            />

            <div className="flex items-center gap-3 flex-1">
              <input
                value={date}
                onChange={e => setDate(e.target.value)}
                disabled={inputDisabled}
                className={cls(
                  'w-42.5 h-9 rounded-lg border px-3 text-base outline-none',
                  inputDisabled
                    ? 'border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-300 focus:border-primary',
                )}
                placeholder="2025.12.31"
              />

              {hasTime && (
                <input
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  disabled={inputDisabled}
                  className={cls(
                    'w-27.5 h-9 rounded-lg border px-3 text-base outline-none',
                    inputDisabled
                      ? 'border-gray-200 bg-gray-100 text-gray-400'
                      : 'border-gray-300 focus:border-primary',
                  )}
                  placeholder="9:00"
                />
              )}
            </div>
          </div>

          {/* 시간 포함 스위치 */}
          <div className="flex items-center pl-9 pr-1">
            <div className="text-base text-gray-900 pr-3">시간 포함</div>
            <ToggleSwitch checked={hasTime} onChange={setHasTime} disabled={inputDisabled} />
          </div>

          {/* ✅ 별도 안내 */}
          <div className="flex items-center gap-3">
            <CheckedCircleBox
              checked={isSeparateNotice}
              onClick={() => setIsSeparateNotice(true)}
              className="w-6 h-6 shrink-0"
            />
            <div className="text-base font-regular text-gray-900">별도 안내</div>
          </div>

          {/* CTA */}
          <button
            type="button"
            className="w-full h-11 rounded-2xl bg-primary text-white text-base font-medium"
            onClick={() => {
              // ✅ 별도 안내면 null 전송
              if (isSeparateNotice) {
                onSubmit({ expectedAnnouncementAt: null });
                return;
              }

              const iso = buildISOFromDotAndTime(date, hasTime ? time : null);
              onSubmit({ expectedAnnouncementAt: iso });
            }}
          >
            등록하기
          </button>
        </div>
      </div>
    </CommonModal>
  );
}
