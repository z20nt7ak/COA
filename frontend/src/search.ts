import type { Filters, Resource, SortCriterion } from './types';
import { displayTimeZone } from './format';
import { collect, LIMITS, parseDate, parseDecimal, parseIds, parseInteger, ValidationError, type Range } from './validation';

export { positiveId } from './validation';

type NumericRule = { label: string; parse: (raw: string, label: string) => number };
const integer = (label: string, range: Range): NumericRule => ({ label, parse: (raw, text) => parseInteger(raw, text, range) });

const labRanges: Record<string, NumericRule | 'date'> = {
  x: integer('Координата X', LIMITS.coordinate),
  y: { label: 'Координата Y', parse: (raw, text) => parseDecimal(raw, text, LIMITS.coordinate) },
  minimalPoint: integer('Минимальный балл', LIMITS.minimalPoint),
  creationDate: 'date',
  disciplinePracticeHours: integer('Часы дисциплины', LIMITS.practiceHours),
  disciplineLabsCount: integer('Работ в дисциплине', LIMITS.count),
};
const disciplineRanges: Record<string, NumericRule | 'date'> = {
  practiceHours: integer('Часы практики', LIMITS.practiceHours),
  labsCount: integer('Количество работ', LIMITS.count),
};

export function validateFilters(resource: Resource, filters: Filters) {
  const errors: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const lab = resource === 'lab-works';
  if (filters.ids.trim()) values[lab ? 'id' : 'ids'] = collect(errors, 'ids', () => parseIds(filters.ids, 'ID записей'));
  if (lab && filters.disciplineIds.trim()) values.disciplineIds = collect(errors, 'disciplineIds', () => parseIds(filters.disciplineIds, 'ID дисциплин'));
  for (const [field, rule] of Object.entries(lab ? labRanges : disciplineRanges)) {
    const from = filters[`${field}From` as keyof Filters], to = filters[`${field}To` as keyof Filters];
    if (rule === 'date') {
      const dateFrom = from ? collect(errors, field, () => parseDate(from, 'Дата создания от')) : undefined;
      const dateTo = to ? collect(errors, field, () => parseDate(to, 'Дата создания до')) : undefined;
      if (dateFrom) values[`${field}From`] = dateFrom;
      if (dateTo) values[`${field}To`] = dateTo;
      if (!errors[field] && dateFrom && dateTo && dateFrom > dateTo) errors[field] = 'Дата «от» не может быть позже даты «до».';
      if (dateFrom || dateTo) values.dateTimeZone = displayTimeZone;
      continue;
    }
    const parsed = [['From', from, 'от'], ['To', to, 'до']].map(([suffix, raw, word]) => {
      if (!raw.trim()) return undefined;
      const value = collect(errors, field, () => rule.parse(raw, `${rule.label} ${word}`));
      if (value !== undefined) values[`${field}${suffix}`] = value;
      return value;
    });
    if (!errors[field] && parsed[0] !== undefined && parsed[1] !== undefined && parsed[0] > parsed[1])
      errors[field] = `«${rule.label}»: значение «от» не может быть больше значения «до».`;
  }
  return { errors, values };
}

export function searchBody(resource: Resource, filters: Filters, page: number, size: number, sorts: SortCriterion[]) {
  const [main] = sorts;
  const body: Record<string, unknown> = { page, size, sortBy: main.field, [resource === 'lab-works' ? 'sortType' : 'sortDirection']: main.direction };
  if (sorts.length > 1) body.sort = sorts.map(({ field, direction }) => ({ field, direction }));
  if (filters.name.trim()) body.name = filters.name.trim();
  const { errors, values } = validateFilters(resource, filters);
  if (Object.keys(errors).length) throw new ValidationError(errors);
  Object.assign(body, values);
  if (resource === 'lab-works') {
    for (const field of ['hasDiscipline', 'hasDifficulty'] as const) if (filters[field] !== '') body[field] = filters[field] === 'true';
    if (filters.disciplineName.trim()) body.disciplineName = filters.disciplineName.trim();
    if (filters.difficulty) body.difficulty = filters.difficulty;
  }
  return body;
}
