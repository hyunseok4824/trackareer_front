import { apiRequest } from '@/src/lib/api/client';
import { AuthAgreementType, AuthType } from '@/src/types/auth';

export const authApi = {
  login: (idToken: string): Promise<AuthType> =>
    apiRequest({
      path: '/auth/login',
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    }),
  signUp: (termAgreements: AuthAgreementType[]): Promise<void> =>
    apiRequest({
      path: '/auth/sign-up',
      method: 'POST',
      body: { termAgreements },
    }),
  addDeleteReason: (reasons: string[]): Promise<void> =>
    apiRequest({
      path: '/auth/delete-account-reason',
      method: 'POST',
      body: { reasons },
    }),
  delete: (): Promise<void> =>
    apiRequest({
      path: '/auth/account',
      method: 'DELETE',
    }),
};
