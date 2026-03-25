import { Position } from '@/src/types/position';
import { ReactNode, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

  // ✅ isOpen 되는 그 순간 바로 위치 세팅 (autoFit 보정은 다음 layoutEffect에서)
  useLayoutEffect(() => {
    if (!isOpen) return;
    updateRealPosition(position);
  }, [isOpen, position]);

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

  // ✅ autoFit 보정: 실제 렌더된 rect 기준으로 viewport 밖이면 flip
  useLayoutEffect(() => {
    if (!isOpen) return;
    if (!autoFit) return;

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
  }, [isOpen, autoFit, position]);

  if (!isOpen || !parentNode) return null;

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
