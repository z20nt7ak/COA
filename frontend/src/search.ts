import { difficulties, isLab, type Entity, type Filters, type Page, type Resource } from './types';

export function positiveId(value: string): number {
  const number = Number(value);
  if (!/^\d+$/.test(value.trim()) || !Number.isSafeInteger(number) || number < 1) throw new Error('ID должен быть положительным целым числом в безопасном диапазоне JavaScript.');
  return number;
}
function ids(value: string) { return [...new Set(value.split(',').map(item => positiveId(item.trim())))]; }
export function searchBody(resource: Resource, filters: Filters, page: number, size: number, sortBy: string, direction: string) {
  const body: Record<string, unknown> = { page, size, sortBy, [resource === 'lab-works' ? 'sortType' : 'sortDirection']: direction };
  if (filters.name.trim()) body.name = filters.name.trim();
  if (filters.ids.trim()) body[resource === 'lab-works' ? 'id' : 'ids'] = ids(filters.ids);
  const fields = resource === 'lab-works'
    ? ['x', 'y', 'minimalPoint', 'creationDate'] : ['practiceHours', 'labsCount'];
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
      if (['practiceHours', 'labsCount'].includes(field) && value < 0) throw new Error('Часы и количество работ не могут быть отрицательными.');
      body[key] = value;
    }
    const from = body[`${field}From`], to = body[`${field}To`];
    if ((typeof from === 'number' && typeof to === 'number' && from > to) || (typeof from === 'string' && typeof to === 'string' && from > to)) throw new Error('Нижняя граница диапазона не может превышать верхнюю.');
  }
  if (resource === 'lab-works') {
    if (filters.difficulty) body.difficulty = filters.difficulty;
    if (filters.disciplineIds.trim()) body.disciplineIds = ids(filters.disciplineIds);
  }
  return body;
}
export function localPage(items: Entity[], filters: Filters, page: number, size: number, sortBy: string, direction: string): Page<Entity> {
  const selectedIds = filters.ids.trim() ? ids(filters.ids) : null;
  const disciplineIds = filters.disciplineIds.trim() ? ids(filters.disciplineIds) : null;
  const filtered = items.filter(item => {
    if (!item.name.toLocaleLowerCase().includes(filters.name.trim().toLocaleLowerCase())) return false;
    if (selectedIds && !selectedIds.includes(item.id)) return false;
    const lab = isLab(item);
    if (lab && filters.difficulty && item.difficulty !== filters.difficulty) return false;
    if (lab && disciplineIds && (!item.discipline || !disciplineIds.includes(item.discipline.id))) return false;
    const values: Record<string, number> = lab
      ? { x: item.coordinates.x, y: item.coordinates.y, minimalPoint: item.minimalPoint }
      : { practiceHours: item.practiceHours, labsCount: item.labsCount };
    for (const [field, value] of Object.entries(values)) {
      const from = filters[`${field}From` as keyof Filters], to = filters[`${field}To` as keyof Filters];
      if ((from !== '' && value < Number(from)) || (to !== '' && value > Number(to))) return false;
    }
    if (lab) {
      const time = Date.parse(item.creationDate);
      if (filters.creationDateFrom && time < Date.parse(`${filters.creationDateFrom}T00:00:00Z`)) return false;
      if (filters.creationDateTo && time >= Date.parse(`${filters.creationDateTo}T00:00:00Z`) + 86400000) return false;
    }
    return true;
  });
  const value = (item: Entity): string | number | null => {
    if (sortBy === 'difficulty' && isLab(item)) return item.difficulty === null ? null : difficulties.indexOf(item.difficulty);
    if (sortBy === 'creationDate' && isLab(item)) return Date.parse(item.creationDate);
    return (item as unknown as Record<string, string | number>)[sortBy] ?? null;
  };
  filtered.sort((a, b) => {
    const av = value(a), bv = value(b);
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    const comparison = typeof av === 'string' && typeof bv === 'string' ? av.localeCompare(bv, 'ru') : Number(av) - Number(bv);
    return comparison ? comparison * (direction === 'asc' ? 1 : -1) : a.id - b.id;
  });
  return { content: filtered.slice((page - 1) * size, page * size), page, size, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size) };
}
