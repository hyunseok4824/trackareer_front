import FullLogo from '@/public/svg/logo/FullLogo.svg';
import AuthButtonSet from '@/src/components/common/header/AuthButtonSet';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col items-center overflow-y-auto overflow-x-hidden">
      <div className="min-w-[480px] w-full max-w-7xl h-full flex flex-col">
        <header className="w-full px-4 tablet:px-9 py-3 flex flex-row justify-between items-center">
          <FullLogo width={216} height={36} />
          <AuthButtonSet />
        </header>
        {children}
      </div>
    </div>
  );
}
