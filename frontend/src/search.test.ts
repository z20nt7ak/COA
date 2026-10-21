import { describe, expect, it } from 'vitest';
import { positiveId, searchBody } from './search';
import { emptyFilters } from './types';

describe('API search contract', () => {
  it('uses the current request names and transmits typed filters', () => {
    expect(searchBody('lab-works', { ...emptyFilters, ids: '2, 5, 2', difficulty: 'EASY', disciplineIds: '3' }, 1, 10, 'name', 'desc')).toEqual({ page: 1, size: 10, sortBy: 'name', sortType: 'desc', id: [2, 5], difficulty: 'EASY', disciplineIds: [3] });
    expect(searchBody('disciplines', { ...emptyFilters, ids: '2', practiceHoursFrom: '0' }, 2, 20, 'id', 'asc')).toEqual({ page: 2, size: 20, sortBy: 'id', sortDirection: 'asc', ids: [2], practiceHoursFrom: 0 });
  });
  it('rejects reversed ranges, unsafe IDs and int32 overflow', () => {
    expect(() => searchBody('lab-works', { ...emptyFilters, xFrom: '20', xTo: '10' }, 1, 10, 'id', 'asc')).toThrow('Нижняя граница');
    expect(() => searchBody('lab-works', { ...emptyFilters, minimalPointFrom: '2147483648' }, 1, 10, 'id', 'asc')).toThrow('Минимальный балл');
    for (const id of ['-1', '0', '1.5', '1e3', '9007199254740993', '']) expect(() => positiveId(id)).toThrow();
  });
  it('transmits null presence, related fields and multi-sort instead of processing records', () => {
    const body = searchBody('lab-works', { ...emptyFilters, hasDiscipline: 'true', hasDifficulty: 'false', disciplineName: 'Физика', disciplinePracticeHoursFrom: '10' }, 3, 20, 'discipline.name', 'desc', 'coordinates.x', 'asc');
    expect(body).toMatchObject({ page: 3, size: 20, hasDiscipline: true, hasDifficulty: false, disciplineName: 'Физика', disciplinePracticeHoursFrom: 10,
      sort: [{ field: 'discipline.name', direction: 'desc' }, { field: 'coordinates.x', direction: 'asc' }] });
  });
});
