import React, { ReactNode, useEffect, useEffectEvent, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: ReactNode; // 랜더링 할 페이지
  isOpen: boolean; // 모델 상태 확인
  closeable?: boolean; // 모달 닫기 허용 여부 (기본값: true)
  onClose?: () => void; // 모델 닫기 이벤트
  /**
   * 모바일 뷰포트에서 모달을 전체화면으로 표시합니다.
   * tablet 이상에서는 기존 팝업 스타일을 유지합니다.
   */
  mobileFullscreen?: boolean;
}

export default function CommonModal({
  children,
  isOpen,
  closeable = true,
  onClose,
  mobileFullscreen = false,
}: ModalProps) {
  const [parentNode, setParentNode] = useState<HTMLElement | null>(null); // 모달 부모 노드 상태관리

  const updateParentNode = useEffectEvent(() => {
    const root = document.getElementById('modal-root');
    setParentNode(root);
  });

  useEffect(() => {
    if (!isOpen && !closeable) return;

    updateParentNode();

    // ESC 버튼 누를 시 모달 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };

    // iOS Safari에서 overflow:hidden이 body 스크롤을 막지 못하는 문제를 우회합니다.
    // position:fixed + top 저장 방식으로 스크롤 위치를 유지하면서 배경 스크롤을 차단합니다.
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      // 스크롤 위치 복원
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, closeable, onClose]);

  // 모달 내부에서 클릭 시 모달창 닫히는거 방지
  const modalPrevent = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  if (!isOpen || !parentNode) return null; // 아직 모달 루트가 준비되지 않았거나, 열리지 않은 상태면 모달 닫기

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-50 flex justify-center',
        mobileFullscreen
          ? 'items-start tablet:items-center tablet:bg-black/15'
          : 'items-center bg-black/15 px-4 tablet:px-0',
      ].join(' ')}
      onMouseDown={closeable ? onClose : undefined}
    >
      <div
        className={[
          'relative bg-white',
          mobileFullscreen
            ? [
                // 모바일: 전체화면 (라운드 없음, 전체 높이)
                'w-full h-dvh overflow-hidden',
                // tablet 이상: 기존 팝업 스타일
                'tablet:h-auto tablet:w-auto tablet:max-h-[90dvh]',
                'tablet:rounded-3xl tablet:border tablet:border-gray-100 tablet:shadow-sm',
              ].join(' ')
            : [
                'overflow-hidden',
                'w-full tablet:w-auto max-h-[90dvh]',
                'rounded-3xl border border-gray-100 shadow-sm',
              ].join(' '),
          'transition-all transform',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        ].join(' ')}
        onMouseDown={modalPrevent}
      >
        {children}
      </div>
    </div>,
    parentNode,
  );
}
