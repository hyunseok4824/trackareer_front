import { firebaseAuth } from '@/src/lib/firebase/firebaseConfig';

export const getFirebaseIdToken = async () => {
  const user = firebaseAuth?.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export class ApiError extends Error {
  status: number;
  bodyText?: string;

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.bodyText = bodyText;
  }
}

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL is missing');
  return baseUrl.replace(/\/$/, '');
};

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  withAuth?: boolean;
};

export const apiRequest = async <T = unknown>({
  path,
  body,
  headers,
  withAuth = true,
  ...init
}: RequestOptions): Promise<T> => {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const token = withAuth ? await getFirebaseIdToken() : null;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`Request failed: ${res.status}`, res.status, text);
  }

  if (res.status === 204) return undefined as T;

  return (await res.json().catch(() => undefined)) as T;
};
