import { useAuthStore } from '@/src/stores/authStore';

type Props = {
  onOpenSettingModal: () => void;
};

export default function ProfileMenu({ onOpenSettingModal }: Props) {
  const { onLoading, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/*
       * 모바일 bottom sheet / 데스크톱 팝오버 공용
       * - 너비: 모바일 w-full (CommonMenu bottom sheet가 full-width), 데스크톱 w-32
       * - 버튼 패딩: 모바일 py-4 → 44px+ 터치 타겟, 데스크톱 p-1.5 (기존)
       */}
      <div className="p-2 tablet:p-1.5 w-full tablet:w-32 flex flex-col gap-1 tablet:gap-0">
        <button
          className="py-4 tablet:py-1.5 px-3 text-center text-base tablet:text-sm text-primary hover:text-white hover:bg-primary rounded-lg"
          onClick={onOpenSettingModal}
        >
          프로필 설정
        </button>
        <button
          className="py-4 tablet:py-1.5 px-3 text-center text-base tablet:text-sm text-primary hover:text-white hover:bg-primary rounded-lg cursor-pointer"
          onClick={handleLogout}
          disabled={onLoading}
        >
          로그아웃
        </button>
      </div>
    </>
  );
}
