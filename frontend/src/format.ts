import type { LabWork } from './types';

function resolveTimeZone() {
  const timeZone = import.meta.env.VITE_DISPLAY_TIME_ZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    return new Intl.DateTimeFormat('ru-RU', { timeZone }).resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export const displayTimeZone = resolveTimeZone();

const dateOnly = new Intl.DateTimeFormat('ru-RU', { timeZone: displayTimeZone, dateStyle: 'medium' });
const dateAndTime = new Intl.DateTimeFormat('ru-RU', { timeZone: displayTimeZone, dateStyle: 'medium', timeStyle: 'medium' });

export function formatCreationDate(value: string, showTime = false) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : (showTime ? dateAndTime : dateOnly).format(date);
}

export function formatCoordinates({ x, y }: LabWork['coordinates']) {
  return `${x}; ${y}`;
}
