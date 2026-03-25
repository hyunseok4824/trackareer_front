import { getFirebaseIdToken } from '@/src/lib/api/client';

class ApiError extends Error {
  status: number;
  bodyText?: string;

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.bodyText = bodyText;
  }
}

export const jobScrape = {
  loadJobData: async (
    url: string,
  ): Promise<{
    sourceUrl: string;
    title: string | null;
    companyName: string | null;
    deadlineDate: string | null;
    deadlineTime: string | null;
  }> => {
    try {
      const token = await getFirebaseIdToken();

      const res = await fetch('https://ryg.kr/scrape/job-detail', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          url,
          fields: ['company', 'title', 'deadline'],
          waitForSelectorTimeout: 1000,
        }),
      });

      if (!res.ok) {
        throw new ApiError(
          `Request failed: ${res.status}`,
          res.status,
          await res.text().catch(() => ''),
        );
      }

      if (res.status === 204) throw new ApiError('No content returned from scrape API', 204);

      const data = await res.json();

      const deadlineDate = data.deadline ? data.deadline.split(' ')[0].replace(/\./g, '-') : null;
      const deadlineTime = data.deadline ? data.deadline.split(' ')[1] : null;

      return {
        sourceUrl: url,
        title: data.title || null,
        companyName: data.company_name || null,
        deadlineDate,
        deadlineTime,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(
          'API Error:',
          error.message,
          'Status:',
          error.status,
          'Body:',
          error.bodyText,
        );
      } else {
        console.error('Unexpected Error:', error);
      }
      return {
        sourceUrl: url,
        title: null,
        companyName: null,
        deadlineDate: null,
        deadlineTime: null,
      };
    }
  },
};
