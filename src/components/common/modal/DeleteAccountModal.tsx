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
    <div className="w-120 h-140 bg-white rounded-3xl p-8 shadow-xl flex flex-col items-center">
      <h1 className="text-xl font-bold text-center mb-4">계정 삭제</h1>

      <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
        저희 서비스에 주신 관심과 사랑에 감사드립니다.
        <br />
        귀하의 솔직한 의견을 공유해주신다면
        <br />더 나은 서비스로 거듭나도록 하겠습니다.
      </p>

      <div className="w-64 flex flex-col gap-4">
        {REASONS.map(reason => (
          <label key={reason} className="flex items-start gap-3 cursor-pointer">
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
              className="w-4 h-4 accent-primary"
            />
            <div className="flex-1 flex flex-col items-stretch gap-2">
              <span className="text-sm text-gray-800">{reason}</span>
              {reason === '기타' && isOther && (
                <input
                  className="w-full p-2 rounded-lg border border-gray-300 text-sm outline-none"
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  placeholder="직접 입력..."
                />
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="flex flex-row gap-4 mt-8">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="w-30 py-3 rounded-xl border border-primary text-primary font-medium text-center"
        >
          취소하기
        </button>

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-30 py-3 rounded-xl border border-primary bg-primary text-white font-medium text-center disabled:bg-disabled disabled:border-disabled disabled:cursor-not-allowed"
        >
          제출하기
        </button>
      </div>
    </div>
  );
}
