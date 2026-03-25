type Props = {
  onDelete: () => void;
  onClose: () => void;
};

export default function JobPostingDeleteModal({ onDelete, onClose }: Props) {
  return (
    <div className="w-80 p-6 shadow-md">
      {/* 제목 */}
      <div className="mb-2.5 flex items-start justify-start gap-1">
        <div className="flex-1 flex flex-col items-stretch">
          <h2 className="text-lg font-semibold text-gray-900">공고를 정말 삭제할까요?</h2>
        </div>
      </div>

      {/* 입력창 */}
      <div className="mb-2.5">
        <p className="text-base text-black font-normal">
          삭제 후에는 더 이상 본 공고의 현황 및 일정을 추적할 수 없어요.
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex flex-row items-center gap-2">
        <button
          className="flex-1 rounded-xl border border-primary py-2.5 text-sm font-medium text-primary transition"
          type="button"
          onClick={onClose}
        >
          취소하기
        </button>
        <button
          className="flex-1 rounded-xl border bg-primary border-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-gray-300"
          type="button"
          onClick={onDelete}
        >
          삭제하기
        </button>
      </div>
    </div>
  );
}
