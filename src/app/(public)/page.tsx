'use client';

import FullLogo from '@/public/svg/logo/FullLogo.svg';
import { jobScrape } from '@/src/api/jobScrape';
import CalendarView from '@/src/components/calendar/CalendarView';
import CommonModal from '@/src/components/common/modal/CommonModal';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import JobPostingEditModal, {
  JobPostingCreateFormData,
} from '@/src/components/jobPosting/JobPostingEditModal';
import JobPostingInput from '@/src/components/jobPosting/JobPostingInput';
import SideBar from '@/src/components/sidebar/Sidebar';
import { useAuthStore } from '@/src/stores/authStore';
import { JOB_POSTING_EDIT_MODE } from '@/src/types/jobPosting';
import { useState } from 'react';

type ModalStatusType =
  | {
      type: typeof JOB_POSTING_EDIT_MODE.DIRECT | 'CLOSED';
      data: null;
    }
  | {
      type: typeof JOB_POSTING_EDIT_MODE.SYNTHETIC;
      data: JobPostingCreateFormData;
    };

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

  const handleSelfButtonPressed = () => {
    setModalStatus({ type: JOB_POSTING_EDIT_MODE.DIRECT, data: null });
  };

  const handleScrapeButtonPressed = async () => {
    if (!url || onLoading) return;
    try {
      setOnLoading(true);
      onScraping = true;

      const scrapedData = await jobScrape.loadJobData(url);

      if (!onScraping) return;

      const data = {
        mode: JOB_POSTING_EDIT_MODE.SYNTHETIC,
        title: scrapedData.title || '',
        companyName: scrapedData.companyName || '',
        memo: null,
        deadlineDate: scrapedData.deadlineDate || '',
        deadlineTime: scrapedData.deadlineTime,
        sourceUrl: url,
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
          sourceUrl: url,
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
          <div className="flex-1 w-full max-w-[54rem] flex flex-col items-center justify-center">
            <h2 className="text-xl font-normal text-text/80 text-center">
              힘들고 긴 취준 여정, 놓치지 않도록 끝까지 관리해드릴게요
            </h2>
            <h1 className="text-4xl font-bold text-text text-center mt-4">
              지원하고 싶은 공고가 있나요?
            </h1>
            <JobPostingInput
              className="mt-15"
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
          <main className="flex flex-1 px-4 tablet:px-9 flex-row w-full items-start justify-center gap-8 overflow-hidden">
            {/* 캘린더 컬럼: 모바일에서 사이드바 탭이면 숨김 */}
            <div
              className={`flex-1 py-8 h-full flex-col gap-8 overflow-hidden ${mobileTab === 'sidebar' ? 'hidden tablet:flex' : 'flex'}`}
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
              className={`py-8 h-full w-full tablet:w-auto ${mobileTab === 'calendar' ? 'hidden tablet:block' : 'block'}`}
            >
              <SideBar />
            </div>
          </main>

          {/* 모바일 하단 탭 내비게이션 */}
          <nav className="tablet:hidden shrink-0 h-14 bg-white border-t border-gray-200 flex items-stretch">
            <button
              type="button"
              onClick={() => setMobileTab('calendar')}
              className={`flex-1 text-sm font-medium transition-colors ${mobileTab === 'calendar' ? 'text-primary' : 'text-muted'}`}
            >
              캘린더
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('sidebar')}
              className={`flex-1 text-sm font-medium transition-colors ${mobileTab === 'sidebar' ? 'text-primary' : 'text-muted'}`}
            >
              현황
            </button>
          </nav>
        </>
      )}

      <CommonModal isOpen={modalStatus.type !== 'CLOSED'} onClose={closeModal}>
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
