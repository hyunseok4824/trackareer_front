// src/stores/authStore.ts
import { authApi } from '@/src/api/auth';
import { firebaseAuth, requestMessagingPermission } from '@/src/lib/firebase/firebaseConfig';
import { AuthProfileType, AuthType } from '@/src/types/auth';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthStoreType = {
  onLoading: boolean;
  auth: AuthType | null;

  // ✅ 추가: persist 복원 완료 여부 (선택이지만 추천)
  hasHydrated: boolean;

  // ✅ 추가: firebase auth 판정 + (user면 서버 login까지) 최소 1회 완료
  authReady: boolean;

  initAuth: () => () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateSignUpCompleted: () => void;
  updateOnboardingCompleted: () => void;

  refreshProfile: (profile: AuthProfileType) => Promise<void>;

  // ✅ 추가: hydrate 플래그 세터 (타입 깔끔하게)
  setHasHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthStoreType>()(
  persist(
    (set, get) => ({
      onLoading: false,
      auth: null,

      hasHydrated: false,
      authReady: false,
      setHasHydrated: v => set({ hasHydrated: v }),

      initAuth: () => {
        if (!firebaseAuth) {
          console.warn('Firebase 초기화에 실패했어요. 환경변수를 확인해주세요.');
          // ✅ 초기화는 끝난 걸로 처리 (무한 대기 방지)
          set({ auth: null, authReady: true });
          return () => {};
        }

        const unsubscribe = firebaseAuth.onAuthStateChanged(async user => {
          try {
            if (user) {
              const firebaseIdToken = await user.getIdToken(true);
              const data = await authApi.login(firebaseIdToken);
              set({ auth: data, authReady: true });

              await requestMessagingPermission();
            } else {
              set({ auth: null, authReady: true });
            }
          } catch (err) {
            console.error('Auth initialization error:', err);
            set({ auth: null, authReady: true });
          }
        });

        return unsubscribe;
      },

      loginWithGoogle: async () => {
        try {
          if (get().onLoading) throw new Error('이미 로그인을 진행 중입니다.');
          set({ onLoading: true });

          if (!firebaseAuth)
            throw new Error('Firebase 초기화에 실패했어요. 환경변수를 확인해주세요.');

          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });

          const userCredential = await signInWithPopup(firebaseAuth, provider);
          const firebaseIdToken = await userCredential.user.getIdToken(true);
          const data = await authApi.login(firebaseIdToken);
          set({ auth: data, authReady: true });
          await requestMessagingPermission();
        } catch (err) {
          console.error('Login error:', err);
          throw new Error('로그인에 실패했어요. 다시 시도해주세요.');
        } finally {
          set({ onLoading: false });
        }
      },

      logout: async () => {
        try {
          if (get().onLoading) throw new Error('이미 로그아웃을 진행 중입니다.');
          set({ onLoading: true });

          if (!firebaseAuth)
            throw new Error('Firebase 초기화에 실패했어요. 환경변수를 확인해주세요.');

          await signOut(firebaseAuth);
          set({ auth: null, authReady: true });

          // TODO : 서버에도 로그아웃 API 요청해서 푸시 토큰 정리 필요
        } catch (err) {
          console.error('Logout error:', err);
          throw new Error('로그아웃에 실패했어요. 다시 시도해주세요.');
        } finally {
          set({ onLoading: false });
        }
      },

      updateSignUpCompleted: () => {
        set(state => {
          if (!state.auth) return state;
          return { auth: { ...state.auth, isSignUpCompleted: true } };
        });
      },

      updateOnboardingCompleted: () => {
        set(state => {
          if (!state.auth) return state;
          return { auth: { ...state.auth, onboardingCompleted: true } };
        });
      },
      refreshProfile: async (profile: AuthProfileType) => {
        set(state => {
          if (!state.auth) return state;
          return {
            auth: {
              ...state.auth,
              profile,
            },
          };
        });
      },
    }),
    {
      name: 'auth-store',
      partialize: s => ({ auth: s.auth }),

      // ✅ persist 복원 완료 플래그 찍기
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('rehydrate error', error);
        state?.setHasHydrated(true);
      },
    },
  ),
);
