/**
 * 인스타그램, 페이스북, 카카오톡, 라인 등 인앱 브라우저 여부를 감지한다.
 *
 * Firebase signInWithPopup / signInWithRedirect 는 인앱 브라우저에서
 * sessionStorage를 사용할 수 없어 "missing initial state" 에러가 발생한다.
 * 이 유틸로 인앱 브라우저를 감지하고 외부 브라우저 사용을 유도해야 한다.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;

  return (
    // Instagram
    /Instagram/i.test(ua) ||
    // Facebook (FBAN = Facebook App, FBAV = Facebook App Version)
    /FBAN|FBAV/i.test(ua) ||
    // KakaoTalk
    /KAKAOTALK/i.test(ua) ||
    // LINE
    /Line\//i.test(ua) ||
    // Naver App
    /NAVER\(inapp/i.test(ua) ||
    // Twitter / X
    /TwitterAndroid|TwitteriPhone/i.test(ua) ||
    // TikTok
    /musical_ly|TikTok/i.test(ua) ||
    // Threads
    /Barcelona/i.test(ua) ||
    // Discord
    /discord/i.test(ua)
  );
}
