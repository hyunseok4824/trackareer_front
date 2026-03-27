"use client";

import Close from '@/public/svg/Close.svg';
import FullLogo from '@/public/svg/logo/FullLogo.svg';
import GoogleIcon from '@/public/svg/social/Google.svg';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import { useAuthStore } from '@/src/stores/authStore';
import { isInAppBrowser } from '@/src/utils/inAppBrowser';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = {
  onClose: () => void;
};

export default function LoginModal({ onClose }: Props) {
  const { onLoading, loginWithGoogle } = useAuthStore();
  const [inApp, setInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  const openInExternalBrowser = async () => {
    const url = window.location.href;

    // Web Share API 지원 시 공유 시트 사용 (iOS Safari 등에서 "Safari에서 열기" 제공)
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // 취소 등 무시
      }
    }

    // 폴백: 클립보드 복사
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 클립보드 접근 실패 시 무시
    }
  };

  return (
    <>
      <div className="w-full min-w-72 tablet:w-120 h-dvh max-h-150">
        <div className="p-5 tablet:p-8 h-full flex flex-col">
        <header className="w-full relative flex justify-center items-center shrink-0 py-1">
          <FullLogo className="max-w-38 lg:max-w-full" />
          {/* 취소 버튼: 패딩 영역 내 우측 정렬 */}
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10"
            aria-label="Close"
            onClick={onClose}
          >
            <Close />
          </button>
        </header>
        <div className="flex flex-col h-[80%]">
          <main className="flex flex-1 flex-col items-center justify-center">
            <article className="text-center mb-10 tablet:mb-20">
              <p className="text-xl font-semibold leading-8 text-black select-none">
                3초만에 로그인하고
                <br />
                나만의 취준 비서를 이용해보세요.
              </p>
            </article>

            <div className="flex flex-col items-center gap-4">
              {inApp ? (
                <>
                  <p className="text-sm text-muted text-center leading-6">
                    앱 내 브라우저에서는 로그인할 수 없어요.
                    <br />
                    Chrome 또는 Safari에서 접속해주세요.
                  </p>
                  <button
                    className="flex flex-row items-center justify-center w-full max-w-75 h-12.5 px-6 border border-muted rounded bg-white text-base font-medium text-text"
                    type="button"
                    onClick={openInExternalBrowser}
                  >
                    {copied ? '링크가 복사되었어요!' : '외부 브라우저에서 열기'}
                  </button>
                </>
              ) : (
                <button
                  className="flex flex-row items-center justify-center gap-3 w-full h-14 px-6 border border-muted rounded-xl bg-white"
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={onLoading}
                >
                  <GoogleIcon width={24} height={24} />
                  <span className="text-lg font-medium text-text">
                    구글 계정으로 시작하기
                  </span>
                </button>
              )}
            </div>
          </main>

          <footer className="flex flex-col items-center text-sm text-muted mt-10">
            <Link
              href={process.env.NEXT_PUBLIC_NOTION_TERMS_URL || '#'}
              className="hover:text-black/30"
              target="_blank"
              rel="noreferrer"
            >
              이용 약관
            </Link>
            <Link
              href={process.env.NEXT_PUBLIC_NOTION_PRIVACY_URL || '#'}
              className="hover:text-black/30"
              target="_blank"
              rel="noreferrer"
            >
              개인 정보 처리 방침
            </Link>
          </footer>
        </div>
        </div>
      </div>
      <LoadingModal isOpen={onLoading} />
    </>
  );
}
