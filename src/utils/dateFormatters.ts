// 날짜 입력 포맷팅 함수

import { format } from 'date-fns';

// 사용자가 날짜 입력 필드에 입력할 때, 입력된 문자열을 'YYYY.MM.DD' 형식으로 포맷팅하는 함수
export const formatDate = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);

  let out = y;

  if (digits.length >= 5) {
    if (m.length === 1) out += `.${m}`;
    else if (m.length === 2) {
      const mm = Number(m);
      out += mm >= 1 && mm <= 12 ? `.${m}` : '.';
    }
  }

  if (digits.length >= 7) {
    if (d.length === 1) out += `.${d}`;
    else if (d.length === 2) {
      const dd = Number(d);
      out += dd >= 1 && dd <= 31 ? `.${d}` : '.';
    }
  }

  return out;
};

// 시간 입력 포맷팅 함수
// 사용자가 시간 입력 필드에 입력할 때, 입력된 문자열을 'HH:MM' 형식으로 포맷팅하는 함수
export const formatTime = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  const hour = digits.slice(0, 2);
  const minute = digits.slice(2, 4);

  if (hour.length === 2 && Number(hour) > 23) return '';
  if (minute.length === 2 && Number(minute) > 59) return `${hour}:`;

  return minute ? `${hour}:${minute}` : hour;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
export type DotDateParts = { y: number; m: number; d: number };

/** "YYYY.MM.DD" -> {y,m,d} (달력 유효성 포함) */
export function parseDotDate(dateDot: string): DotDateParts | null {
  const digits = dateDot.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));

  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  // ✅ 달력상 유효한 날짜인지 체크 (예: 2026-02-31 방지)
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;

  return { y, m, d };
}

/** "HH:mm" (또는 "HHmm") -> {hh,mm} */
export function parseHHmm(time?: string): { hh: number; mm: number } | null {
  const tDigits = (time ?? '').replace(/\D/g, '');
  if (tDigits.length !== 4) return null;

  const hh = Number(tDigits.slice(0, 2));
  const mm = Number(tDigits.slice(2, 4));
  if (hh > 23 || mm > 59) return null;

  return { hh, mm };
}

/** {y,m,d} + hh:mm:ss -> "YYYY-MM-DDTHH:mm:ssZ" */
export function buildUtcZIso(parts: DotDateParts, hh: number, mm: number, ss = 0): string {
  const { y, m, d } = parts;
  return `${y}-${pad2(m)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}:${pad2(ss)}Z`;
}

/**
 * ✅ 날짜만 있는 경우(조회용)
 * - startOfDay: 00:00:00Z
 * - endOfDay:   23:59:59Z
 */
export function toUtcZStartOfDay(dateDot: string): string | null {
  const parts = parseDotDate(dateDot);
  if (!parts) return null;
  return buildUtcZIso(parts, 0, 0, 0);
}

export function toUtcZEndOfDay(dateDot: string): string | null {
  const parts = parseDotDate(dateDot);
  if (!parts) return null;
  return buildUtcZIso(parts, 23, 59, 59);
}

/**
 * ✅ 날짜+시간 있는 경우(등록/마감 등)
 * includeTime=false면 (기존 로직 유지) 23:59:00Z
 * includeTime=true면  HH:mm:00Z
 */
export function toUtcZFromDotDateTime(
  dateDot: string,
  time?: string,
  includeTime?: boolean,
): string | null {
  const parts = parseDotDate(dateDot);
  if (!parts) return null;

  if (!includeTime) {
    // 기존 코드가 23:59로 사용했으니 그대로 유지
    return buildUtcZIso(parts, 23, 59, 0);
  }

  const t = parseHHmm(time);
  if (!t) return null;

  return buildUtcZIso(parts, t.hh, t.mm, 0);
}

/**
 * ✅ Date 객체 기반(캘린더 범위 조회용)
 * - 로컬 타임존 영향 없이 "해당 Date의 로컬 y/m/d 값"을 그대로 Z로 포장
 *
 * CalendarView에서 startOfDay(date), endOfDay(date) 만들어서 넣으면:
 * - start: 00:00:00Z
 * - end:   23:59:59Z
 */
export function toUtcZStartOfDayFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${pad2(m)}-${pad2(d)}T00:00:00Z`;
}

export function toUtcZEndOfDayFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${pad2(m)}-${pad2(d)}T23:59:59Z`;
}

export function buildISOFromDotAndTime(dateDot: string, timeHm?: string | null) {
  // "2026.02.25" + "09:00" -> ISO(Z)
  const digits = dateDot.replace(/\D/g, '');
  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));

  let hh = 0;
  let mm = 0;
  if (timeHm) {
    const t = timeHm.replace(/\D/g, '');
    hh = Number(t.slice(0, 2));
    mm = Number(t.slice(2, 4));
  }

  return new Date(y, m - 1, d, hh, mm, 0).toISOString();
}

export function datetimeToString(datetime: string): string {
  // ISO 문자열 -> "2026년 02월 25일" + "09:00"
  const date = new Date(datetime);
  const today = new Date();
  const yearStr = date.getFullYear() === today.getFullYear() ? '' : `${date.getFullYear()}년 `;
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const dateStr = isToday
    ? '오늘'
    : `${yearStr}${pad2(date.getMonth() + 1)}월 ${pad2(date.getDate())}일`;
  const timeStr = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  return `${dateStr} ${timeStr}`;
}

export function dateToDiffDays(date: string): number {
  const targetDate = new Date(date);
  const today = new Date();
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const targetDateTimestamp = targetDate.getTime();
  const todayTimestamp = today.getTime();
  const diffDays = Math.round((targetDateTimestamp - todayTimestamp) / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function dateToYYYYMMDD(date: Date) {
  return format(date, 'yyyy-MM-dd');
}
