import React from 'react';

type Props = {
  className?: string;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

const LoadingView: React.FC<Props> = ({ className }) => {
  return (
    <div className={cx('w-full h-full flex-1 flex items-center justify-center', className)}>
      <div className="w-8 h-8 border-4 border-disabled border-t-primary rounded-full animate-spin" />
    </div>
  );
};

export default LoadingView;
