import { useRef } from 'react';
import type React from 'react';

const MOVE_THRESHOLD_PX = 10;

type LongPressHandlers = {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

/**
 * 모바일 long press 감지 훅.
 *
 * - 짧은 탭(threshold 이내 touchend) → onClick 호출
 * - 긴 누르기(threshold 경과 후) → onLongPress 호출
 * - 10px 이상 손가락 이동 시 타이머 취소 (스크롤과 충돌 방지)
 * - touchend 에서 e.preventDefault()로 후속 click 이벤트 차단
 *
 * 사용처: 반드시 onClick 은 별도로 element 에 유지해야 데스크톱 클릭이 동작한다.
 * touch 환경에서는 이 훅의 onTouchEnd 가 click 을 대신 처리하므로
 * 데스크톱 onClick 과 충돌하지 않는다.
 */
export function useLongPress(
  onClick: () => void,
  onLongPress: () => void,
  threshold = 500,
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onTouchStart(e) {
      triggeredRef.current = false;
      startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      timerRef.current = setTimeout(() => {
        triggeredRef.current = true;
        onLongPress();
      }, threshold);
    },

    onTouchMove(e) {
      if (!startPosRef.current) return;
      const dx = Math.abs(e.touches[0].clientX - startPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - startPosRef.current.y);
      // 일정 거리 이상 이동하면 long press 취소 (스크롤 허용)
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        clearTimer();
      }
    },

    onTouchEnd(e) {
      clearTimer();
      // touchend → click 이벤트 순서로 발생하므로, preventDefault 로 click 차단.
      // onClick / onLongPress 는 이 훅 안에서 직접 호출한다.
      e.preventDefault();
      if (!triggeredRef.current) {
        onClick();
      }
    },

    onTouchCancel() {
      clearTimer();
      triggeredRef.current = false;
    },

    // long press 중 네이티브 context menu / 텍스트 선택 팝업 방지
    onContextMenu(e) {
      e.preventDefault();
    },
  };
}
