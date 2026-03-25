import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean; // 모델 상태 확인
  hasModal?: boolean; // 모달 여부
  title?: string; // 로딩 제목
  description?: string; // 동작 설명
  button?: React.ReactNode; // 버튼 요소
}

export default function LoadingModal({
  isOpen,
  title,
  description,
  hasModal = false,
  button,
}: ModalProps) {
  const root = document.getElementById('modal-root');

  useEffect(() => {
    if (!isOpen) return;

    // 모달 활성화 시 외부 스크롤 방지
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !root) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/20 flex flex-col items-center justify-center z-50">
      <div
        className={
          hasModal
            ? 'flex flex-col items-center justify-center w-100 h-120 rounded-3xl bg-white shadow-lg px-6 py-8'
            : 'flex flex-col items-center justify-center'
        }
      >
        <div className="flex-1 w-full" />
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        {title && <p className="mt-4 text-lg font-medium text-text">{title}</p>}
        {description && <p className="mt-2 text-sm font-normal text-text/80">{description}</p>}
        <div className="flex-1 w-full" />
        {button && <div className="self-center">{button}</div>}
      </div>
    </div>,
    root,
  );
}
