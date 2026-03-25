import { AuthIndustryType, AuthJobType, AuthPurposeType } from '@/src/types/auth';

export const JOB_CATEGORIES: AuthJobType[] = [
  '경영·기획',
  '마케팅·광고',
  '영업·고객상담',
  '물류·유통',
  '제조·생산',
  'IT·데이터',
  '디자인',
  '연구개발·설계',
  '미디어·문화',
  '전문직',
  '서비스',
  '기타',
];

export const INDUSTRIES: AuthIndustryType[] = [
  'IT/정보통신',
  '금융·은행',
  '제조·생산',
  '서비스',
  '유통·리테일',
  '교육',
  '건설',
  '의료·바이오',
  '미디어·문화',
  '기관·협회',
  '기타',
];

export const PURPOSES: AuthPurposeType[] = [
  '일정을 편하게 관리하고 싶어요',
  '지원 현황을 한눈에 보고 싶어요',
  '취준 과정을 기록하고 싶어요',
];
