import ChevronRightIcon from '@/public/svg/ChevronRight.svg';
import CommonModal from '@/src/components/common/modal/CommonModal';
import JobPostingSiteListModal from '@/src/components/jobPosting/JobPostingSiteListModal';
import { useState } from 'react';

type Props = {
  className?: string;
  url: string;
  onChangeUrl: (url: string) => void;
  onCreate: () => void;
  onSubmit: () => void;
};

export default function JobPostingInput({
  className,
  url,
  onChangeUrl,
  onCreate,
  onSubmit,
}: Props) {
  const [jobSiteListModalOpened, setJobSiteListModalOpened] = useState<boolean>(false);

  const openJobSiteListModal = () => setJobSiteListModalOpened(true);
  const closeJobSiteListModal = () => setJobSiteListModalOpened(false);

  const handleSubmit = async () => {
    if (!url) {
      alert('공고의 URL을 입력해주세요.');
      return;
    }

    const pathName = url.split('?')[0].split('#')[0];
    const pathPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./]*)?$/;

    if (!pathPattern.test(pathName)) {
      alert('공고의 URL을 올바르게 입력해주세요.');
      return;
    }
    onSubmit();
  };

  return (
    <>
      <section
        className={`shrink-0 w-full rounded-3xl flex flex-col bg-white overflow-hidden shadow-default ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-primary px-6 py-3">
          <p className="text-base font-bold text-white">
            간편하게 지원할 공고들의 일정을 등록하세요
          </p>
          <div className="relative">
            <button
              className="flex items-center gap-1 border border-white rounded-full px-3 py-2 text-sm font-medium text-white hover:bg-white hover:text-primary"
              type="button"
              onClick={openJobSiteListModal}
            >
              지원할 공고 찾아보기
              <ChevronRightIcon width={16} height={16} />
            </button>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <textarea
            value={url}
            onChange={e => onChangeUrl(e.target.value)}
            placeholder={'https:// 원하는 공고의 링크를 넣어주세요'}
            className="h-13 w-full outline-none text-base text-text placeholder:text-muted overflow-y-scroll resize-none"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCreate}
              className="py-2 px-3 rounded-2xl bg-tertiary text-sm leading-4 font-medium text-primary"
            >
              직접 입력하기
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="py-2 px-3 rounded-2xl bg-primary text-sm leading-4 font-medium text-white"
            >
              일정에 등록하기
            </button>
          </div>
        </div>
      </section>
      <CommonModal isOpen={jobSiteListModalOpened} onClose={closeJobSiteListModal}>
        <JobPostingSiteListModal onClose={closeJobSiteListModal} />
      </CommonModal>
    </>
  );
}
