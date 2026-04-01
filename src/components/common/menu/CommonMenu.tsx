import { Position } from '@/src/types/position';
import { ReactNode, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * tailwind.config.ts의 tablet 브레이크포인트(600px)와 동기화.
 * 이 값 미만이면 anchored popover 대신 bottom sheet로 렌더합니다.
 */
const MOBILE_BREAKPOINT = 600;

interface ContextMenuProps {
  children: ReactNode;
  isOpen: boolean;
  position: Position;
  portalId?: string;
  className?: string;
  autoFit?: boolean;
  onClose: () => void;
}

export default function CommonMenu({
  className,
  children,
  isOpen,
  position,
  portalId,
  autoFit = true,
  onClose,
}: ContextMenuProps) {
  const [parentNode, setParentNode] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /**
   * 모바일 감지: viewport < 600px(tablet breakpoint) → bottom sheet 모드
   * SSR 호환을 위해 초기값은 typeof window 가드 처리.
   */
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  useLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ✅ 열리는 순간 바로 position을 박아서 "첫 렌더부터" 정상 위치에 뜨게 함
  const [realPosition, setRealPosition] = useState<Position>({ left: -9999, top: -9999 });

  const updateParentNode = useEffectEvent(() => {
    const node = portalId ? document.getElementById(portalId) : document.body;
    setParentNode(node);
  });

  // ✅ portal node를 useLayoutEffect로(첫 페인트 전에 준비)
  useLayoutEffect(() => {
    if (!isOpen) return;
    updateParentNode();
  }, [isOpen, portalId]);

  const updateRealPosition = useEffectEvent((updated: Position) => {
    setRealPosition(updated);
  });

  // ✅ isOpen 되는 그 순간 바로 위치 세팅 (데스크톱 팝오버 전용)
  useLayoutEffect(() => {
    if (!isOpen || isMobile) return;
    updateRealPosition(position);
  }, [isOpen, position, isMobile]);

  // ESC / outside click 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isOpen, onClose]);

  /**
   * 모바일 bottom sheet가 열릴 때 배경 스크롤 잠금.
   * iOS Safari는 overflow:hidden이 body에 적용되지 않으므로
   * position:fixed + top 저장 방식으로 처리합니다.
   */
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, isMobile]);

  // ✅ autoFit 보정: 데스크톱 팝오버 전용 (모바일은 bottom sheet라 불필요)
  useLayoutEffect(() => {
    if (!isOpen) return;
    if (!autoFit) return;
    if (isMobile) return;

    const el = menuRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 8;

    const isLeft = 'left' in position;
    const isRight = 'right' in position;
    const isTop = 'top' in position;
    const isBottom = 'bottom' in position;

    let left = isLeft ? position.left : undefined;
    let right = isRight ? position.right : undefined;
    let top = isTop ? position.top : undefined;
    let bottom = isBottom ? position.bottom : undefined;

    // 가로 flip
    if (left !== undefined) {
      if (left + rect.width > vw - padding) {
        right = Math.max(padding, vw - left);
        left = undefined;
      } else {
        left = Math.max(padding, left);
      }
    } else if (right !== undefined) {
      if (right + rect.width > vw - padding) {
        left = Math.max(padding, vw - right);
        right = undefined;
      } else {
        right = Math.max(padding, right);
      }
    }

    // 세로 flip
    if (top !== undefined) {
      if (top + rect.height > vh - padding) {
        bottom = Math.max(padding, vh - top);
        top = undefined;
      } else {
        top = Math.max(padding, top);
      }
    } else if (bottom !== undefined) {
      if (bottom + rect.height > vh - padding) {
        top = Math.max(padding, vh - bottom);
        bottom = undefined;
      } else {
        bottom = Math.max(padding, bottom);
      }
    }

    let next: Position = position;
    if (left !== undefined && top !== undefined) next = { left, top };
    else if (right !== undefined && top !== undefined) next = { right, top };
    else if (left !== undefined && bottom !== undefined) next = { left, bottom };
    else if (right !== undefined && bottom !== undefined) next = { right, bottom };

    updateRealPosition(next);
  }, [isOpen, autoFit, position, isMobile]);

  if (!isOpen || !parentNode) return null;

  /**
   * 모바일: bottom sheet 방식
   * - 화면 하단에서 슬라이드업, 전체 너비
   * - 딤 배경 탭 시 닫기
   * - className(width 등)은 데스크톱 팝오버용이므로 여기서는 적용 안 함
   * - safe-area-inset-bottom 으로 iOS 홈 인디케이터 대응
   */
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-50" aria-hidden={!isOpen}>
        {/* 딤 배경 */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Bottom sheet */}
        <div
          ref={menuRef}
          role="menu"
          className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl overflow-y-auto max-h-[85dvh] outline-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {children}
        </div>
      </div>,
      parentNode,
    );
  }

  /**
   * 데스크톱: 기존 anchored popover 방식 (변경 없음)
   */
  return createPortal(
    <div className="fixed inset-0 z-50" aria-hidden={!isOpen}>
      <div
        ref={menuRef}
        role="menu"
        className={[
          'fixed',
          'bg-white border border-gray-100 shadow-sm rounded-xl',
          'overflow-hidden',
          'outline-none',
          className ?? '',
        ].join(' ')}
        style={realPosition}
      >
        {children}
      </div>
    </div>,
    parentNode,
  );
}
