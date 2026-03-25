import ChevronRightIcon from '@/public/svg/ChevronRight.svg';
import CloseIcon from '@/public/svg/Close.svg';

type Props = {
  onClose: () => void;
};

const JOB_SITES = [
  { name: '사람인', href: 'https://www.saramin.co.kr/zf_user/jobs/list/job-category' },
  { name: '잡코리아', href: 'https://www.jobkorea.co.kr/recruit/joblist?menucode=duty' },
];

function JobSiteItem({ name, href, onClick }: { name: string; href: string; onClick: () => void }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="w-full px-4 py-4 rounded-xl text-base font-medium text-text group hover:bg-primary hover:text-white flex flex-row items-center justify-between"
    >
      {name}
      <ChevronRightIcon className="text-muted group-hover:text-white" width={20} height={20} />
    </a>
  );
}

export default function JobPostingSiteListModal({ onClose }: Props) {
  return (
    <div className="p-6 w-120 flex flex-col">
      <header className="w-full flex flex-row justify-between items-start">
        <div className="p-2 flex-1 flex flex-col items-stretch">
          <p className="text-lg font-medium text-text">추천 공고 사이트</p>
          <p className="text-sm font-regular text-muted">
            지원할 공고의 링크를 복사해서 사용해보세요.
          </p>
        </div>
        <button
          className="flex items-center justify-center w-8 h-8"
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon className="text-muted" width={20} height={20} />
        </button>
      </header>
      <ul className="w-full mt-6 p-2 flex flex-col gap-1">
        {JOB_SITES.map(site => (
          <JobSiteItem key={site.name} name={site.name} href={site.href} onClick={onClose} />
        ))}
      </ul>
    </div>
  );
}
