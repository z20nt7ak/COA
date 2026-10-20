import { describe, expect, it } from 'vitest';
import { localPage, positiveId, searchBody } from './search';
import { emptyFilters, type LabWork } from './types';

const lab = (id: number, overrides: Partial<LabWork> = {}): LabWork => ({ id, name: 'Механика', coordinates: { x: 0, y: 1.5 }, creationDate: '2026-10-20T12:00:00Z', minimalPoint: 10, difficulty: null, discipline: null, ...overrides });
describe('API search contract', () => {
  it('uses the existing, different parameter names of both Swagger schemas', () => {
    expect(searchBody('lab-works', { ...emptyFilters, ids: '2, 5, 2', difficulty: 'EASY', disciplineIds: '3' }, 1, 10, 'name', 'desc')).toEqual({ page: 1, size: 10, sortBy: 'name', sortType: 'desc', id: [2, 5], difficulty: 'EASY', disciplineIds: [3] });
    expect(searchBody('disciplines', { ...emptyFilters, ids: '2', practiceHoursFrom: '0' }, 2, 20, 'id', 'asc')).toEqual({ page: 2, size: 20, sortBy: 'id', sortDirection: 'asc', ids: [2], practiceHoursFrom: 0 });
  });
  it('rejects reversed ranges, unsafe IDs and values outside Java int32', () => {
    expect(() => searchBody('lab-works', { ...emptyFilters, xFrom: '20', xTo: '10' }, 1, 10, 'id', 'asc')).toThrow('Нижняя граница');
    expect(() => searchBody('lab-works', { ...emptyFilters, minimalPointFrom: '2147483648' }, 1, 10, 'id', 'asc')).toThrow('Минимальный балл');
    for (const id of ['-1', '0', '1.5', '1e3', '9007199254740993', '']) expect(() => positiveId(id)).toThrow();
  });
});
describe('session collection', () => {
  it('combines name, relation and range filters before calculating the total', () => {
    const discipline = { id: 3, name: 'Физика', practiceHours: 20, labsCount: 1 };
    const result = localPage([lab(1), lab(2, { discipline }), lab(3, { discipline, minimalPoint: 5 })], { ...emptyFilters, name: 'МЕХ', disciplineIds: '3', minimalPointFrom: '10' }, 1, 10, 'id', 'asc');
    expect(result.totalElements).toBe(1); expect(result.content[0].id).toBe(2);
  });
  it('includes the whole final UTC date and excludes the following day', () => {
    const result = localPage([lab(1, { creationDate: '2026-10-20T23:59:59.999Z' }), lab(2, { creationDate: '2026-10-21T00:00:00Z' })], { ...emptyFilters, creationDateFrom: '2026-10-20', creationDateTo: '2026-10-20' }, 1, 10, 'id', 'asc');
    expect(result.content.map(item => item.id)).toEqual([1]);
  });
  it('orders equal values by ID and applies pagination to the filtered result', () => {
    const result = localPage([lab(3), lab(1), lab(2)], emptyFilters, 2, 2, 'name', 'desc');
    expect(result.content.map(item => item.id)).toEqual([3]); expect(result.totalPages).toBe(2); expect(result.totalElements).toBe(3);
  });
  it('sorts difficulty by domain order, with nulls last', () => {
    const result = localPage([lab(1), lab(2, { difficulty: 'EASY' }), lab(3, { difficulty: 'TERRIBLE' })], emptyFilters, 1, 10, 'difficulty', 'desc');
    expect(result.content.map(item => item.id)).toEqual([3, 2, 1]);
  });
});
