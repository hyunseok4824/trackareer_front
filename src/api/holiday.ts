import { apiRequest } from '@/src/lib/api/client';
import { HolidayType } from '@/src/types/holiday';

export const holidayApi = {
  // 엔드포인트 오타(/hoildays)는 API 명세 기준 그대로 사용
  getList: (): Promise<HolidayType[]> =>
    apiRequest({
      path: '/holidays',
      method: 'GET',
    }),
};
