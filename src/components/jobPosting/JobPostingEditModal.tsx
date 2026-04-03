'use client';

import CloseIcon from '@/public/svg/Close.svg';
import { jobPostingsApi } from '@/src/api/jobPosting';
import ToggleSwitchButton from '@/src/components/common/button/ToggleSwitchButton';
import CommonModal from '@/src/components/common/modal/CommonModal';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import LoginModal from '@/src/components/common/modal/LoginModal';
import LoadingView from '@/src/components/common/view/LoadingView';
import { useJobPosting } from '@/src/hook/useJobPosting';
import { useAuthStore } from '@/src/stores/authStore';
import { JOB_POSTING_EDIT_MODE, JobPostingEditMode, STAGE_TYPE } from '@/src/types/jobPosting';
import { formatDate, formatTime } from '@/src/utils/dateFormatters';
import { useEffect, useRef, useState } from 'react';

export type JobPostingCreateFormData = {
  mode: typeof JOB_POSTING_EDIT_MODE.SYNTHETIC | typeof JOB_POSTING_EDIT_MODE.DIRECT;
  companyName: string;
  title: string;
  memo: string | null;
  deadlineDate: string;
  deadlineTime: string | null;
  sourceUrl: string | null;
};

type JobPostingUpdateFormData = {
  mode: typeof JOB_POSTING_EDIT_MODE.MODIFIED;
  companyName: string;
  title: string;
  memo: string;
};

type CreateErrorMessage = {
  mode: typeof JOB_POSTING_EDIT_MODE.SYNTHETIC | typeof JOB_POSTING_EDIT_MODE.DIRECT;
  companyName: string | null;
  title: string | null;
  dealine: string | null;
  sourceUrl: string | null;
};

type UpdateErrorMessage = {
  mode: typeof JOB_POSTING_EDIT_MODE.MODIFIED;
  companyName: string | null;
  title: string | null;
};

type Props =
  | {
      mode: typeof JOB_POSTING_EDIT_MODE.SYNTHETIC;
      data: {
        initValue: JobPostingCreateFormData;
      };
      onClose: () => void;
    }
  | {
      mode: typeof JOB_POSTING_EDIT_MODE.DIRECT;
      data: undefined;
      onClose: () => void;
    }
  | {
      mode: typeof JOB_POSTING_EDIT_MODE.MODIFIED;
      data: { jobId: number };
      onClose: () => void;
    };

const MODAL_TEXT: Record<JobPostingEditMode, { title: string; description: string }> = {
  [JOB_POSTING_EDIT_MODE.DIRECT]: {
    title: '공고 등록하기',
    description: '직접 공고 정보를 입력해주세요',
  },
  [JOB_POSTING_EDIT_MODE.SYNTHETIC]: {
    title: '공고 등록하기',
    description: '자동으로 불러온 정보를 확인하고, 필요시 수정해주세요',
  },
  [JOB_POSTING_EDIT_MODE.MODIFIED]: {
    title: '공고 수정하기',
    description: '원하는 항목의 내용을 수정해주세요',
  },
};

const getErrorMessageOfDeadline = (
  date: string,
  time: string | null,
  includeTime: boolean,
  errorOnEmpty?: boolean,
): string | null => {
  const dateDigits = date.replace(/\D/g, '');
  if (dateDigits.length === 0) {
    if (errorOnEmpty !== false) {
      return '날짜를 입력해주세요';
    }
  } else if (dateDigits.length !== 8) {
    return '날짜를 올바른 형식으로 입력해주세요. (예: 2026.01.30)';
  } else {
    const y = Number(dateDigits.slice(0, 4));
    const m = Number(dateDigits.slice(4, 6));
    const d = Number(dateDigits.slice(6, 8));
    const dateObj = new Date(y, m - 1, d);

    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
      return '날짜를 유효한 값으로 입력해주세요.';
    }
  }

  if (!includeTime) {
    return null;
  }

  if (!time) {
    if (errorOnEmpty !== false) {
      return '시간을 입력해주세요.';
    }
  } else {
    const timeDigits = time.replace(/\D/g, '');
    if (timeDigits.length !== 4) {
      return '시간을 올바른 형식으로 입력해주세요. (예: 20:00)';
    }

    const hh = Number(timeDigits.slice(0, 2));
    const mm = Number(timeDigits.slice(2, 4));

    if (hh > 23 || mm > 59) {
      return '시간을 유효한 값으로 입력해주세요.';
    }
  }

  return null;
};

const getISOStringOfDeadline = (
  date: string,
  time: string | null,
  includeTime: boolean,
): string => {
  const dateDigits = date.replace(/\D/g, '');
  const y = Number(dateDigits.slice(0, 4));
  const m = Number(dateDigits.slice(4, 6));
  const d = Number(dateDigits.slice(6, 8));

  let hh = 0;
  let mm = 0;
  if (includeTime && time) {
    const timeDigits = time.replace(/\D/g, '');
    hh = Number(timeDigits.slice(0, 2));
    mm = Number(timeDigits.slice(2, 4));
  }

  return new Date(y, m - 1, d, hh, mm, 0).toISOString();
};

function FieldItem({
  label,
  required,
  children,
  errorMessage,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  errorMessage: string | null;
}) {
  return (
    <section className="flex flex-col items-start">
      <label className="font-bold text-base text-text mb-2">
        <span>
          {label} {required && <strong className="text-accent font-medium">*</strong>}
        </span>
      </label>
      {children}
      {errorMessage && <span className="mt-1 text-sm text-accent font-normal">{errorMessage}</span>}
    </section>
  );
}

export default function JobPostingEditModal({ mode, data, onClose }: Props) {
  const { auth } = useAuthStore();
  const [onFetching, setOnFetching] = useState<boolean>(false);

  // 모바일에서 소프트 키보드가 올라올 때 모달 높이를 visualViewport 기준으로 보정
  // tablet (600px) 이상에서는 적용하지 않음
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      if (window.innerWidth >= 600) {
        setMobileViewportHeight(null);
        return;
      }
      setMobileViewportHeight(vv.height);
    };
    update();
    vv.addEventListener('resize', update);
    window.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  const [fetchingErrorMessage, setFetchingErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobPostingCreateFormData | JobPostingUpdateFormData>(
    mode === JOB_POSTING_EDIT_MODE.MODIFIED
      ? {
          mode: JOB_POSTING_EDIT_MODE.MODIFIED,
          companyName: '',
          title: '',
          memo: '',
        }
      : mode === JOB_POSTING_EDIT_MODE.SYNTHETIC
        ? data.initValue
        : {
            mode: JOB_POSTING_EDIT_MODE.DIRECT,
            companyName: '',
            title: '',
            memo: '',
            deadlineDate: '',
            deadlineTime: '',
            sourceUrl: '',
          },
  );
  const [errorMessage, setErrorMessage] = useState<CreateErrorMessage | UpdateErrorMessage>(
    mode === JOB_POSTING_EDIT_MODE.MODIFIED
      ? {
          mode: JOB_POSTING_EDIT_MODE.MODIFIED,
          companyName: null,
          title: null,
        }
      : {
          mode,
          companyName: null,
          title: null,
          dealine: null,
          sourceUrl: null,
        },
  );

  useEffect(() => {
    if (mode !== JOB_POSTING_EDIT_MODE.MODIFIED) {
      return;
    }

    const fetchJobPosting = async () => {
      try {
        setOnFetching(true);
        const initValue = await jobPostingsApi.get(data.jobId);

        setFormData({
          mode: JOB_POSTING_EDIT_MODE.MODIFIED,
          companyName: initValue.companyName,
          title: initValue.title,
          memo: initValue.memo ?? '',
        });
      } catch (e) {
        console.error('Error fetching job posting details:', e);
        setFetchingErrorMessage('공고 정보를 불러오지 못했습니다.');
      } finally {
        setOnFetching(false);
      }
    };

    fetchJobPosting();
  }, [mode, data]);

  const onChangeCompanyName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trimStart().replaceAll('\n', '').slice(0, 32);
    setFormData(prev => ({ ...prev, companyName: newValue }));
    if (e.target.value === '') {
      return;
    }
    setErrorMessage(prev => ({
      ...prev,
      companyName: newValue ? null : '기업명을 입력해주세요.',
    }));
  };

  const onChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trimStart().replaceAll('\n', '').slice(0, 64);
    setFormData(prev => ({ ...prev, title: newValue }));
    if (e.target.value === '') {
      return;
    }
    setErrorMessage(prev => ({ ...prev, title: newValue ? null : '포지션을 입력해주세요.' }));
  };

  // 메모 textarea 자동 높이 조절을 위한 ref
  const memoRef = useRef<HTMLTextAreaElement>(null);

  // iOS Safari에서 키보드가 올라온 후 포커스된 필드를 스크롤 컨테이너 중앙으로 이동
  // 키보드 애니메이션이 끝난 뒤 보정하기 위해 320ms 딜레이 사용
  const scrollFieldIntoView = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 320);
  };

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.trimStart();
    setFormData(prev => ({ ...prev, memo: newValue }));

    // 입력 내용에 따라 textarea 높이 자동 확장 (max-h-64 = 256px 초과 시 내부 스크롤)
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  // Deadline date/time
  // Only editable in CREATE mode, not in UPDATE mode
  const [includeTime, setIncludeTime] = useState<boolean>(false);

  const onChangeDeadlineDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === JOB_POSTING_EDIT_MODE.MODIFIED) return;
    const newValue = formatDate(e.target.value);
    setFormData(prev => ({ ...prev, deadlineDate: newValue }));
  };

  const onChangeDeadlineTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === JOB_POSTING_EDIT_MODE.MODIFIED) return;
    const newValue = formatTime(e.target.value);
    setFormData(prev => ({ ...prev, deadlineTime: newValue }));
  };

  useEffect(() => {
    if (formData.mode === JOB_POSTING_EDIT_MODE.MODIFIED) return;

    if (formData.deadlineDate === '' && formData.deadlineTime === '' && includeTime === false) {
      return;
    }

    const dateError = getErrorMessageOfDeadline(
      formData.deadlineDate,
      formData.deadlineTime,
      includeTime,
      false,
    );
    setErrorMessage(prev => ({ ...prev, dealine: dateError }));
  }, [mode, formData, includeTime]);

  // 로그인 모달 상태 관리
  const [isLoginModalOpened, setIsLoginModalOpened] = useState<boolean>(false);

  const closeLoginModal = () => setIsLoginModalOpened(false);

  // 제출 상태 관리
  const { insertJobPosting, updateJobPosting } = useJobPosting();
  const [onSubmitting, setOnSubmitting] = useState<boolean>(false);

  const validateUpdateFormData = (
    data: JobPostingUpdateFormData,
  ): { ok: boolean; errors: UpdateErrorMessage } => {
    let isOk = true;
    const next: UpdateErrorMessage = {
      mode: data.mode,
      companyName: null,
      title: null,
    };

    if (!data.companyName.trim()) {
      next.companyName = '기업명을 입력해주세요.';
      isOk = false;
    }
    if (!data.title.trim()) {
      next.title = '포지션을 입력해주세요.';
      isOk = false;
    }

    return { ok: isOk, errors: next };
  };

  const validateCreateFormData = (
    data: JobPostingCreateFormData,
  ): {
    ok: boolean;
    errors: CreateErrorMessage;
  } => {
    let isOk = true;
    const next: CreateErrorMessage = {
      mode: data.mode,
      companyName: null,
      title: null,
      dealine: null,
      sourceUrl: null,
    };

    if (!data.companyName.trim()) {
      next.companyName = '기업명을 입력해주세요.';
      isOk = false;
    }
    if (!data.title.trim()) {
      next.title = '포지션을 입력해주세요.';
      isOk = false;
    }

    // yyyy.mm.dd 포맷의 문자열을 Date 객체로 변환하여 유효한 날짜인지 체크
    const dateError = getErrorMessageOfDeadline(data.deadlineDate, data.deadlineTime, includeTime);
    if (dateError) {
      next.dealine = dateError;
      isOk = false;
    }

    return { ok: isOk, errors: next };
  };

  const onSubmitUpdate = async () => {
    if (onSubmitting || mode !== JOB_POSTING_EDIT_MODE.MODIFIED) return;

    if (!auth) {
      setIsLoginModalOpened(true);
      return;
    }

    try {
      setOnSubmitting(true);

      const parsedFormData = {
        mode: formData.mode,
        companyName: formData.companyName.trim(),
        title: formData.title.trim(),
        memo: formData.memo?.trim() || null,
      } as JobPostingUpdateFormData;

      const { ok, errors } = validateUpdateFormData(parsedFormData);
      if (!ok) {
        setErrorMessage(errors);
        return;
      }

      const payload = {
        companyName: formData.companyName.trim(),
        title: formData.title.trim(),
        memo: formData.memo?.trim() || null,
      };

      const updated = await jobPostingsApi.update(data.jobId, payload);

      updateJobPosting(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setOnSubmitting(false);
    }
  };

  const onSubmitCreate = async () => {
    if (onSubmitting || formData.mode === JOB_POSTING_EDIT_MODE.MODIFIED) return;

    if (!auth) {
      setIsLoginModalOpened(true);
      return;
    }

    try {
      setOnSubmitting(true);

      const parsedFormData = {
        companyName: formData.companyName.trim(),
        title: formData.title.trim(),
        memo: formData.memo?.trim() || null,
        deadlineDate: formData.deadlineDate.trim(),
        deadlineTime: includeTime ? formData.deadlineTime?.trim() || null : null,
        sourceUrl: formData.sourceUrl?.trim() || null,
      } as JobPostingCreateFormData;

      const { ok, errors } = validateCreateFormData(parsedFormData);

      if (!ok) {
        setErrorMessage(errors);
        return;
      }

      const payload = {
        companyName: parsedFormData.companyName,
        title: parsedFormData.title,
        memo: parsedFormData.memo,
        eventAt: getISOStringOfDeadline(
          parsedFormData.deadlineDate,
          parsedFormData.deadlineTime,
          includeTime,
        ),
        stageType: STAGE_TYPE.DOCUMENT,
        sourceUrl: parsedFormData.sourceUrl,
        editMode: formData.mode,
      };

      const created = await jobPostingsApi.create(payload);
      insertJobPosting(created);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setOnSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="w-full tablet:w-180 h-dvh tablet:h-auto tablet:max-h-[90dvh] flex flex-col"
        style={mobileViewportHeight !== null ? { height: `${mobileViewportHeight}px` } : undefined}
      >
        <header className="shrink-0 w-full p-6 flex flex-row gap-3 items-start border-b-[0.5px] border-muted/25">
          <div className="flex-1 flex flex-col items-stretch gap-1">
            <h1 className="flex-1 font-bold text-2xl">{MODAL_TEXT[mode].title}</h1>
            <p className="text-base font-regular">{MODAL_TEXT[mode].description}</p>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8"
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon width={24} height={24} className={'text-muted'} />
          </button>
        </header>
        {onFetching && <LoadingView />}
        {!onFetching && fetchingErrorMessage && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-base font-medium text-muted">{fetchingErrorMessage}</p>
          </div>
        )}
        {!onFetching && !fetchingErrorMessage && (
          <>
            <div
              className="flex-1 min-h-0 flex flex-col gap-4 px-6 pt-6 pb-16 overflow-y-auto"
              style={{
                scrollbarWidth: 'none',
              }}
            >
              <FieldItem label="기업명" required errorMessage={errorMessage.companyName}>
                <input
                  id="companyName"
                  className="w-full border border-muted focus:border-primary mt-1 rounded-md px-3 py-2 box-border"
                  placeholder="기업명 ex) 삼성전자, 카카오모빌리티..."
                  maxLength={32}
                  value={formData.companyName}
                  onChange={onChangeCompanyName}
                  onFocus={scrollFieldIntoView}
                />
              </FieldItem>
              <FieldItem label="포지션" required errorMessage={errorMessage.title}>
                <input
                  id="jobPosition"
                  className="w-full border border-muted focus:border-primary mt-1 box-border rounded-md px-3 py-2"
                  placeholder="채용 포지션 ex) 프론트 엔드 개발자..."
                  maxLength={64}
                  value={formData.title}
                  onChange={onChangeTitle}
                  onFocus={scrollFieldIntoView}
                />
              </FieldItem>
              {formData.mode !== JOB_POSTING_EDIT_MODE.MODIFIED && (
                <>
                  <FieldItem
                    label="지원 마감일"
                    required
                    errorMessage={
                      errorMessage.mode === JOB_POSTING_EDIT_MODE.MODIFIED
                        ? null
                        : errorMessage.dealine
                    }
                  >
                    {/*
                     * flex-wrap: 320px처럼 좁은 화면에서 시간 입력 + 토글이
                     * 아래 줄로 자연스럽게 내려가도록 처리
                     */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <input
                        id="deadlineDate"
                        type="text"
                        inputMode="numeric"
                        placeholder="ex) 2026.01.30"
                        className="flex-1 min-w-36 border border-muted focus:border-primary box-border rounded-md px-3 py-2"
                        value={formData.deadlineDate}
                        onChange={onChangeDeadlineDate}
                        onFocus={scrollFieldIntoView}
                      />

                      {includeTime && (
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="20:00"
                          className="border border-muted focus:border-primary box-border w-20 rounded-md px-3 py-2"
                          value={formData.deadlineTime || ''}
                          onChange={onChangeDeadlineTime}
                          onFocus={scrollFieldIntoView}
                        />
                      )}

                      <div className="flex flex-row items-center gap-1">
                        <span className="text-sm font-medium">시간 포함</span>
                        <ToggleSwitchButton
                          checked={includeTime}
                          onChange={setIncludeTime}
                          size="sm"
                        />
                      </div>
                    </div>
                  </FieldItem>
                </>
              )}
              <FieldItem label="메모" errorMessage={null}>
                <textarea
                  ref={memoRef}
                  id="memo"
                  className="w-full border border-muted focus:border-primary mt-1 box-border rounded-md px-3 py-2 min-h-20 max-h-64 resize-none overflow-y-auto"
                  placeholder="메모 입력하기"
                  value={formData.memo || ''}
                  onChange={onChangeMemo}
                  onFocus={scrollFieldIntoView}
                />
              </FieldItem>
            </div>
            <div className="shrink-0 px-6 pb-6 pt-2">
              <button
                className="px-4 py-2 bg-primary text-white rounded-xl w-full h-12 disabled:opacity-60"
                onClick={mode === JOB_POSTING_EDIT_MODE.MODIFIED ? onSubmitUpdate : onSubmitCreate}
                disabled={onSubmitting}
              >
                {mode === JOB_POSTING_EDIT_MODE.MODIFIED ? '수정하기' : '공고 등록하기'}
              </button>
            </div>
          </>
        )}
      </div>
      <CommonModal isOpen={isLoginModalOpened && !auth} onClose={closeLoginModal} mobileFullscreen>
        <LoginModal onClose={closeLoginModal} />
      </CommonModal>

      <LoadingModal isOpen={onSubmitting} />
    </>
  );
}
