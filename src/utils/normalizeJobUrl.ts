/**
 * 모바일/공유 링크를 스크래핑 가능한 URL로 정규화합니다.
 *
 * 처리 케이스:
 * 1. 프로토콜 누락 (https:// 자동 추가)
 * 2. 사람인 모바일 서브도메인 (m.saramin.co.kr → www.saramin.co.kr + 경로 재구성)
 * 3. 잡코리아 모바일 서브도메인 (m.jobkorea.co.kr → www.jobkorea.co.kr)
 *
 * 단축 URL(bit.ly 등)은 서버 측 redirect 추적에서 처리해야 합니다.
 */

export type NormalizeJobUrlResult = {
  /** 스크래핑에 사용할 정규화된 URL */
  normalizedUrl: string;
  /** 사용자가 입력한 URL을 저장/표시용으로 정리한 값 */
  sourceUrl: string;
  /** 스크래핑용 URL이 입력 URL과 달라졌는지 여부 */
  changed: boolean;
};

function addProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * 사람인 모바일 URL → 데스크톱 URL 변환
 *
 * 모바일:  https://m.saramin.co.kr/job-search/view?rec_idx=XXXXXX
 * 데스크톱: https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=XXXXXX
 *
 * rec_idx 파라미터가 양쪽에서 동일하게 공고를 식별합니다.
 */
function normalizeSaramin(parsed: URL): URL | null {
  if (parsed.hostname !== 'm.saramin.co.kr') return null;

  const recIdx = parsed.searchParams.get('rec_idx');
  if (recIdx) {
    // rec_idx가 있으면 데스크톱 canonical URL로 재구성
    return new URL(`https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=${recIdx}`);
  }

  // rec_idx가 없으면 서브도메인만 교체 (경로 유지, 백엔드 redirect에 의존)
  const normalized = new URL(parsed.toString());
  normalized.hostname = 'www.saramin.co.kr';
  return normalized;
}

/**
 * 잡코리아 모바일 URL → 데스크톱 URL 변환
 * 서브도메인만 교체합니다.
 */
function normalizeJobkorea(parsed: URL): URL | null {
  if (parsed.hostname !== 'm.jobkorea.co.kr') return null;

  const normalized = new URL(parsed.toString());
  normalized.hostname = 'www.jobkorea.co.kr';
  return normalized;
}

const SITE_NORMALIZERS: Array<(url: URL) => URL | null> = [
  normalizeSaramin,
  normalizeJobkorea,
];

export function normalizeJobUrl(rawUrl: string): NormalizeJobUrlResult {
  const sourceUrl = addProtocol(rawUrl.trim());

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    // URL 파싱 실패 시 프로토콜만 추가된 값 반환
    // (유효성 검사는 JobPostingInput에서 이미 수행됨)
    return {
      normalizedUrl: sourceUrl,
      sourceUrl,
      changed: sourceUrl !== rawUrl.trim(),
    };
  }

  for (const normalizer of SITE_NORMALIZERS) {
    const result = normalizer(parsed);
    if (result) {
      return {
        normalizedUrl: result.toString(),
        sourceUrl,
        changed: result.toString() !== sourceUrl,
      };
    }
  }

  return {
    normalizedUrl: sourceUrl,
    sourceUrl,
    changed: sourceUrl !== rawUrl.trim(),
  };
}
