'use client';

import AddIcon from '@/public/svg/Add.svg';
import CloseIcon from '@/public/svg/Close.svg';
import FullLogo from '@/public/svg/logo/FullLogo.svg';
import { jobScrape } from '@/src/api/jobScrape';
import CalendarView from '@/src/components/calendar/CalendarView';
import CommonModal from '@/src/components/common/modal/CommonModal';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import JobPostingEditModal, {
  JobPostingCreateFormData,
} from '@/src/components/jobPosting/JobPostingEditModal';
import JobPostingInput from '@/src/components/jobPosting/JobPostingInput';
import JobPostingRegisterTypeModal from '@/src/components/jobPosting/JobPostingRegisterTypeModal';
import SideBar from '@/src/components/sidebar/Sidebar';
import { useAuthStore } from '@/src/stores/authStore';
import { JOB_POSTING_EDIT_MODE } from '@/src/types/jobPosting';
import { normalizeJobUrl } from '@/src/utils/normalizeJobUrl';
import { useState } from 'react';

type ModalStatusType =
  | { type: 'CLOSED'; data: null }
  | { type: 'SELECT_TYPE'; data: null }
  | { type: 'AUTO_INPUT'; data: null }
  | { type: typeof JOB_POSTING_EDIT_MODE.DIRECT; data: null }
  | { type: typeof JOB_POSTING_EDIT_MODE.SYNTHETIC; data: JobPostingCreateFormData };

type MobileTab = 'calendar' | 'sidebar';

let onScraping = false; // 전역 변수로 상태 관리

export default function Page() {
  const { auth } = useAuthStore();
  const [url, setUrl] = useState<string>('');
  const [onLoading, setOnLoading] = useState<boolean>(false);
  const [modalStatus, setModalStatus] = useState<ModalStatusType>({ type: 'CLOSED', data: null });
  const [mobileTab, setMobileTab] = useState<MobileTab>('calendar');

  const handleChangeUrl = (newUrl: string) => {
    const newValue = newUrl.replace(/\s/g, ''); // 공백 제거
    setUrl(newValue);
  };

  const handleAddButtonPressed = () => {
    setModalStatus({ type: 'SELECT_TYPE', data: null });
  };

  const handleSelfButtonPressed = () => {
    setModalStatus({ type: JOB_POSTING_EDIT_MODE.DIRECT, data: null });
  };

  const handleAutoRegisterSelected = () => {
    setModalStatus({ type: 'AUTO_INPUT', data: null });
  };

  const handleScrapeButtonPressed = async () => {
    if (!url || onLoading) return;

    // 프로토콜 누락 보완 + 모바일 서브도메인 → 데스크톱 URL 정규화
    const { normalizedUrl, sourceUrl } = normalizeJobUrl(url);

    try {
      setOnLoading(true);
      onScraping = true;

      const scrapedData = await jobScrape.loadJobData(normalizedUrl);

      if (!onScraping) return;

      const data = {
        mode: JOB_POSTING_EDIT_MODE.SYNTHETIC,
        title: scrapedData.title || '',
        companyName: scrapedData.companyName || '',
        memo: null,
        deadlineDate: scrapedData.deadlineDate || '',
        deadlineTime: scrapedData.deadlineTime,
        sourceUrl,
      } as JobPostingCreateFormData;

      setModalStatus({ type: JOB_POSTING_EDIT_MODE.SYNTHETIC, data });
    } catch (error) {
      console.error('Error during job scrape:', error);
      if (!onScraping) return;
      setModalStatus({
        type: JOB_POSTING_EDIT_MODE.SYNTHETIC,
        data: {
          title: '',
          companyName: '',
          memo: null,
          deadlineDate: '',
          deadlineTime: '',
          sourceUrl,
        } as JobPostingCreateFormData,
      });
    } finally {
      setOnLoading(false);
      onScraping = false;
    }
  };

  const handleCancelButtonPressed = () => {
    setOnLoading(false);
    onScraping = false;
    setModalStatus({
      type: JOB_POSTING_EDIT_MODE.DIRECT,
      data: null,
    });
  };

  const closeModal = () => {
    setModalStatus({ type: 'CLOSED', data: null });
  };

  return (
    <>
      {!auth && (
        <main className="flex-1 w-full flex flex-col items-center justify-center px-4 tablet:px-9 py-8">
          <div className="flex-1 w-full max-w-[54rem] flex flex-col items-center justify-center pb-16 tablet:pb-0">
            <h2 className="text-sm tablet:text-xl font-normal text-text/80 text-center break-keep">
              힘들고 긴 취준 여정, 놓치지 않도록 끝까지 관리해드릴게요
            </h2>
            <h1 className="text-2xl tablet:text-4xl font-bold text-text text-center mt-4 break-keep">
              지원하고 싶은 공고가 있나요?
            </h1>
            <JobPostingInput
              className="mt-8 tablet:mt-15"
              url={url}
              onChangeUrl={handleChangeUrl}
              onCreate={handleSelfButtonPressed}
              onSubmit={handleScrapeButtonPressed}
            />
          </div>
          <footer className="self-center mt-12">
            <FullLogo width={108} height={18} />
          </footer>
        </main>
      )}

      {auth && (
        <>
          <main className="flex flex-1 px-0 tablet:px-9 flex-row w-full items-start justify-center gap-0 tablet:gap-8 overflow-hidden">
            {/* 캘린더 컬럼: 모바일에서 사이드바 탭이면 숨김 */}
            <div
              className={`flex-1 py-0 tablet:py-8 h-full flex-col gap-8 overflow-hidden ${mobileTab === 'sidebar' ? 'hidden tablet:flex' : 'flex'}`}
            >
              {/* 공고 입력: 모바일에서 숨김 */}
              <JobPostingInput
                className="hidden tablet:block"
                url={url}
                onChangeUrl={handleChangeUrl}
                onCreate={handleSelfButtonPressed}
                onSubmit={handleScrapeButtonPressed}
              />
              <CalendarView />
            </div>

            {/* 사이드바 컬럼: 모바일에서 캘린더 탭이면 숨김 */}
            <div
              className={`py-0 tablet:py-8 h-full w-full tablet:w-auto ${mobileTab === 'calendar' ? 'hidden tablet:block' : 'block'}`}
            >
              <SideBar />
            </div>
          </main>

          {/* 모바일 하단 탭 내비게이션 */}
          <nav className="tablet:hidden shrink-0 h-14 bg-white border-t border-gray-200 flex items-stretch overflow-visible relative">
            <button
              type="button"
              onClick={() => setMobileTab('calendar')}
              className={`flex-1 text-sm font-medium transition-colors ${mobileTab === 'calendar' ? 'text-primary' : 'text-muted'}`}
            >
              캘린더
            </button>

            {/* 중앙 공간 확보 — 절대 배치 버튼의 터치 영역용 */}
            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setMobileTab('sidebar')}
              className={`flex-1 text-sm font-medium transition-colors ${mobileTab === 'sidebar' ? 'text-primary' : 'text-muted'}`}
            >
              현황
            </button>

            {/* 중앙 공고 등록 CTA — 탭 바 중앙에 절대 배치, 위로 살짝 돌출 */}
            <button
              type="button"
              onClick={handleAddButtonPressed}
              aria-label="공고 등록"
              className="absolute left-1/2 -translate-x-1/2 -top-4 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
            >
              <AddIcon width={36} height={36} />
            </button>
          </nav>
        </>
      )}

      {/* 등록 방식 선택 모달 */}
      <CommonModal isOpen={modalStatus.type === 'SELECT_TYPE'} onClose={closeModal}>
        <JobPostingRegisterTypeModal
          onSelectAuto={handleAutoRegisterSelected}
          onSelectManual={handleSelfButtonPressed}
          onClose={closeModal}
        />
      </CommonModal>

      {/* 자동 등록 — URL 입력 모달 */}
      <CommonModal isOpen={modalStatus.type === 'AUTO_INPUT'} onClose={closeModal}>
        <div className="w-full tablet:w-[32rem] flex flex-col">
          <header className="shrink-0 w-full p-6 flex flex-row gap-3 items-start border-b-[0.5px] border-muted/25">
            <div className="flex-1 flex flex-col gap-1">
              <h1 className="font-bold text-2xl text-text">자동 등록</h1>
              <p className="text-base text-muted">
                공고 URL을 입력해서 정보를 자동으로 불러옵니다
              </p>
            </div>
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8"
              aria-label="닫기"
              onClick={closeModal}
            >
              <CloseIcon width={24} height={24} className="text-muted" />
            </button>
          </header>
          <div className="p-6">
            <JobPostingInput
              flat
              hideDirectButton
              url={url}
              onChangeUrl={handleChangeUrl}
              onCreate={handleSelfButtonPressed}
              onSubmit={handleScrapeButtonPressed}
            />
          </div>
        </div>
      </CommonModal>

      {/* 수동 등록 / 스크래핑 결과 모달 */}
      <CommonModal
        isOpen={
          modalStatus.type === JOB_POSTING_EDIT_MODE.DIRECT ||
          modalStatus.type === JOB_POSTING_EDIT_MODE.SYNTHETIC
        }
        onClose={closeModal}
        mobileFullscreen
      >
        {modalStatus.type === JOB_POSTING_EDIT_MODE.SYNTHETIC && (
          <JobPostingEditModal
            mode={JOB_POSTING_EDIT_MODE.SYNTHETIC}
            data={{ initValue: modalStatus.data }}
            onClose={closeModal}
          />
        )}
        {modalStatus.type === JOB_POSTING_EDIT_MODE.DIRECT && (
          <JobPostingEditModal
            mode={JOB_POSTING_EDIT_MODE.DIRECT}
            data={undefined}
            onClose={closeModal}
          />
        )}
      </CommonModal>
      <LoadingModal
        isOpen={onLoading}
        hasModal
        title="공고 정보를 분석 중입니다..."
        description="정확한 정보 추출을 위해 시간이 소요될 수 있습니다."
        button={
          <button
            onClick={handleCancelButtonPressed}
            className="mt-6 px-4 py-2 rounded-lg bg-muted text-white hover:bg-muted/90"
          >
            취소하고 직접 입력하기
          </button>
        }
      />
    </>
  );
}
