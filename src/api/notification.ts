import { apiRequest } from '@/src/lib/api/client';
import { AuthNotificationType } from '@/src/types/auth';

export const notificationApi = {
  getList: async (): Promise<{ settings: AuthNotificationType[] }> =>
    apiRequest({
      path: '/notification-settings/me',
      method: 'GET',
    }),
  update: ({
    settingKey,
    channel,
    isEnabled,
  }: {
    settingKey: 'DAILY_SCHEDULE' | 'WEEKLY_BRIEF' | 'NOTICE_UPDATE' | 'MARKETING';
    channel: 'BROWSER' | 'EMAIL';
    isEnabled: boolean;
  }): Promise<AuthNotificationType> =>
    apiRequest({
      path: '/notification-settings/me',
      method: 'PATCH',
      body: {
        settingKey,
        channel,
        isEnabled,
      },
    }),
  savePushToken: async ({
    token,
    deviceLabel,
  }: {
    token: string;
    deviceLabel: string;
  }): Promise<void> =>
    apiRequest({
      path: '/notification-settings/me/push-token',
      method: 'POST',
      body: {
        token,
        deviceLabel,
      },
    }),
  deletePushToken: async (token: string): Promise<void> =>
    apiRequest({
      path: `/notification-settings/me/push-token`,
      method: 'DELETE',
      body: {
        token,
      },
    }),
};
