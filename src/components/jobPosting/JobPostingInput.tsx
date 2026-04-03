import ChevronRightIcon from '@/public/svg/ChevronRight.svg';
import CommonModal from '@/src/components/common/modal/CommonModal';
import JobPostingSiteListModal from '@/src/components/jobPosting/JobPostingSiteListModal';
import { useState } from 'react';

type Props = {
  className?: string;
  /**
   * 모달 안에서 사용할 때 카드 래퍼(배경·그림자·라운드)를 제거합니다.
   */
  flat?: boolean;
  /**
   * 자동 등록 전용 모달처럼 수동 입력 진입점이 이미 선택된 경우,
   * "직접 입력하기" 버튼을 숨깁니다.
   */
  hideDirectButton?: boolean;
  url: string;
  onChangeUrl: (url: string) => void;
  onCreate: () => void;
  onSubmit: () => void;
};

export default function JobPostingInput({
  className,
  flat = false,
  hideDirectButton = false,
  url,
  onChangeUrl,
  onCreate,
  onSubmit,
}: Props) {
  const [jobSiteListModalOpened, setJobSiteListModalOpened] = useState<boolean>(false);

  const openJobSiteListModal = () => setJobSiteListModalOpened(true);
  const closeJobSiteListModal = () => setJobSiteListModalOpened(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      alert('공고의 URL을 입력해주세요.');
      return;
    }

    /*
     * URL 정규화 및 검증
     *
     * 기존 regex(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./]*)?$/)는
     * %, (, ), ~, +, = 등 실제 URL에 등장하는 문자를 거부해서
     * 모바일 웹 공유 링크 / 앱 공유 링크 / tracking parameter 포함 URL이
     * 자동 추출에 실패하는 원인이었습니다.
     *
     * URL 생성자는 RFC 3986에 따라 유효한 모든 URL을 허용하므로
     * 아래 패턴들을 모두 처리합니다.
     *   - 프로토콜 없는 URL (m.saramin.co.kr/...)  → https:// 자동 추가
     *   - 모바일 전용 서브도메인 (m., mobile. 등)
     *   - 앱 공유 / 단축 URL (bit.ly, url.kr 등)  → 스크레이퍼가 redirect 추적
     *   - tracking query parameter (?utm_source=... 등)
     *   - 인코딩된 문자(%20, %ED%95 등)가 포함된 경로
     */
    const rawUrl = url.trim();
    const urlWithProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlWithProtocol);
    } catch {
      alert('공고의 URL을 올바르게 입력해주세요.');
      return;
    }

    // http / https 만 허용 (javascript:, data: 등 차단)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      alert('공고의 URL을 올바르게 입력해주세요.');
      return;
    }

    // 호스트가 없는 경우 (예: "https:///path") 차단
    if (!parsedUrl.hostname || parsedUrl.hostname === 'localhost') {
      alert('공고의 URL을 올바르게 입력해주세요.');
      return;
    }

    onSubmit();
  };

  return (
    <>
      <section
        className={[
          'shrink-0 w-full flex flex-col overflow-hidden',
          flat ? '' : 'rounded-3xl bg-white shadow-default',
          className ?? '',
        ].join(' ')}
      >
        {/* Header: 모바일에서는 숨김, tablet 이상은 기존 모습 유지 */}
        <div className="hidden tablet:flex items-center justify-between gap-3 bg-primary px-6 py-3">
          <p className="text-base font-bold text-white">
            간편하게 지원할 공고들의 일정을 등록하세요
          </p>
          <button
            className="flex items-center gap-1 border border-white rounded-full px-3 py-2 text-sm font-medium text-white hover:bg-white hover:text-primary"
            type="button"
            onClick={openJobSiteListModal}
          >
            지원할 공고 찾아보기
            <ChevronRightIcon width={16} height={16} />
          </button>
        </div>
        <div className="p-4 tablet:p-6 flex flex-col gap-3">
          <textarea
            value={url}
            onChange={e => onChangeUrl(e.target.value)}
            placeholder={'https:// 원하는 공고의 링크를 넣어주세요'}
            className="h-13 w-full outline-none text-base text-text placeholder:text-muted overflow-y-scroll resize-none"
          />

          {/* 모바일: flex-1 균등 분할 / tablet+: 기존 우측 정렬 */}
          <div className="flex items-center gap-3 tablet:justify-end">
            {!hideDirectButton && (
              <button
                type="button"
                onClick={onCreate}
                className="flex-1 tablet:flex-none py-3 tablet:py-2 px-3 rounded-2xl bg-tertiary text-sm leading-5 font-medium text-primary break-keep"
              >
                직접 입력하기
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 tablet:flex-none py-3 tablet:py-2 px-3 rounded-2xl bg-primary text-sm leading-5 font-medium text-white break-keep"
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
