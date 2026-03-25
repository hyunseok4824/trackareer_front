// src/components/common/button/CheckedCircleBox.tsx
'use client';

import CheckIcon from '@/public/svg/Check.svg';

type Props = {
  checked: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  className?: string;
};

export default function CheckedCircleBox({ checked, onClick, disabled, className }: Props) {
  return (
    <div
      role="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={checked}
      className={[
        'rounded-full border flex items-center justify-center',
        checked ? 'border-primary bg-primary' : 'border-muted bg-white',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className ?? '',
      ].join(' ')}
    >
      {checked && <CheckIcon className="text-white" width={12} height={12} />}
    </div>
  );
}
