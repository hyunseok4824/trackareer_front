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
      {/* 헤더: "상태 변경" + X */}
      <div className="flex items-center justify-between border-gray-100">
        <div className="text-[10px] font-semibold text-gray-900">상태 변경</div>

        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="w-2 h-2 text-xs flex items-center justify-center hover:bg-gray-50 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* 메뉴 목록 */}
      <div className="">
        {items.map(it => (
          <button
            key={it.key}
            type="button"
            role="menuitem"
            onClick={() => onSelect(it.key)}
            className={[
              'w-full text-left text-[10px] rounded-md',
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
