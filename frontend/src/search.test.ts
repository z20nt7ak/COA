import { describe, expect, it } from 'vitest';
import { searchBody } from './search';
import { LIMITS, parseDate, parseDecimal, parseIds, parseInteger, parseName, positiveId, ValidationError } from './validation';
import { emptyFilters, type SortCriterion } from './types';

const ID_SORT: SortCriterion[] = [{ field: 'id', direction: 'asc' }];

describe('API search contract', () => {
  it('uses the current request names and transmits typed filters', () => {
    expect(searchBody('lab-works', { ...emptyFilters, ids: '2, 5, 2', difficulty: 'EASY', disciplineIds: '3' }, 1, 10, [{ field: 'name', direction: 'desc' }])).toEqual({ page: 1, size: 10, sortBy: 'name', sortType: 'desc', id: [2, 5], difficulty: 'EASY', disciplineIds: [3] });
    expect(searchBody('disciplines', { ...emptyFilters, ids: '2', practiceHoursFrom: '0' }, 2, 20, [{ field: 'id', direction: 'asc' }])).toEqual({ page: 2, size: 20, sortBy: 'id', sortDirection: 'asc', ids: [2], practiceHoursFrom: 0 });
  });
  it('rejects reversed ranges, unsafe IDs and int32 overflow', () => {
    expect(() => searchBody('lab-works', { ...emptyFilters, xFrom: '20', xTo: '10' }, 1, 10, ID_SORT)).toThrow('не может быть больше');
    expect(() => searchBody('lab-works', { ...emptyFilters, minimalPointFrom: '101' }, 1, 10, ID_SORT)).toThrow('Минимальный балл');
    for (const id of ['-1', '0', '1.5', '1e3', '9007199254740993', '']) expect(() => positiveId(id)).toThrow();
  });
  it('sends every sort criterion in order and keeps the first as the main one', () => {
    const sorts: SortCriterion[] = [{ field: 'difficulty', direction: 'desc' }, { field: 'minimalPoint', direction: 'asc' }, { field: 'name', direction: 'asc' }, { field: 'coordinates.y', direction: 'desc' }];
    expect(searchBody('lab-works', emptyFilters, 1, 10, sorts)).toEqual({ page: 1, size: 10, sortBy: 'difficulty', sortType: 'desc', sort: sorts });
    expect(searchBody('lab-works', emptyFilters, 1, 10, ID_SORT)).not.toHaveProperty('sort');
  });
  it('transmits null presence, related fields and multi-sort instead of processing records', () => {
    const body = searchBody('lab-works', { ...emptyFilters, hasDiscipline: 'true', hasDifficulty: 'false', disciplineName: 'Физика', disciplinePracticeHoursFrom: '10' }, 3, 20, [{ field: 'discipline.name', direction: 'desc' }, { field: 'coordinates.x', direction: 'asc' }]);
    expect(body).toMatchObject({ page: 3, size: 20, hasDiscipline: true, hasDifficulty: false, disciplineName: 'Физика', disciplinePracticeHoursFrom: 10,
      sort: [{ field: 'discipline.name', direction: 'desc' }, { field: 'coordinates.x', direction: 'asc' }] });
  });
  it('reports every invalid filter by field', () => {
    try { searchBody('lab-works', { ...emptyFilters, xFrom: '1.5', minimalPointTo: '0', ids: '1, abc' }, 1, 10, ID_SORT); expect.unreachable(); }
    catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(Object.keys((error as ValidationError).errors).sort()).toEqual(['ids', 'minimalPoint', 'x']);
    }
  });
});

describe('field validation matches backend types', () => {
  it('accepts only whole numbers for Integer/Long fields', () => {
    expect(parseInteger(' -12 ', 'X', LIMITS.coordinate)).toBe(-12);
    expect(() => parseInteger('1.5', 'X', LIMITS.coordinate)).toThrow('дробные значения не допускаются');
    expect(() => parseInteger('1,5', 'X', LIMITS.coordinate)).toThrow('дробные значения не допускаются');
    for (const raw of ['1e3', 'abc', '', ' ']) expect(() => parseInteger(raw, 'X', LIMITS.coordinate)).toThrow();
  });
  it('applies business limits shared with the backend', () => {
    expect(() => parseInteger('1001', 'X', LIMITS.coordinate)).toThrow('от -1');
    expect(() => parseInteger('0', 'Минимальный балл', LIMITS.minimalPoint)).toThrow('от 1 до 100');
    expect(() => parseInteger('101', 'Минимальный балл', LIMITS.minimalPoint)).toThrow('от 1 до 100');
    expect(parseInteger('100', 'Минимальный балл', LIMITS.minimalPoint)).toBe(100);
    expect(parseInteger('0', 'Часы', LIMITS.practiceHours)).toBe(0);
    expect(() => parseInteger('-1', 'Часы', LIMITS.practiceHours)).toThrow('не может быть отрицательным');
    expect(() => parseInteger('501', 'Часы', LIMITS.practiceHours)).toThrow('от 0 до 500');
    expect(parseName('а'.repeat(5000))).toHaveLength(5000);
    expect(() => parseName('   ')).toThrow('не может быть пустым');
    expect(() => searchBody('lab-works', { ...emptyFilters, minimalPointFrom: '150' }, 1, 10, ID_SORT)).toThrow('от 1 до 100');
  });
  it('accepts typographic minus signs and thousands separators', () => {
    for (const raw of ['−5', '–5', '‒5', '- 5', '−\u00a05']) expect(parseInteger(raw, 'X', LIMITS.coordinate)).toBe(-5);
    for (const raw of ['1 000', '1\u00a0000', '1\u202f000', '1\u2009000']) expect(parseInteger(raw, 'Работ', LIMITS.count)).toBe(1000);
    expect(parseInteger('12 345 678', 'Работ', LIMITS.count)).toBe(12345678);
    for (const raw of ['10 00', '1 0', '1  000', '1 000 0', '−']) expect(() => parseInteger(raw, 'Работ', LIMITS.count)).toThrow();
    expect(() => parseInteger('10 00', 'Работ', LIMITS.count)).toThrow('между разрядами');
    expect(() => parseInteger('1 000,5', 'Работ', LIMITS.count)).toThrow('дробные значения не допускаются');
    expect(parseDecimal('−3,75', 'Y', LIMITS.coordinate, 2)).toBe(-3.75);
    expect(parseDecimal('−1 000,00', 'Y', LIMITS.coordinate, 2)).toBe(-1000);
    for (const shown of [(-1000).toLocaleString('ru-RU'), (1000).toLocaleString('ru-RU'), '−1000'])
      expect(() => parseInteger(shown, 'X', LIMITS.coordinate)).not.toThrow();
  });
  it('accepts fractions with a dot or a comma for Double fields', () => {
    expect(parseDecimal('3,75', 'Y', LIMITS.coordinate, 2)).toBe(3.75);
    expect(parseDecimal('-0.50', 'Y', LIMITS.coordinate, 2)).toBe(-0.5);
    expect(() => parseDecimal('1.234', 'Y', LIMITS.coordinate, 2)).toThrow('не больше 2 знаков');
    expect(() => parseDecimal('1000.5', 'Y', LIMITS.coordinate)).toThrow('от -1');
    for (const raw of ['', 'abc', '1e3', '1.2.3']) expect(() => parseDecimal(raw, 'Y', LIMITS.coordinate)).toThrow();
  });
  it('accepts only full dates between 2000 and 2100', () => {
    expect(parseDate('2026-10-01', 'Дата')).toBe('2026-10-01');
    expect(parseDate('2000-01-01', 'Дата')).toBe('2000-01-01');
    expect(parseDate('2100-12-31', 'Дата')).toBe('2100-12-31');
    expect(() => parseDate('1999-12-31', 'Дата')).toThrow('с 2000 по 2100');
    expect(() => parseDate('2101-01-01', 'Дата')).toThrow('с 2000 по 2100');
    expect(() => parseDate('275760-01-01', 'Дата')).toThrow('четырьмя цифрами');
    expect(() => parseDate('2026-02-30', 'Дата')).toThrow('не существует');
    expect(() => searchBody('lab-works', { ...emptyFilters, creationDateFrom: '275760-01-01' }, 1, 10, ID_SORT)).toThrow('четырьмя цифрами');
    expect(searchBody('lab-works', { ...emptyFilters, creationDateFrom: '2026-01-01' }, 1, 10, ID_SORT)).toMatchObject({ creationDateFrom: '2026-01-01' });
  });
  it('parses ID lists with commas or spaces', () => {
    expect(parseIds('1, 2 2;3,', 'ID')).toEqual([1, 2, 3]);
    expect(() => parseIds('1, 0', 'ID')).toThrow('«0»');
    for (const raw of [',', ';', ' , ; ']) expect(() => parseIds(raw, 'ID')).toThrow('хотя бы один ID');
    expect(() => searchBody('lab-works', { ...emptyFilters, ids: ',' }, 1, 10, ID_SORT)).toThrow('хотя бы один ID');
  });
});
