import React, { ReactNode, useEffect, useEffectEvent, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: ReactNode; // 랜더링 할 페이지
  isOpen: boolean; // 모델 상태 확인
  closeable?: boolean; // 모달 닫기 허용 여부 (기본값: true)
  onClose?: () => void; // 모델 닫기 이벤트
}

export default function CommonModal({ children, isOpen, closeable = true, onClose }: ModalProps) {
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

    // 모달 활성화 시 외부 스크롤 방지
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, closeable, onClose]);

  // 모달 내부에서 클릭 시 모달창 닫히는거 방지
  const modalPrevent = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  if (!isOpen || !parentNode) return null; // 아직 모달 루트가 준비되지 않았거나, 열리지 않은 상태면 모달 닫기

  return createPortal(
    <div
      className="fixed inset-0 bg-black/15 flex items-center justify-center z-50 px-4 tablet:px-0"
      onMouseDown={onClose}
    >
      <div
        className={[
          'overflow-hidden relative',
          'w-full tablet:w-auto max-h-[90dvh] bg-white rounded-3xl border border-gray-100 shadow-sm',
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
