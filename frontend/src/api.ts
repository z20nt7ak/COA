import type { Resource, Entity, Page, LabInput, DisciplineInput } from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}
export function baseUrl(service: 'labs' | 'bars') {
  return ((service === 'labs' ? import.meta.env.VITE_LABS_API_URL : import.meta.env.VITE_BARS_API_URL)
    || `/api/${service}`).replace(/\/$/, '');
}
export async function request<T>(service: 'labs' | 'bars', path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  const timeout = AbortSignal.timeout(15000);
  try {
    response = await fetch(`${baseUrl(service)}${path}`, {
      method, headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, timeout.aborted ? 'Сервер не ответил за 15 секунд. Проверьте подключение.' : 'Не удалось подключиться к сервису. Проверьте, запущен ли бэкенд и правильно ли настроен адрес.');
  }
  const text = await response.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = undefined; }
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data ? String(data.message) : `Ошибка сервера: ${response.status} ${response.statusText}`;
    throw new ApiError(response.status, message);
  }
  if (text && data === undefined) throw new ApiError(response.status, 'Сервис вернул неожиданный формат ответа. Проверьте адрес API.');
  return data as T;
}
export const api = {
  get: (resource: Resource, id: number) => request<Entity>('labs', `/${resource}/${id}`),
  search: (resource: Resource, body: unknown, signal?: AbortSignal) => request<Page<Entity>>('labs', `/${resource}/search`, 'POST', body, signal),
  save: (resource: Resource, body: LabInput | DisciplineInput, id?: number) => request<Entity>('labs', `/${resource}${id ? `/${id}` : ''}`, id ? 'PUT' : 'POST', body),
  remove: (resource: Resource, id: number) => request<void>('labs', `/${resource}/${id}`, 'DELETE'),
  link: (discipline: number, lab: number, action: 'add' | 'remove') => request<void>('bars', `/discipline/${discipline}/labwork/${lab}/${action}`, 'POST'),
};
