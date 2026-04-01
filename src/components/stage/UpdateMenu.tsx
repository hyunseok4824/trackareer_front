'use client';

import CommonMenu from '@/src/components/common/menu/CommonMenu';
import { STAGE_RESULT, StageResult } from '@/src/types/jobPosting';
import type { Position } from '@/src/types/position';

export const STAGE_UPDATE_MENU_ACTION = {
  SET_COMPLETED: 'SET_COMPLETED',
  SET_INCOMPLETED: 'SET_INCOMPLETED',
  SET_PASSED: 'SET_PASSED',
  SET_REJECTED: 'SET_REJECTED',
  REVERT: 'REVERT',
};

export type StageUpdateMenuAction =
  (typeof STAGE_UPDATE_MENU_ACTION)[keyof typeof STAGE_UPDATE_MENU_ACTION];

type Props = {
  position: Position;
  currentStatus: StageResult;
  isFirstStage: boolean;
  onClose: () => void;
  onSelect: (action: StageUpdateMenuAction) => void;
  className?: string;
};

export default function StageUpdateMenu({
  position,
  currentStatus,
  isFirstStage,
  onClose,
  onSelect,
  className,
}: Props) {
  const items: Array<{ key: StageUpdateMenuAction; label: string; tone?: 'default' | 'danger' }> =
    currentStatus === STAGE_RESULT.IN_PROGRESS && isFirstStage
      ? [
          { key: STAGE_UPDATE_MENU_ACTION.SET_COMPLETED, label: '완료' },
          { key: STAGE_UPDATE_MENU_ACTION.SET_INCOMPLETED, label: '미완료' },
        ]
      : currentStatus === STAGE_RESULT.IN_PROGRESS && !isFirstStage
        ? [
            { key: STAGE_UPDATE_MENU_ACTION.SET_COMPLETED, label: '완료' },
            { key: STAGE_UPDATE_MENU_ACTION.SET_INCOMPLETED, label: '미완료' },
            { key: STAGE_UPDATE_MENU_ACTION.REVERT, label: '되돌리기', tone: 'danger' },
          ]
        : currentStatus === STAGE_RESULT.DONE
          ? [
              { key: STAGE_UPDATE_MENU_ACTION.SET_PASSED, label: '합격' },
              { key: STAGE_UPDATE_MENU_ACTION.SET_REJECTED, label: '불합격' },
              { key: STAGE_UPDATE_MENU_ACTION.REVERT, label: '되돌리기', tone: 'danger' },
            ]
          : [
              // PASSED / REJECTED
              { key: STAGE_UPDATE_MENU_ACTION.REVERT, label: '되돌리기', tone: 'danger' },
            ];

  return (
    <CommonMenu
      isOpen={true}
      position={position}
      onClose={onClose}
      className={['w-18 rounded-2xl shadow-lg border border-gray-100 p-2', className ?? ''].join(
        ' ',
      )}
    >
      {/*
       * 헤더: "상태 변경" + 닫기 버튼
       * - 닫기 버튼: 모바일에서 min-w/h-9(36px) 확보 → 터치 가능
       * - 모바일 bottom sheet 환경에서는 p-4로 여백 확보
       */}
      <div className="flex items-center justify-between p-4 tablet:p-0 border-b border-gray-100 tablet:border-0">
        <div className="text-sm tablet:text-[10px] font-semibold text-gray-900">상태 변경</div>

        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="min-w-9 min-h-9 tablet:min-w-0 tablet:min-h-0 tablet:w-2 tablet:h-2 flex items-center justify-center rounded-lg text-disabled text-xs hover:bg-gray-50"
        >
          ✕
        </button>
      </div>

      {/*
       * 메뉴 목록
       * - 모바일: py-3 + text-sm → 충분한 터치 타겟 (44px+)
       * - 데스크톱: py-0.5 + text-[10px] → 기존 컴팩트 레이아웃 유지
       */}
      <div className="py-1 tablet:py-0">
        {items.map(it => (
          <button
            key={it.key}
            type="button"
            role="menuitem"
            onClick={() => onSelect(it.key)}
            className={[
              'w-full text-left rounded-md',
              'text-sm tablet:text-[10px]',
              'py-3 tablet:py-0.5 px-4 tablet:px-0',
              it.tone === 'danger' ? 'text-red-500' : 'text-gray-900',
              'hover:bg-gray-50 active:bg-gray-100',
            ].join(' ')}
          >
            {it.label}
          </button>
        ))}
      </div>
    </CommonMenu>
  );
}
