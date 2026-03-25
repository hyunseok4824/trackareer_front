// importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js');

// firebase.initializeApp({
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
//   vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
// });

// const messaging = firebase.messaging();

// // 백그라운드 메시지 핸들러 (옵션: 기본 알림 외에 추가 작업이 필요한 경우)
// messaging.onBackgroundMessage(payload => {
//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/firebase-logo.png',
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function () {
  console.log('fcm sw activate..');
});
self.addEventListener('push', function (e) {
  let data;
  try {
    data = e.data ? e.data.json() : null;
  } catch {
    // JSON이 아니면 무시
    return;
  }
  if (!data?.notification) return;

  const { title, body } = data.notification;

  e.waitUntil(
    self.registration.showNotification(title ?? '', {
      body: body ?? '',
    }),
  );
});
