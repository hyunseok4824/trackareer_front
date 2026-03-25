'use client';

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export default function ToggleSwitchButton({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
}: ToggleSwitchProps) {
  const sizeMap = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-8', thumb: 'w-7 h-7', translate: 'translate-x-6' },
  } as const;

  const s = sizeMap[size];

  return (
    <div className="flex items-center justify-between gap-3">
      {label && (
        <span className={`text-sm ${disabled ? 'text-black/30' : 'text-black/70'}`}>{label}</span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/40',
          s.track,
          disabled ? 'bg-black/10 cursor-not-allowed' : checked ? 'bg-primary' : 'bg-black/20',
        ].join(' ')}
      >
        <span
          className={[
            'absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white',
            'shadow-md transition-transform duration-200',
            s.thumb,
            checked ? s.translate : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
