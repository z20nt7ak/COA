import type { Filters, Resource } from './types';

export function positiveId(value: string): number {
  const number = Number(value);
  if (!/^\d+$/.test(value.trim()) || !Number.isSafeInteger(number) || number < 1) throw new Error('ID должен быть положительным целым числом в безопасном диапазоне JavaScript.');
  return number;
}
function ids(value: string) { return [...new Set(value.split(',').map(item => positiveId(item.trim())))]; }
export function searchBody(resource: Resource, filters: Filters, page: number, size: number, sortBy: string, direction: string, thenBy = '', thenDirection = 'asc') {
  const body: Record<string, unknown> = { page, size, sortBy, [resource === 'lab-works' ? 'sortType' : 'sortDirection']: direction };
  if (thenBy) body.sort = [{ field: sortBy, direction }, { field: thenBy, direction: thenDirection }];
  if (filters.name.trim()) body.name = filters.name.trim();
  if (filters.ids.trim()) body[resource === 'lab-works' ? 'id' : 'ids'] = ids(filters.ids);
  const fields = resource === 'lab-works'
    ? ['x', 'y', 'minimalPoint', 'creationDate', 'disciplinePracticeHours', 'disciplineLabsCount'] : ['practiceHours', 'labsCount'];
  for (const field of fields) {
    for (const suffix of ['From', 'To']) {
      const key = `${field}${suffix}` as keyof Filters;
      const raw = filters[key];
      if (!raw) continue;
      if (field === 'creationDate') { body[key] = raw; continue; }
      const value = Number(raw);
      if (!Number.isFinite(value) || (field !== 'y' && !Number.isSafeInteger(value))) throw new Error('Проверьте числовые границы фильтров.');
      if (field === 'x' && (value < -2147483648 || value > 2147483647)) throw new Error('Координата X должна помещаться в int32.');
      if (field === 'minimalPoint' && (value < 1 || value > 2147483647)) throw new Error('Минимальный балл: от 1 до 2147483647.');
      if (['practiceHours', 'labsCount', 'disciplinePracticeHours', 'disciplineLabsCount'].includes(field) && value < 0) throw new Error('Часы и количество работ не могут быть отрицательными.');
      body[key] = value;
    }
    const from = body[`${field}From`], to = body[`${field}To`];
    if ((typeof from === 'number' && typeof to === 'number' && from > to) || (typeof from === 'string' && typeof to === 'string' && from > to)) throw new Error('Нижняя граница диапазона не может превышать верхнюю.');
  }
  if (resource === 'lab-works') {
    for (const field of ['hasDiscipline', 'hasDifficulty'] as const) if (filters[field] !== '') body[field] = filters[field] === 'true';
    if (filters.disciplineName.trim()) body.disciplineName = filters.disciplineName.trim();
    if (filters.difficulty) body.difficulty = filters.difficulty;
    if (filters.disciplineIds.trim()) body.disciplineIds = ids(filters.disciplineIds);
  }
  return body;
}
