'use client';

import ChevronDownIcon from '@/public/svg/ChevronDown.svg';
import CommonMenu from '@/src/components/common/menu/CommonMenu';
import ProfileMenu from '@/src/components/common/menu/ProfileMenu';
import CommonModal from '@/src/components/common/modal/CommonModal';
import LoginModal from '@/src/components/common/modal/LoginModal';
import SettingsModal from '@/src/components/common/modal/SettingModal';
import { useAuthStore } from '@/src/stores/authStore';
import { Position } from '@/src/types/position';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

function LoginButtonSet() {
  const [loginModalOpened, setLoginModalOpened] = useState<boolean>(false);

  const openLoginModal = () => setLoginModalOpened(true);
  const closeLoginModal = () => setLoginModalOpened(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 모바일: 단일 CTA 버튼 */}
        <button
          onClick={openLoginModal}
          className="tablet:hidden h-9 px-4 bg-primary rounded-3xl text-sm font-bold text-white hover:bg-primary/90 transition"
        >
          시작하기
        </button>
        {/* 태블릿 이상: 로그인 + 회원가입 */}
        <button
          onClick={openLoginModal}
          className="hidden tablet:block h-9 px-4 bg-primary rounded-3xl text-sm font-bold text-white hover:bg-primary/90 transition"
        >
          로그인
        </button>
        <button
          onClick={openLoginModal}
          className="hidden tablet:block h-9 px-4 border border-primary rounded-3xl text-sm font-bold text-primary hover:bg-primary/10 transition"
        >
          회원가입
        </button>
      </div>
      <CommonModal isOpen={loginModalOpened} onClose={closeLoginModal} mobileFullscreen>
        <LoginModal onClose={closeLoginModal} />
      </CommonModal>
    </>
  );
}

function ProfileButton({ userName }: { userName: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState<boolean>(false);
  const [isProfileChanged, setIsProfileChanged] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<Position>({ right: 0, top: 0 });

  const computePosition = () => {
    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setMenuPosition({
      right: Math.max(8, window.innerWidth - rect.right),
      top: rect.bottom + 8,
    });
  };

  useLayoutEffect(() => {
    computePosition(); // ✅ 렌더 직후
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    computePosition(); // ✅ 열 때도 한 번 더

    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);

    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [isMenuOpen]);

  const openModal = () => {
    setIsMenuOpen(true);
  };

  const closeModal = () => {
    setIsMenuOpen(false);
  };

  const onOpenSettingModal = () => {
    setIsMenuOpen(false);
    setIsSettingModalOpen(true);
  };

  const onCloseSettingModal = () => {
    if (isProfileChanged) {
      const confirmLeave = window.confirm('변경사항이 저장되지 않았어요. 그래도 이동하시겠어요?');
      if (!confirmLeave) return;
    }
    setIsSettingModalOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        className="cursor-pointer px-3 py-2 flex flex-row gap-1 items-center border border-primary rounded-3xl overflow-hidden text-sm leading-5 text-primary hover:bg-primary hover:text-white"
        onClick={openModal}
      >
        <strong>{userName}</strong> 님
        <ChevronDownIcon className="fill-primary" width={16} height={16} />
      </button>
      <CommonMenu isOpen={isMenuOpen} position={menuPosition} autoFit={true} onClose={closeModal}>
        <ProfileMenu onOpenSettingModal={onOpenSettingModal} />
      </CommonMenu>
      <CommonModal isOpen={isSettingModalOpen} onClose={onCloseSettingModal} mobileFullscreen>
        <SettingsModal
          isProfileChanged={isProfileChanged}
          onClose={onCloseSettingModal}
          setIsProfileChanged={setIsProfileChanged}
        />
      </CommonModal>
    </>
  );
}

export default function AuthButtonSet() {
  const { auth } = useAuthStore();

  if (!auth) {
    return <LoginButtonSet />;
  }

  return <ProfileButton userName={auth.profile?.nickname} />;
}
