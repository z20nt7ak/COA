export const LIMITS = {
  minimalPoint: { min: 1, max: 100 },
  coordinate: { min: -1000, max: 1000 },
  coordinateYFractionDigits: 2,
  practiceHours: { min: 0, max: 500 },
  count: { min: 0, max: Number.MAX_SAFE_INTEGER },
  creationDate: { min: '2000-01-01', max: '2100-12-31' },
} as const;
export const LONG_MAX = Number.MAX_SAFE_INTEGER;
export const MAX_IDS = 1000;

const fmt = (value: number) => value.toLocaleString('ru-RU');

export class ValidationError extends Error {
  constructor(public errors: Record<string, string>) {
    super(Object.values(errors)[0] ?? 'Проверьте введённые данные.');
    this.name = 'ValidationError';
  }
}

export type Range = { min: number; max: number };

function outOfRange(label: string, { min, max }: Range, value: number) {
  if (min === 0 && value < 0) return `«${label}» не может быть отрицательным.`;
  if (max === LONG_MAX) return `«${label}» должно быть не меньше ${fmt(min)}.`;
  return `«${label}» должно быть от ${fmt(min)} до ${fmt(max)}.`;
}

function normalizeNumber(raw: string, label: string): string {
  let value = raw.trim()
    .replace(/^[\u2212\u2012\u2013\uFE63\uFF0D]/, '-')
    .replace(/^([-+])\s+/, '$1');
  if (/\s/.test(value)) {
    if (!/^[-+]?\d{1,3}(\s\d{3})+([.,]\d*)?$/.test(value)) throw new Error(`«${label}»: пробелы можно ставить только между разрядами, например 1 000.`);
    value = value.replace(/\s/g, '');
  }
  return value;
}

export function parseInteger(raw: string, label: string, range: Range): number {
  const value = normalizeNumber(raw, label);
  if (!value) throw new Error(`Заполните поле «${label}».`);
  if (/^[-+]?(\d+[.,]\d*|[.,]\d+)$/.test(value)) throw new Error(`«${label}» должно быть целым числом — дробные значения не допускаются.`);
  if (!/^[-+]?\d+$/.test(value)) throw new Error(`«${label}» должно быть целым числом, например ${range.min < 0 ? '-5 или 12' : range.max >= 10 ? '10' : String(range.min)}.`);
  const number = Number(value) || 0;
  if (number < range.min || number > range.max) throw new Error(outOfRange(label, range, number));
  return number;
}

export function parseDecimal(raw: string, label: string, range: Range, fractionDigits?: number): number {
  const value = normalizeNumber(raw, label).replace(',', '.');
  if (!value) throw new Error(`Заполните поле «${label}».`);
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(value)) throw new Error(`«${label}» должно быть числом, например 12 или -3,75.`);
  const number = Number(value) || 0;
  if (number < range.min || number > range.max) throw new Error(outOfRange(label, range, number));
  const fraction = value.split('.')[1]?.replace(/0+$/, '') ?? '';
  if (fractionDigits !== undefined && fraction.length > fractionDigits) throw new Error(`«${label}» может содержать не больше ${fractionDigits} знаков после запятой.`);
  return number;
}

export function parseDate(raw: string, label: string): string {
  const value = raw.trim();
  const { min, max } = LIMITS.creationDate;
  const range = `с ${min.slice(0, 4)} по ${max.slice(0, 4)} год`;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`«${label}»: укажите дату полностью, год — четырьмя цифрами (${range}).`);
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error(`«${label}»: такой даты не существует.`);
  if (value < min || value > max) throw new Error(`«${label}»: год должен быть ${range}.`);
  return value;
}

export function parseName(raw: string, label = 'Название'): string {
  const value = raw.trim();
  if (!value) throw new Error(`Заполните поле «${label}» — оно не может быть пустым или состоять только из пробелов.`);
  return value;
}

export function positiveId(raw: string, label = 'ID'): number {
  const value = raw.trim();
  if (!value) throw new Error(`Введите ${label}.`);
  if (!/^[-+]?\d+$/.test(value)) throw new Error(`${label} должен быть целым положительным числом, например 12.`);
  const number = Number(value);
  if (number < 1) throw new Error(`${label} должен быть больше нуля.`);
  if (number > LONG_MAX) throw new Error(`${label} слишком большой: максимум ${fmt(LONG_MAX)}.`);
  return number;
}

export function parseIds(raw: string, label: string): number[] {
  const parts = raw.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0) throw new Error(`«${label}»: укажите хотя бы один ID, например 1, 2, 3.`);
  const result = new Set<number>();
  for (const part of parts) {
    try { result.add(positiveId(part, 'ID')); }
    catch { throw new Error(`«${label}»: значение «${part}» не является корректным ID. Укажите целые положительные числа через запятую, например 1, 2, 3.`); }
  }
  if (result.size > MAX_IDS) throw new Error(`«${label}»: можно указать не больше ${fmt(MAX_IDS)} ID.`);
  return [...result];
}

export function collect<T>(errors: Record<string, string>, key: string, check: () => T): T | undefined {
  try { return check(); } catch (error) { errors[key] = error instanceof Error ? error.message : String(error); return undefined; }
}
