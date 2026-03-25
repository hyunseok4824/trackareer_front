import { apiRequest } from '@/src/lib/api/client';
import { AuthIndustryType, AuthJobType, AuthProfileType, AuthPurposeType } from '@/src/types/auth';

export const profilesApi = {
  onboarding: ({
    jobInterests,
    industryInterests,
    usagePurposes,
  }: {
    jobInterests: AuthJobType[];
    industryInterests: AuthIndustryType[];
    usagePurposes: AuthPurposeType[];
  }): Promise<void> =>
    apiRequest({
      path: '/profiles/onboarding',
      method: 'PUT',
      body: {
        jobInterests,
        industryInterests,
        usagePurposes,
      },
    }),
  update: ({
    nickname,
    jobInterests,
    industryInterests,
  }: {
    nickname: string;
    jobInterests: AuthJobType[];
    industryInterests: AuthIndustryType[];
  }): Promise<{ profile: AuthProfileType }> =>
    apiRequest({
      path: '/profiles/me',
      method: 'PATCH',
      body: {
        nickname,
        jobInterests,
        industryInterests,
      },
    }),
};
