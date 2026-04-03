import CloseIcon from '@/public/svg/Close.svg';

type Props = {
  onSelectAuto: () => void;
  onSelectManual: () => void;
  onClose: () => void;
};

export default function JobPostingRegisterTypeModal({
  onSelectAuto,
  onSelectManual,
  onClose,
}: Props) {
  return (
    <div className="w-full tablet:w-96 flex flex-col">
      <header className="shrink-0 w-full p-6 flex flex-row gap-3 items-start border-b-[0.5px] border-muted/25">
        <div className="flex-1 flex flex-col gap-1">
          <h1 className="font-bold text-2xl text-text">공고 등록</h1>
          <p className="text-base text-muted">원하는 방식으로 공고를 등록하세요</p>
        </div>
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8"
          aria-label="닫기"
          onClick={onClose}
        >
          <CloseIcon width={24} height={24} className="text-muted" />
        </button>
      </header>
      <div className="p-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onSelectAuto}
          className="w-full text-left p-4 rounded-2xl border border-primary/30 hover:border-primary hover:bg-tertiary transition-colors"
        >
          <p className="font-bold text-base text-text">자동 등록</p>
          <p className="text-sm text-muted mt-1">
            공고 URL을 입력해서 정보를 자동으로 불러옵니다
          </p>
        </button>
        <button
          type="button"
          onClick={onSelectManual}
          className="w-full text-left p-4 rounded-2xl border border-muted/30 hover:border-primary hover:bg-tertiary transition-colors"
        >
          <p className="font-bold text-base text-text">수동 등록</p>
          <p className="text-sm text-muted mt-1">공고 정보를 직접 입력해서 등록합니다</p>
        </button>
      </div>
    </div>
  );
}
