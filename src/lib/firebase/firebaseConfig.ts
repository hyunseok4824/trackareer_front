import { notificationApi } from '@/src/api/notification';
import { FirebaseOptions, getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getToken, Messaging } from 'firebase/messaging';

// 파이어 베이스 설정 (본 서비스용)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
} as FirebaseOptions;

const isBrowser = typeof window !== 'undefined'; // 현재 코드가 브라우저에서 실행 중인지 확인 (Next.js SSR 대응)
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey); // Firebase 초기화에 필요한 config 값이 실제로 존재하는지 체크

// Firebase 인스턴스 변수 선언
let firebaseApp: FirebaseApp | null = null; // Firebase 프로젝트 최상위 앱 인스턴스
let firebaseDb: Firestore | null = null; // Firestore DB 인스턴스  (데이터 관리)
let firebaseAuth: Auth | null = null; // Firebase Authentication 인스턴스 (토큰 관리)
const firebaseMessaging: Messaging | null = null; // Firebase Cloud Messaging 인스턴스 (푸시 알림)

// Firebase 인스턴스 초기화
if (isBrowser && hasFirebaseConfig) {
  firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  firebaseDb = getFirestore(firebaseApp);
  firebaseAuth = getAuth(firebaseApp);

  // firebaseMessaging = getMessaging(firebaseApp);
}
export { firebaseApp, firebaseAuth, firebaseDb, firebaseMessaging };

export async function requestPermission() {
  await Notification.requestPermission();
}

export async function requestMessagingPermission() {
  if (typeof window === 'undefined') return;
  if (!firebaseMessaging) return;

  try {
    // 0) HTTPS / secure context 체크 (인앱/개발환경에서 자주 실패)
    if (!window.isSecureContext) {
      return; // UX: https에서만 가능 안내
    }

    // 1) 필수 API 체크
    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return; // UX: 외부 브라우저 안내
    }

    // 2) SW 먼저 등록 + ready 대기 (경로는 반드시 절대경로)
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // 서비스 워커 등록 (푸시 알림 수신을 위해 필요)
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 3) 권한 요청 (여기서 throw 나는 인앱이 있어서 별도 try로 감싸도 됨)
    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      return; // UX: 권한 요청 불가 환경 안내
    }
    if (permission !== 'granted') return;

    // 5) getToken에 SW registration 명시
    const token = await getToken(firebaseMessaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!token) return;

    await notificationApi.savePushToken({
      token,
      deviceLabel: navigator.userAgent,
    });
  } catch (err) {
    console.error('푸시 알림 권한 요청 또는 토큰 저장 중 오류:', err);
  }
}
