'use client';

import FullLogo from '@/public/svg/logo/FullLogo.svg';
import { profilesApi } from '@/src/api/profile';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import { INDUSTRIES, JOB_CATEGORIES, PURPOSES } from '@/src/constant/auth';
import { useAuthStore } from '@/src/stores/authStore';
import { AuthIndustryType, AuthJobType, AuthPurposeType } from '@/src/types/auth';
import { useMemo, useState } from 'react';

type Step = 1 | 2 | 3;

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

function Chip<T extends string>({
  label,
  selected,
  onClick,
}: {
  label: T;
  selected: boolean;
  onClick: () => void;
  variant?: 'outline' | 'filled';
}) {
  const base = 'rounded-lg border p-2 text-sm font-medium';

  const selectedStyle = selected
    ? 'border-primary bg-primary text-white'
    : 'border-primary bg-white text-primary hover:bg-primary/80 hover:text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(base, selectedStyle)}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

function ProgressBars({ step }: { step: Step }) {
  // 3칸 바: step에 따라 active 개수
  const actives = step; // 1~3
  return (
    <div className="mt-4">
      <div className="flex flex-row items-center gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={cx('h-1 w-15 rounded-lg', i <= actives ? 'bg-primary' : 'bg-disabled')}
          />
        ))}
      </div>
      <div className="mt-1 text-xs text-primary">{step} of 3</div>
    </div>
  );
}

export default function Onboarding3Step() {
  const { logout, updateOnboardingCompleted } = useAuthStore();
  const [onLoading, setOnLoading] = useState<boolean>(false);
  const [step, setStep] = useState<Step>(1);

  const [jobInterests, setJobInterests] = useState<AuthJobType[]>([]);
  const [industryInterests, setIndustryInterests] = useState<AuthIndustryType[]>([]);
  const [usagePurposes, setUsagePurposes] = useState<AuthPurposeType[]>([]);

  const title = useMemo(() => {
    if (step === 1) return '어떤 직무에 관심이 있나요?';
    if (step === 2) return '어떤 산업에 관심이 있나요?';
    if (step === 3) return '어떤 목적으로 서비스를 사용하고 싶나요?';
  }, [step]);

  const canNext = useMemo(() => {
    if (step === 1) return jobInterests.length > 0;
    if (step === 2) return industryInterests.length > 0;
    if (step === 3) return usagePurposes.length > 0;
    return false;
  }, [step, jobInterests.length, industryInterests.length, usagePurposes]);

  const toggleMulti = <T extends string>(value: T, current: T[], setter: (v: T[]) => void) => {
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  const onNext = async () => {
    if (step === 1) {
      if (jobInterests.length === 0) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (industryInterests.length === 0) return;
      setStep(3);
      return;
    }

    if (step === 3) {
      if (usagePurposes.length === 0) return;

      try {
        if (onLoading) return;
        setOnLoading(true);
        await profilesApi.onboarding({ jobInterests, industryInterests, usagePurposes });
        updateOnboardingCompleted();
      } finally {
        setOnLoading(false);
      }
    }
  };

  const onPrev = () => {
    if (step === 1) return;

    if (step === 2) {
      setStep(1);
      setIndustryInterests([]);
      return;
    }

    if (step === 3) {
      setStep(2);
      setUsagePurposes([]);
      return;
    }
  };

  return (
    <>
      {/*
       * 모바일: w-full h-dvh (CommonModal mobileFullscreen과 함께 전체화면)
       * tablet+: w-180 h-120 (기존 팝업 스타일)
       * 레이아웃: header/progress(shrink-0) + content(flex-1 overflow-y-auto) + footer(shrink-0)
       * → 칩이 많아도 내부 스크롤, 하단 버튼은 항상 노출
       */}
      <div className="w-full h-dvh tablet:w-180 tablet:h-120 flex flex-col overflow-hidden">
        {/* Header + Progress: 항상 상단 고정 */}
        <div className="shrink-0 px-6 tablet:p-9 tablet:pb-0 pt-8">
          <header className="flex items-start justify-between">
            <FullLogo width={144} height={24} />
            <button type="button" onClick={logout} className="text-xs font-normal text-disabled">
              로그아웃 후 닫기
            </button>
          </header>
          <ProgressBars step={step} />
        </div>

        {/* 스크롤 가능한 칩 선택 영역 */}
        <main className="flex-1 overflow-y-auto px-6 tablet:px-9 pt-4 pb-2">
          <h1 className="text-base font-bold text-text">{title}</h1>

          {/* Step bodies: 고정 너비 제거 → w-full로 모바일 overflow 방지 */}
          {step === 1 && (
            <div className="mt-6 w-full flex flex-wrap gap-3 gap-y-2">
              {JOB_CATEGORIES.map(item => (
                <Chip<AuthJobType>
                  key={item}
                  label={item}
                  selected={jobInterests.includes(item)}
                  onClick={() => toggleMulti(item, jobInterests, setJobInterests)}
                  variant="outline"
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 w-full flex flex-wrap gap-3 gap-y-2">
              {INDUSTRIES.map(item => (
                <Chip<AuthIndustryType>
                  key={item}
                  label={item}
                  selected={industryInterests.includes(item)}
                  onClick={() => toggleMulti(item, industryInterests, setIndustryInterests)}
                  variant="filled"
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 w-full flex flex-col gap-3">
              {PURPOSES.map(item => (
                <Chip<AuthPurposeType>
                  key={item}
                  label={item}
                  selected={usagePurposes.includes(item)}
                  onClick={() => toggleMulti(item, usagePurposes, setUsagePurposes)}
                  variant="outline"
                />
              ))}
            </div>
          )}
        </main>

        {/* 하단 네비게이션 버튼: safe-area 대응, 항상 고정 */}
        <footer
          className="shrink-0 px-6 tablet:px-9 pt-4 pb-8 flex items-center justify-end gap-6"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          {step !== 1 && (
            <button
              type="button"
              onClick={onPrev}
              className="text-base font-medium text-primary hover:text-primary/80"
            >
              이전으로
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className={cx(
              'px-6 py-3 rounded-lg text-base font-medium',
              canNext
                ? 'cursor-pointer bg-primary text-white hover:bg-primary/90'
                : 'cursor-not-allowed bg-disabled text-white',
            )}
          >
            {step === 3 ? '시작하기' : '다음으로'}
          </button>
        </footer>
      </div>
      <LoadingModal isOpen={onLoading} />
    </>
  );
}
