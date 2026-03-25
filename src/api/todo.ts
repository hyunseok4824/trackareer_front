import { apiRequest } from '@/src/lib/api/client';
import { TodoType } from '@/src/types/todo';

export const todoApi = {
  getList: ({
    startDate,
    endDate,
  }: {
    startDate: string; // ISO string
    endDate: string; // ISO string
  }): Promise<TodoType[]> =>
    apiRequest({
      path: `/todos?${new URLSearchParams({ startDate, endDate }).toString()}`,
      method: 'GET',
    }),
  create: ({
    content,
    date,
  }: {
    content: string;
    date: string; // ISO string
  }): Promise<TodoType> =>
    apiRequest({
      path: `/todos`,
      method: 'POST',
      body: { content, date },
    }),
  update: ({
    id,
    content,
    isDone,
  }: {
    id: number;
    content: string;
    isDone: boolean;
  }): Promise<TodoType> =>
    apiRequest({
      path: `/todos/${id}`,
      method: 'PATCH',
      body: { content, isDone },
    }),
  delete: ({ id }: { id: number }): Promise<void> =>
    apiRequest({
      path: `/todos/${id}`,
      method: 'DELETE',
    }),
};
