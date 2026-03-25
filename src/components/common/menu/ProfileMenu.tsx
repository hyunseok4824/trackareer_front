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
      <div className="p-1.5 w-32 flex flex-col">
        <button
          className="p-1.5 text-center text-sm text-primary hover:text-white hover:bg-primary rounded-lg"
          onClick={onOpenSettingModal}
        >
          프로필 설정
        </button>
        <button
          className="p-1.5 text-center text-sm text-primary hover:text-white hover:bg-primary rounded-lg cursor-pointer"
          onClick={handleLogout}
          disabled={onLoading}
        >
          로그아웃
        </button>
      </div>
    </>
  );
}
