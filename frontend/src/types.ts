export const difficulties = ['VERY_EASY', 'EASY', 'VERY_HARD', 'TERRIBLE'] as const;
export type Difficulty = typeof difficulties[number];
export const difficultyLabels: Record<Difficulty, string> = {
  VERY_EASY: 'Очень легко', EASY: 'Легко', VERY_HARD: 'Очень сложно', TERRIBLE: 'Экстремально',
};
export interface Discipline { id: number; name: string; practiceHours: number; labsCount: number }
export interface NameGroup { name: string; count: number }
export interface LabWork {
  id: number; name: string; coordinates: { x: number; y: number }; creationDate: string;
  minimalPoint: number; difficulty: Difficulty | null; discipline: Discipline | null;
}
export type Entity = LabWork | Discipline;
export type Resource = 'lab-works' | 'disciplines';
export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }
export type LabInput = Omit<LabWork, 'id' | 'creationDate' | 'discipline'> & { discipline: { id: number } | null };
export type DisciplineInput = Pick<Discipline, 'name' | 'practiceHours'>;
export interface Filters {
  hasDiscipline: string; hasDifficulty: string; disciplineName: string;
  disciplinePracticeHoursFrom: string; disciplinePracticeHoursTo: string;
  disciplineLabsCountFrom: string; disciplineLabsCountTo: string;
  name: string; ids: string; difficulty: string; disciplineIds: string;
  xFrom: string; xTo: string; yFrom: string; yTo: string;
  creationDateFrom: string; creationDateTo: string;
  minimalPointFrom: string; minimalPointTo: string;
  practiceHoursFrom: string; practiceHoursTo: string; labsCountFrom: string; labsCountTo: string;
}
export const emptyFilters: Filters = {
  hasDiscipline: '', hasDifficulty: '', disciplineName: '',
  disciplinePracticeHoursFrom: '', disciplinePracticeHoursTo: '', disciplineLabsCountFrom: '', disciplineLabsCountTo: '',
  name: '', ids: '', difficulty: '', disciplineIds: '', xFrom: '', xTo: '', yFrom: '', yTo: '',
  creationDateFrom: '', creationDateTo: '', minimalPointFrom: '', minimalPointTo: '',
  practiceHoursFrom: '', practiceHoursTo: '', labsCountFrom: '', labsCountTo: '',
};
export const isLab = (entity: Entity): entity is LabWork => 'coordinates' in entity;
