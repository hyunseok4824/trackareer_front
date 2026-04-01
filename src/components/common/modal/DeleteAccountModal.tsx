'use client';

import { useState } from 'react';

type Props = {
  onCancel: () => void;
  onSubmit: (reasons: string[]) => void | Promise<void>;
  submitting?: boolean;
};

const REASONS: string[] = [
  '취업에 성공하여 필요가 없어졌어요',
  '원하는 기능이 부족했어요',
  '사용하기 복잡하거나 불편했어요',
  '생각보다 서비스가 도움이 되지 않았어요',
  '서비스가 제 취업 단계와 맞지 않았어요',
  '알림이 부담스러웠어요',
  '다른 서비스를 사용하고 있어요',
  '기타',
];

export default function DeleteAccountModal({ onCancel, onSubmit, submitting = false }: Props) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherText, setOtherText] = useState<string>('');

  const isOther = selectedReasons.includes('기타');
  const isValid =
    selectedReasons.filter(r => r !== '기타').length > 0 ||
    !isOther ||
    (isOther && otherText.trim().length > 0);

  const handleSubmit = async () => {
    if (!isValid) return;

    const finalReasons = isOther
      ? [...selectedReasons.filter(r => r !== '기타'), otherText.trim()]
      : selectedReasons;
    await onSubmit(finalReasons);
  };

  return (
    <div className="w-full h-dvh tablet:w-120 tablet:h-140 flex flex-col overflow-hidden bg-white">
      <header
        className="shrink-0 px-6 tablet:px-8 pb-4 pt-6 tablet:pt-8 border-b border-gray-100"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <h1 className="text-xl font-bold text-center">계정 삭제</h1>
        <p className="mt-4 text-sm text-gray-500 text-center leading-relaxed break-keep">
          저희 서비스에 주신 관심과 사랑에 감사드립니다.
          <br />
          귀하의 솔직한 의견을 공유해주신다면
          <br />
          더 나은 서비스로 거듭나도록 하겠습니다.
        </p>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 tablet:px-8 py-6">
        <div className="w-full flex flex-col gap-3">
          {REASONS.map(reason => (
            <label
              key={reason}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 px-4 py-3 cursor-pointer"
            >
              <input
                type="checkbox"
                name="delete-reason"
                value={reason}
                checked={selectedReasons.includes(reason)}
                onChange={() =>
                  setSelectedReasons(prev =>
                    prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason],
                  )
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <div className="flex-1 flex flex-col items-stretch gap-2 min-w-0">
                <span className="text-sm leading-6 text-gray-800 break-keep">{reason}</span>
                {reason === '기타' && isOther && (
                  <input
                    className="w-full min-w-0 rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    value={otherText}
                    onChange={e => setOtherText(e.target.value)}
                    placeholder="직접 입력..."
                  />
                )}
              </div>
            </label>
          ))}
        </div>
      </main>

      <footer
        className="shrink-0 border-t border-gray-100 bg-white px-6 tablet:px-8 pt-4 pb-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-2 gap-3 tablet:mx-auto tablet:max-w-sm">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="w-full min-h-12 rounded-xl border border-primary px-4 py-3 text-center text-base font-medium text-primary"
          >
            취소하기
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full min-h-12 rounded-xl border border-primary bg-primary px-4 py-3 text-center text-base font-medium text-white disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled"
          >
            제출하기
          </button>
        </div>
      </footer>
    </div>
  );
}
