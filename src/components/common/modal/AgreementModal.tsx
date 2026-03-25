// "use client"

import CheckIcon from '@/public/svg/Check.svg';
import ChevronRightIcon from '@/public/svg/ChevronRight.svg';
import FullLogo from '@/public/svg/logo/FullLogo.svg';
import { authApi } from '@/src/api/auth';
import CheckedCircleBox from '@/src/components/common/button/CheckedCircleBox';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import { useAuthStore } from '@/src/stores/authStore';
import Link from 'next/link';
import { useState } from 'react';

function CheckedIcon({ checked }: { checked: boolean }) {
  return (
    <CheckIcon width={20} height={20} className={checked ? 'text-primary' : 'text-disabled'} />
  );
}

const TERMS = [
  {
    key: 'SERVICE',
    title: '서비스 이용약관',
    required: true,
    href: process.env.NEXT_PUBLIC_NOTION_TERMS_URL,
  },
  {
    key: 'PRIVACY',
    title: '개인정보 처리방침',
    required: true,
    href: process.env.NEXT_PUBLIC_NOTION_PRIVACY_URL,
  },
  {
    key: 'MARKETING_USE',
    title: '마케팅 활용 동의',
    description: '서비스 개선 및 맞춤형 콘텐츠 제공을 위해 활용됩니다.',
    required: false,
    href: process.env.NEXT_PUBLIC_NOTION_MARKETING_USE_URL,
  },
  {
    key: 'MARKETING_RECV',
    title: '마케팅 수신 동의',
    description: '이메일을 통한 이벤트 및 혜택 안내에 활용됩니다.',
    required: false,
    href: process.env.NEXT_PUBLIC_NOTION_MARKETING_RECEIVE_URL,
  },
] as {
  key: 'SERVICE' | 'PRIVACY' | 'MARKETING_USE' | 'MARKETING_RECV';
  title: string;
  description?: string;
  required: boolean;
  href: string;
}[];

export default function AgreementModal() {
  const { logout, updateSignUpCompleted } = useAuthStore();
  const [terms, setTerms] = useState({
    SERVICE: false,
    PRIVACY: false,
    MARKETING_USE: false,
    MARKETING_RECV: false,
  });
  const requiredChecked = terms.SERVICE && terms.PRIVACY;
  const [onLoading, setOnLoading] = useState<boolean>(false);

  const handleSetAll = () => {
    const value = !Object.values(terms).every(Boolean);
    setTerms({
      SERVICE: value,
      PRIVACY: value,
      MARKETING_USE: value,
      MARKETING_RECV: value,
    });
  };

  const handleToggleTerm = (key: keyof typeof terms) => {
    setTerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = async () => {
    if (!requiredChecked) return;

    const agreedTerms = Object.entries(terms)
      .filter(([, value]) => value)
      .map(([key]) => key as 'SERVICE' | 'PRIVACY' | 'MARKETING_USE' | 'MARKETING_RECV');

    try {
      if (onLoading) return;
      setOnLoading(true);
      await authApi.signUp(agreedTerms);
      updateSignUpCompleted();
    } catch (error) {
      console.error('Error during sign-up:', error);
    } finally {
      setOnLoading(false);
    }
  };

  return (
    <>
      <div className="w-120 h-150 flex flex-col p-8 pb-12 justify-center items-center">
        <header className="w-full h-20 relative flex">
          {/* 취소 버튼 */}
          <button className="absolute left-0 top-0 text-xs text-muted" onClick={logout}>
            로그아웃
          </button>
          <FullLogo
            className="absolute top-11 left-1/2 transform -translate-x-1/2"
            width={216}
            height={36}
          />
        </header>
        <div className="w-80 flex-1 flex flex-col items-stretch">
          <div className="flex-1 flex flex-col justify-center items-stretch ">
            <p className="text-base font-regular text-black">
              서비스 이용을 위해 아래 항목에 동의해주세요.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center">
              <section className="w-full">
                {/* 전체동의 */}
                <button
                  type="button"
                  className="flex flex-row gap-2 items-center"
                  onClick={handleSetAll}
                >
                  <CheckedCircleBox
                    className="w-6 h-6"
                    checked={Object.values(terms).every(Boolean)}
                  />
                  <p className="font-medium text-text text-lg leading-5">전체 동의하기</p>
                </button>

                {/* 항목 리스트 */}
                <ul className="w-full mt-6 flex flex-col gap-2">
                  {TERMS.map(item => {
                    return (
                      <li key={item.key} className="flex flex-row gap-2 py-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTerm(item.key)}
                          className="flex-1 flex flex-row gap-2 "
                        >
                          <CheckedIcon checked={terms[item.key]} />
                          <div className="flex-1 flex flex-col gap-1 items-stretch">
                            <p className="text-sm font-normal text-text text-left">
                              {item.title}{' '}
                              <span className={'text-primary'}>
                                {item.required ? '(필수)' : '(선택)'}
                              </span>
                            </p>
                            {item.description && (
                              <p className="text-xs text-normal text-muted  text-left">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </button>
                        <Link
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 flex items-center justify-center"
                          aria-label={`${item.title} 보기`}
                        >
                          <ChevronRightIcon className="text-muted" width={16} height={16} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>
          <button
            type="button"
            disabled={!requiredChecked}
            onClick={onSubmit}
            className={`py-4 w-full rounded-xl text-base font-medium text-white bg-primary disabled:bg-disabled disabled:cursor-not-allowed`}
          >
            시작하기
          </button>
        </div>
      </div>
      <LoadingModal isOpen={onLoading} />
    </>
  );
}
