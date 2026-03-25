'use client';

import CloseIcon from '@/public/svg/Close.svg';
import { authApi } from '@/src/api/auth';
import { notificationApi } from '@/src/api/notification';
import { profilesApi } from '@/src/api/profile';
import CommonModal from '@/src/components/common/modal/CommonModal';
import DeleteAccountModal from '@/src/components/common/modal/DeleteAccountModal';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import LoadingView from '@/src/components/common/view/LoadingView';
import { INDUSTRIES, JOB_CATEGORIES } from '@/src/constant/auth';
import { useAuthStore } from '@/src/stores/authStore';
import {
  AuthIndustryType,
  AuthJobType,
  AuthNotificationType,
  AuthProfileType,
} from '@/src/types/auth';
import { useEffect, useMemo, useRef, useState } from 'react';

type SettingsTab = 'PROFILE' | 'NOTIFICATIONS' | 'ACCOUNT';

export type SettingsModalValue = {
  email: string;
  name: string;
  interestedJob: AuthJobType | '';
  industries: AuthIndustryType[];
  notifications: {
    browserTodaySchedule: boolean;
    emailWeeklyBriefing: boolean;
    emailProductUpdates: boolean;
    emailEventMarketing: boolean;
  };
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

function TabItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'w-full text-left px-4 py-2 rounded-lg text-lg font-medium',
        active ? 'text-text' : 'text-text/50',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  );
}

function Chip<T extends string>({
  label,
  selected,
  onClick,
}: {
  label: T;
  selected: boolean;
  onClick: () => void;
}) {
  const base = 'rounded-lg border p-2 text-sm font-medium';
  const selectedStyle = selected
    ? 'border-primary bg-primary text-white'
    : 'border-primary bg-white text-primary hover:bg-primary hover:text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(base, selectedStyle)}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1">
        <div className="text-base font-normal text-text">{label}</div>
        {description && <div className="mt-1 text-xs font-normal text-text/50">{description}</div>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition',
          checked ? 'bg-primary' : 'bg-disabled',
        )}
      >
        <span
          className={cx(
            'inline-block h-5 w-5 transform rounded-full bg-white transition',
            checked ? 'translate-x-5' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}

function toggleMulti<T extends string>(v: T, current: T[]): T[] {
  return current.includes(v) ? current.filter(x => x !== v) : [...current, v];
}

function stableStringify(v: unknown) {
  return JSON.stringify(v);
}

/**
 * ✅ Props는 onClose만.
 * - open/close는 "부모가 마운트/언마운트" 또는 "상위 모달 스토어"에서 제어한다고 가정.
 * - 초기값은 const { auth } = useAuthStore()에서 가져옴.
 */
export default function SettingsModal({
  isProfileChanged,
  onClose,
  setIsProfileChanged,
}: {
  isProfileChanged: boolean;
  onClose: () => void;
  setIsProfileChanged: (value: boolean) => void;
}) {
  // 공통
  const [tab, setTab] = useState<SettingsTab>('PROFILE');
  const { auth } = useAuthStore();

  const tabTitle = useMemo(() => {
    switch (tab) {
      case 'PROFILE':
        return '프로필 관리';
      case 'NOTIFICATIONS':
        return '알림 관리';
      case 'ACCOUNT':
        return '계정 관리';
    }
  }, [tab]);

  const onChangeTab = (nextTab: SettingsTab) => {
    if (isProfileChanged) {
      const confirmLeave = window.confirm('변경사항이 저장되지 않았어요. 그래도 이동하시겠어요?');
      if (!confirmLeave) return;
    }
    setTab(nextTab);
    setIsProfileChanged(false);
  };

  // Notification
  const [notificationList, setNotificationList] = useState<AuthNotificationType[]>([]);

  useEffect(() => {
    const fetchNotificationList = async () => {
      const result = await notificationApi.getList();
      setNotificationList(result.settings);
    };

    fetchNotificationList();
  }, []);

  const updateNotification = async (updated: AuthNotificationType) => {
    try {
      const updatedNotification = await notificationApi.update(updated);
      setNotificationList(prev =>
        prev.map(n => (n.settingKey === updatedNotification.settingKey ? updatedNotification : n)),
      );
    } catch (err) {
      console.error('알림 설정 업데이트 실패:', err);
    }
  };

  return (
    <div className="relative z-10 w-240 h-150 bg-white rounded-3xl overflow-hidden">
      <div className="flex h-full">
        {/* Left nav */}
        <aside className="w-60 bg-background border-r border-gray-100 px-6 py-10 relative">
          <div className="space-y-2">
            <TabItem
              label="프로필"
              active={tab === 'PROFILE'}
              onClick={() => onChangeTab('PROFILE')}
            />
            <TabItem
              label="알림"
              active={tab === 'NOTIFICATIONS'}
              onClick={() => onChangeTab('NOTIFICATIONS')}
            />
            <TabItem
              label="계정"
              active={tab === 'ACCOUNT'}
              onClick={() => onChangeTab('ACCOUNT')}
            />
          </div>

          <div className="absolute left-6 bottom-6 text-xs text-disabled">v 1.0.0</div>
        </aside>

        {/* Right content */}
        <main className="flex-1 h-full flex flex-col">
          <header className="w-full h-28 flex flex-row items-end justify-between px-8 py-8">
            <h1 className="text-2xl font-medium text-text">{tabTitle}</h1>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="absolute right-6 top-6 h-10 w-10 rounded-full flex items-center justify-center text-text/60 hover:bg-tertiary"
            >
              <CloseIcon width={24} height={24} />
            </button>
          </header>
          <div className="relative w-full flex-1 flex flex-col overflow-y-hidden">
            {tab === 'PROFILE' && !auth?.profile && <LoadingView />}
            {tab === 'PROFILE' && auth?.profile && (
              <ProfileTab profile={auth.profile} updateIsProfileChanged={setIsProfileChanged} />
            )}

            {tab === 'NOTIFICATIONS' && notificationList.length === 0 && <LoadingView />}
            {tab === 'NOTIFICATIONS' && notificationList.length > 0 && (
              <NotificationsTab
                notificationList={notificationList}
                updateNotification={updateNotification}
              />
            )}
            {tab === 'ACCOUNT' && !auth && <LoadingView />}
            {tab === 'ACCOUNT' && auth && <AccountTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  updateIsProfileChanged,
}: {
  profile: AuthProfileType;
  updateIsProfileChanged: (changed: boolean) => void;
}) {
  const updateIsProfileChangedRef = useRef(updateIsProfileChanged);
  updateIsProfileChangedRef.current = updateIsProfileChanged;

  const [onSaving, setOnSaving] = useState<boolean>(false);
  const { refreshProfile } = useAuthStore();

  // Profile
  const [newProfile, setNewProfile] = useState<AuthProfileType>(profile);

  // profile prop이 변경되면 newProfile state도 업데이트
  useEffect(() => {
    setNewProfile(profile);
  }, [profile]);

  const isProfileChanged = useMemo(() => {
    return stableStringify(newProfile) !== stableStringify(profile);
  }, [newProfile, profile]);

  useEffect(() => {
    updateIsProfileChangedRef.current(isProfileChanged);
  }, [isProfileChanged]);

  const isEnableToSave = useMemo(() => {
    const isNicknameValid = newProfile.nickname.trim().length > 0;
    const isJobValid = newProfile.jobInterests.length > 0;
    const isIndustryValid = newProfile.industryInterests.length > 0;
    return isNicknameValid && isJobValid && isIndustryValid;
  }, [newProfile]);

  const onChangeNickname = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNewProfile(prev => ({ ...prev, nickname: newValue }));
  };

  const onChangeJob = (job: AuthJobType) => {
    setNewProfile(prev => ({ ...prev, jobInterests: toggleMulti(job, prev.jobInterests) }));
  };

  const onChangeIndustry = (industry: AuthIndustryType) => {
    setNewProfile(prev => ({
      ...prev,
      industryInterests: toggleMulti(industry, prev.industryInterests),
    }));
  };

  const onCancel = () => {
    setNewProfile(profile);
  };

  const onSave = async () => {
    try {
      if (onSaving) return;

      const isChanged = stableStringify(newProfile) !== stableStringify(profile);
      if (!isChanged) return;

      setOnSaving(true);
      const updated = await profilesApi.update({
        nickname: newProfile.nickname.trim(),
        jobInterests: newProfile.jobInterests,
        industryInterests: newProfile.industryInterests,
      });
      await refreshProfile(updated.profile);
    } catch (err) {
      console.error('프로필 업데이트 실패:', err);
      alert('프로필 업데이트에 실패했어요. 다시 시도해주세요.');
    } finally {
      setOnSaving(false);
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col overflow-x-scroll">
        <div className="w-full px-8 py-6 pb-40 flex flex-col gap-8">
          {/* Email */}
          <div>
            <div className="text-sm font-semibold text-text mb-2">이메일</div>
            <div className="text-sm font-normal text-text">{profile.email}</div>
          </div>

          {/* Name */}
          <div>
            <div className="text-sm font-semibold text-text mb-2">이름</div>
            <input
              value={newProfile.nickname}
              onChange={onChangeNickname}
              className="w-full h-11 rounded-lg border border-gray-200 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Job */}
          <div>
            <div className="text-sm font-semibold text-text mb-2">관심 직무</div>
            <div className="flex flex-wrap gap-3 gap-y-2">
              {JOB_CATEGORIES.map(job => (
                <Chip<AuthJobType>
                  key={job}
                  label={job}
                  selected={newProfile.jobInterests.includes(job)}
                  onClick={() => onChangeJob(job)}
                />
              ))}
            </div>
          </div>

          {/* Industries */}
          <div>
            <div className="text-sm font-semibold text-text mb-2">관심 산업</div>
            <div className="flex flex-wrap gap-3 gap-y-2">
              {INDUSTRIES.map(ind => (
                <Chip<AuthIndustryType>
                  key={ind}
                  label={ind}
                  selected={newProfile.industryInterests.includes(ind)}
                  onClick={() => onChangeIndustry(ind)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      {isProfileChanged && (
        <footer className="absolute bottom-0 left-0 right-0 px-8 pb-6 pt-4 bg-linear-to-t from-white via-white to-white/0">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white pl-6 pr-2 py-2">
            <p className="flex-1 text-sm font-medium text-text">변경사항이 있어요</p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={onSaving}
                className={cx(
                  'h-10 px-4 rounded-lg text-sm font-medium',
                  'text-text hover:bg-gray-50',
                )}
              >
                취소
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={!isEnableToSave || onSaving}
                className={cx(
                  'h-10 px-4 rounded-lg text-sm font-medium',
                  isEnableToSave
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-200 text-gray-500',
                )}
              >
                저장하기
              </button>
            </div>
          </div>
        </footer>
      )}

      <LoadingModal isOpen={onSaving} />
    </>
  );
}

function NotificationsTab({
  notificationList,
  updateNotification,
}: {
  notificationList: AuthNotificationType[];
  updateNotification: (notification: AuthNotificationType) => void;
}) {
  const notificationMap: Record<AuthNotificationType['settingKey'], AuthNotificationType> =
    useMemo(() => {
      const map = {} as Record<AuthNotificationType['settingKey'], AuthNotificationType>;
      notificationList.forEach(n => {
        map[n.settingKey] = n;
      });
      return map;
    }, [notificationList]);

  return (
    <div className="pl-8 pr-12 py-6 w-full flex flex-col gap-12">
      <div className="w-full flex flex-col gap-8">
        <div className="text-sm font-medium text-text">브라우저 알림</div>
        <Toggle
          label="오늘의 일정 알림"
          checked={notificationMap.DAILY_SCHEDULE?.isEnabled || false}
          onChange={next =>
            updateNotification({
              ...notificationMap.DAILY_SCHEDULE,
              isEnabled: next,
            })
          }
        />
      </div>
      <div className="w-full flex flex-col gap-8">
        <div className="text-sm font-medium text-text">이메일 알림</div>
        <Toggle
          label="주간 일정 브리핑"
          description="이번 주에 예정된 일정에 대한 브리핑이 제공돼요"
          checked={notificationMap.WEEKLY_BRIEF?.isEnabled || false}
          onChange={next =>
            updateNotification({
              ...notificationMap.WEEKLY_BRIEF,
              isEnabled: next,
            })
          }
        />

        <Toggle
          label="공지 및 업데이트"
          description="제품 업데이트, 최신 기능, 개선 사항 소식이 제공돼요"
          checked={notificationMap.NOTICE_UPDATE?.isEnabled || false}
          onChange={next =>
            updateNotification({
              ...notificationMap.NOTICE_UPDATE,
              isEnabled: next,
            })
          }
        />

        <Toggle
          label="이벤트 및 마케팅"
          description="사용자에게 유용한 팁과 각종 이벤트 소식이 제공돼요"
          checked={notificationMap.MARKETING?.isEnabled || false}
          onChange={next =>
            updateNotification({
              ...notificationMap.MARKETING,
              isEnabled: next,
            })
          }
        />
      </div>
    </div>
  );
}

function AccountTab() {
  const { logout } = useAuthStore();
  const [isSelectReasonModalOpened, setIsSelectReasonModalOpened] = useState<boolean>(false);
  // Account
  const onDeleteAccount = async () => {
    setIsSelectReasonModalOpened(true);
  };

  const onCancelDelete = () => {
    setIsSelectReasonModalOpened(false);
  };

  const onSubmitDeleteReason = async (reasons: string[]) => {
    try {
      await authApi.addDeleteReason(reasons);
      setIsSelectReasonModalOpened(false);
      const isConfirmed = confirm(
        '계정 정말 삭제할까요?\n\n계정을 삭제하면 즉시 모든 계정 정보와 데이터가 \n영구적으로 삭제되며, 다시 복구할 수 없어요.',
      );
      if (isConfirmed) {
        await authApi.delete();
        logout();
      }
    } catch {
      alert('삭제 사유를 제출하는 데 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div className="pl-8 pr-12 py-6 w-full flex flex-col">
        <div className="flex flex-col items-start">
          <div className="text-sm font-medium text-text">계정 삭제</div>
          <div className="mt-2 text-xs font-normal text-text/50">
            계정 정보와 모든 데이터가 삭제돼요
          </div>

          <button
            type="button"
            onClick={onDeleteAccount}
            className="mt-6 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
          >
            삭제하기
          </button>
        </div>
      </div>
      {isSelectReasonModalOpened && (
        <CommonModal isOpen={isSelectReasonModalOpened} onClose={onCancelDelete}>
          <DeleteAccountModal onCancel={onCancelDelete} onSubmit={onSubmitDeleteReason} />
        </CommonModal>
      )}
    </>
  );
}
