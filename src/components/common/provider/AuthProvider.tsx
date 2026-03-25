'use client';

import AgreementModal from '@/src/components/common/modal/AgreementModal';
import CommonModal from '@/src/components/common/modal/CommonModal';
import Onboarding3Step from '@/src/components/common/modal/OnboardingModal';
import { useAuthStore } from '@/src/stores/authStore';
import { useEffect, useMemo } from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, initAuth, authReady } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe?.();
  }, [initAuth]);

  // ✅ auth/authReady로부터 파생되는 값이므로 state로 들고 있지 말고 계산
  const modalState = useMemo<'agreement' | 'onboarding' | null>(() => {
    if (!authReady) return null; // 초기 판정 전에는 모달도 띄우지 않음
    if (auth === null) return null;
    if (!auth.isSignUpCompleted) return 'agreement';
    if (!auth.onboardingCompleted) return 'onboarding';
    return null;
  }, [authReady, auth]);

  // ✅ (옵션) 401 원천 차단: 초기 auth 판정 전에는 children 자체를 렌더하지 않음
  if (!authReady) return null; // 또는 <Splash />

  return (
    <>
      {children}
      <CommonModal isOpen={modalState === 'agreement'} closeable={false}>
        <AgreementModal />
      </CommonModal>
      <CommonModal isOpen={modalState === 'onboarding'} closeable={false}>
        <Onboarding3Step />
      </CommonModal>
    </>
  );
}